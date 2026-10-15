import { RATE_LIMITS, checkRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit';
import { phoneAuthClient, phoneE164, registrationBody, registrationJson, registrationResponse, RegistrationError } from '@/lib/registration';

export async function POST(request: Request) {
  return registrationResponse(async () => {
    const limit = await checkRateLimit(request, RATE_LIMITS.otpVerify);
    if (!limit.allowed) return rateLimitExceededResponse(RATE_LIMITS.otpVerify, limit, 'otp-verify');
    const body = await registrationBody(request, ['phone_number', 'code']);
    const phone = phoneE164(body.phone_number);
    if (typeof body.code !== 'string' || !/^\d{6}$/.test(body.code)) throw new RegistrationError(400, 'Enter the six-digit verification code.');
    const { data, error } = await phoneAuthClient().auth.verifyOtp({ phone, token: body.code, type: 'sms' });
    if (error) {
      if (error.status === 429) return rateLimitExceededResponse(RATE_LIMITS.otpVerify, { ...limit, retryAfterSec: 60 }, 'otp-verify');
      throw new RegistrationError(error.status && error.status >= 500 ? 503 : 400, 'Verification failed. Request a new code and try again.');
    }
    if (!data.session?.access_token || !data.session.refresh_token || !data.user?.id || !data.user.phone_confirmed_at || phoneE164(data.user.phone) !== phone) {
      throw new RegistrationError(400, 'Verification did not establish phone ownership.');
    }
    const { access_token, refresh_token, expires_at, expires_in, token_type } = data.session;
    return registrationJson({
      status: 'phone_verified',
      session: { access_token, refresh_token, expires_at, expires_in, token_type },
      user: { id: data.user.id, phone_number: phone },
    });
  });
}
