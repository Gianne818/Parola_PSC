import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { registryHttpsQuery } from './registry-https';

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-private-service-key');
});

describe('server-only account HTTPS transport', () => {
  it('calls a named RPC over HTTPS without sending SQL', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-private-service-key');
    const fetcher = vi.fn().mockResolvedValue(Response.json([{ id: 'owner', phone_number: '+639171234567' }]));
    vi.stubGlobal('fetch', fetcher);
    expect(await registryHttpsQuery('profile_demo', ['owner', '+639171234567']))
      .toEqual({ rows: [{ id: 'owner', phone_number: '+639171234567' }] });
    const [url, options] = fetcher.mock.calls[0];
    expect(url).toBe('https://project.supabase.co/rest/v1/rpc/parola_registry_v1');
    expect(JSON.parse(options.body)).toEqual({ p_operation: 'profile_demo', p_values: ['owner', '+639171234567'] });
    expect(options.cache).toBe('no-store');
    expect(options.redirect).toBe('error');
    expect(options.headers.apikey).toBe('test-private-service-key');
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });
  it.each(['', 'YOUR_SUPABASE_SERVICE_ROLE_KEY'])('rejects absent/placeholder server keys before HTTP: %s', async key => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', key);
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    await expect(registryHttpsQuery('login_demo', ['+639171234567'])).rejects.toMatchObject({ code: 'registry_https_config' });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each(['http://project.supabase.co', 'https://user:private@project.supabase.co', 'https://project.supabase.co/other'])('rejects invalid backend origins: %s', async url => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', url);
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    await expect(registryHttpsQuery('login_demo', ['+639171234567'])).rejects.toMatchObject({ code: 'registry_https_config' });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each([null, {}, 'text', [null], [[], {}], [{ id: 1 }, { id: 2 }]])('rejects malformed or overbroad result %j', async body => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(body)));
    await expect(registryHttpsQuery('profile_demo', ['owner', '+639171234567'])).rejects.toMatchObject({ code: 'registry_https_unavailable' });
  });
  it('uses new server secret keys only in the apikey header', async () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'sb_secret_test_only');
    const fetcher = vi.fn().mockResolvedValue(Response.json([])); vi.stubGlobal('fetch', fetcher);
    expect(await registryHttpsQuery('login_demo', ['+639171234567'])).toEqual({ rows: [] });
    expect(fetcher.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
  });
  it('keeps non-JSON and upstream authentication errors private', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response('private driver details', { status: 500 }))
      .mockResolvedValueOnce(Response.json({ message: 'private key details', code: '42501' }, { status: 403 }));
    vi.stubGlobal('fetch', fetcher);
    for (let attempt = 0; attempt < 2; attempt++) {
      await expect(registryHttpsQuery('login_demo', ['+639171234567'])).rejects.toThrow(/Account storage/);
    }
  });
});
