import { describe, expect, it } from 'vitest';
import type { AdvisoryPreferences } from '@/types';
import { initialSamplePreferences, validateSamplePreferences } from '@/components/onboarding/advisory-preferences-demo';

describe('disconnected preference contract validation', () => {
  it('starts each synthetic sample paused with the published defaults and independent arrays', () => {
    expect(initialSamplePreferences()).toEqual({ advisory_days: [], preferred_advisory_time: '05:00:00', preferred_language: 'en', habitat_preference: 'both' });
    const edited = initialSamplePreferences(); edited.advisory_days.push(1);
    expect(initialSamplePreferences().advisory_days).toEqual([]);
  });

  it('accepts zero and five distinct ISO weekdays, sorts a copy and preserves seconds', () => {
    const input = { ...initialSamplePreferences(), advisory_days: [7, 6, 3, 2, 1] } as AdvisoryPreferences;
    const result = validateSamplePreferences(input);
    expect(result).toEqual({ ok: true, value: { ...input, advisory_days: [1, 2, 3, 6, 7] } });
    expect(input.advisory_days).toEqual([7, 6, 3, 2, 1]);
    expect(validateSamplePreferences(initialSamplePreferences()).ok).toBe(true);
  });

  it.each([[1, 1], [1, 2, 3, 4, 5, 6], [0], [8], [1.5], ['1'], null].map(days => ({ days })))('rejects invalid weekday input $days without truncation or coercion', ({ days }) => {
    const result = validateSamplePreferences({ ...initialSamplePreferences(), advisory_days: days } as AdvisoryPreferences);
    expect(result).toMatchObject({ ok: false, field: 'advisory_days' });
  });

  it.each([['00:00', '00:00:00'], ['23:59:59', '23:59:59'], ['04:30:17', '04:30:17']])('normalizes %s as Manila wall time without device timezone conversion', (input, output) => {
    const result = validateSamplePreferences({ ...initialSamplePreferences(), preferred_advisory_time: input });
    expect(result).toMatchObject({ ok: true, value: { preferred_advisory_time: output } });
  });

  it.each(['', '24:00', '23:60', '05:00:60', '5:00', '05:00Z', '05:00:00+08:00'])('rejects invalid local time %s', time => {
    expect(validateSamplePreferences({ ...initialSamplePreferences(), preferred_advisory_time: time })).toMatchObject({ ok: false, field: 'preferred_advisory_time' });
  });

  it.each(['en', 'tl', 'ceb', 'hil'] as const)('accepts language %s without creating translation coverage', preferred_language => {
    expect(validateSamplePreferences({ ...initialSamplePreferences(), preferred_language }).ok).toBe(true);
  });
  it.each(['pelagic', 'demersal', 'both'] as const)('preserves habitat %s', habitat_preference => {
    expect(validateSamplePreferences({ ...initialSamplePreferences(), habitat_preference })).toMatchObject({ ok: true, value: { habitat_preference } });
  });
  it.each([['preferred_language', 'bcl'], ['habitat_preference', 'nearest']])('rejects unsupported %s instead of mapping to a default', (field, value) => {
    expect(validateSamplePreferences({ ...initialSamplePreferences(), [field]: value })).toMatchObject({ ok: false, field });
  });
});
