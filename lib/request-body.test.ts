import { describe, expect, it, vi } from 'vitest';
import { boundedJson } from './request-body';
import { registrationBody, registrationResponse } from './registration';

describe('bounded registration requests and stable errors', () => {
  it('parses valid small JSON', async () => {
    expect(await boundedJson(new Request('https://example.test', { method: 'POST', body: '{"a":1}' }))).toEqual({ a: 1 });
  });
  it('limits UTF-8 bytes without trusting content-length', async () => {
    const request = new Request('https://example.test', { method: 'POST', body: '"éééé"' });
    await expect(boundedJson(request, 8)).rejects.toMatchObject({ status: 413, code: 'payload_too_large' });
  });
  it('rejects oversized declared length before reading', async () => {
    const request = new Request('https://example.test', { method: 'POST', headers: { 'Content-Length': '999999' }, body: '{}' });
    await expect(boundedJson(request)).rejects.toMatchObject({ status: 413 });
  });
  it('times out a stalled body without doing downstream work', async () => {
    vi.useFakeTimers();
    try {
      const stream = new ReadableStream({ start() {} });
      const request = new Request('https://example.test', { method: 'POST', body: stream, duplex: 'half' } as RequestInit);
      const pending = expect(boundedJson(request, 1024, 50)).rejects.toMatchObject({ status: 408, code: 'request_timeout' });
      await vi.advanceTimersByTimeAsync(51);
      await pending;
    } finally { vi.useRealTimers(); }
  });
  it.each(['null', '[]', 'broken'])('returns stable English error input for malformed payload %s', async body => {
    const response = await registrationResponse(() => registrationBody(new Request('https://example.test', { method: 'POST', body }), []).then(() => Response.json({})));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: 'invalid_json', message_language: 'en' });
  });
});
