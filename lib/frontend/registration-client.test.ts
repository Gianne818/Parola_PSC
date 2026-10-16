import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { registrationCopy, AUTH_LANGUAGES } from '@/components/auth/auth-copy';
import { accountRequest, requestRegistrationOtp, validRegistrationCode, verifyRegistrationOtp } from './registration-client';
const fetcher = vi.fn();
beforeEach(() => { vi.stubGlobal('fetch', fetcher); fetcher.mockReset(); });
afterEach(() => vi.unstubAllGlobals());
describe('same registration screen, two OTP modes', () => {
  it.each(AUTH_LANGUAGES)('has accurate mode-specific OTP copy for $code', ({ code }) => {
    expect(registrationCopy(code, 'demo').codeHint).toContain('1234');
    expect(registrationCopy(code, 'live').modeNotice).not.toBe(registrationCopy(code, 'demo').modeNotice);
    expect(registrationCopy(code, 'live').code).not.toContain('demo');
    expect(registrationCopy(code, 'demo').codeHint).not.toContain('?');
  });
  it.each(['1', '1234', '000000', '999999'])('accepts numeric demo code %s without OTP calls', async code => {
    await requestRegistrationOtp('demo', '09171234567');
    expect(await verifyRegistrationOtp('demo', '09171234567', code)).toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each(['', 'abcdef', '12x4', '1234567'])('rejects malformed code %j', code => {
    expect(validRegistrationCode(code, 'demo')).toBe(false);
    expect(validRegistrationCode(code, 'live')).toBe(false);
  });
  it('requests and verifies a real OTP only in live mode (mocked)', async () => {
    const session = { access_token: 'test-access', refresh_token: 'test-refresh' };
    fetcher.mockResolvedValueOnce(Response.json({ status: 'code_requested' }, { status: 202 }))
      .mockResolvedValueOnce(Response.json({ status: 'phone_verified', session }));
    await requestRegistrationOtp('live', '09171234567');
    expect(await verifyRegistrationOtp('live', '09171234567', '012345')).toEqual(session);
    expect(fetcher.mock.calls.map(call => call[0])).toEqual(['/api/auth/otp/request', '/api/auth/otp/verify']);
    expect(JSON.parse(fetcher.mock.calls[1][1].body).code).toBe('012345');
  });
  it('rejects incorrect/expired live OTP responses without pretending verification succeeded', async () => {
    fetcher.mockResolvedValue(Response.json({ error: 'Verification failed.' }, { status: 400 }));
    await expect(verifyRegistrationOtp('live', '09171234567', '999999')).rejects.toThrow('Verification failed');
  });
  it('does not allow a short numeric demo code in live mode', async () => {
    await expect(verifyRegistrationOtp('live', '09171234567', '1234')).rejects.toThrow('six-digit');
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('surfaces registration failures without retries or a fabricated local account', async () => {
    fetcher.mockResolvedValue(Response.json({ error: 'Database unavailable.' }, { status: 503 }));
    await expect(accountRequest('/api/users/register', { phone_number: '09171234567' })).rejects.toThrow('Database unavailable');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
