import { NextResponse } from 'next/server';
import { RATE_LIMITS, checkRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
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
    const normalizedPhone = phone_number.trim().toLowerCase();
    const [byIp, byPhone] = await Promise.all([
      checkRateLimit(request, RATE_LIMITS.loginByIp),
      checkRateLimit(request, RATE_LIMITS.loginByPhone, normalizedPhone),
    ]);
    const exceeded = !byIp.allowed ? { config: RATE_LIMITS.loginByIp, result: byIp } : !byPhone.allowed ? { config: RATE_LIMITS.loginByPhone, result: byPhone } : null;
    if (exceeded) {
      return rateLimitExceededResponse(exceeded.config, exceeded.result, 'login');
    }

    const apiUrl = process.env.PAROLA_API_URL || 'http://localhost:8000';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    let response: Response;
    try {
      response = await fetch(`${apiUrl}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number,
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
  } catch {
    console.error('[Login API] backend unreachable');
    return NextResponse.json(
      { error: 'Backend authentication server unavailable.', offline: true },
      { status: 503 }
    );
  }
}
