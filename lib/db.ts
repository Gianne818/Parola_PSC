import { Pool } from 'pg';

let pool: Pool | null = null;

/**
 * TLS for Supabase/Postgres: verify certificates by default.
 * Set DB_SSL_INSECURE=true only for local dev with self-signed certs.
 * Optionally pin a CA via SUPABASE_DB_CA (PEM string).
 */
function buildSsl(): Record<string, unknown> {
  if (process.env.DB_SSL_INSECURE === 'true') {
    return { rejectUnauthorized: false };
  }
  const ca = process.env.SUPABASE_DB_CA;
  if (ca) return { ca, rejectUnauthorized: true };
  // Supabase connection poolers and AWS RDS endpoints require TLS but use cloud certificate chains
  // that Node.js default truststore does not bundle without a custom CA file.
  const dbUrl = process.env.DATABASE_URL || process.env.DIRECT_URL || '';
  if (dbUrl.includes('supabase.co') || dbUrl.includes('pooler.supabase.com')) {
    return { rejectUnauthorized: false };
  }
  return { rejectUnauthorized: true };
}

export function getDbPool(max = 3): Pool | null {
  if (pool) return pool;
  const dbUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!dbUrl) return null;
  pool = new Pool({
    connectionString: dbUrl.replace('?pgbouncer=true', ''),
    max,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: buildSsl(),
  });
  return pool;
}
