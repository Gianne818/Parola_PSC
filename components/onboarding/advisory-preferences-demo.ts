import type { AdvisoryPreferences, AdvisoryWeekday } from '@/types';

// Frontend-only fixtures and validation. No server validators or transports are
// imported: those modules initialize authentication/database dependencies.
export const WEEKDAYS: ReadonlyArray<{ value: AdvisoryWeekday; label: string }> = [
  { value: 1, label: 'Monday' }, { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' }, { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' }, { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
];

export const PREFERENCE_LANGUAGES = [
  { value: 'en', label: 'English' }, { value: 'tl', label: 'Tagalog' },
  { value: 'ceb', label: 'Cebuano' }, { value: 'hil', label: 'Hiligaynon' },
] as const;

export function initialSamplePreferences(): AdvisoryPreferences {
  // Published new-account defaults, never a claim about an existing account.
  return { advisory_days: [], preferred_advisory_time: '05:00:00', preferred_language: 'en', habitat_preference: 'both' };
}

export type PreferenceField = keyof AdvisoryPreferences;
export type PreferenceValidation =
  | { ok: true; value: AdvisoryPreferences }
  | { ok: false; field: PreferenceField; message: string };

export function validateSamplePreferences(input: AdvisoryPreferences): PreferenceValidation {
  const days = input.advisory_days;
  if (!Array.isArray(days) || days.length > 5 || new Set(days).size !== days.length
    || days.some(day => !Number.isInteger(day) || day < 1 || day > 7)) {
    return { ok: false, field: 'advisory_days', message: 'Choose 0–5 distinct weekdays. A sixth day cannot be added.' };
  }
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(input.preferred_advisory_time)) {
    return { ok: false, field: 'preferred_advisory_time', message: 'Enter a Manila time from 00:00:00 to 23:59:59, including hours and minutes.' };
  }
  if (!PREFERENCE_LANGUAGES.some(language => language.value === input.preferred_language)) {
    return { ok: false, field: 'preferred_language', message: 'Choose one of the four supported language preferences.' };
  }
  if (!['pelagic', 'demersal', 'both'].includes(input.habitat_preference)) {
    return { ok: false, field: 'habitat_preference', message: 'Choose pelagic, demersal or both habitats.' };
  }
  return { ok: true, value: { ...input, advisory_days: [...days].sort((a, b) => a - b),
    preferred_advisory_time: input.preferred_advisory_time.length === 5 ? `${input.preferred_advisory_time}:00` : input.preferred_advisory_time } };
}

export function describeSampleDays(days: readonly AdvisoryWeekday[]): string {
  return days.length ? WEEKDAYS.filter(day => days.includes(day.value)).map(day => day.label).join(', ') : 'No weekdays — routine advisories paused in this sample';
}
