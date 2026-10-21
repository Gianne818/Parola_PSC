import { getAuthMode } from './auth-mode';
import { demoOwner, hasDemoCookie, DEMO_OWNER_CONDITION } from './demo-account';
import { phoneE164, registrationOwner, registryQuery, RegistrationError, VERIFIED_PROFILE_SQL, type RegistryProfile } from './registration';
import { isProfileId } from './geographic-eligibility';

export class GeographicAccessError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export function geographicEnforcementEnabled(): boolean {
  const flag = process.env.PAROLA_GEOGRAPHIC_ENFORCEMENT_ENABLED ?? 'false';
  if (flag !== 'true' && flag !== 'false') throw new GeographicAccessError(503, 'geographic_config_unavailable', 'Geographic access is unavailable.');
  return flag === 'true';
}

/** Resolve the persisted profile, which may differ from Auth's user ID after linking. */
export async function geographicOwner(request: Request): Promise<string> {
  try {
    const demo = getAuthMode() === 'demo' && hasDemoCookie(request) && !request.headers.has('authorization');
    const owner = demo ? demoOwner(request) : await registrationOwner(request);
    const result = await registryQuery<RegistryProfile>(demo ? 'profile_demo' : 'profile_live', demo
      ? `SELECT u.id, u.is_active FROM public.users u WHERE ${DEMO_OWNER_CONDITION};` : VERIFIED_PROFILE_SQL,
    [owner.id, phoneE164(owner.phone)]);
    const profile = result.rows[0];
    if (!profile || !isProfileId(profile.id) || profile.is_active !== true) {
      throw new GeographicAccessError(403, 'geographic_owner_unavailable', 'An active registered account is required.');
    }
    return profile.id;
  } catch (error) {
    if (error instanceof GeographicAccessError) throw error;
    if (error instanceof RegistrationError && [401, 403].includes(error.status)) {
      throw new GeographicAccessError(error.status, 'geographic_auth_required', 'Sign in to access permitted fishing areas.');
    }
    throw new GeographicAccessError(503, 'geographic_owner_unavailable', 'Account access is unavailable.');
  }
}

export async function geographicReadProfile(request: Request): Promise<string | undefined> {
  if (geographicEnforcementEnabled()) return geographicOwner(request);
  if (getAuthMode() !== 'demo') throw new GeographicAccessError(503, 'geographic_enforcement_inactive', 'Geographic access must be configured before live fishing guidance is available.');
  return undefined; // The existing anonymous demo preview remains a preview.
}
