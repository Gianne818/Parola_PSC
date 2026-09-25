import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export type AuthUser = {
  id: string;
  phone: string | null;
};

function getBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization');
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

function normalizePhone(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

/**
 * Validate a Supabase JWT from the Authorization header.
 * Returns the user when the token is valid, otherwise null.
 * Returns null (not throw) when Supabase is not configured so callers
 * can fail closed with 401.
 */
export async function getSupabaseUser(request: Request): Promise<AuthUser | null> {
  const token = getBearerToken(request);
  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url.startsWith('http') || !anonKey) return null;

  try {
    const supabase = createClient(url, anonKey);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;
    const phone =
      (data.user.phone as string | null) ??
      ((data.user.user_metadata as Record<string, unknown> | null)?.phone_number as string | null) ??
      null;
    return { id: data.user.id, phone };
  } catch {
    return null;
  }
}

export function isAdminRequest(request: Request): boolean {
  const adminKey = process.env.ADMIN_API_KEY || '';
  if (!adminKey) return false;
  const provided =
    request.headers.get('x-admin-key') ?? request.headers.get('x-api-key') ?? '';
  if (!provided) return false;
  if (provided.length !== adminKey.length) return false;
  // Timing-safe compare without leaking length via early exit
  let diff = 0;
  for (let i = 0; i < adminKey.length; i++) {
    diff |= adminKey.charCodeAt(i) ^ provided.charCodeAt(i);
  }
  return diff === 0;
}

export function unauthorized(message = 'Authentication required.') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = 'Forbidden.') {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function adminNotConfigured() {
  return NextResponse.json(
    { error: 'Admin access is not configured.' },
    { status: 503 }
  );
}

/**
 * Require ADMIN_API_KEY. Fails closed when the env var is missing.
 */
export function requireAdmin(request: Request): NextResponse | null {
  if (!process.env.ADMIN_API_KEY) return adminNotConfigured();
  if (!isAdminRequest(request)) return unauthorized('Admin authentication required.');
  return null;
}

/**
 * Require any authenticated caller: valid admin key OR valid Supabase user JWT.
 */
export async function requireUser(request: Request): Promise<{ user: AuthUser | null; error: NextResponse | null }> {
  if (isAdminRequest(request)) return { user: null, error: null };
  const user = await getSupabaseUser(request);
  if (!user) return { user: null, error: unauthorized() };
  return { user, error: null };
}

/**
 * Require ownership of `phoneNumber`: admin bypasses, otherwise the
 * Supabase JWT phone must match (digits-only, suffix match for +63/09 variants).
 */
export async function requireOwnerOrAdmin(
  request: Request,
  phoneNumber: string
): Promise<NextResponse | null> {
  if (!process.env.ADMIN_API_KEY && !(process.env.NEXT_PUBLIC_SUPABASE_URL || '').startsWith('http')) {
    return NextResponse.json({ error: 'Authentication is not configured.' }, { status: 503 });
  }
  if (isAdminRequest(request)) return null;
  const user = await getSupabaseUser(request);
  if (!user) return unauthorized();
  const wanted = normalizePhone(phoneNumber);
  const have = normalizePhone(user.phone);
  if (!wanted || !have) return forbidden('Phone ownership could not be verified.');
  // Allow +63XXXXXXXXXX vs 09XXXXXXXXXX variants: compare last 10 digits
  if (wanted.slice(-10) !== have.slice(-10)) {
    return forbidden('You can only access your own account.');
  }
  return null;
}
