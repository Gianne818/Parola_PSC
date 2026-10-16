import { createHmac, randomBytes, pbkdf2, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { getAuthMode } from '@/lib/auth-mode';
import { phoneE164, registrationJson, RegistrationError } from '@/lib/registration';

const derive = promisify(pbkdf2);
const COOKIE = 'parola-demo-session';
const MAX_AGE = 24 * 60 * 60;
type DemoOwner = { id: string; phone: string };

function secret(): string {
  const key = process.env.PAROLA_DEMO_SESSION_SECRET || '';
  if (key.length < 32) throw new RegistrationError(503, 'Configure PAROLA_DEMO_SESSION_SECRET before demo registration.');
  return key;
}

export function requireDemoConfig() {
  if (getAuthMode() !== 'demo') throw new RegistrationError(403, 'Demo registration is disabled.');
  secret();
}

export function checkSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (request.headers.get('sec-fetch-site') === 'cross-site' || (origin && origin !== new URL(request.url).origin)) {
    throw new RegistrationError(403, 'Cross-origin account requests are not allowed.');
  }
}

// Matches the existing Python login format: hex salt, PBKDF2-SHA256, 100k rounds.
export async function hashAccountPassword(value: unknown): Promise<string> {
  if (typeof value !== 'string' || value.length < 6 || value.length > 128) {
    throw new RegistrationError(400, 'Use a password with 6–128 characters.', 'invalid_password', 'password');
  }
  const salt = randomBytes(16).toString('hex');
  const key = await derive(value, salt, 100000, 32, 'sha256');
  return `${salt}$${key.toString('hex')}`;
}

export async function matchesAccountPassword(value: string, stored: unknown): Promise<boolean> {
  if (typeof stored !== 'string' || !/^[a-f0-9]{32}\$[a-f0-9]{64}$/.test(stored)) return false;
  const [salt, hex] = stored.split('$');
  const key = await derive(value, salt, 100000, 32, 'sha256');
  return timingSafeEqual(key, Buffer.from(hex, 'hex'));
}

export function demoSessionResponse(profile: { id: string; phone_number: string; [key: string]: unknown }, status = 200) {
  requireDemoConfig();
  const payload = Buffer.from(JSON.stringify({ id: profile.id, phone: phoneE164(profile.phone_number ?? profile.phone),
    exp: Math.floor(Date.now() / 1000) + MAX_AGE })).toString('base64url');
  const signature = createHmac('sha256', secret()).update(payload).digest('base64url');
  const response = registrationJson({ ...profile, auth_mode: 'demo', contact_verified: false,
    messaging_consent: false, messaging_eligible: false, session: null }, status);
  response.headers.set('Set-Cookie', `${COOKIE}=${payload}.${signature}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${MAX_AGE}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
  return response;
}

export function hasDemoCookie(request: Request): boolean {
  return (request.headers.get('cookie') || '').split(';').some(value => value.trim().startsWith(`${COOKIE}=`));
}

export function demoOwner(request: Request): DemoOwner {
  requireDemoConfig();
  const cookie = (request.headers.get('cookie') || '').split(';').map(value => value.trim()).find(value => value.startsWith(`${COOKIE}=`));
  try {
    const [payload, signature, extra] = (cookie?.slice(COOKIE.length + 1) || '').split('.');
    if (!payload || !signature || extra || payload.length > 1024) throw new Error();
    const expected = createHmac('sha256', secret()).update(payload).digest();
    const actual = Buffer.from(signature, 'base64url');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error();
    const owner = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!/^[a-f0-9-]{36}$/i.test(owner.id) || !Number.isSafeInteger(owner.exp) || owner.exp <= Date.now() / 1000) throw new Error();
    return { id: owner.id, phone: phoneE164(owner.phone) };
  } catch {
    throw new RegistrationError(401, 'Sign in again to continue.');
  }
}

export function clearDemoSession() {
  const response = registrationJson({ status: 'signed_out' });
  response.headers.set('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
  return response;
}

export const DEMO_OWNER_CONDITION = `u.id = $1 AND u.phone_e164 = $2
  AND u.auth_user_id IS NULL AND u.phone_verified_at IS NULL AND u.messaging_consent IS FALSE`;
