import { Pool } from 'pg';
import { readFileSync } from 'node:fs';
import { X509Certificate } from 'node:crypto';

let pool: Pool | null = null;

/**
 * TLS for Supabase/Postgres: verify certificates by default.
 * DB_SSL_INSECURE=true skips certificate verification in every environment.
 * Load a CA via SUPABASE_DB_CA_FILE, URL sslrootcert, or SUPABASE_DB_CA.
 */
function buildSsl(address: URL): Record<string, unknown> {
  if (process.env.DB_SSL_INSECURE === 'true') {
    return { rejectUnauthorized: false };
  }
  const caFile = process.env.SUPABASE_DB_CA_FILE?.trim() || address.searchParams.get('sslrootcert');
  let ca = process.env.SUPABASE_DB_CA?.trim();
  try {
    if (caFile) ca = readFileSync(caFile, 'utf8');
    if (ca) {
      const certificates = ca.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g);
      if (!certificates?.length || certificates.some(certificate => !new X509Certificate(certificate).ca)) {
        throw new Error('Expected a certificate authority');
      }
      return { ca: certificates.join('\n'), rejectUnauthorized: true };
    }
  } catch {
    throw new Error('Unable to load a valid database CA certificate.');
  }
  return { rejectUnauthorized: true };
}

export function getDbPool(max = 3): Pool | null {
  if (pool) return pool;
  const dbUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!dbUrl) return null;
  const address = new URL(dbUrl);
  const ssl = buildSsl(address);
  // pg URL SSL options can replace the explicit ssl object. Keep the selected
  // verification policy here so URL options cannot override the env setting.
  for (const name of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'pgbouncer']) address.searchParams.delete(name);
  pool = new Pool({
    connectionString: address.toString(),
    max,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl,
  });
  return pool;
}
