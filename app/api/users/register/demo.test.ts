import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/db', () => ({ getDbPool: vi.fn() }));
vi.mock('@/lib/route-auth', () => ({ getSupabaseUser: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/rate-limit', async original => ({ ...await original<typeof import('@/lib/rate-limit')>(), checkRateLimit: vi.fn(async () => ({ allowed: true })) }));
import { getDbPool } from '@/lib/db';
import { getSupabaseUser } from '@/lib/route-auth';
import { createClient } from '@supabase/supabase-js';
import { getAuthMode } from '@/lib/auth-mode';
import { demoOwner, hashAccountPassword, matchesAccountPassword } from '@/lib/demo-account';
import { phoneAuthClient, REGISTER_VERIFIED_USER_SQL } from '@/lib/registration';
import { readSchedule } from '@/lib/frontend/profile-client';
import { POST as register } from './route';
import { POST as login } from '../login/route';
import { POST as logout } from '../logout/route';
import { GET as profile, PUT as editProfile } from '../profile/route';
import { PUT as consent } from '../consent/route';
import { POST as requestOtp } from '../../auth/otp/request/route';
import { POST as verifyOtp } from '../../auth/otp/verify/route';

const query = vi.fn();
const id = '11111111-1111-4111-8111-111111111111';
const saved = { id, phone_number: '+639171234567', full_name: 'Test Fisher', home_port_name: 'Port', latitude: 0, longitude: 0,
  advisory_days: [], preferred_advisory_time: '05:00:00', preferred_language: 'en', habitat_preference: 'both' };
const input = { phone_number: '09171234567', full_name: 'Test Fisher', home_port_name: 'Port', latitude: 0, longitude: 0, password: 'demo-password' };
function request(body?: unknown, cookie?: string, extra: Record<string, string> = {}) {
  return new Request('http://localhost/api', { method: body === undefined ? 'GET' : 'POST',
    headers: { ...(cookie ? { cookie } : {}), ...extra }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}
function cookie(response: Response) { return response.headers.get('set-cookie')!.split(';')[0]; }
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('PAROLA_AUTH_MODE', 'demo');
  vi.stubEnv('PAROLA_REGISTRY_TRANSPORT', 'postgres');
  vi.stubEnv('PAROLA_DEMO_SESSION_SECRET', 'test-signing-secret-at-least-32-characters');
  vi.mocked(getDbPool).mockReturnValue({ query } as never);
  vi.mocked(getSupabaseUser).mockResolvedValue(null);
  query.mockResolvedValue({ rows: [saved] });
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Unexpected network call')));
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('existing-table demo registration', () => {
  it('saves a normal user without invoking Supabase Auth or SMS', async () => {
    const response = await register(request(input));
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ id, status: 'registered', auth_mode: 'demo', contact_verified: false, messaging_eligible: false, session: null });
    const [sql, values] = query.mock.calls[0];
    expect(sql).toContain('INSERT INTO public.users');
    expect(sql).toContain('NULL, NULL, FALSE');
    expect(values.slice(0, 5)).toEqual([saved.phone_number, input.full_name, 'Port', 0, 0]);
    expect(values[5]).not.toContain(input.password);
    expect(await matchesAccountPassword(input.password, values[5])).toBe(true);
    expect(response.headers.get('set-cookie')).toContain('HttpOnly; SameSite=Lax');
    expect(demoOwner(request(undefined, cookie(response)))).toEqual({ id, phone: saved.phone_number });
    expect(createClient).not.toHaveBeenCalled();
    expect(getSupabaseUser).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each([undefined, 'demo'])('defaults safely when mode is %s', mode => {
    vi.stubEnv('PAROLA_AUTH_MODE', mode);
    expect(getAuthMode()).toBe('demo');
    expect(() => phoneAuthClient()).toThrow('disabled in demo');
  });
  it.each(['', 'invalid'])('rejects invalid server mode %j without database calls', async mode => {
    vi.stubEnv('PAROLA_AUTH_MODE', mode);
    expect((await register(request(input))).status).toBe(503);
    expect(query).not.toHaveBeenCalled();
  });
  it('requires a configured signing secret before inserting', async () => {
    vi.stubEnv('PAROLA_DEMO_SESSION_SECRET', '');
    expect((await register(request(input))).status).toBe(503);
    expect(query).not.toHaveBeenCalled();
  });
  it.each([{ password: 'short' }, { password: undefined }, { messaging_consent: true }, { auth_user_id: id }, { auth_mode: 'live' }, { phone_verified_at: 'now' }])('rejects invalid/overposted fields %j', async extra => {
    expect((await register(request({ ...input, ...extra }))).status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });
  it('never overwrites a duplicate or pretends database failure succeeded', async () => {
    query.mockRejectedValueOnce({ code: '23505' });
    expect((await register(request(input))).status).toBe(409);
    query.mockRejectedValueOnce(new Error('private DB connection'));
    const response = await register(request(input));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('private');
    expect(response.headers.has('set-cookie')).toBe(false);
  });
  it('shows only a safe diagnostic in development when database TLS fails', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    query.mockRejectedValueOnce(Object.assign(new Error('private connection credentials'), { code: 'SELF_SIGNED_CERT_IN_CHAIN' }));
    const response = await register(request(input));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ diagnostic_code: 'SELF_SIGNED_CERT_IN_CHAIN',
      error: expect.stringContaining('SELF_SIGNED_CERT_IN_CHAIN') });
    expect(response.headers.has('set-cookie')).toBe(false);
  });
  it.each(['production', 'development'])('never exposes arbitrary driver details in %s', async mode => {
    vi.stubEnv('NODE_ENV', mode);
    query.mockRejectedValueOnce({ code: 'private-database-url', message: 'private connection credentials' });
    const response = await register(request(input));
    const body = await response.json();
    expect(response.status).toBe(503);
    expect(JSON.stringify(body)).not.toContain('private');
    if (mode === 'production') {
      expect(body).not.toHaveProperty('diagnostic_code');
      expect(body.error).toBe('Registration service unavailable. Please try again.');
    } else expect(body.diagnostic_code).toBe('UNEXPECTED_ERROR');
  });
  it.each([
    [new Error('Connection terminated unexpectedly'), 'DB_CONNECTION_CLOSED'],
    [new Error('SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string'), 'DB_PASSWORD_MISSING'],
    [Object.assign(new Error('private database details'), { code: 'XX000' }), 'DB_XX000'],
    [new TypeError('private runtime details'), 'TYPE_ERROR'],
    [new Error('private wrapper', { cause: { code: 'ECONNRESET' } }), 'ECONNRESET'],
  ])('classifies an unlabelled or wrapped error safely as %s', async (error, code) => {
    vi.stubEnv('NODE_ENV', 'development');
    query.mockRejectedValueOnce(error);
    const response = await register(request(input));
    const body = await response.json();
    expect(body.diagnostic_code).toBe(code);
    expect(JSON.stringify(body)).not.toContain('private');
  });
  it('rejects cross-origin writes before insertion', async () => {
    expect((await register(request(input, undefined, { origin: 'https://other.test' }))).status).toBe(403);
    expect(query).not.toHaveBeenCalled();
  });
  it('cannot use request flags to bypass verification in live mode', async () => {
    vi.stubEnv('PAROLA_AUTH_MODE', 'live');
    expect((await register(request({ ...input, demo: true }))).status).toBe(401);
    expect(query).not.toHaveBeenCalled();
  });
  it.each([requestOtp, verifyOtp])('blocks direct OTP endpoint calls during demo', async handler => {
    expect((await handler(request({ phone_number: input.phone_number, ...(handler === verifyOtp ? { code: '123456' } : {}) }))).status).toBe(409);
    expect(createClient).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('demo login, profile and mode isolation', () => {
  it('logs in using the existing password format without a FastAPI/provider request', async () => {
    query.mockResolvedValue({ rows: [{ ...saved, password_hash: await hashAccountPassword(input.password) }] });
    const response = await login(request({ phone_number: input.phone_number, password: input.password }));
    expect(response.status).toBe(200);
    expect(await response.json()).not.toHaveProperty('password_hash');
    expect(query.mock.calls[0][1]).toEqual([saved.phone_number]);
    expect(query.mock.calls[0][0]).toContain('auth_user_id IS NULL');
    expect(fetch).not.toHaveBeenCalled();
  });
  it('rejects the wrong password without a session', async () => {
    query.mockResolvedValue({ rows: [{ ...saved, password_hash: await hashAccountPassword(input.password) }] });
    const response = await login(request({ phone_number: input.phone_number, password: 'wrong-password' }));
    expect(response.status).toBe(401);
    expect(response.headers.has('set-cookie')).toBe(false);
  });
  it('returns the saved schedule immediately on password login', async () => {
    query.mockResolvedValue({ rows: [{ ...saved, advisory_days: [1, 3, 5], preferred_language: 'hil',
      preferred_advisory_time: '04:30:17', password_hash: await hashAccountPassword(input.password) }] });
    const response = await login(request({ phone_number: input.phone_number, password: input.password }));
    expect(response.status).toBe(200);
    expect(readSchedule(await response.json())).toMatchObject({ advisory_days: [1, 3, 5], preferred_language: 'hil',
      preferred_advisory_time: '04:30:17', habitat_preference: 'both', routine_paused: false });
    expect(query).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('allows reload and port edits only for the signed unverified account', async () => {
    const session = cookie(await register(request(input)));
    query.mockClear();
    expect((await profile(request(undefined, session))).status).toBe(200);
    expect(query.mock.calls[0][1]).toEqual([id, saved.phone_number]);
    expect(query.mock.calls[0][0]).toContain('u.phone_verified_at IS NULL');
    expect((await editProfile(request({ phone_number: input.phone_number, home_port_name: 'Changed', latitude: 0, longitude: 0 }, session))).status).toBe(200);
    expect((await editProfile(request({ phone_number: '09170000000', full_name: 'Other' }, session))).status).toBe(403);
    expect((await consent(request({ messaging_consent: true, consent_version: 'messaging-v1' }, session))).status).toBe(401);
  });
  it('rejects forged and expired sessions before database access', async () => {
    const session = cookie(await register(request(input)));
    query.mockClear();
    expect((await profile(request(undefined, session + 'tampered'))).status).toBe(401);
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 25 * 3600 * 1000);
    expect((await profile(request(undefined, session))).status).toBe(401);
    expect(query).not.toHaveBeenCalled();
  });
  it('rejects a demo session after switching to live mode', async () => {
    const session = cookie(await register(request(input)));
    vi.stubEnv('PAROLA_AUTH_MODE', 'live');
    query.mockClear();
    expect((await profile(request(undefined, session))).status).toBe(401);
    expect(query).not.toHaveBeenCalled();
  });
  it('expires the demo cookie on logout', async () => {
    expect((await logout(request({}))).headers.get('set-cookie')).toContain('Max-Age=0');
  });
  it('only links an unverified password account after authoritative live phone confirmation', () => {
    expect(REGISTER_VERIFIED_USER_SQL).toContain('a.phone_confirmed_at IS NOT NULL');
    expect(REGISTER_VERIFIED_USER_SQL).toContain('ON CONFLICT (phone_e164) DO UPDATE');
    expect(REGISTER_VERIFIED_USER_SQL).toContain('public.users.auth_user_id IS NULL');
    expect(REGISTER_VERIFIED_USER_SQL).not.toContain('id = EXCLUDED.id');
    expect(REGISTER_VERIFIED_USER_SQL).not.toContain('home_port_geom = EXCLUDED');
  });
});
