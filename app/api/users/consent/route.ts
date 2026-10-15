import { consentInput, MESSAGING_CONSENT_TEXT, MESSAGING_CONSENT_VERSION, phoneE164, registrationBody, registrationJson, registrationOwner, registrationResponse, registryDb, RegistrationError } from '@/lib/registration';

export async function GET(request: Request) {
  return registrationResponse(async () => {
    const owner = await registrationOwner(request);
    const result = await registryDb().query(`
      SELECT messaging_consent, messaging_consent_version, messaging_consent_at
      FROM public.users WHERE auth_user_id = $1 AND phone_e164 = $2;`, [owner.id, phoneE164(owner.phone)]);
    return registrationJson({
      consent_version: MESSAGING_CONSENT_VERSION, consent_text: MESSAGING_CONSENT_TEXT,
      consent: result.rows[0] || null,
    });
  });
}

export async function PUT(request: Request) {
  return registrationResponse(async () => {
    const owner = await registrationOwner(request);
    const body = await registrationBody(request, ['messaging_consent', 'consent_version']);
    const consent = consentInput(body);
    const result = await registryDb().query(`
      UPDATE public.users u SET messaging_consent = $3,
        messaging_consent_version = $4, messaging_consent_at = NOW(),
        messaging_consent_actor_id = $1, updated_at = NOW()
      FROM auth.users a
      WHERE u.auth_user_id = $1 AND a.id = u.auth_user_id
        AND u.phone_e164 = $2 AND u.phone_verified_at IS NOT NULL AND a.phone_confirmed_at IS NOT NULL
        AND public.parola_phone_e164(a.phone) = $2
      RETURNING u.messaging_consent, u.messaging_consent_version, u.messaging_consent_at,
        (u.is_active IS TRUE AND u.messaging_consent) AS messaging_eligible;`,
    [owner.id, phoneE164(owner.phone), consent, MESSAGING_CONSENT_VERSION]);
    if (!result.rows[0]) throw new RegistrationError(404, 'Verified registration not found.');
    return registrationJson(result.rows[0]);
  });
}
