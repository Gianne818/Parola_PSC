import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/rate-limit', async importOriginal => ({ ...await importOriginal<typeof import('@/lib/rate-limit')>(), checkRateLimit: vi.fn() }));
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rate-limit';
import { POST as requestOtp } from './request/route';
import { POST as verifyOtp } from './verify/route';
const signInWithOtp = vi.fn();
const verify = vi.fn();
const phone = '+639171234567';
function request(body: unknown) { return new Request('http://localhost/api/auth/otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); }
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('PAROLA_SMS_MODE', 'live');
  vi.stubEnv('IPROG_MOCK_MODE', 'false');
  vi.stubEnv('PAROLA_PHONE_AUTH_ENABLED', 'true');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'public-anon-key');
  vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true } as never);
  vi.mocked(createClient).mockReturnValue({ auth: { signInWithOtp, verifyOtp: verify } } as never);
  signInWithOtp.mockResolvedValue({ error: null });
  verify.mockResolvedValue({ data: { session: { access_token: 'access-token', refresh_token: 'refresh-token', expires_at: 1800000000, expires_in: 3600, token_type: 'bearer' }, user: { id: 'verified-user', phone, phone_confirmed_at: '2026-10-15T00:00:00Z' } }, error: null });
});
afterEach(() => vi.unstubAllEnvs());
describe('Supabase SMS OTP HTTP endpoints', () => {
  it('requests a real SMS for a normalized phone without creating a registry record', async () => {
    const response = await requestOtp(request({ phone_number: '0917 123 4567', captcha_token: 'captcha' }));
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ status: 'code_requested' });
    expect(signInWithOtp).toHaveBeenCalledWith({ phone, options: { channel: 'sms', shouldCreateUser: true, captchaToken: 'captcha' } });
    expect(createClient).toHaveBeenCalledWith('https://example.supabase.co', 'public-anon-key', expect.objectContaining({ auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }));
  });
  it('returns an actual verified session with no-store caching', async () => {
    const response = await verifyOtp(request({ phone_number: phone, code: '123456' }));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toMatchObject({ status: 'phone_verified', session: { access_token: 'access-token', refresh_token: 'refresh-token' }, user: { id: 'verified-user', phone_number: phone } });
    expect(verify).toHaveBeenCalledWith({ phone, token: '123456', type: 'sms' });
  });
  it('does not accept the old demo code when Supabase rejects it', async () => {
    verify.mockResolvedValue({ data: { session: null, user: null }, error: { status: 403, message: 'provider detail' } });
    const response = await verifyOtp(request({ phone_number: phone, code: '482910' }));
    expect(response.status).toBe(400);
    expect(await response.text()).not.toContain('provider detail');
  });
  it('rechecks every verification attempt, including expired or reused codes', async () => {
    verify.mockResolvedValueOnce({ data: { session: null }, error: { status: 403 } });
    expect((await verifyOtp(request({ phone_number: phone, code: '123456' }))).status).toBe(400);
    expect(verify).toHaveBeenCalledTimes(1);
  });
  it.each([
    { session: null, user: { phone, phone_confirmed_at: '2026-10-15' } },
    { session: {}, user: { id: 'owner', phone, phone_confirmed_at: '2026-10-15' } },
    { session: {}, user: { phone, phone_confirmed_at: null } },
    { session: {}, user: { phone: '+639170000000', phone_confirmed_at: '2026-10-15' } },
  ])('rejects incomplete or mismatched provider success: %j', async data => {
    verify.mockResolvedValue({ data, error: null });
    expect((await verifyOtp(request({ phone_number: phone, code: '123456' }))).status).toBe(400);
  });
  it.each(['12345', '1234567', 'abcdef', 123456])('rejects malformed code before the provider: %j', async code => {
    expect((await verifyOtp(request({ phone_number: phone, code }))).status).toBe(400);
    expect(verify).not.toHaveBeenCalled();
  });
  it.each([requestOtp, verifyOtp])('fails closed when verification is disabled', async handler => {
    vi.stubEnv('PAROLA_PHONE_AUTH_ENABLED', 'false');
    expect((await handler(request({ phone_number: phone, ...(handler === verifyOtp ? { code: '123456' } : {}) })) ).status).toBe(503);
    expect(createClient).not.toHaveBeenCalled();
  });
  it('redacts provider/network failures', async () => {
    signInWithOtp.mockRejectedValue(new Error('private gateway credentials'));
    const response = await requestOtp(request({ phone_number: phone }));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('private');
  });
  it('preserves provider throttling', async () => {
    signInWithOtp.mockResolvedValue({ error: { status: 429 } });
    const response = await requestOtp(request({ phone_number: phone }));
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('60');
  });
  it('throttles before provider calls', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, retryAfterSec: 30 } as never);
    expect((await requestOtp(request({ phone_number: phone }))).status).toBe(429);
    expect(signInWithOtp).not.toHaveBeenCalled();
  });
  it.each([[], null, { phone_number: '+14155552671' }, { phone_number: phone, actor_id: 'helper' }])('rejects malformed input: %j', async body => {
    expect((await requestOtp(request(body))).status).toBe(400);
    expect(signInWithOtp).not.toHaveBeenCalled();
  });
});
