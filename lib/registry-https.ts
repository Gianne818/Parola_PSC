import type { QueryResultRow } from 'pg';

export type RegistryOperation = 'health' | 'register_demo' | 'register_live' | 'login_demo'
  | 'profile_demo' | 'profile_live' | 'update_demo' | 'update_live'
  | 'consent_read' | 'consent_write' | 'sms_eligibility';

export class RegistryHttpsError extends Error {
  code: string;
  constructor(code: string, message: string) { super(message); this.code = code; }
}

/** Backend only: never import from client code or expose its service key. */
export async function registryHttpsQuery<R extends QueryResultRow = QueryResultRow>(operation: RegistryOperation, values: unknown[]): Promise<{ rows: R[] }> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  let origin: URL;
  try {
    origin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '');
    if (origin.protocol !== 'https:' || origin.username || origin.password || origin.search || origin.hash
      || !['', '/'].includes(origin.pathname) || !key || key.includes('YOUR_')) throw new Error();
  } catch {
    throw new RegistryHttpsError('registry_https_config', 'Configure the backend Supabase URL and service role key for account storage.');
  }
  let response: Response;
  try {
    response = await fetch(new URL('/rest/v1/rpc/parola_registry_v1', origin).toString(), {
      method: 'POST', cache: 'no-store', redirect: 'error',
      headers: { 'Content-Type': 'application/json', apikey: key!,
        ...(!key!.startsWith('sb_secret_') ? { Authorization: `Bearer ${key}` } : {}) },
      body: JSON.stringify({ p_operation: operation, p_values: values }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new RegistryHttpsError('registry_https_unavailable', 'Account storage is unreachable. The save outcome is unconfirmed; no automatic retry was made.');
  }
  let data: unknown;
  try { data = await response.json(); }
  catch { throw new RegistryHttpsError('registry_https_unavailable', 'Account storage returned an invalid response.'); }
  if (!response.ok) {
    const code = data && typeof data === 'object' && 'code' in data ? data.code : undefined;
    if (code === '23505') throw new RegistryHttpsError('23505', 'An account already exists.');
    if (code === 'PGRST202' || code === '42883') {
      throw new RegistryHttpsError('registry_https_migration_required', 'HTTPS account storage is not installed. Apply migration 06 before using this transport.');
    }
    throw new RegistryHttpsError('registry_https_unavailable', 'Account storage is unavailable. Check backend credentials, permissions and Supabase status.');
  }
  if (!Array.isArray(data) || data.length > 1 || data.some(row => !row || typeof row !== 'object' || Array.isArray(row))) {
    throw new RegistryHttpsError('registry_https_unavailable', 'Account storage returned an invalid result.');
  }
  return { rows: data as R[] };
}
