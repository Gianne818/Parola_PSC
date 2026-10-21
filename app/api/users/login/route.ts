import { getAuthMode } from '@/lib/auth-mode';
import { checkSameOrigin, demoSessionResponse, matchesAccountPassword, requireDemoConfig } from '@/lib/demo-account';
import { phoneE164, registryQuery, registrationBody, registrationResponse, type RegistryProfile } from '@/lib/registration';
import { NextResponse } from 'next/server';
import { RATE_LIMITS, checkRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit';
import { withAdvisorySchedule } from '@/lib/advisory-preferences';

export async function POST(request: Request) {
  return registrationResponse(async () => {
    const body = await registrationBody(request, ['phone_number', 'password']);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }
    const { phone_number, password } = body as { phone_number?: unknown; password?: unknown };

    if (typeof phone_number !== 'string' || !phone_number.trim()) {
      return NextResponse.json(
        { error: 'phone_number and password are required' },
        { status: 400 }
      );
    }
    if (typeof password !== 'string' || !password) {
      return NextResponse.json(
        { error: 'phone_number and password are required' },
        { status: 400 }
      );
    }
    if (phone_number.length > 32 || password.length > 128) {
      return NextResponse.json({ error: 'Login failed.' }, { status: 400 });
    }

    // Brute-force guard: per-IP bucket plus per-phone bucket so distributed
    // attacks against one account are also throttled. 5 attempts / 15 min.
    const normalizedPhone = phoneE164(phone_number);
    const [byIp, byPhone] = await Promise.all([
      checkRateLimit(request, RATE_LIMITS.loginByIp),
      checkRateLimit(request, RATE_LIMITS.loginByPhone, normalizedPhone),
    ]);
    const exceeded = !byIp.allowed ? { config: RATE_LIMITS.loginByIp, result: byIp } : !byPhone.allowed ? { config: RATE_LIMITS.loginByPhone, result: byPhone } : null;
    if (exceeded) {
      return rateLimitExceededResponse(exceeded.config, exceeded.result, 'login');
    }

    if (getAuthMode() === 'demo') {
      checkSameOrigin(request);
      requireDemoConfig();
      const result = await registryQuery<RegistryProfile>('login_demo', `SELECT id, phone_number, full_name, home_port_name, password_hash,
        ST_Y(home_port_geom) AS latitude, ST_X(home_port_geom) AS longitude,
        advisory_days, preferred_advisory_time::text, preferred_language, habitat_preference
        FROM public.users WHERE phone_e164 = $1 AND auth_user_id IS NULL AND phone_verified_at IS NULL AND messaging_consent IS FALSE;`, [normalizedPhone]);
      const account = result.rows[0];
      if (!account || !(await matchesAccountPassword(password, account.password_hash))) {
        return NextResponse.json({ error: 'Incorrect phone number or password.' }, { status: 401 });
      }
      const { password_hash: _passwordHash, ...profile } = account;
      return demoSessionResponse(withAdvisorySchedule(profile));
    }
    const apiUrl = process.env.PAROLA_API_URL || 'http://localhost:8000';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    let response: Response;
    try {
      response = await fetch(new URL('/api/users/login', apiUrl), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: normalizedPhone,
          password,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    let data: Record<string, unknown> = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      // Preserve status codes for the frontend's offline-vs-error branching,
      // but don't proxy backend internals verbatim.
      const message =
        response.status === 401
          ? 'Incorrect password. Please try again.'
          : response.status === 404
            ? 'Account not found for this phone number. Please register first.'
            : 'Login failed.';
      return NextResponse.json({ error: message }, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  });
}
