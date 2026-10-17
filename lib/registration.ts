import { getAuthMode } from '@/lib/auth-mode';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseUser, type AuthUser } from '@/lib/route-auth';
import { getDbPool } from '@/lib/db';
import { isValidPhilippineMobile } from '@/lib/philippine-mobile';
import { boundedJson, RequestBodyError } from '@/lib/request-body';
import type { QueryResultRow } from 'pg';
import type { AdvisoryPreferences } from '@/types';
import { registryHttpsQuery, RegistryHttpsError, type RegistryOperation } from '@/lib/registry-https';

export const MESSAGING_CONSENT_VERSION = 'messaging-v1';
export const MESSAGING_CONSENT_TEXT = 'I agree to receive Parola fishing advisories and safety alerts by SMS at my verified phone number. I can withdraw this messaging consent in the portal. Sponsor messages are not included.';

export class RegistrationError extends Error {
  constructor(public status: number, message: string,
    public code = ({ 400: 'invalid_request', 401: 'auth_required', 403: 'ownership_required', 404: 'profile_not_found', 409: 'conflict', 503: 'service_unavailable' } as Record<number, string>)[status] || 'request_failed',
    public field?: string) { super(message); }
}

export function registrationJson(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

// Local diagnosis only. Never echo driver messages, SQL, connection URLs or PII.
const LOCAL_FAILURE_CODES = new Set([
  'EACCES', 'EPERM', 'ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT',
  'SELF_SIGNED_CERT_IN_CHAIN', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'CERT_HAS_EXPIRED', 'ERR_TLS_CERT_ALTNAME_INVALID', 'ERR_INVALID_URL',
  '23502', '23503', '23514', '42703', '42P01', '42883', '42501', '28P01', '3D000', '53300', '57P01',
]);

function localFailureCode(error: unknown, depth = 0): string {
  if (!error || typeof error !== 'object' || depth > 3) return 'UNEXPECTED_ERROR';
  const value = error as { code?: unknown; message?: unknown; name?: unknown; cause?: unknown; errors?: unknown[] };
  if (typeof value.code === 'string') {
    if (LOCAL_FAILURE_CODES.has(value.code)) return value.code;
    if (/^[0-9A-Z]{5}$/.test(value.code)) return `DB_${value.code}`;
  }
  // These labels come from known driver conditions; raw messages stay private.
  if (typeof value.message === 'string') {
    if (/connection terminated unexpectedly/i.test(value.message)) return 'DB_CONNECTION_CLOSED';
    if (/connection timeout|timeout exceeded when trying to connect|timeout expired/i.test(value.message)) return 'DB_CONNECTION_TIMEOUT';
    if (/client password must be/i.test(value.message)) return 'DB_PASSWORD_MISSING';
    if (/server signature does not match/i.test(value.message)) return 'DB_PASSWORD_REJECTED';
    if (/tenant or user not found/i.test(value.message)) return 'DB_POOLER_USER_NOT_FOUND';
    if (/max clients|maxclients|too many clients/i.test(value.message)) return 'DB_POOL_FULL';
    if (/Cannot use a pool after calling end/i.test(value.message)) return 'DB_POOL_ENDED';
  }
  const nested = [value.cause, ...(Array.isArray(value.errors) ? value.errors.slice(0, 3) : [])];
  for (const cause of nested) {
    const code = localFailureCode(cause, depth + 1);
    if (code !== 'UNEXPECTED_ERROR') return code;
  }
  return value.name === 'TypeError' ? 'TYPE_ERROR' : value.name === 'RangeError' ? 'RANGE_ERROR' : 'UNEXPECTED_ERROR';
}

export async function registrationResponse(action: () => Promise<Response>): Promise<Response> {
  try { return await action(); }
  catch (error) {
    if (error instanceof RegistrationError || error instanceof RequestBodyError) return registrationJson({ error: error.message, code: error.code,
      ...(error instanceof RegistrationError && error.field ? { field: error.field } : {}), message_language: 'en' }, error.status);
    const diagnostic = process.env.NODE_ENV === 'development'
      ? localFailureCode(error) : undefined;
    return registrationJson({ error: `Registration service unavailable. Please try again.${diagnostic ? ` (Diagnostic: ${diagnostic})` : ''}`,
      code: 'service_unavailable', message_language: 'en', ...(diagnostic ? { diagnostic_code: diagnostic } : {}) }, 503);
  }
}

export async function registrationBody(request: Request, allowed: readonly string[]): Promise<Record<string, unknown>> {
  const body = await boundedJson(request);
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new RegistrationError(400, 'Invalid JSON body.', 'invalid_json');
  if (Object.keys(body).some(key => !allowed.includes(key))) {
    throw new RegistrationError(400, 'Unsupported registration fields. Assisted registration is disabled.', 'unsupported_fields');
  }
  return body as Record<string, unknown>;
}

export function phoneE164(value: unknown): string {
  if (typeof value !== 'string' || !isValidPhilippineMobile(value)) throw new RegistrationError(400, 'A valid Philippine mobile number is required.', 'invalid_phone', 'phone_number');
  return `+63${value.replace(/\D/g, '').slice(-10)}`;
}

export function consentInput(body: Record<string, unknown>): boolean {
  if (typeof body.messaging_consent !== 'boolean') throw new RegistrationError(400, 'An explicit messaging_consent choice is required.', 'consent_required', 'messaging_consent');
  if (body.consent_version !== MESSAGING_CONSENT_VERSION) throw new RegistrationError(409, 'Review the current messaging consent before submitting.', 'consent_version_outdated', 'consent_version');
  return body.messaging_consent;
}

export function phoneAuthClient() {
  if (getAuthMode() === 'demo') throw new RegistrationError(409, 'OTP requests are disabled in demo mode.', 'demo_mode');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (process.env.PAROLA_PHONE_AUTH_ENABLED !== 'true' || !url.startsWith('https://') || !key) {
    throw new RegistrationError(503, 'Phone verification is not configured.');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(8000) }) },
  });
}

