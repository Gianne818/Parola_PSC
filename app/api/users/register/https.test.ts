import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/db', () => ({ getDbPool: vi.fn(() => { throw new Error('Direct PostgreSQL is forbidden in this suite'); }) }));
vi.mock('@/lib/route-auth', () => ({ getSupabaseUser: vi.fn() }));
vi.mock('@/lib/rate-limit', async original => ({ ...await original<typeof import('@/lib/rate-limit')>(), checkRateLimit: vi.fn(async () => ({ allowed: true })) }));
import { getDbPool } from '@/lib/db';
import { getSupabaseUser } from '@/lib/route-auth';
import { matchesAccountPassword } from '@/lib/demo-account';
import { POST as register } from './route';
import { POST as login } from '../login/route';
import { GET as profile, PUT as update } from '../profile/route';
import { PUT as consent } from '../consent/route';
import { POST as otp } from '../../auth/otp/request/route';

const fetcher = vi.fn();
const id = '11111111-1111-4111-8111-111111111111';
const saved = { id, phone_number: '+639171234567', full_name: 'Test Fisher', home_port_name: 'Port', latitude: 0, longitude: 0,
  advisory_days: [], preferred_advisory_time: '05:00:00', preferred_language: 'en', habitat_preference: 'both' };
const input = { phone_number: '09171234567', full_name: 'Test Fisher', home_port_name: 'Port', latitude: 0, longitude: 0, password: 'demo-password' };
function request(body?: unknown, cookie?: string) {
  return new Request('http://localhost/api', { method: body === undefined ? 'GET' : 'POST',
    headers: { ...(cookie ? { cookie } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}
function rpc(index = 0) { return JSON.parse(fetcher.mock.calls[index][1].body); }
function session(response: Response) { return response.headers.get('set-cookie')!.split(';')[0]; }

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('PAROLA_REGISTRY_TRANSPORT', 'https');
  vi.stubEnv('PAROLA_AUTH_MODE', 'demo');
  vi.stubEnv('PAROLA_DEMO_SESSION_SECRET', 'test-signing-secret-at-least-32-characters');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-private-service-key');
  vi.mocked(getSupabaseUser).mockResolvedValue(null);
  fetcher.mockImplementation(async () => Response.json([saved]));
  vi.stubGlobal('fetch', fetcher);
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('accounts over HTTPS with direct PostgreSQL unavailable', () => {
  it('registers in demo and establishes only an unverified application session', async () => {
    const response = await register(request(input));
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ id, auth_mode: 'demo', contact_verified: false, messaging_eligible: false, session: null });
    expect(response.headers.get('set-cookie')).toContain('HttpOnly');
    expect(rpc().p_operation).toBe('register_demo');
    expect(rpc().p_values.slice(0, 5)).toEqual([saved.phone_number, input.full_name, input.home_port_name, 0, 0]);
    expect(await matchesAccountPassword(input.password, rpc().p_values[5])).toBe(true);
    expect(getDbPool).not.toHaveBeenCalled();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toBe('https://project.supabase.co/rest/v1/rpc/parola_registry_v1');
  });

  it('supports password login, reload and port edits without losing preferences', async () => {
    const initial = await register(request(input));
    const password_hash = rpc().p_values[5];
    const cookie = session(initial);
    const preferences = { advisory_days: [1, 3, 5], preferred_language: 'ceb', habitat_preference: 'demersal', preferred_advisory_time: '04:30:00' };
    fetcher.mockClear();
    fetcher.mockImplementation(async (_url, options) => {
      const { p_operation } = JSON.parse(options.body);
      return Response.json([{ ...saved, ...preferences, ...(p_operation === 'login_demo' ? { password_hash } : {}) }]);
    });
    const signedIn = await login(request({ phone_number: input.phone_number, password: input.password }));
    expect(signedIn.status).toBe(200);
    expect(await signedIn.json()).not.toHaveProperty('password_hash');
    expect(rpc().p_operation).toBe('login_demo');
    const loaded = await profile(request(undefined, cookie));
    expect(await loaded.json()).toMatchObject({ ...preferences, id, contact_verified: false });
    expect(rpc(1)).toEqual({ p_operation: 'profile_demo', p_values: [id, saved.phone_number] });
    expect((await update(request({ phone_number: input.phone_number, home_port_name: 'Changed', latitude: 0, longitude: 0 }, cookie))).status).toBe(200);
    expect(rpc(2)).toEqual({ p_operation: 'update_demo', p_values: [id, saved.phone_number, null, 'Changed', 0, 0, null, null, null, null] });
    expect(getDbPool).not.toHaveBeenCalled();
  });

  it('blocks cross-account edits, live consent and OTP during demo without HTTP writes', async () => {
    const cookie = session(await register(request(input)));
    fetcher.mockClear();
    expect((await update(request({ phone_number: '09170000000', full_name: 'Other' }, cookie))).status).toBe(403);
    expect((await consent(request({ messaging_consent: true, consent_version: 'messaging-v1' }, cookie))).status).toBe(401);
    expect((await otp(request({ phone_number: input.phone_number }))).status).toBe(409);
    expect(fetcher).not.toHaveBeenCalled();
    expect(getDbPool).not.toHaveBeenCalled();
  });

  it('preserves duplicate conflicts and migration errors without issuing a session', async () => {
    for (const [code, status] of [['23505', 409], ['PGRST202', 503]] as const) {
      fetcher.mockResolvedValueOnce(Response.json({ code, message: 'private provider details' }, { status: 400 }));
      const response = await register(request(input));
      expect(response.status).toBe(status);
      expect(response.headers.has('set-cookie')).toBe(false);
      expect(await response.text()).not.toContain('private');
    }
    expect(getDbPool).not.toHaveBeenCalled();
  });

  it('does not retry or switch to PostgreSQL after an ambiguous HTTPS write failure', async () => {
    fetcher.mockRejectedValueOnce(new Error('private connection details'));
    const response = await register(request(input));
    expect(response.status).toBe(503);
    expect(await response.text()).toContain('unconfirmed');
    expect(response.headers.has('set-cookie')).toBe(false);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(getDbPool).not.toHaveBeenCalled();
  });

  it('requires actual live ownership and explicit consent before selecting live registration', async () => {
    vi.stubEnv('PAROLA_AUTH_MODE', 'live');
    expect((await register(request(input))).status).toBe(401);
    expect(fetcher).not.toHaveBeenCalled();
    vi.mocked(getSupabaseUser).mockResolvedValue({ id, phone: saved.phone_number });
    expect((await register(request(input))).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
    const response = await register(request({ ...input, messaging_consent: false, consent_version: 'messaging-v1' }));
    expect(response.status).toBe(201);
    expect(rpc().p_operation).toBe('register_live');
    expect(rpc().p_values[0]).toBe(id);
    expect(rpc().p_values[7]).toBe(false);
    expect(getDbPool).not.toHaveBeenCalled();
  });

  it('uses live owner operations for profile and consent and rejects a demo cookie after mode switch', async () => {
    const cookie = session(await register(request(input)));
    vi.stubEnv('PAROLA_AUTH_MODE', 'live');
    fetcher.mockClear();
    expect((await profile(request(undefined, cookie))).status).toBe(401);
    expect(fetcher).not.toHaveBeenCalled();
    vi.mocked(getSupabaseUser).mockResolvedValue({ id, phone: saved.phone_number });
    expect((await profile(request())).status).toBe(200);
    expect(rpc().p_operation).toBe('profile_live');
    expect((await update(request({ phone_number: input.phone_number, full_name: 'Owner' }))).status).toBe(200);
    expect(rpc(1).p_operation).toBe('update_live');
    fetcher.mockResolvedValueOnce(Response.json([{ messaging_consent: false, messaging_eligible: false }]));
    expect((await consent(request({ messaging_consent: false, consent_version: 'messaging-v1' }))).status).toBe(200);
    expect(rpc(2)).toEqual({ p_operation: 'consent_write', p_values: [id, saved.phone_number, false, 'messaging-v1'] });
    expect(getDbPool).not.toHaveBeenCalled();
  });
});
