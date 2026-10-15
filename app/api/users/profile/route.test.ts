import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/db', () => ({ getDbPool: vi.fn() }));
vi.mock('@/lib/route-auth', () => ({ getSupabaseUser: vi.fn() }));
import { getDbPool } from '@/lib/db';
import { getSupabaseUser } from '@/lib/route-auth';
import { PUT } from './route';
const query = vi.fn();
const owner = { id: 'owner-id', phone: '+639171234567' };
const valid = { phone_number: '09171234567', full_name: 'Fisher', home_port_name: 'Port', latitude: 0, longitude: 0 };
function request(body: unknown) { return new Request('http://localhost/api/users/profile', { method: 'PUT', body: JSON.stringify(body) }); }
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getSupabaseUser).mockResolvedValue(owner);
  vi.mocked(getDbPool).mockReturnValue({ query } as never);
  query.mockResolvedValue({ rows: [{ id: owner.id }] });
});
describe('owner profile edits', () => {
  it('uses the verified actor and preserves omitted advisory time', async () => {
    expect((await PUT(request(valid))).status).toBe(200);
    expect(query.mock.calls[0][1]).toEqual([owner.id, owner.phone, 'Fisher', 'Port', 0, 0, null]);
  });
  it('rejects cross-fisher edits', async () => {
    expect((await PUT(request({ ...valid, phone_number: '09170000000' }))).status).toBe(403);
    expect(query).not.toHaveBeenCalled();
  });
  it('rejects attempts to change consent through a profile edit', async () => {
    expect((await PUT(request({ ...valid, messaging_consent: true }))).status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });
  it('does not allow an admin key to edit on behalf of a fisher', async () => {
    vi.mocked(getSupabaseUser).mockResolvedValue(null);
    expect((await PUT(request(valid))).status).toBe(401);
    expect(query).not.toHaveBeenCalled();
  });
  it('cannot edit an unlinked legacy account', async () => {
    query.mockResolvedValue({ rows: [] });
    expect((await PUT(request(valid))).status).toBe(404);
  });
});
