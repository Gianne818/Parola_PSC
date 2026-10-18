import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/db', () => ({ getDbPool: vi.fn(() => { throw new Error('Direct PostgreSQL is forbidden in this suite'); }) }));
vi.mock('@/lib/route-auth', () => ({ getSupabaseUser: vi.fn() }));
vi.mock('@/lib/rate-limit', async original => ({ ...await original<typeof import('@/lib/rate-limit')>(), checkRateLimit: vi.fn(async () => ({ allowed: true })) }));
import { getDbPool } from '@/lib/db';
import { getSupabaseUser } from '@/lib/route-auth';
import { matchesAccountPassword } from '@/lib/demo-account';
import { readProfile, readSchedule } from '@/lib/frontend/profile-client';
import { POST as register } from './route';
import { POST as login } from '../login/route';
import { GET as profile, PUT as update } from '../profile/route';
import { PUT as consent } from '../consent/route';
import { POST as otp } from '../../auth/otp/request/route';
import { POST as logout } from '../logout/route';
import { checkDemoAccount } from '../../../../scripts/check-demo-account.mjs';

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
  fetcher.mockReset();
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
  it('runs the complete account API acceptance command through the real route handlers', async () => {
    let row: Record<string, unknown>;
    fetcher.mockImplementation(async (_url, options) => {
      const { p_operation: operation, p_values: v } = JSON.parse(options.body);
      if (operation === 'register_demo') {
        row = { id, phone_number: v[0], full_name: v[1], home_port_name: v[2], longitude: v[3], latitude: v[4],
          password_hash: v[5], preferred_advisory_time: v[6], advisory_days: v[7], preferred_language: v[8], habitat_preference: v[9], messaging_consent: false };
      } else if (operation === 'update_demo') {
        for (const [field, index] of Object.entries({ full_name: 2, home_port_name: 3, longitude: 4, latitude: 5,
          preferred_advisory_time: 6, advisory_days: 7, preferred_language: 8, habitat_preference: 9 })) {
          if (v[index] !== null) row[field] = v[index];
        }
      } else if (!['login_demo', 'profile_demo'].includes(operation)) throw new Error('Unexpected RPC');
      const { password_hash, ...profileRow } = row!;
      return Response.json([operation === 'login_demo' ? { ...profileRow, password_hash } : profileRow]);
    });
    const recorded = vi.fn();
    const bridge: typeof fetch = async (url, init) => {
      const incoming = new Request(url, init);
      const path = new URL(incoming.url).pathname;
      if (path === '/api/users/register') return register(incoming);
      if (path === '/api/users/login') return login(incoming);
      if (path === '/api/users/logout') return logout(incoming);
      if (path === '/api/users/consent') return consent(incoming);
      if (path === '/api/users/profile') return incoming.method === 'PUT' ? update(incoming) : profile(incoming);
      throw new Error('Unexpected account API');
    };
    const result = await checkDemoAccount('http://localhost:3000', { allowWrites: true, fetcher: bridge, report: vi.fn(), recordCreated: recorded });
    expect(result).toEqual({ checks: 9, id });
    expect(recorded).toHaveBeenCalledTimes(1);
    expect(row!.advisory_days).toEqual([]);
    expect(row!.messaging_consent).toBe(false);
    expect(getDbPool).not.toHaveBeenCalled();
  });
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

  it.each(['pelagic', 'demersal', 'both'])('returns the canonical %s profile after the existing live RPC omits coordinates', async habitat => {
    vi.stubEnv('PAROLA_AUTH_MODE', 'live');
    vi.mocked(getSupabaseUser).mockResolvedValue({ id, phone: saved.phone_number });
    const persisted = { ...saved, home_port_name: 'Saved Port', latitude: 14.1, longitude: 122.9,
      habitat_preference: habitat, advisory_days: [1, 3, 5], preferred_language: 'ceb', preferred_advisory_time: '04:30:17',
      messaging_consent: false, messaging_eligible: false };
    const { latitude: _lat, longitude: _lng, ...acknowledgement } = persisted;
    fetcher.mockResolvedValueOnce(Response.json([{ ...acknowledgement, messaging_consent: true, messaging_eligible: true }]))
      .mockResolvedValueOnce(Response.json([persisted]));
    const response = await register(request({ ...input, messaging_consent: false, consent_version: 'messaging-v1' }));
    expect(response.status).toBe(201);
    const account = await response.json();
    expect(readProfile(account)).toMatchObject({ id, port: 'Saved Port', lat: 14.1, lng: 122.9, speciesPreference: habitat });
    expect(readSchedule(account)).toMatchObject({ advisory_days: [1, 3, 5], preferred_language: 'ceb', preferred_advisory_time: '04:30:17' });
    expect(account).toMatchObject({ contact_verified: true, messaging_eligible: false });
    expect(rpc(1)).toEqual({ p_operation: 'profile_live', p_values: [id, saved.phone_number] });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(getDbPool).not.toHaveBeenCalled();
  });

  it.each(['missing', 'unavailable'])('does not repeat a saved registration when profile readback is %s', async failure => {
    vi.stubEnv('PAROLA_AUTH_MODE', 'live');
    vi.mocked(getSupabaseUser).mockResolvedValue({ id, phone: saved.phone_number });
    fetcher.mockResolvedValueOnce(Response.json([saved]));
    if (failure === 'missing') fetcher.mockResolvedValueOnce(Response.json([]));
    else fetcher.mockRejectedValueOnce(new Error('private connection details'));
    const response = await register(request({ ...input, messaging_consent: false, consent_version: 'messaging-v1' }));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: 'profile_readback_unavailable', error: expect.stringContaining('Sign in') });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(rpc().p_operation).toBe('register_live');
    expect(rpc(1).p_operation).toBe('profile_live');
    expect(response.headers.has('set-cookie')).toBe(false);
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
