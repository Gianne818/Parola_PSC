import { supabase } from '@/lib/supabase';

/**
 * Build headers for first-party API calls, attaching the Supabase JWT
 * when a session exists so /api routes can verify ownership.
 */
export async function authHeaders(base: Record<string, string> = {}): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) return { ...base, Authorization: `Bearer ${token}` };
  } catch {
    // Offline / unconfigured Supabase — fall through without a token.
  }
  return base;
}