export async function registrationOwner(request: Request): Promise<AuthUser> {
  // Admin keys and supplied actor/role fields do not establish fisher consent.
  const user = await getSupabaseUser(request);
  if (!user) throw new RegistrationError(401, 'A verified phone session is required.');
  if (!user.phone) throw new RegistrationError(403, 'Verify your phone before continuing.');
  phoneE164(user.phone);
  return user;
}

export function registryDb() {
  const db = getDbPool(5);
  if (!db) throw new RegistrationError(503, 'Registration database is not configured.');
  return db;
}

export interface RegistryProfile extends AdvisoryPreferences {
  id: string;
  phone_number: string;
  password_hash?: unknown;
  [key: string]: unknown;
}

export async function registryQuery<R extends QueryResultRow = QueryResultRow>(operation: RegistryOperation, sql: string, values: unknown[]): Promise<{ rows: R[] }> {
  const transport = process.env.PAROLA_REGISTRY_TRANSPORT ?? 'postgres';
  if (transport === 'postgres') return registryDb().query<R>(sql, values);
  if (transport !== 'https') throw new RegistrationError(503, 'Invalid account storage transport.', 'registry_transport_invalid');
  try { return await registryHttpsQuery<R>(operation, values); }
  catch (error) {
    if (error instanceof RegistryHttpsError && error.code !== '23505') {
      throw new RegistrationError(503, error.message, error.code);
    }
    throw error;
  }
}

export const REGISTER_VERIFIED_USER_SQL = `
  INSERT INTO public.users (
    id, auth_user_id, phone_number, full_name, home_port_name, home_port_geom,
    preferred_advisory_time, phone_verified_at, messaging_consent,
    messaging_consent_version, messaging_consent_at, messaging_consent_actor_id,
    advisory_days, preferred_language, habitat_preference, password_hash
  )
  SELECT a.id, a.id, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326), $7,
    NOW(), $8, $9, NOW(), a.id, $10::smallint[], $11, $12, $13
  FROM auth.users a
  WHERE a.id = $1 AND a.phone_confirmed_at IS NOT NULL
    AND public.parola_phone_e164(a.phone) = $2
  ON CONFLICT (phone_e164) DO UPDATE SET
    auth_user_id = EXCLUDED.auth_user_id, phone_verified_at = EXCLUDED.phone_verified_at,
    messaging_consent = EXCLUDED.messaging_consent, messaging_consent_version = EXCLUDED.messaging_consent_version,
    messaging_consent_at = EXCLUDED.messaging_consent_at, messaging_consent_actor_id = EXCLUDED.messaging_consent_actor_id,
    password_hash = COALESCE(EXCLUDED.password_hash, public.users.password_hash), updated_at = NOW()
  WHERE public.users.auth_user_id IS NULL AND public.users.phone_verified_at IS NULL
    AND public.users.messaging_consent IS FALSE AND public.users.password_hash IS NOT NULL
  RETURNING id, phone_number, full_name, home_port_name, created_at,
    messaging_consent, messaging_consent_version, messaging_consent_at,
    advisory_days, preferred_advisory_time::text, preferred_language, habitat_preference,
    (is_active IS TRUE AND messaging_consent) AS messaging_eligible;
`;

export async function smsRecipientEligible(phone: string, ownerId?: string): Promise<boolean> {
  const result = await registryQuery<{ eligible: boolean }>('sms_eligibility',
    `SELECT public.parola_sms_recipient_eligible($1, $2, $3) AS eligible;`,
    [phoneE164(phone), MESSAGING_CONSENT_VERSION, ownerId || null],
  );
  return result.rows[0]?.eligible === true;
}
