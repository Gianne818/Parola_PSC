import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('./registration', () => ({ registrationOwner: vi.fn(), registryQuery: vi.fn(), phoneE164: (phone: string) => phone,
  VERIFIED_PROFILE_SQL: 'verified owner SQL', RegistrationError: class extends Error { constructor(public status: number) { super('private detail'); } } }));
vi.mock('./demo-account', () => ({ demoOwner: vi.fn(), hasDemoCookie: vi.fn(() => false), DEMO_OWNER_CONDITION: 'owner condition' }));
import { registrationOwner, registryQuery, RegistrationError } from './registration';
import { demoOwner, hasDemoCookie } from './demo-account';
import { geographicReadProfile, geographicOwner } from './geographic-access';
const profileId = '11111111-1111-4111-8111-111111111111';
const request = new Request('http://localhost/api/advisories/nearest?user_id=forged&tier=premium');
beforeEach(() => {
  vi.clearAllMocks(); vi.stubEnv('PAROLA_AUTH_MODE', 'demo'); vi.stubEnv('PAROLA_GEOGRAPHIC_ENFORCEMENT_ENABLED', 'false');
  vi.mocked(registrationOwner).mockResolvedValue({ id: 'different-auth-id', phone: '+639171234567' });
  vi.mocked(registryQuery).mockResolvedValue({ rows: [{ id: profileId, is_active: true }] });
});
afterEach(() => vi.unstubAllEnvs());
describe('geographic API authority', () => {
  it('preserves anonymous demo previews without account or geographic requests', async () => {
    expect(await geographicReadProfile(request)).toBeUndefined();
    expect(registryQuery).not.toHaveBeenCalled();
  });
  it('blocks live reads while enforcement is inactive instead of serving unrestricted data', async () => {
    vi.stubEnv('PAROLA_AUTH_MODE', 'live');
    await expect(geographicReadProfile(request)).rejects.toMatchObject({ status: 503, code: 'geographic_enforcement_inactive' });
    expect(registryQuery).not.toHaveBeenCalled();
  });
  it('uses the persisted profile identity, ignoring forged request profile/tier fields', async () => {
    vi.stubEnv('PAROLA_GEOGRAPHIC_ENFORCEMENT_ENABLED', 'true');
    expect(await geographicReadProfile(request)).toBe(profileId);
    expect(registryQuery).toHaveBeenCalledWith('profile_live', expect.any(String), ['different-auth-id', '+639171234567']);
  });
  it('supports an authenticated demo owner without claiming real phone verification', async () => {
    vi.mocked(hasDemoCookie).mockReturnValueOnce(true);
    vi.mocked(demoOwner).mockReturnValue({ id: profileId, phone: '+639171234567' });
    expect(await geographicOwner(request)).toBe(profileId);
    expect(registrationOwner).not.toHaveBeenCalled();
  });
  it.each([[], [{ id: profileId, is_active: false }], [{ id: 'not-a-profile', is_active: true }]].map(rows => ({ rows })))('rejects missing/inactive profiles %j', async ({ rows }) => {
    vi.mocked(registryQuery).mockResolvedValue({ rows });
    await expect(geographicOwner(request)).rejects.toMatchObject({ status: 403 });
  });
  it('preserves authentication failures without exposing driver details', async () => {
    vi.mocked(registrationOwner).mockRejectedValue(new RegistrationError(401, 'private detail'));
    await expect(geographicOwner(request)).rejects.toMatchObject({ status: 401, code: 'geographic_auth_required' });
  });
});
