import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/db', () => ({ getDbPool: vi.fn() }));
vi.mock('@/lib/routine-scheduler', async original => ({ ...await original<typeof import('@/lib/routine-scheduler')>(), planRoutineAdvisories: vi.fn() }));
import { getDbPool } from '@/lib/db';
import { planRoutineAdvisories } from '@/lib/routine-scheduler';
import { POST } from './route';

const pool = {} as NonNullable<ReturnType<typeof getDbPool>>;
const request = (body: unknown = {}, key = 'test-admin') => new Request('http://localhost/api/sms/schedule', {
  method: 'POST', headers: { 'x-admin-key': key }, body: JSON.stringify(body),
});
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('ADMIN_API_KEY', 'test-admin');
  vi.stubEnv('PAROLA_ROUTINE_SCHEDULER_ENABLED', 'false');
  vi.stubEnv('PAROLA_AUTH_MODE', 'demo');
  vi.mocked(getDbPool).mockReturnValue(pool);
  vi.mocked(planRoutineAdvisories).mockResolvedValue({ dry_run: true, persisted: false, planned: 0, due: 0,
    changed: null, cancelled: null, sent: 0, timezone: 'Asia/Manila', advisory_date: '2026-10-19', evaluated_at: '2026-10-18T21:00:00Z' });
  vi.stubGlobal('fetch', vi.fn());
});
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('admin-only routine planning API', () => {
  it('fails closed when admin access is not configured', async () => {
    vi.stubEnv('ADMIN_API_KEY', '');
    expect((await POST(request())).status).toBe(503);
    expect(getDbPool).not.toHaveBeenCalled();
  });
  it('rejects missing/wrong admin credentials before storage', async () => {
    expect((await POST(request({}, 'wrong'))).status).toBe(401);
    expect(getDbPool).not.toHaveBeenCalled();
  });
  it('defaults to a no-send preview and returns only aggregate counts', async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toMatchObject({ dry_run: true, persisted: false, sent: 0 });
    expect(planRoutineAdvisories).toHaveBeenCalledWith(pool, true);
  });
  it.each([null, [], { dry_run: 'false' }, { dry_run: null }, { recipient: 'other' }, { now: '2026-10-19' }])
  ('rejects malformed/overposted inputs: %j', async body => {
    expect((await POST(request(body))).status).toBe(400);
    expect(getDbPool).not.toHaveBeenCalled();
  });
  it('blocks queue persistence in the current demo configuration', async () => {
    expect((await POST(request({ dry_run: false }))).status).toBe(409);
    expect(getDbPool).not.toHaveBeenCalled();
  });
  it('allows an explicitly enabled live backend to plan without invoking a provider', async () => {
    vi.stubEnv('PAROLA_ROUTINE_SCHEDULER_ENABLED', 'true');
    vi.stubEnv('PAROLA_AUTH_MODE', 'live');
    vi.stubEnv('PAROLA_SMS_MODE', 'live');
    vi.stubEnv('IPROG_MOCK_MODE', 'false');
    expect((await POST(request({ dry_run: false }))).status).toBe(200);
    expect(planRoutineAdvisories).toHaveBeenCalledWith(pool, false);
  });
  it('redacts storage errors and never falls back to SMS or another store', async () => {
    vi.mocked(planRoutineAdvisories).mockRejectedValue(new Error('private connection string'));
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('private');
    expect(planRoutineAdvisories).toHaveBeenCalledTimes(1);
  });
  it('reports unavailable storage honestly', async () => {
    vi.mocked(getDbPool).mockReturnValue(null);
    expect((await POST(request())).status).toBe(503);
    expect(planRoutineAdvisories).not.toHaveBeenCalled();
  });
});
