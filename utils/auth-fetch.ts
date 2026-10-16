import { supabase } from '@/lib/supabase';

/**
 * Build headers for first-party API calls, attaching the Supabase JWT
 * when a session exists so /api routes can verify ownership.
 */
export async function authHeaders(base: Record<string, string> = {}, expectedOwnerId?: string): Promise<Record<string, string>> {
  const { data, error } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (error || !token) throw new Error('A Supabase owner session is required. Verify your phone again.');
  if (expectedOwnerId !== undefined && (!expectedOwnerId || data.session.user?.id !== expectedOwnerId)) {
    throw new Error('The owner session changed. Reload the current account before changing consent.');
  }
  return { ...base, Authorization: `Bearer ${token}` };
}
