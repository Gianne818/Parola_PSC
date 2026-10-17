import { getAuthMode } from '@/lib/auth-mode';
import { checkSameOrigin, demoSessionResponse, hashAccountPassword, requireDemoConfig } from '@/lib/demo-account';
import { RATE_LIMITS, checkRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit';
import { ADVISORY_PREFERENCE_FIELDS, registrationPreferences, withAdvisorySchedule } from '@/lib/advisory-preferences';
import { consentInput, MESSAGING_CONSENT_VERSION, phoneE164, REGISTER_VERIFIED_USER_SQL, registrationBody, registrationJson, registrationOwner, registrationResponse, registryQuery, RegistrationError, type RegistryProfile } from '@/lib/registration';

export async function POST(request: Request) {
  return registrationResponse(async () => {
    const limit = await checkRateLimit(request, RATE_LIMITS.registration);
    if (!limit.allowed) return rateLimitExceededResponse(RATE_LIMITS.registration, limit, 'registration');
    const demo = getAuthMode() === 'demo';
    if (demo) { checkSameOrigin(request); requireDemoConfig(); }
    const owner = demo ? null : await registrationOwner(request);
    const body = await registrationBody(request, ['phone_number', 'full_name', 'home_port_name', 'latitude', 'longitude', ...ADVISORY_PREFERENCE_FIELDS, 'messaging_consent', 'consent_version', 'password']);
    const phone = phoneE164(body.phone_number);
    if (owner && phone !== phoneE164(owner.phone)) throw new RegistrationError(403, 'You can only register your verified phone.');
    const consent = demo ? false : consentInput(body);
    if (demo && (body.messaging_consent === true || body.consent_version !== undefined)) throw new RegistrationError(400, 'Verify your phone in live mode before granting messaging consent.');
    const { full_name, home_port_name } = body;
    if (typeof full_name !== 'string' || !full_name.trim() || full_name.length > 100) throw new RegistrationError(400, 'full_name must be 1-100 characters.');
    if (typeof home_port_name !== 'string' || !home_port_name.trim() || home_port_name.length > 100) throw new RegistrationError(400, 'home_port_name must be 1-100 characters.');
    for (const [field, min, max] of [['latitude', -90, 90], ['longitude', -180, 180]] as const) {
      const value = body[field];
      if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new RegistrationError(400, `${field} must be a valid numeric coordinate.`);
    }
    const preferences = registrationPreferences(body);
    const passwordHash = demo || body.password !== undefined ? await hashAccountPassword(body.password) : null;
    try {
      if (demo) {
        const result = await registryQuery<RegistryProfile>('register_demo', `INSERT INTO public.users
          (phone_number, full_name, home_port_name, home_port_geom, password_hash,
           preferred_advisory_time, advisory_days, preferred_language, habitat_preference,
           auth_user_id, phone_verified_at, messaging_consent)
          VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6, $7, $8::smallint[], $9, $10, NULL, NULL, FALSE)
          RETURNING id, phone_number, full_name, home_port_name, created_at,
            ST_Y(home_port_geom) AS latitude, ST_X(home_port_geom) AS longitude,
            advisory_days, preferred_advisory_time::text, preferred_language, habitat_preference;`,
        [phone, full_name.trim(), home_port_name.trim(), body.longitude, body.latitude, passwordHash,
          preferences.preferred_advisory_time, preferences.advisory_days, preferences.preferred_language, preferences.habitat_preference]);
        if (!result.rows[0]) throw new RegistrationError(503, 'Account was not saved.');
        return demoSessionResponse({ ...withAdvisorySchedule(result.rows[0]), status: 'registered' }, 201);
      }
      const result = await registryQuery<RegistryProfile>('register_live', REGISTER_VERIFIED_USER_SQL, [owner!.id, phone, full_name.trim(), home_port_name.trim(), body.longitude, body.latitude, preferences.preferred_advisory_time, consent, MESSAGING_CONSENT_VERSION, preferences.advisory_days, preferences.preferred_language, preferences.habitat_preference, passwordHash]);
      if (!result.rows[0]) throw new RegistrationError(403, 'Phone ownership could not be confirmed.');
      return registrationJson(withAdvisorySchedule({ ...result.rows[0], contact_verified: true, status: 'registered' }), 201);
    } catch (error) {
      if ((error as { code?: string })?.code === '23505') throw new RegistrationError(409, 'An account already exists. Sign in, or complete live phone verification to link an unverified account.');
      throw error;
    }
  });
}
