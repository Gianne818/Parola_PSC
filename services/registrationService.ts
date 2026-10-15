import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '@/types';
import { supabase } from '@/lib/supabase';
import { isValidPhilippineMobile } from '@/lib/philippine-mobile';
import { isClientCoordinate } from '@/lib/frontend/coordinates';
import { authHeaders } from '@/utils/auth-fetch';

// Wire types are local to this consumer until Son publishes shared client types.
export interface RegistrationInput {
  phone_number: string;
  full_name: string;
  home_port_name: string;
  latitude: number;
  longitude: number;
  messaging_consent: boolean;
  consent_version: string;
}
export interface SavedConsent {
  messaging_consent: boolean;
  messaging_consent_version: string | null;
  messaging_consent_at: string | null;
}
export interface ConsentDocument {
  consent_version: string;
  consent_text: string;
  consent: SavedConsent | null;
}
export class RegistrationClientError extends Error {
  constructor(message: string, public status = 0, public retryAt = 0) { super(message); }
}
export function normalizedPhone(value: string): string {
  if (!isValidPhilippineMobile(value)) throw new RegistrationClientError('Enter a valid Philippine mobile number.');
  return '+63' + value.replace(/\D/g, '').slice(-10);
}
export function confirmedOwner(user: User | null): User {
  if (!user?.id || !user.phone_confirmed_at || !user.phone) {
    throw new RegistrationClientError('Verify your phone again to establish an owner session.', 401);
  }
  normalizedPhone(user.phone);
  return user;
}

// Never retry mutations automatically: a lost response may follow a committed write.
async function request(path: string, method = 'GET', body?: object, authenticated = true, expectedOwnerId?: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    let headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authenticated) {
      try { headers = await authHeaders(headers, expectedOwnerId); }
      catch { throw new RegistrationClientError('Your Supabase owner session is unavailable or changed. Verify your own phone again. This request was not sent.', 401); }
    }
    const response = await fetch(path, { method, headers, cache: 'no-store', signal: controller.signal,
      ...(body ? { body: JSON.stringify(body) } : {}) });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const retry = response.headers.get('Retry-After');
      const retryAt = retry ? (/^\d+$/.test(retry) ? Date.now() + Number(retry) * 1000 : Date.parse(retry)) : 0;
      const fallback = response.status === 401 ? 'Your session expired. Verify your phone again.'
        : response.status === 403 ? 'This session cannot change that account. Verify your own phone again.'
        : response.status === 409 ? 'Account or consent conflict. Reload the current account and consent before retrying.'
        : response.status === 429 ? 'Too many attempts. Wait before trying again.'
        : 'The service is unavailable. No saved success was confirmed.';
      throw new RegistrationClientError(typeof data?.error === 'string' ? data.error : fallback,
        response.status, response.status === 429 ? (Number.isFinite(retryAt) && retryAt > Date.now() ? retryAt : Date.now() + 60000) : 0);
    }
    if (!data || typeof data !== 'object') throw new Error('Invalid response');
    return data;
  } catch (error) {
    if (error instanceof RegistrationClientError) throw error;
    throw new RegistrationClientError('No server confirmation was received. The request may have completed. Check the saved account before retrying; no local account was created.');
  } finally { clearTimeout(timeout); }
}

