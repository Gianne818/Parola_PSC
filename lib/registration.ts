import { createClient } from '@supabase/supabase-js';
import { getSupabaseUser, type AuthUser } from '@/lib/route-auth';
import { getDbPool } from '@/lib/db';
import { isValidPhilippineMobile } from '@/lib/philippine-mobile';

export const MESSAGING_CONSENT_VERSION = 'messaging-v1';
export const MESSAGING_CONSENT_TEXT = 'I agree to receive Parola fishing advisories and safety alerts by SMS at my verified phone number. I can withdraw this messaging consent in the portal. Sponsor messages are not included.';

export class RegistrationError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function registrationJson(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function registrationResponse(action: () => Promise<Response>): Promise<Response> {
  try { return await action(); }
  catch (error) {
    if (error instanceof RegistrationError) return registrationJson({ error: error.message }, error.status);
    return registrationJson({ error: 'Registration service unavailable. Please try again.' }, 503);
  }
}

export async function registrationBody(request: Request, allowed: readonly string[]): Promise<Record<string, unknown>> {
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new RegistrationError(400, 'Invalid JSON body.');
  if (Object.keys(body).some(key => !allowed.includes(key))) {
    throw new RegistrationError(400, 'Unsupported registration fields. Assisted registration is disabled.');
  }
  return body as Record<string, unknown>;
}

export function phoneE164(value: unknown): string {
  if (typeof value !== 'string' || !isValidPhilippineMobile(value)) throw new RegistrationError(400, 'A valid Philippine mobile number is required.');
  return `+63${value.replace(/\D/g, '').slice(-10)}`;
}

export function consentInput(body: Record<string, unknown>): boolean {
  if (typeof body.messaging_consent !== 'boolean') throw new RegistrationError(400, 'An explicit messaging_consent choice is required.');
  if (body.consent_version !== MESSAGING_CONSENT_VERSION) throw new RegistrationError(409, 'Review the current messaging consent before submitting.');
  return body.messaging_consent;
}

export function phoneAuthClient() {
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

export const REGISTER_VERIFIED_USER_SQL = `
  INSERT INTO public.users (
    id, auth_user_id, phone_number, full_name, home_port_name, home_port_geom,
    preferred_advisory_time, phone_verified_at, messaging_consent,
    messaging_consent_version, messaging_consent_at, messaging_consent_actor_id
  )
  SELECT a.id, a.id, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326), $7,
    NOW(), $8, $9, NOW(), a.id
  FROM auth.users a
  WHERE a.id = $1 AND a.phone_confirmed_at IS NOT NULL
    AND public.parola_phone_e164(a.phone) = $2
  RETURNING id, phone_number, full_name, home_port_name, created_at,
    messaging_consent, messaging_consent_version, messaging_consent_at,
    (is_active IS TRUE AND messaging_consent) AS messaging_eligible;
`;

export async function smsRecipientEligible(phone: string, ownerId?: string): Promise<boolean> {
  const result = await registryDb().query<{ eligible: boolean }>(
    `SELECT public.parola_sms_recipient_eligible($1, $2, $3) AS eligible;`,
    [phoneE164(phone), MESSAGING_CONSENT_VERSION, ownerId || null],
  );
  return result.rows[0]?.eligible === true;
}
