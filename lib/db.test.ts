import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { rootCertificates } from 'node:tls';

const mocks = vi.hoisted(() => ({
  Pool: vi.fn(function (_options: { connectionString: string; ssl: { rejectUnauthorized: boolean; ca?: string } }) { return {}; }),
  readFileSync: vi.fn(),
}));
vi.mock('pg', () => ({ Pool: mocks.Pool }));
vi.mock('node:fs', () => ({ readFileSync: mocks.readFileSync }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv('DATABASE_URL', 'postgresql://example:example@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres');
  vi.stubEnv('DIRECT_URL', '');
  vi.stubEnv('DB_SSL_INSECURE', 'false');
  vi.stubEnv('SUPABASE_DB_CA', '');
  vi.stubEnv('SUPABASE_DB_CA_FILE', '');
  vi.stubEnv('NODE_ENV', 'test');
});
afterEach(() => vi.unstubAllEnvs());
async function configure() { const { getDbPool } = await import('./db'); return getDbPool(); }

describe('PostgreSQL certificate verification', () => {
  it('verifies Supabase certificates by default without a hostname bypass', async () => {
    await configure();
    expect(mocks.Pool.mock.calls[0][0].ssl).toEqual({ rejectUnauthorized: true });
  });

  it('loads the configured CA file and keeps verification enabled', async () => {
    vi.stubEnv('SUPABASE_DB_CA_FILE', 'example-ca.crt');
    mocks.readFileSync.mockReturnValue(rootCertificates[0]);
    await configure();
    expect(mocks.readFileSync).toHaveBeenCalledWith('example-ca.crt', 'utf8');
    expect(mocks.Pool.mock.calls[0][0].ssl).toEqual({ ca: rootCertificates[0], rejectUnauthorized: true });
  });

  it('supports an inline CA without reading a file', async () => {
    vi.stubEnv('SUPABASE_DB_CA', rootCertificates[0]);
    await configure();
    expect(mocks.readFileSync).not.toHaveBeenCalled();
    expect(mocks.Pool.mock.calls[0][0].ssl).toEqual({ ca: rootCertificates[0], rejectUnauthorized: true });
  });

  it.each(['invalid', 'unreadable'])('fails closed on an %s CA file without exposing details', async kind => {
    vi.stubEnv('SUPABASE_DB_CA_FILE', 'private-path.crt');
    mocks.readFileSync.mockImplementation(() => {
      if (kind === 'unreadable') throw new Error('private filesystem details');
      return 'private non-certificate contents';
    });
    await expect(configure()).rejects.toThrow('Unable to load a valid database CA certificate.');
    expect(mocks.Pool).not.toHaveBeenCalled();
  });

  it('uses a URL root certificate while preventing URL options from overriding verification', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://example:example@db.example/postgres?sslmode=no-verify&sslrootcert=example-ca.crt&pgbouncer=true&application_name=parola');
    mocks.readFileSync.mockReturnValue(rootCertificates[0]);
    await configure();
    const options = mocks.Pool.mock.calls[0][0];
    const url = new URL(options.connectionString);
    expect(url.searchParams.has('sslmode')).toBe(false);
    expect(url.searchParams.has('sslrootcert')).toBe(false);
    expect(url.searchParams.has('pgbouncer')).toBe(false);
    expect(url.searchParams.get('application_name')).toBe('parola');
    expect(options.ssl).toEqual({ ca: rootCertificates[0], rejectUnauthorized: true });
  });

  it.each(['development', 'production'])('honors the insecure override in %s without loading a CA', async environment => {
    vi.stubEnv('DB_SSL_INSECURE', 'true');
    vi.stubEnv('NODE_ENV', environment);
    vi.stubEnv('SUPABASE_DB_CA_FILE', 'unavailable-on-this-computer.crt');
    await configure();
    expect(mocks.Pool.mock.calls[0][0].ssl).toEqual({ rejectUnauthorized: false });
    expect(mocks.readFileSync).not.toHaveBeenCalled();
  });
});
