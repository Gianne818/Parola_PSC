import { createHmac, randomBytes } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSmsHook } from './index';

const secret = randomBytes(32);
const settings: Record<string, string> = {
  SEND_SMS_HOOK_SECRET: `v1,whsec_${secret.toString('base64')}`,
  IPROG_API_KEY: 'test-provider-token',
  IPROG_MOCK_MODE: 'false',
  IPROG_SENDER_NAME: 'PAROLA',
};
const event = { user: { id: 'test-user-id', phone: '+639171234567' }, sms: { otp: '012345' } };
function signed(body = JSON.stringify(event), timestamp = Math.floor(Date.now() / 1000)) {
  const id = 'test-webhook-id';
  const signature = createHmac('sha256', secret).update(`${id}.${timestamp}.${body}`).digest('base64');
  return new Request('https://example.test/functions/v1/send-sms', {
    method: 'POST', body,
    headers: {
      'webhook-id': id,
      'webhook-timestamp': String(timestamp),
      'webhook-signature': `v1,${signature}`,
    },
  });
}
function setup(overrides: Record<string, string | undefined> = {}) {
  const config = { ...settings, ...overrides };
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ status: 200, message_id: 'provider-id' }));
  return { fetcher, handler: createSmsHook((name) => config[name], fetcher) };
}
afterEach(() => vi.useRealTimers());

describe('Supabase Send SMS iPROG hook', () => {
  it('sends the signed OTP and normalizes the Philippine phone', async () => {
    const { handler, fetcher } = setup();
    const response = await handler(signed());
    expect(response.status).toBe(200);
    // Supabase rejects a successful HTTP hook without application/json.
    expect(response.headers.get('content-type')).toMatch(/^application\/json(?:;|$)/);
    expect(await response.json()).toEqual({});
    expect(response.headers.get('cache-control')).toBe('no-store');
    const [url, options] = fetcher.mock.calls[0];
    expect(url).toBe('https://sms.iprogtech.com/api/v1/sms_messages');
    expect(JSON.parse(options!.body as string)).toEqual({
      api_token: 'test-provider-token', phone_number: '639171234567', sender_name: 'PAROLA',
      message: 'Your Parola verification code is 012345. Do not share this code.',
    });
    expect(options!.redirect).toBe('error');
  });

  it('accepts the Auth phone format without a plus sign', async () => {
    const { handler } = setup();
    expect((await handler(signed(JSON.stringify({ ...event, user: { ...event.user, phone: '639171234567' } })))).status).toBe(200);
  });

  it.each(['GET', 'OPTIONS', 'PUT'])('rejects %s without sending', async (method) => {
    const { handler, fetcher } = setup();
    expect((await handler(new Request('https://example.test', { method }))).status).toBe(405);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it.each([
    { SEND_SMS_HOOK_SECRET: '' }, { SEND_SMS_HOOK_SECRET: 'invalid' },
    { IPROG_API_KEY: '' }, { IPROG_API_KEY: 'YOUR_IPROG_API_KEY_HERE' },
    { IPROG_MOCK_MODE: 'true' }, { IPROG_MOCK_MODE: '' },
    { IPROG_API_ENDPOINT: 'https://attacker.test' },
  ])('fails closed for unavailable configuration %j', async (overrides) => {
    const { handler, fetcher } = setup(overrides);
    expect((await handler(signed())).status).toBe(503);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it.each(['webhook-id', 'webhook-timestamp', 'webhook-signature'])('rejects a missing %s', async (header) => {
    const { handler, fetcher } = setup();
    const request = signed();
    request.headers.delete(header);
    expect((await handler(request)).status).toBe(401);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it.each([-301, 301])('rejects a signed timestamp outside the tolerance (%s seconds)', async (offset) => {
    const { handler, fetcher } = setup();
    expect((await handler(signed(undefined, Math.floor(Date.now() / 1000) + offset))).status).toBe(401);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('rejects tampering and forged signatures', async () => {
    const { handler, fetcher } = setup();
    const request = signed();
    request.headers.set('webhook-signature', `v1,${randomBytes(32).toString('base64')}`);
    expect((await handler(request)).status).toBe(401);
    const original = signed();
    const tampered = new Request(original.url, { method: 'POST', headers: original.headers, body: JSON.stringify({ ...event, sms: { otp: '999999' } }) });
    expect((await handler(tampered)).status).toBe(401);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('accepts a matching signature among rotation signatures', async () => {
    const { handler } = setup();
    const request = signed();
    request.headers.set('webhook-signature', `v1,${randomBytes(32).toString('base64')} ${request.headers.get('webhook-signature')}`);
    expect((await handler(request)).status).toBe(200);
  });

  it.each([
    'invalid-json', 'null', '[]', '{}',
    JSON.stringify({ ...event, user: { ...event.user, phone: '+12025550123' } }),
    JSON.stringify({ ...event, sms: { otp: '12345' } }),
    JSON.stringify({ ...event, sms: { otp: 123456 } }),
  ])('rejects an invalid signed event without sending', async (body) => {
    const { handler, fetcher } = setup();
    expect((await handler(signed(body))).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('bounds the request body', async () => {
    const { handler, fetcher } = setup();
    expect((await handler(signed('x'.repeat(65537)))).status).toBe(413);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it.each([
    { status: 500, data: { status: 500, message: 'provider secret error' } },
    { status: 200, data: { status: 400, message: 'insufficient credits' } },
    { status: 200, data: {} },
  ])('does not report acceptance on a provider rejection', async ({ status, data }) => {
    const { handler, fetcher } = setup();
    fetcher.mockResolvedValue(Response.json(data, { status }));
    const response = await handler(signed());
    expect(response.status).toBe(503);
    const body = await response.text();
    expect(body).not.toContain('test-provider-token');
    expect(body).not.toContain('012345');
    expect(body).not.toContain('provider secret error');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('retries an explicit sender-name rejection without a sender name', async () => {
    const { handler, fetcher } = setup();
    fetcher.mockResolvedValueOnce(Response.json({ status: 400, message: 'Smart/TNT networks do not accept shared sender names' }));
    expect((await handler(signed())).status).toBe(200);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetcher.mock.calls[1][1]!.body as string)).not.toHaveProperty('sender_name');
  });

  it('does not retry an ambiguous network failure', async () => {
    const { handler, fetcher } = setup();
    fetcher.mockRejectedValue(new Error('network failure with provider credentials'));
    const response = await handler(signed());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('provider credentials');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('aborts a slow provider within the Auth hook budget', async () => {
    vi.useFakeTimers();
    const { handler, fetcher } = setup();
    fetcher.mockImplementation((_url, options) => new Promise((_resolve, reject) => {
      options!.signal!.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
    }));
    const pending = handler(signed());
    await vi.advanceTimersByTimeAsync(3500);
    expect((await pending).status).toBe(503);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
