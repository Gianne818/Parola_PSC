import type { AdvisoryPreferences, AdvisorySchedule, AdvisoryWeekday, Language, UserProfile } from '@/types';
import { detectPhilippineRegion } from '@/data/philippineRegions';
import { isClientCoordinate } from './coordinates';

const languages = ['en', 'tl', 'ceb', 'hil'];
const habitats = ['pelagic', 'demersal', 'both'];

export function validatePreferences(value: AdvisoryPreferences): string | null {
  // Boundaries: paused, 1–5 unique days, sixth/duplicate/out-of-range day, seconds.
  const days = value.advisory_days;
  if (!Array.isArray(days) || days.length > 5 || new Set(days).size !== days.length
    || days.some(day => !Number.isInteger(day) || day < 1 || day > 7)) return 'Choose up to five different weekdays.';
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value.preferred_advisory_time)) return 'Enter a valid Manila time.';
  if (!languages.includes(value.preferred_language)) return 'Choose an available message language.';
  if (!habitats.includes(value.habitat_preference)) return 'Choose pelagic, demersal or both.';
  return null;
}

export function readSchedule(account: Record<string, unknown>): AdvisorySchedule | null {
  const preferences = account as unknown as AdvisoryPreferences;
  if (validatePreferences(preferences) || account.advisory_timezone !== 'Asia/Manila'
    || account.routine_paused !== (preferences.advisory_days.length === 0)) return null;
  const next = account.next_routine_at;
  if (next !== null && (typeof next !== 'string' || !Number.isFinite(Date.parse(next)))) return null;
  if (account.routine_paused && next !== null) return null;
  const status = account.language_status as AdvisorySchedule['language_status'] | undefined;
  if (!status || status.requested !== preferences.preferred_language || status.message_language !== 'en'
    || status.reviewed !== false || status.fallback !== (preferences.preferred_language !== 'en')) return null;
  return {
    advisory_days: [...preferences.advisory_days].sort((a, b) => a - b) as AdvisoryWeekday[],
    preferred_advisory_time: preferences.preferred_advisory_time.length === 5 ? `${preferences.preferred_advisory_time}:00` : preferences.preferred_advisory_time,
    preferred_language: preferences.preferred_language as Language, habitat_preference: preferences.habitat_preference,
    advisory_timezone: 'Asia/Manila', routine_paused: account.routine_paused as boolean,
    next_routine_at: next as string | null, language_status: { ...status },
  };
}

export function readProfile(account: Record<string, unknown>): UserProfile {
  if (typeof account.id !== 'string' || !account.id || typeof account.phone_number !== 'string' || !account.phone_number
    || typeof account.home_port_name !== 'string' || !account.home_port_name
    || !habitats.includes(account.habitat_preference as string)
    || !isClientCoordinate(account.latitude as number, account.longitude as number)) {
    throw new Error('The server did not return a complete profile. Reload before continuing.');
  }
  const lat = account.latitude as number;
  const lng = account.longitude as number;
  const region = detectPhilippineRegion(lat, lng, account.home_port_name);
  return { id: account.id, phone: account.phone_number, vesselName: typeof account.full_name === 'string' ? account.full_name : '',
    licenseNo: '', boatType: '', port: account.home_port_name, lat, lng,
    speciesPreference: account.habitat_preference as UserProfile['speciesPreference'],
    regionId: region.id, regionName: region.name, fmaZone: region.fmaZone, regionalBounds: region.bounds };
}

export function profilePatch(profile: Partial<UserProfile>): Record<string, unknown> {
  const fields = { vesselName: 'full_name', port: 'home_port_name', lat: 'latitude', lng: 'longitude', speciesPreference: 'habitat_preference' } as const;
  return Object.fromEntries(Object.entries(fields).filter(([key]) => profile[key as keyof UserProfile] !== undefined)
    .map(([key, wireKey]) => [wireKey, profile[key as keyof UserProfile]]));
}

export async function requestProfile(body?: Record<string, unknown>, headers: Record<string, string> = {}) {
  const response = await fetch('/api/users/profile', {
    method: body ? 'PUT' : 'GET', credentials: 'same-origin', cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...headers },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(response.status === 401 || response.status === 403
    ? 'Sign in again before saving your profile.' : 'The profile could not be confirmed. Your draft has been kept; reload saved details before retrying.');
  const account: Record<string, unknown> = await response.json();
  return { profile: readProfile(account), schedule: readSchedule(account) };
}
