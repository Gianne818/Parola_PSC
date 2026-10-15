import { Buffer } from 'node:buffer';
import { createHmac, timingSafeEqual } from 'node:crypto';

type Environment = (name: string) => string | undefined;
const IPROG_ENDPOINT = 'https://sms.iprogtech.com/api/v1/sms_messages';
const MAX_BODY_BYTES = 64 * 1024;
const SIGNATURE_TOLERANCE_SECONDS = 300;
// Supabase HTTP Auth hooks have a five-second execution budget.
const PROVIDER_TIMEOUT_MS = 3500;

function failure(status: number, message: string): Response {
  return Response.json({ error: { http_code: status, message } }, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function signingKey(secret: string): Buffer {
  const encoded = secret.replace(/^v1,whsec_/, '').replace(/^whsec_/, '');
  const key = Buffer.from(encoded, 'base64');
  if (key.length < 32 || key.toString('base64') !== encoded) {
    throw new Error('Invalid hook secret');
  }
  return key;
}

// Standard Webhooks: HMAC-SHA256 over id.timestamp.raw_body. Use the platform's
// cryptographic primitives and constant-time comparison; never trust body fields
// or a bearer token as evidence that a request came from Supabase Auth.
function validSignature(request: Request, body: string, key: Buffer): boolean {
  const id = request.headers.get('webhook-id');
  const timestamp = request.headers.get('webhook-timestamp');
  const signatures = request.headers.get('webhook-signature');
  if (!id || !timestamp || !signatures || !/^\d+$/.test(timestamp)) return false;
  const seconds = Number(timestamp);
  if (!Number.isSafeInteger(seconds) ||
      Math.abs(Math.floor(Date.now() / 1000) - seconds) > SIGNATURE_TOLERANCE_SECONDS) return false;

  const expected = createHmac('sha256', key).update(`${id}.${timestamp}.${body}`).digest();
  return signatures.split(/\s+/).some((entry) => {
    const [version, encoded] = entry.split(',');
    if (version !== 'v1' || !encoded) return false;
    const received = Buffer.from(encoded, 'base64');
    return received.length === expected.length &&
      received.toString('base64') === encoded && timingSafeEqual(received, expected);
  });
}

function object(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
}

async function readBody(request: Request): Promise<string> {
  const reader = request.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new Error('Body too large');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks).toString('utf8');
}

export function createSmsHook(env: Environment, fetcher: typeof fetch = fetch) {
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'POST') {
      const response = failure(405, 'POST required');
      response.headers.set('Allow', 'POST');
      return response;
    }

    let key: Buffer;
    const apiKey = env('IPROG_API_KEY')?.trim();
    try {
      key = signingKey(env('SEND_SMS_HOOK_SECRET') ?? '');
      if (!apiKey || apiKey === 'IPROG_PENDING_HACKATHON_KEY' ||
          apiKey === 'YOUR_IPROG_API_KEY_HERE' || env('IPROG_MOCK_MODE') !== 'false' ||
          (env('IPROG_API_ENDPOINT') || IPROG_ENDPOINT) !== IPROG_ENDPOINT) {
        throw new Error('SMS configuration unavailable');
      }
    } catch {
      return failure(503, 'Phone verification is unavailable');
    }

    if (!request.headers.get('webhook-signature')) return failure(401, 'Invalid hook signature');
    let body: string;
    try {
      body = await readBody(request);
    } catch {
      return failure(413, 'Invalid hook body');
    }
    if (!validSignature(request, body, key)) return failure(401, 'Invalid hook signature');

    let phone: string;
    let otp: string;
    try {
      const payload = object(JSON.parse(body));
      const user = object(payload.user);
      const sms = object(payload.sms);
      if (typeof user.id !== 'string' || !user.id ||
          typeof user.phone !== 'string' || !/^\+?639\d{9}$/.test(user.phone) ||
          typeof sms.otp !== 'string' || !/^\d{6}$/.test(sms.otp)) {
        throw new Error('Invalid OTP event');
      }
      phone = user.phone.replace(/^\+/, '');
      otp = sms.otp;
    } catch {
      return failure(400, 'Invalid phone verification event');
    }

    const payload: Record<string, string> = {
      api_token: apiKey,
      phone_number: phone,
      message: `Your Parola verification code is ${otp}. Do not share this code.`,
    };
    const sender = env('IPROG_SENDER_NAME')?.trim();
    if (sender) payload.sender_name = sender;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
    try {
      const send = async () => {
        const response = await fetcher(IPROG_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
          redirect: 'error',
        });
        return { response, data: object(await response.json()) };
      };
      let result = await send();
      const accepted = () => result.response.ok &&
        (result.data.status === 200 || result.data.status === '200');
      // Match the existing gateway's sender-name fallback, but only after an
      // explicit rejection. Never retry an ambiguous network/timeout result.
      if (!accepted() && payload.sender_name && typeof result.data.message === 'string' &&
          /sender[ _-]?name/i.test(result.data.message)) {
        delete payload.sender_name;
        result = await send();
      }
      if (!accepted()) return failure(503, 'Verification SMS could not be submitted');
      // Auth HTTP hooks require JSON even when the hook has no output fields.
      // Provider acceptance is not proof of handset delivery or verification.
      return Response.json({}, { status: 200, headers: { 'Cache-Control': 'no-store' } });
    } catch {
      return failure(503, 'Verification SMS could not be submitted');
    } finally {
      clearTimeout(timeout);
    }
  };
}

// Supabase Edge Functions support the default { fetch } entry point. Keeping
// environment access here also lets the real handler run in offline Node tests.
export default {
  fetch(request: Request): Promise<Response> {
    const runtime = globalThis as unknown as { Deno: { env: { get(name: string): string | undefined } } };
    return createSmsHook((name) => runtime.Deno.env.get(name))(request);
  },
};
