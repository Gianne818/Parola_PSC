import { RATE_LIMITS, checkRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit';
import { phoneAuthClient, phoneE164, registrationBody, registrationJson, registrationResponse, RegistrationError } from '@/lib/registration';

export async function POST(request: Request) {
  return registrationResponse(async () => {
    const limit = await checkRateLimit(request, RATE_LIMITS.otpRequest);
    if (!limit.allowed) return rateLimitExceededResponse(RATE_LIMITS.otpRequest, limit, 'otp-request');
    const body = await registrationBody(request, ['phone_number', 'captcha_token']);
    const phone = phoneE164(body.phone_number);
    if (body.captcha_token !== undefined && (typeof body.captcha_token !== 'string' || !body.captcha_token || body.captcha_token.length > 4096)) {
      throw new RegistrationError(400, 'Invalid CAPTCHA token.');
    }
    const { error } = await phoneAuthClient().auth.signInWithOtp({
      phone,
      options: { channel: 'sms', shouldCreateUser: true, captchaToken: body.captcha_token as string | undefined },
    });
    if (error) {
      if (error.status === 429) return rateLimitExceededResponse(RATE_LIMITS.otpRequest, { ...limit, retryAfterSec: 60 }, 'otp-request');
      throw new RegistrationError(503, 'Unable to request a verification code. Please try again.');
    }
    return registrationJson({ status: 'code_requested' }, 202);
  });
}