export async function requestRegistrationCode(phone: string) {
  const data = await request('/api/auth/otp/request', 'POST', { phone_number: normalizedPhone(phone) }, false);
  if (data.status !== 'code_requested') throw new RegistrationClientError('Code request was not confirmed.');
}
export async function verifyRegistrationCode(phone: string, code: string) {
  const phoneNumber = normalizedPhone(phone);
  if (!/^\d{6}$/.test(code)) throw new RegistrationClientError('Enter the six-digit code, including any leading zero.');
  const data = await request('/api/auth/otp/verify', 'POST', { phone_number: phoneNumber, code }, false);
  if (data.status !== 'phone_verified' || !data.user?.id || data.user.phone_number !== phoneNumber ||
    !data.session?.access_token || !data.session.refresh_token) throw new RegistrationClientError('Verification did not return a matching owner session.');
  try {
    if (typeof supabase.auth.setSession !== 'function') throw new Error('Auth unavailable');
    const result = await supabase.auth.setSession({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
    if (result.error || !result.data.session) throw new Error('Session rejected');
    const owner = confirmedOwner(result.data.user);
    if (owner.id !== data.user.id || normalizedPhone(owner.phone!) !== phoneNumber) throw new Error('Owner mismatch');
  } catch {
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    throw new RegistrationClientError('Phone verification did not establish a usable Supabase session. Verify again; registration has not been saved.', 401);
  }
}

function validConsent(value: unknown): value is SavedConsent {
  if (!value || typeof value !== 'object') return false;
  const row = value as SavedConsent;
  return typeof row.messaging_consent === 'boolean' &&
    (row.messaging_consent_version === null || typeof row.messaging_consent_version === 'string') &&
    (row.messaging_consent_at === null || typeof row.messaging_consent_at === 'string');
}
export async function loadMessagingConsent(ownerId: string): Promise<ConsentDocument> {
  const data = await request('/api/users/consent', 'GET', undefined, true, ownerId);
  if (typeof data.consent_version !== 'string' || !data.consent_version || typeof data.consent_text !== 'string' || !data.consent_text ||
    (data.consent !== null && !validConsent(data.consent))) throw new RegistrationClientError('Current consent text could not be loaded. Try again.');
  return data;
}
export async function saveMessagingConsent(choice: boolean, version: string, ownerId: string): Promise<SavedConsent> {
  const data = await request('/api/users/consent', 'PUT', { messaging_consent: choice, consent_version: version }, true, ownerId);
  if (!validConsent(data) || data.messaging_consent !== choice || data.messaging_consent_version !== version || !data.messaging_consent_at) {
    throw new RegistrationClientError('Saved consent was not confirmed. Reload the current consent before retrying.');
  }
  return data;
}
export const emptyOwnerProfile: UserProfile = {
  phone: '', vesselName: '', licenseNo: '', boatType: '', speciesPreference: 'pelagic', port: '', lat: NaN, lng: NaN,
};
export async function loadOwnerProfile(owner: User): Promise<UserProfile | null> {
  // RLS restricts reads to auth_user_id; never read by an untrusted phone or actor.
  const { data, error } = await supabase.from('users')
    .select('id,auth_user_id,phone_number,phone_verified_at,full_name,home_port_name')
    .eq('auth_user_id', owner.id).maybeSingle();
  if (error) throw new RegistrationClientError('Saved registration could not be loaded. Retry the account read before creating another account.');
  if (!data) return null;
  if (typeof data.id !== 'string' || !data.id || data.auth_user_id !== owner.id || !data.phone_verified_at ||
    typeof data.phone_number !== 'string' || normalizedPhone(data.phone_number) !== normalizedPhone(owner.phone!)) {
    throw new RegistrationClientError('The saved profile does not match the confirmed owner. Account linking requires review.', 403);
  }
  return { ...emptyOwnerProfile, id: data.id, phone: normalizedPhone(data.phone_number),
    vesselName: typeof data.full_name === 'string' ? data.full_name : '', port: typeof data.home_port_name === 'string' ? data.home_port_name : '' };
}
export async function persistRegistration(input: RegistrationInput): Promise<UserProfile> {
  if (!input.full_name.trim() || input.full_name.length > 100 || !input.home_port_name.trim() || input.home_port_name.length > 100 ||
    !isClientCoordinate(input.latitude, input.longitude) || typeof input.messaging_consent !== 'boolean' || !input.consent_version) {
    throw new RegistrationClientError('Enter your name, home port and explicit messaging choice.');
  }
  const payload = { phone_number: normalizedPhone(input.phone_number), full_name: input.full_name.trim(), home_port_name: input.home_port_name.trim(),
    latitude: input.latitude, longitude: input.longitude, messaging_consent: input.messaging_consent, consent_version: input.consent_version };
  const data = await request('/api/users/register', 'POST', payload);
  const { id, phone_number, full_name, home_port_name } = data;
  if (data.status !== 'registered' || data.contact_verified !== true || !data.id || data.phone_number !== payload.phone_number ||
    data.full_name !== payload.full_name || data.home_port_name !== payload.home_port_name || !validConsent(data) ||
    data.messaging_consent !== payload.messaging_consent || data.messaging_consent_version !== payload.consent_version || !data.messaging_consent_at) {
    throw new RegistrationClientError('Registration acknowledgement was incomplete. Check the saved account before retrying.');
  }
  return { ...emptyOwnerProfile, id, phone: phone_number, vesselName: full_name, port: home_port_name,
    lat: payload.latitude, lng: payload.longitude };
}
export async function persistOwnerProfile(profile: UserProfile): Promise<UserProfile> {
  if (!isClientCoordinate(profile.lat, profile.lng)) throw new RegistrationClientError('Select a home port before saving.');
  const payload = { phone_number: normalizedPhone(profile.phone), full_name: profile.vesselName,
    home_port_name: profile.port, latitude: profile.lat, longitude: profile.lng };
  const data = await request('/api/users/profile', 'PUT', payload);
  if (data.id !== profile.id || data.phone_number !== payload.phone_number || data.full_name !== payload.full_name ||
    data.home_port_name !== payload.home_port_name || !isClientCoordinate(data.latitude, data.longitude)) {
    throw new RegistrationClientError('Profile save was not confirmed. Check the saved account before retrying.');
  }
  return { ...profile, lat: data.latitude, lng: data.longitude };
}
