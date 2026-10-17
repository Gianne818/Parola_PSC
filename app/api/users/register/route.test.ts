import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/db', () => ({ getDbPool: vi.fn() }));
vi.mock('@/lib/route-auth', () => ({ getSupabaseUser: vi.fn() }));
vi.mock('@/lib/rate-limit', async importOriginal => ({ ...await importOriginal<typeof import('@/lib/rate-limit')>(), checkRateLimit: vi.fn() }));
import { getDbPool } from '@/lib/db';
import { getSupabaseUser } from '@/lib/route-auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { POST } from './route';

const query = vi.fn();
const owner = { id: '11111111-1111-4111-8111-111111111111', phone: '+639171234567' };
const defaults = { advisory_days: [], preferred_advisory_time: '05:00:00', preferred_language: 'en', habitat_preference: 'both' };
const valid = { phone_number: '09171234567', full_name: 'Test Fisher', home_port_name: 'Mercedes Fish Port', latitude: 14.1, longitude: 122.9, messaging_consent: true, consent_version: 'messaging-v1' };
function request(body: unknown) { return new Request('http://localhost/api/users/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); }
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('PAROLA_AUTH_MODE', 'live');
  vi.stubEnv('PAROLA_REGISTRY_TRANSPORT', 'postgres');
  vi.mocked(getSupabaseUser).mockResolvedValue(owner);
  vi.mocked(getDbPool).mockReturnValue({ query } as never);
  vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true } as never);
  query.mockResolvedValue({ rows: [{ ...defaults, id: owner.id, phone_number: owner.phone, messaging_consent: true, messaging_eligible: true }] });
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Unexpected external fallback')));
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('verified registration', () => {
  it('registers only the verified actor with explicit consent and no provider tokens in the response', async () => {
    const response = await POST(request(valid));
    expect(response.status).toBe(201);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toMatchObject({ id: owner.id, contact_verified: true, status: 'registered', messaging_consent: true });
    expect(query.mock.calls[0][1]).toEqual([owner.id, '+639171234567', 'Test Fisher', 'Mercedes Fish Port', 122.9, 14.1, '05:00:00', true, 'messaging-v1', [], 'en', 'both', null]);
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each(['09171234567', '+639171234567', '+63 (917) 123-4567'])('normalizes the same verified phone: %s', async phone => {
    expect((await POST(request({ ...valid, phone_number: phone }))).status).toBe(201);
    expect(query.mock.calls[0][1][1]).toBe('+639171234567');
  });
  it('allows account creation when messaging consent is declined', async () => {
    query.mockResolvedValue({ rows: [{ ...defaults, id: owner.id, messaging_consent: false, messaging_eligible: false }] });
    const response = await POST(request({ ...valid, messaging_consent: false }));
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ messaging_consent: false, messaging_eligible: false });
    expect(query.mock.calls[0][1][7]).toBe(false);
  });
  it('rejects demo codes/admin keys without an actual phone session', async () => {
    vi.mocked(getSupabaseUser).mockResolvedValue(null);
    const response = await POST(request({ ...valid, code: '482910' }));
    expect(response.status).toBe(401);
    expect(query).not.toHaveBeenCalled();
  });
  it('rejects an unconfirmed contact', async () => {
    vi.mocked(getSupabaseUser).mockResolvedValue({ ...owner, phone: null });
    expect((await POST(request(valid))).status).toBe(403);
    expect(query).not.toHaveBeenCalled();
  });
  it('rejects registration for another phone', async () => {
    expect((await POST(request({ ...valid, phone_number: '09170000000' }))).status).toBe(403);
    expect(query).not.toHaveBeenCalled();
  });
  it.each([{ actor_id: owner.id }, { assisted_by: owner.id }, { role: 'admin' }, { phone_verified_at: '2026-10-15' }, { password_hash: 'forged' }])('rejects overposted or helper fields: %j', async extra => {
    expect((await POST(request({ ...valid, ...extra }))).status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });
  it.each([undefined, null, 'true', 1])('requires a boolean consent choice: %j', async consent => {
    expect((await POST(request({ ...valid, messaging_consent: consent }))).status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });
  it('rejects an outdated consent version', async () => {
    expect((await POST(request({ ...valid, consent_version: 'old' }))).status).toBe(409);
    expect(query).not.toHaveBeenCalled();
  });
  it.each([null, '', false, [], {}, '14.1', 91])('rejects invalid latitude: %j', async latitude => {
    expect((await POST(request({ ...valid, latitude }))).status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });
  it('accepts zero coordinates', async () => {
    expect((await POST(request({ ...valid, latitude: 0, longitude: 0 }))).status).toBe(201);
  });
  it('returns a paused schedule when no weekdays were selected without withdrawing consent', async () => {
    const response = await POST(request(valid));
    expect(await response.json()).toMatchObject({ ...defaults, routine_paused: true, next_routine_at: null, messaging_consent: true });
  });
  it('persists five selected days and explicit time/language/habitat', async () => {
    const preferences = { advisory_days: [1, 2, 3, 4, 5], preferred_advisory_time: '04:30:15', preferred_language: 'ceb', habitat_preference: 'demersal' };
    query.mockResolvedValue({ rows: [{ ...preferences, id: owner.id }] });
    const response = await POST(request({ ...valid, ...preferences, advisory_days: [5, 3, 1, 4, 2] }));
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ ...preferences, routine_paused: false, advisory_timezone: 'Asia/Manila' });
    expect(query.mock.calls[0][1]).toEqual([owner.id, owner.phone, 'Test Fisher', 'Mercedes Fish Port', 122.9, 14.1, '04:30:15', true, 'messaging-v1', [1, 2, 3, 4, 5], 'ceb', 'demersal', null]);
  });
  it.each([[1, 1], [1, 2, 3, 4, 5, 6], [0], [8], [true], ['1'], null].map(advisory_days => ({ advisory_days })))('rejects invalid weekdays without persistence: $advisory_days', async ({ advisory_days }) => {
    expect((await POST(request({ ...valid, advisory_days }))).status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });
  it.each(['24:00', '05:60', '05:00:60', null])('rejects invalid time: %j', async time => {
    expect((await POST(request({ ...valid, preferred_advisory_time: time }))).status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });
  it('maps a concurrent duplicate to 409 without overwriting', async () => {
    query.mockRejectedValue({ code: '23505' });
    expect((await POST(request(valid))).status).toBe(409);
    expect(query).toHaveBeenCalledTimes(1);
  });
  it('fails if authoritative ownership changed before the insert', async () => {
    query.mockResolvedValue({ rows: [] });
    expect((await POST(request(valid))).status).toBe(403);
  });
  it.each(['42703', '42P01', '08006'])('does not bypass a missing migration/database failure: %s', async code => {
    query.mockRejectedValue({ code, message: 'private connection details' });
    const response = await POST(request(valid));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('private');
    expect(query).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('fails when the database is not configured', async () => {
    vi.mocked(getDbPool).mockReturnValue(null);
    expect((await POST(request(valid))).status).toBe(503);
  });
  it('rate limits before auth or persistence', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, retryAfterSec: 45 } as never);
    const response = await POST(request(valid));
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('45');
    expect(getSupabaseUser).not.toHaveBeenCalled();
    expect(query).not.toHaveBeenCalled();
  });
});
