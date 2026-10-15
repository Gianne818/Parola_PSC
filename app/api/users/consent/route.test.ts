import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/db', () => ({ getDbPool: vi.fn() }));
vi.mock('@/lib/route-auth', () => ({ getSupabaseUser: vi.fn() }));
import { getDbPool } from '@/lib/db';
import { getSupabaseUser } from '@/lib/route-auth';
import { GET, PUT } from './route';
const query = vi.fn();
const owner = { id: 'owner-id', phone: '+639171234567' };
function request(body: unknown) { return new Request('http://localhost/api/users/consent', { method: 'PUT', body: JSON.stringify(body) }); }
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getSupabaseUser).mockResolvedValue(owner);
  vi.mocked(getDbPool).mockReturnValue({ query } as never);
  query.mockResolvedValue({ rows: [{ messaging_consent: false, messaging_consent_version: 'messaging-v1', messaging_eligible: false }] });
});
describe('owner messaging consent', () => {
  it('exposes the current consent text/version and saved choice', async () => {
    const response = await GET(new Request('http://localhost/api/users/consent'));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ consent_version: 'messaging-v1', consent_text: expect.stringContaining('Sponsor messages are not included'), consent: { messaging_consent: false } });
  });
  it('withdraws consent under the verified actor, without deleting the account', async () => {
    const response = await PUT(request({ messaging_consent: false, consent_version: 'messaging-v1' }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ messaging_consent: false, messaging_eligible: false });
    expect(query.mock.calls[0][1]).toEqual([owner.id, owner.phone, false, 'messaging-v1']);
    expect(query.mock.calls[0][0]).toContain('THEN NOW() ELSE u.messaging_consent_at END');
  });
  it('does not report inactive contacts as eligible when granting consent', async () => {
    query.mockResolvedValue({ rows: [{ messaging_consent: true, messaging_eligible: false }] });
    const response = await PUT(request({ messaging_consent: true, consent_version: 'messaging-v1' }));
    expect(await response.json()).toMatchObject({ messaging_consent: true, messaging_eligible: false });
  });
  it('does not accept helper/target actor overrides', async () => {
    expect((await PUT(request({ messaging_consent: true, consent_version: 'messaging-v1', user_id: 'other-fisher' }))).status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });
  it('rejects admin-only or missing sessions', async () => {
    vi.mocked(getSupabaseUser).mockResolvedValue(null);
    expect((await PUT(request({ messaging_consent: true, consent_version: 'messaging-v1' }))).status).toBe(401);
    expect(query).not.toHaveBeenCalled();
  });
  it('requires reviewed current consent for updates', async () => {
    expect((await PUT(request({ messaging_consent: true, consent_version: 'old' }))).status).toBe(409);
    expect(query).not.toHaveBeenCalled();
  });
  it('returns not found when no linked verified registration can be changed', async () => {
    query.mockResolvedValue({ rows: [] });
    expect((await PUT(request({ messaging_consent: false, consent_version: 'messaging-v1' }))).status).toBe(404);
  });
  it('surfaces storage failure without falsely reporting saved consent', async () => {
    query.mockRejectedValue(new Error('connection details'));
    const response = await PUT(request({ messaging_consent: false, consent_version: 'messaging-v1' }));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('connection details');
  });
});
