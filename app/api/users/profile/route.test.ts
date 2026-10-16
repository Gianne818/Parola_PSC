import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/db', () => ({ getDbPool: vi.fn() }));
vi.mock('@/lib/route-auth', () => ({ getSupabaseUser: vi.fn() }));
import { getDbPool } from '@/lib/db';
import { getSupabaseUser } from '@/lib/route-auth';
import { GET, PUT } from './route';
const query = vi.fn();
const owner = { id: 'owner-id', phone: '+639171234567' };
const saved = { advisory_days: [1, 3, 5], preferred_advisory_time: '04:30:15', preferred_language: 'hil', habitat_preference: 'pelagic' };
const valid = { phone_number: '09171234567', full_name: 'Fisher', home_port_name: 'Port', latitude: 0, longitude: 0 };
function request(body: unknown) { return new Request('http://localhost/api/users/profile', { method: 'PUT', body: JSON.stringify(body) }); }
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getSupabaseUser).mockResolvedValue(owner);
  vi.mocked(getDbPool).mockReturnValue({ query } as never);
  query.mockResolvedValue({ rows: [{ ...saved, id: owner.id }] });
});
describe('owner profile edits', () => {
  it('uses the verified actor and preserves omitted advisory time', async () => {
    expect((await PUT(request(valid))).status).toBe(200);
    expect(query.mock.calls[0][1]).toEqual([owner.id, owner.phone, 'Fisher', 'Port', 0, 0, null, null, null, null]);
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
  it('reloads saved preferences from the database for the authenticated owner', async () => {
    const response = await GET(new Request('http://localhost/api/users/profile?phone_number=09170000000'));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toMatchObject({ ...saved, advisory_timezone: 'Asia/Manila', routine_paused: false,
      language_status: { requested: 'hil', message_language: 'en', fallback: true, reviewed: false } });
    expect(query.mock.calls[0][1]).toEqual([owner.id, owner.phone]);
    expect(query.mock.calls[0][0]).toContain('a.phone_confirmed_at IS NOT NULL');
  });
  it('requires an owner session to read preferences', async () => {
    vi.mocked(getSupabaseUser).mockResolvedValue(null);
    expect((await GET(new Request('http://localhost/api/users/profile'))).status).toBe(401);
    expect(query).not.toHaveBeenCalled();
  });
  it('returns 404 when the confirmed owner has no matching profile', async () => {
    query.mockResolvedValue({ rows: [] });
    expect((await GET(new Request('http://localhost/api/users/profile'))).status).toBe(404);
  });
  it('allows preference-only edits without replacing port/name/coordinates', async () => {
    expect((await PUT(request({ phone_number: owner.phone, advisory_days: [5, 1], preferred_language: 'tl' }))).status).toBe(200);
    expect(query.mock.calls[0][1]).toEqual([owner.id, owner.phone, null, null, null, null, null, [1, 5], 'tl', null]);
    expect(query.mock.calls[0][0]).toContain('COALESCE($8::smallint[], u.advisory_days)');
  });
  it('preserves every preference during a port-only edit', async () => {
    const response = await PUT(request({ phone_number: owner.phone, home_port_name: 'Changed port', latitude: 10, longitude: 123 }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject(saved);
    expect(query.mock.calls[0][1]).toEqual([owner.id, owner.phone, null, 'Changed port', 123, 10, null, null, null, null]);
  });
  it('passes an empty array as an explicit pause, rather than omission', async () => {
    query.mockResolvedValue({ rows: [{ ...saved, advisory_days: [] }] });
    const response = await PUT(request({ phone_number: owner.phone, advisory_days: [] }));
    expect(await response.json()).toMatchObject({ routine_paused: true, next_routine_at: null });
    expect(query.mock.calls[0][1][7]).toEqual([]);
  });
  it.each([
    { advisory_days: [1, 1] }, { advisory_days: [1, 2, 3, 4, 5, 6] }, { advisory_days: null },
    { preferred_language: 'xx' }, { preferred_language: null }, { habitat_preference: 'reef' },
    { preferred_advisory_time: '24:00' }, { preferred_advisory_time: null },
    { latitude: 10 }, { longitude: 123 }, { latitude: null, longitude: 123 },
    { full_name: null }, { home_port_name: '' }, {},
  ])('rejects invalid partial edits: %j', async fields => {
    expect((await PUT(request({ phone_number: owner.phone, ...fields }))).status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });
  it('fails closed when migration 03 is unavailable without exposing database details', async () => {
    query.mockRejectedValue({ code: '42703', message: 'private SQL connection details' });
    const response = await GET(new Request('http://localhost/api/users/profile'));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('private');
  });
});
