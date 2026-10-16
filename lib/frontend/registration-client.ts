import type { AuthMode } from '@/lib/auth-mode';

export function validRegistrationCode(code: string, mode: AuthMode) {
  return mode === 'demo' ? /^\d{1,6}$/.test(code) : /^\d{6}$/.test(code);
}

export async function accountRequest(path: string, body?: unknown, token?: string) {
  const response = await fetch(path, {
    method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Account request failed. Please try again.');
  return data;
}

export async function requestRegistrationOtp(mode: AuthMode, phone: string) {
  if (mode === 'demo') return;
  await accountRequest('/api/auth/otp/request', { phone_number: phone });
}

export async function verifyRegistrationOtp(mode: AuthMode, phone: string, code: string) {
  if (!validRegistrationCode(code, mode)) throw new Error(mode === 'demo' ? 'Enter any 1–6 digit demo code.' : 'Enter the six-digit SMS code.');
  if (mode === 'demo') return null;
  const result = await accountRequest('/api/auth/otp/verify', { phone_number: phone, code });
  if (result.status !== 'phone_verified' || !result.session?.access_token || !result.session?.refresh_token) {
    throw new Error('Phone verification did not complete.');
  }
  return result.session;
}
