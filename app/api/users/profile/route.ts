import { phoneE164, registrationBody, registrationJson, registrationOwner, registrationResponse, registryDb, RegistrationError } from '@/lib/registration';

export async function PUT(request: Request) {
  return registrationResponse(async () => {
    const owner = await registrationOwner(request);
    const body = await registrationBody(request, ['phone_number', 'full_name', 'home_port_name', 'latitude', 'longitude', 'preferred_advisory_time']);
    const phone = phoneE164(body.phone_number);
    if (phone !== phoneE164(owner.phone)) throw new RegistrationError(403, 'You can only edit your own profile.');
    for (const field of ['full_name', 'home_port_name'] as const) {
      const value = body[field];
      if (typeof value !== 'string' || !value.trim() || value.length > 100) throw new RegistrationError(400, `${field} must be 1-100 characters.`);
    }
    for (const [field, min, max] of [['latitude', -90, 90], ['longitude', -180, 180]] as const) {
      const value = body[field];
      if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new RegistrationError(400, `${field} must be a valid numeric coordinate.`);
    }
    const time = body.preferred_advisory_time;
    if (time !== undefined && (typeof time !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(time))) throw new RegistrationError(400, 'preferred_advisory_time must be a valid HH:MM or HH:MM:SS time.');
    const result = await registryDb().query(`
      UPDATE public.users u SET full_name = $3, home_port_name = $4,
        home_port_geom = ST_SetSRID(ST_MakePoint($5, $6), 4326),
        preferred_advisory_time = COALESCE($7::time, u.preferred_advisory_time), updated_at = NOW()
      FROM auth.users a WHERE u.auth_user_id = $1 AND a.id = u.auth_user_id
        AND u.phone_e164 = $2 AND a.phone_confirmed_at IS NOT NULL
        AND public.parola_phone_e164(a.phone) = $2
      RETURNING u.id, u.phone_number, u.full_name, u.home_port_name,
        ST_Y(u.home_port_geom) AS latitude, ST_X(u.home_port_geom) AS longitude;`,
    [owner.id, phone, (body.full_name as string).trim(), (body.home_port_name as string).trim(), body.longitude, body.latitude, time ?? null]);
    if (!result.rows[0]) throw new RegistrationError(404, 'Verified registration not found.');
    return registrationJson(result.rows[0]);
  });
}
