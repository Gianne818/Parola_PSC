import { RATE_LIMITS, checkRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit';
import { ADVISORY_PREFERENCE_FIELDS, registrationPreferences, withAdvisorySchedule } from '@/lib/advisory-preferences';
import { consentInput, MESSAGING_CONSENT_VERSION, phoneE164, REGISTER_VERIFIED_USER_SQL, registrationBody, registrationJson, registrationOwner, registrationResponse, registryDb, RegistrationError } from '@/lib/registration';

export async function POST(request: Request) {
  return registrationResponse(async () => {
    const limit = await checkRateLimit(request, RATE_LIMITS.registration);
    if (!limit.allowed) return rateLimitExceededResponse(RATE_LIMITS.registration, limit, 'registration');
    const owner = await registrationOwner(request);
    const body = await registrationBody(request, ['phone_number', 'full_name', 'home_port_name', 'latitude', 'longitude', ...ADVISORY_PREFERENCE_FIELDS, 'messaging_consent', 'consent_version']);
    const phone = phoneE164(body.phone_number);
    if (phone !== phoneE164(owner.phone)) throw new RegistrationError(403, 'You can only register your verified phone.');
    const consent = consentInput(body);
    const { full_name, home_port_name } = body;
    if (typeof full_name !== 'string' || !full_name.trim() || full_name.length > 100) throw new RegistrationError(400, 'full_name must be 1-100 characters.');
    if (typeof home_port_name !== 'string' || !home_port_name.trim() || home_port_name.length > 100) throw new RegistrationError(400, 'home_port_name must be 1-100 characters.');
    for (const [field, min, max] of [['latitude', -90, 90], ['longitude', -180, 180]] as const) {
      const value = body[field];
      if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new RegistrationError(400, `${field} must be a valid numeric coordinate.`);
    }
    const preferences = registrationPreferences(body);
    try {
      const result = await registryDb().query(REGISTER_VERIFIED_USER_SQL, [owner.id, phone, full_name.trim(), home_port_name.trim(), body.longitude, body.latitude, preferences.preferred_advisory_time, consent, MESSAGING_CONSENT_VERSION, preferences.advisory_days, preferences.preferred_language, preferences.habitat_preference]);
      if (!result.rows[0]) throw new RegistrationError(403, 'Phone ownership could not be confirmed.');
      return registrationJson(withAdvisorySchedule({ ...result.rows[0], contact_verified: true, status: 'registered' }), 201);
    } catch (error) {
      if ((error as { code?: string })?.code === '23505') throw new RegistrationError(409, 'An account already exists. Sign in instead; legacy account linking requires review.');
      throw error;
    }
  });
}
