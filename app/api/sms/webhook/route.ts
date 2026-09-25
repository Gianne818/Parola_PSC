import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { getDbPool } from '@/lib/db';
import { RATE_LIMITS, checkRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit';

// Best-effort in-memory idempotency for retried gateway callbacks (single instance).
const seenMessageIds = new Map<string, number>();
const IDEMPOTENCY_TTL_MS = 60 * 60 * 1000;

function isDuplicate(messageId: string): boolean {
  const now = Date.now();
  const prev = seenMessageIds.get(messageId);
  if (prev !== undefined && now - prev < IDEMPOTENCY_TTL_MS) return true;
  seenMessageIds.set(messageId, now);
  if (seenMessageIds.size > 1000) {
    const oldest = [...seenMessageIds.entries()].sort((a, b) => a[1] - b[1])[0]?.[0];
    if (oldest) seenMessageIds.delete(oldest);
  }
  // Opportunistic expiry sweep
  if (seenMessageIds.size % 100 === 0) {
    for (const [key, ts] of seenMessageIds) {
      if (now - ts >= IDEMPOTENCY_TTL_MS) seenMessageIds.delete(key);
    }
  }
  return false;
}

function verifySignature(rawBody: string, provided: string | null, secret: string): boolean {
  if (!provided) return false;
  const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  const a = Buffer.from(provided.trim().toLowerCase(), 'utf8');
  const b = Buffer.from(expected.toLowerCase(), 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** 1 = High, 2 = Medium, 3 = Low. Matches standalone digits only ("13" is not a vote). */
function parseFeedbackValue(message: string): number {
  const match = message.match(/\b([123])\b/);
  if (!match) return 2;
  return Number(match[1]);
}

function isValidPhilippinePhone(phone: string): boolean {
  return /^(63\d{10}|09\d{9}|9\d{9})$/.test(phone.replace(/\D/g, ''));
}

function phoneCandidates(phone: string): string[] {
  const digits = phone.replace(/\D/g, '');
  const last10 = digits.slice(-10);
  return [...new Set([phone, digits, `63${last10}`, `0${last10}`])];
}

export async function POST(request: Request) {
  const flood = await checkRateLimit(request, RATE_LIMITS.smsWebhook);
  if (!flood.allowed) {
    return rateLimitExceededResponse(RATE_LIMITS.smsWebhook, flood, 'sms-webhook');
  }
  const secret = process.env.SMS_WEBHOOK_SECRET || '';
  if (!secret) {
    console.error('[SMS Webhook] SMS_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook receiver is not configured.' }, { status: 503 });
  }

  let rawBody = '';
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const signature =
    request.headers.get('x-webhook-signature') ?? request.headers.get('x-iprog-signature');
  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { phone_number, message, message_id } = body as {
    phone_number?: unknown;
    message?: unknown;
    message_id?: unknown;
  };

  if (typeof phone_number !== 'string' || !phone_number.trim()) {
    return NextResponse.json({ error: 'phone_number and message required' }, { status: 400 });
  }
  if (typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ error: 'phone_number and message required' }, { status: 400 });
  }
  if (message.length > 1000) {
    return NextResponse.json({ error: 'message must be at most 1000 characters.' }, { status: 400 });
  }

  const cleanedPhone = phone_number.trim();
  if (cleanedPhone.length > 32 || !isValidPhilippinePhone(cleanedPhone)) {
    return NextResponse.json({ error: 'phone_number must be a valid Philippine mobile number.' }, { status: 400 });
  }

  if (typeof message_id === 'string' && message_id) {
    if (message_id.length > 128) {
      return NextResponse.json({ error: 'message_id is too long.' }, { status: 400 });
    }
    if (isDuplicate(message_id)) {
      return NextResponse.json({ status: 'duplicate' });
    }
  }

  const feedbackValue = parseFeedbackValue(message);
  // catch_feedbacks.raw_sms_body is VARCHAR(50)
  const rawSmsBody = message.trim().slice(0, 50);

  // Resolve the sender to a real user — never store unlinked junk rows.
  let userId: string | null = null;
  let advisoryId: string | null = null;
  const db = getDbPool(3);
  if (db) {
    try {
      const candidates = phoneCandidates(cleanedPhone);
      const placeholders = candidates.map((_, i) => `$${i + 1}`).join(', ');
      const userRes = await db.query(
        `SELECT id FROM public.users WHERE phone_number IN (${placeholders}) LIMIT 1;`,
        candidates
      );
      userId = (userRes.rows?.[0]?.id as string | undefined) ?? null;
      if (userId) {
        const advRes = await db.query(
          `SELECT id FROM public.daily_advisories WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1;`,
          [userId]
        );
        advisoryId = (advRes.rows?.[0]?.id as string | undefined) ?? null;
      }
    } catch {
      console.error('[SMS Webhook] user/advisory lookup failed');
    }
  }
  if (!userId) {
    return NextResponse.json({ error: 'User not found for this phone number.' }, { status: 404 });
  }

  const apiUrl = process.env.PAROLA_API_URL || 'http://localhost:8000';
  const backendApiKey = process.env.PAROLA_API_KEY || '';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    let response: Response;
    try {
      response = await fetch(`${apiUrl}/api/feedback/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(backendApiKey ? { 'X-API-Key': backendApiKey } : {}),
        },
        body: JSON.stringify({
          user_id: userId,
          advisory_id: advisoryId,
          feedback_value: feedbackValue,
          raw_sms_body: rawSmsBody,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok) {
      console.error('[SMS Webhook] backend rejected feedback');
      return NextResponse.json({ error: 'Feedback could not be recorded.' }, { status: 502 });
    }
    return NextResponse.json({ status: 'received', forwarded: true });
  } catch {
    console.error('[SMS Webhook] backend unreachable');
    return NextResponse.json({ error: 'Feedback service unavailable.' }, { status: 503 });
  }
}
