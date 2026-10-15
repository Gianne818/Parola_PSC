import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/route-auth', () => ({ requireAdmin: vi.fn(() => null), getSupabaseUser: vi.fn() }));
vi.mock('@/lib/rate-limit', async original => ({ ...await original<typeof import('@/lib/rate-limit')>(), checkRateLimit: vi.fn(async () => ({ allowed: true })) }));
import { createClient } from '@supabase/supabase-js';
import { IProgSmsService } from '@/services/iprogSmsService';
import { smsService } from '@/services/smsServiceInstance';
import { phoneAuthClient } from '@/lib/registration';
import { POST as requestOtp } from '../auth/otp/request/route';
import { POST as verifyOtp } from '../auth/otp/verify/route';
import { GET as getConfig, POST as setConfig } from './config/route';

const fetchMock = vi.fn();
const body = (value: unknown) => new Request('http://localhost/api', { method: 'POST', body: JSON.stringify(value) });
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('PAROLA_SMS_MODE', 'demo');
  vi.stubEnv('IPROG_MOCK_MODE', 'false');
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockRejectedValue(new Error('Unexpected network request'));
  smsService.updateConfig({ mockMode: true });
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('credit-free SMS demo', () => {
  it.each(['demo', '', 'invalid'])('blocks provider calls in mode %j despite a live service override', async mode => {
    vi.stubEnv('PAROLA_SMS_MODE', mode);
    const service = new IProgSmsService({ mockMode: false, apiKey: 'test-provider-key' });
    service.updateConfig({ mockMode: false });
    expect(service.getConfig().mockMode).toBe(true);
    expect(await service.sendSms({ recipient: '09171234567', message: 'Demo advisory' }))
      .toMatchObject({ success: true, mode: 'MOCK_DRY_RUN', simulated: true, delivered: false, creditsUsed: 0 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('keeps live mode paused while the provider mock flag is enabled', async () => {
    vi.stubEnv('PAROLA_SMS_MODE', 'live');
    vi.stubEnv('IPROG_MOCK_MODE', 'true');
    const service = new IProgSmsService({ mockMode: false, apiKey: 'test-provider-key' });
    expect((await service.sendSms({ recipient: '09171234567', message: 'Preview' })).mode).toBe('MOCK_DRY_RUN');
    expect(() => phoneAuthClient()).toThrow('paused');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('preserves live dispatch when explicitly selected (mocked provider)', async () => {
    vi.stubEnv('PAROLA_SMS_MODE', 'live');
    fetchMock.mockResolvedValue(Response.json({ status: 200, message_id: 'mocked-provider-id' }));
    const service = new IProgSmsService({ mockMode: false, apiKey: 'test-provider-key' });
    expect(await service.sendSms({ recipient: '09171234567', message: 'Live-path fixture' })).toMatchObject({ success: true, mode: 'LIVE_DISPATCH' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('previews an OTP without calling Supabase or granting ownership', async () => {
    const response = await requestOtp(body({ phone_number: '09171234567' }));
    expect(response.status).toBe(202);
    expect(await response.json()).toMatchObject({ status: 'demo_code_requested', demo_code: '482910', contact_verified: false, creditsUsed: 0 });
    expect(createClient).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('checks the demo code without issuing a real session', async () => {
    const response = await verifyOtp(body({ phone_number: '09171234567', code: '482910' }));
    expect(await response.json()).toMatchObject({ status: 'demo_code_checked', contact_verified: false, session: null });
    expect(createClient).not.toHaveBeenCalled();
  });
  it.each(['000000', '123456', '999999'])('accepts any six-digit demo code %s without a real session', async code => {
    const response = await verifyOtp(body({ phone_number: '09171234567', code }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ mode: 'MOCK_DRY_RUN', session: null, contact_verified: false });
    expect(createClient).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each(['', 'abcdef', '12345', '1234567', 123456, null])('rejects malformed demo input %j', async code => {
    expect((await verifyOtp(body({ phone_number: '09171234567', code }))).status).toBe(400);
    expect(createClient).not.toHaveBeenCalled();
  });
  it('guards the live Auth client itself', () => {
    expect(() => phoneAuthClient()).toThrow('paused');
    expect(createClient).not.toHaveBeenCalled();
  });
  it('rejects runtime attempts to turn live sending on and reports the lock', async () => {
    expect((await setConfig(body({ mockMode: false }))).status).toBe(409);
    expect(await (await getConfig(new Request('http://localhost/api/sms/config'))).json())
      .toMatchObject({ demoLocked: true, mockMode: true, remainingFreeQuota: null });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
