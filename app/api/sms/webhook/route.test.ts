import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ getDbPool: vi.fn() }));

import { getDbPool } from '@/lib/db';
import { POST } from './route';

const getDbPoolMock = vi.mocked(getDbPool);
const SECRET = 'test-webhook-secret';

function sign(rawBody: string): string {
  return createHmac('sha256', SECRET).update(rawBody, 'utf8').digest('hex');
}

let ipCounter = 0;
function postWebhook(body: unknown, signature: string | null, rawOverride?: string) {
  const raw = rawOverride ?? JSON.stringify(body);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    // Unique IP per request so the in-memory rate limiter never bleeds across tests.
    'x-forwarded-for': `10.9.8.${(ipCounter++ % 250) + 1}`,
  };
  if (signature !== null) headers['x-webhook-signature'] = signature;
  return new Request('http://localhost/api/sms/webhook', {
    method: 'POST',
    headers,
    body: raw,
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  ipCounter = 100;
  process.env.SMS_WEBHOOK_SECRET = SECRET;
  process.env.PAROLA_API_URL = 'http://localhost:8000';
  process.env.PAROLA_API_KEY = 'backend-key';
});

describe('POST /api/sms/webhook', () => {
  it('returns 401 for a bad signature', async () => {
    getDbPoolMock.mockReturnValue(null);
    const body = { phone_number: '09171234567', message: '2' };
    const res = await POST(postWebhook(body, 'deadbeef'));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toMatch(/signature/i);
  });

  it('returns 404 for an unknown user', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    getDbPoolMock.mockReturnValue({ query } as never);
    const fetchMock = vi.fn(() => Promise.reject(new Error('backend should not be called')));
    vi.stubGlobal('fetch', fetchMock);

    const body = { phone_number: '09171234567', message: '2' };
    const res = await POST(postWebhook(body, sign(JSON.stringify(body))));
    expect(res.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('treats a retried message_id as a duplicate (idempotency)', async () => {
    const messageId = `test-dup-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const query = vi.fn((sql: string) => {
      if (sql.includes('FROM public.users')) {
        return Promise.resolve({ rows: [{ id: 'user-1' }] });
      }
      return Promise.resolve({ rows: [{ id: 'adv-1' }] });
    });
    getDbPoolMock.mockReturnValue({ query } as never);
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true } as Response));
    vi.stubGlobal('fetch', fetchMock);

    const body = { phone_number: '09171234567', message: '1 Salamat', message_id: messageId };
    const raw = JSON.stringify(body);
    const sig = sign(raw);

    const first = await POST(postWebhook(body, sig, raw));
    expect(first.status).toBe(200);
    expect(await first.json()).toMatchObject({ status: 'received' });

    const second = await POST(postWebhook(body, sig, raw));
    expect(second.status).toBe(200);
    expect(await second.json()).toMatchObject({ status: 'duplicate' });

    // Backend forwarded exactly once.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
