import { NextResponse } from 'next/server';

export interface RateLimitConfig {
  /** Max requests per window. */
  limit: number;
  /** Window size in milliseconds. */
  windowMs: number;
  /** Namespace so buckets don't collide across routes. */
  keyPrefix: string;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the window resets (for Retry-After). */
  retryAfterSec: number;
  remaining: number;
  /** Unix ms when the window resets. */
  resetMs: number;
  key: string;
}

export const RATE_LIMITS = {
  /** Billed SMS dispatch: 5/min per IP. */
  smsSend: { limit: 5, windowMs: 60_000, keyPrefix: 'sms-send' },
  /** Login brute-force protection: 5 per 15 min per IP and per phone. */
  loginByIp: { limit: 5, windowMs: 15 * 60_000, keyPrefix: 'login-ip' },
  loginByPhone: { limit: 5, windowMs: 15 * 60_000, keyPrefix: 'login-phone' },
  /** Authenticated lookup / enumeration guard: 30/min per IP. */
  byPhone: { limit: 30, windowMs: 60_000, keyPrefix: 'by-phone' },
  /** Hotspot feed: 60/min per IP. */
  nearest: { limit: 60, windowMs: 60_000, keyPrefix: 'nearest' },
  /** Gateway callbacks (shared gateway IPs): 120/min per IP. */
  smsWebhook: { limit: 120, windowMs: 60_000, keyPrefix: 'sms-webhook' },
} satisfies Record<string, RateLimitConfig>;

type Bucket = { count: number; resetMs: number };

// Single-instance in-memory fixed-window store. Shared via globalThis so
// dev HMR doesn't reset buckets on every edit. In multi-instance prod
// deployments set UPSTASH_REDIS_REST_URL/TOKEN for a shared store.
const globalStore = globalThis as unknown as {
  __rateLimitBuckets?: Map<string, Bucket>;
};
if (!globalStore.__rateLimitBuckets) {
  globalStore.__rateLimitBuckets = new Map<string, Bucket>();
}
const buckets = globalStore.__rateLimitBuckets;

function getUpstashConfig(): { url: string; token: string } | null {
  const url = (process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, '');
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || '';
  if (!url.startsWith('http') || !token) return null;
  return { url, token };
}

/** Best-effort client IP: X-Forwarded-For > X-Real-IP > fallback. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp.slice(0, 64);
  return 'unknown';
}

function memoryCheck(key: string, config: RateLimitConfig, now: number): RateLimitResult {
  const entry = buckets.get(key);
  if (!entry || now >= entry.resetMs) {
    const resetMs = now + config.windowMs;
    buckets.set(key, { count: 1, resetMs });
    // Opportunistic sweep to bound memory.
    if (buckets.size % 200 === 0) {
      for (const [k, v] of buckets) {
        if (now >= v.resetMs) buckets.delete(k);
      }
    }
    return {
      allowed: true,
      retryAfterSec: Math.ceil(config.windowMs / 1000),
      remaining: config.limit - 1,
      resetMs,
      key,
    };
  }
  entry.count += 1;
  const retryAfterSec = Math.max(1, Math.ceil((entry.resetMs - now) / 1000));
  return {
    allowed: entry.count <= config.limit,
    retryAfterSec,
    remaining: Math.max(0, config.limit - entry.count),
    resetMs: entry.resetMs,
    key,
  };
}

async function upstashCheck(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult | null> {
  const upstash = getUpstashConfig();
  if (!upstash) return null;
  try {
    const res = await fetch(`${upstash.url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${upstash.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([['INCR', key], ['PTTL', key]]),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ result: number | string }>;
    const count = Number(data?.[0]?.result);
    let ttlMs = Number(data?.[1]?.result);
    if (!Number.isFinite(count)) return null;
    if (!Number.isFinite(ttlMs) || ttlMs < 0) {
      // First hit or missing TTL: arm the window.
      await fetch(`${upstash.url}/pexpire/${encodeURIComponent(key)}/${config.windowMs}/NX`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${upstash.token}` },
      }).catch(() => null);
      ttlMs = config.windowMs;
    }
    const retryAfterSec = Math.max(1, Math.ceil(ttlMs / 1000));
    return {
      allowed: count <= config.limit,
      retryAfterSec,
      remaining: Math.max(0, config.limit - count),
      resetMs: Date.now() + ttlMs,
      key,
    };
  } catch {
    return null;
  }
}

/**
 * Fixed-window rate limit. Prefers shared Upstash Redis when configured,
 * falls back to an in-memory token bucket (single instance).
 * Never throws: on store failure it fails open so availability isn't
 * coupled to Redis.
 */
export async function checkRateLimit(
  request: Request,
  config: RateLimitConfig,
  extraKey?: string
): Promise<RateLimitResult> {
  const ip = getClientIp(request);
  const suffix = extraKey ? `:${extraKey.slice(0, 64)}` : '';
  const key = `ratelimit:${config.keyPrefix}:${ip}${suffix}`;
  const now = Date.now();

  const shared = await upstashCheck(key, config);
  if (shared) return shared;
  return memoryCheck(key, config, now);
}

/** 429 JSON response with Retry-After header. */
export function rateLimitedResponse(retryAfterSec: number, scope?: string): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.', ...(scope ? { scope } : {}) },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSec),
      },
    }
  );
}

/**
 * Build a 429 response with accurate limit headers for the given config.
 */
export function rateLimitExceededResponse(
  config: RateLimitConfig,
  result: RateLimitResult,
  scope?: string
): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.', ...(scope ? { scope } : {}) },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfterSec),
        'X-RateLimit-Limit': String(config.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(Math.ceil(result.resetMs / 1000)),
      },
    }
  );
}
