import { describe, expect, it, vi } from 'vitest';
import { checkDemoAccount } from '../scripts/check-demo-account.mjs';

describe('opt-in demo account acceptance command', () => {
  it('does nothing without explicit database-write opt-in', async () => {
    const fetcher = vi.fn();
    await expect(checkDemoAccount('http://localhost:3000', { fetcher })).rejects.toThrow('--allow-demo-account-writes');
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each(['https://localhost:3000', 'http://example.com', 'http://localhost.example.com',
    'http://user:password@localhost:3000', 'http://localhost:3000/other', 'http://localhost:3000/?token=test'])
  ('refuses nonlocal or ambiguous origins: %s', async origin => {
    const fetcher = vi.fn();
    await expect(checkDemoAccount(origin, { allowWrites: true, fetcher })).rejects.toThrow('localhost origin');
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('stops before registration if the unsigned profile check fails', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({}, { status: 503 }));
    await expect(checkDemoAccount('http://localhost:3000', { allowWrites: true, fetcher })).rejects.toThrow('HTTP 401');
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][1].method).toBe('GET');
  });
  it('never retries an ambiguous registration or exposes network credentials', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({}, { status: 401 }))
      .mockRejectedValueOnce(new Error('private credentials'));
    await expect(checkDemoAccount('http://localhost:3000', { allowWrites: true, fetcher })).rejects.toThrow('save outcome may be unknown');
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(String(fetcher.mock.calls[1][0])).toBe('http://localhost:3000/api/users/register');
    expect(fetcher.mock.calls[1][1].redirect).toBe('error');
  });
  it('does not echo malformed server bodies', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('private server credentials', { status: 401 }));
    await expect(checkDemoAccount('http://localhost:3000', { allowWrites: true, fetcher })).rejects.toThrow('invalid JSON response');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
