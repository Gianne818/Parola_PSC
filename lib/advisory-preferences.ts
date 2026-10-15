import type { AdvisoryPreferences, AdvisoryWeekday } from '@/types';
import { RegistrationError } from '@/lib/registration';

export const ADVISORY_PREFERENCE_FIELDS = ['advisory_days', 'preferred_advisory_time', 'preferred_language', 'habitat_preference'] as const;

/** Omitted fields are absent so a profile edit cannot reset saved preferences. */
export function advisoryPreferenceInput(body: Record<string, unknown>): Partial<AdvisoryPreferences> {
  const result: Partial<AdvisoryPreferences> = {};
  if (body.advisory_days !== undefined) {
    const days = body.advisory_days;
    if (!Array.isArray(days) || days.length > 5 || days.some(day => !Number.isInteger(day) || day < 1 || day > 7)
      || new Set(days).size !== days.length) {
      throw new RegistrationError(400, 'advisory_days must contain 0–5 distinct ISO weekdays (Monday=1 through Sunday=7).');
    }
    result.advisory_days = [...days].sort((a, b) => a - b) as AdvisoryWeekday[];
  }
  if (body.preferred_advisory_time !== undefined) {
    const value = body.preferred_advisory_time;
    if (typeof value !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value)) {
      throw new RegistrationError(400, 'preferred_advisory_time must be a valid HH:MM or HH:MM:SS time.');
    }
    result.preferred_advisory_time = value.length === 5 ? `${value}:00` : value;
  }
  if (body.preferred_language !== undefined) {
    if (!['en', 'tl', 'ceb', 'hil'].includes(body.preferred_language as string)) {
      throw new RegistrationError(400, 'preferred_language must be en, tl, ceb or hil.');
    }
    result.preferred_language = body.preferred_language as AdvisoryPreferences['preferred_language'];
  }
  if (body.habitat_preference !== undefined) {
    if (!['pelagic', 'demersal', 'both'].includes(body.habitat_preference as string)) {
      throw new RegistrationError(400, 'habitat_preference must be pelagic, demersal or both.');
    }
    result.habitat_preference = body.habitat_preference as AdvisoryPreferences['habitat_preference'];
  }
  return result;
}

export function registrationPreferences(body: Record<string, unknown>): AdvisoryPreferences {
  return { advisory_days: [], preferred_advisory_time: '05:00:00', preferred_language: 'en', habitat_preference: 'both', ...advisoryPreferenceInput(body) };
}

/** Manila is UTC+08:00 year-round. Always return a strictly future occurrence. */
export function nextRoutineAt(preferences: Pick<AdvisoryPreferences, 'advisory_days' | 'preferred_advisory_time'>, now = new Date()): string | null {
  if (!preferences.advisory_days.length) return null;
  const offset = 8 * 60 * 60 * 1000;
  const local = new Date(now.getTime() + offset);
  const [hour, minute, second = 0] = preferences.preferred_advisory_time.split(':').map(Number);
  for (let day = 0; day <= 7; day++) {
    const candidate = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + day, hour, minute, second));
    const weekday = candidate.getUTCDay() || 7;
    const timestamp = candidate.getTime() - offset;
    if (preferences.advisory_days.includes(weekday as AdvisoryWeekday) && timestamp > now.getTime()) return new Date(timestamp).toISOString();
  }
  return null;
}

export function withAdvisorySchedule<T extends AdvisoryPreferences>(profile: T, now = new Date()) {
  return { ...profile, advisory_timezone: 'Asia/Manila' as const, routine_paused: profile.advisory_days.length === 0, next_routine_at: nextRoutineAt(profile, now) };
}
