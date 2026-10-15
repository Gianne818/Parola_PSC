import { phoneE164, registrationBody, registrationJson, registrationOwner, registrationResponse, registryDb, RegistrationError } from '@/lib/registration';
import { ADVISORY_PREFERENCE_FIELDS, advisoryPreferenceInput, withAdvisorySchedule } from '@/lib/advisory-preferences';

const profileColumns = `u.id, u.phone_number, u.full_name, u.home_port_name,
  ST_Y(u.home_port_geom) AS latitude, ST_X(u.home_port_geom) AS longitude,
  u.advisory_days, u.preferred_advisory_time::text, u.preferred_language, u.habitat_preference,
  u.is_active, u.messaging_consent, u.messaging_consent_version, u.messaging_consent_at`;
const ownerCondition = `u.auth_user_id = $1 AND a.id = u.auth_user_id
  AND u.phone_e164 = $2 AND a.phone_confirmed_at IS NOT NULL
  AND public.parola_phone_e164(a.phone) = $2`;

export async function GET(request: Request) {
  return registrationResponse(async () => {
    const owner = await registrationOwner(request);
    const result = await registryDb().query(`SELECT ${profileColumns} FROM public.users u
      JOIN auth.users a ON a.id = u.auth_user_id WHERE ${ownerCondition};`, [owner.id, phoneE164(owner.phone)]);
    if (!result.rows[0]) throw new RegistrationError(404, 'Verified registration not found.');
    return registrationJson(withAdvisorySchedule(result.rows[0]));
  });
}

export async function PUT(request: Request) {
  return registrationResponse(async () => {
    const owner = await registrationOwner(request);
    const body = await registrationBody(request, ['phone_number', 'full_name', 'home_port_name', 'latitude', 'longitude', ...ADVISORY_PREFERENCE_FIELDS]);
    const phone = phoneE164(body.phone_number);
    if (phone !== phoneE164(owner.phone)) throw new RegistrationError(403, 'You can only edit your own profile.');
    if (Object.keys(body).every(key => key === 'phone_number')) throw new RegistrationError(400, 'Provide at least one profile or preference field to update.');
    for (const field of ['full_name', 'home_port_name'] as const) {
      const value = body[field];
      if (value !== undefined && (typeof value !== 'string' || !value.trim() || value.length > 100)) throw new RegistrationError(400, `${field} must be 1-100 characters.`);
    }
    if ((body.latitude === undefined) !== (body.longitude === undefined)) throw new RegistrationError(400, 'Provide latitude and longitude together.');
    for (const [field, min, max] of [['latitude', -90, 90], ['longitude', -180, 180]] as const) {
      const value = body[field];
      if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)) throw new RegistrationError(400, `${field} must be a valid numeric coordinate.`);
    }
    const preferences = advisoryPreferenceInput(body);
    const result = await registryDb().query(`
      UPDATE public.users u SET full_name = COALESCE($3::text, u.full_name), home_port_name = COALESCE($4::text, u.home_port_name),
        home_port_geom = CASE WHEN $5::double precision IS NULL THEN u.home_port_geom ELSE ST_SetSRID(ST_MakePoint($5, $6), 4326) END,
        preferred_advisory_time = COALESCE($7::time, u.preferred_advisory_time),
        advisory_days = COALESCE($8::smallint[], u.advisory_days),
        preferred_language = COALESCE($9::text, u.preferred_language),
        habitat_preference = COALESCE($10::text, u.habitat_preference), updated_at = NOW()
      FROM auth.users a WHERE ${ownerCondition}
      RETURNING ${profileColumns};`,
    [owner.id, phone, (body.full_name as string | undefined)?.trim() ?? null, (body.home_port_name as string | undefined)?.trim() ?? null,
      body.longitude ?? null, body.latitude ?? null, preferences.preferred_advisory_time ?? null,
      preferences.advisory_days ?? null, preferences.preferred_language ?? null, preferences.habitat_preference ?? null]);
    if (!result.rows[0]) throw new RegistrationError(404, 'Verified registration not found.');
    return registrationJson(withAdvisorySchedule(result.rows[0]));
  });
}
