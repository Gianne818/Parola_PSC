import { describe, expect, it } from 'vitest';
import { advisoryPreferenceInput, nextRoutineAt, registrationPreferences } from './advisory-preferences';

describe('advisory preference validation', () => {
  it('does not manufacture update values for omitted fields', () => {
    expect(advisoryPreferenceInput({})).toEqual({});
    expect(registrationPreferences({})).toEqual({ advisory_days: [], preferred_advisory_time: '05:00:00', preferred_language: 'en', habitat_preference: 'both' });
  });
  it('sorts a copy of five valid weekdays and normalizes whole-minute times', () => {
    const days = [5, 3, 1, 4, 2];
    expect(advisoryPreferenceInput({ advisory_days: days, preferred_advisory_time: '00:00' })).toEqual({ advisory_days: [1, 2, 3, 4, 5], preferred_advisory_time: '00:00:00' });
    expect(days).toEqual([5, 3, 1, 4, 2]);
  });
  it.each([null, '1,2', {}, [1, 1], [1, 2, 3, 4, 5, 6], [0], [8], [-1], [1.5], ['1'], [true], [null], [[1, 2]]].map(advisory_days => ({ advisory_days })))('rejects malformed weekdays: $advisory_days', ({ advisory_days }) => {
    expect(() => advisoryPreferenceInput({ advisory_days })).toThrow();
  });
  it.each(['04:30+08:00', '04:30:00.5', '4:30', '24:00', '05:60', 18000, true, null])('rejects malformed time: %j', preferred_advisory_time => {
    expect(() => advisoryPreferenceInput({ preferred_advisory_time })).toThrow();
  });
  it.each(['en', 'tl', 'ceb', 'hil'])('accepts supported language: %s', preferred_language => {
    expect(advisoryPreferenceInput({ preferred_language })).toEqual({ preferred_language });
  });
  it.each(['pelagic', 'demersal', 'both'])('accepts supported habitat: %s', habitat_preference => {
    expect(advisoryPreferenceInput({ habitat_preference })).toEqual({ habitat_preference });
  });
  it.each([{ preferred_language: null }, { preferred_language: 'EN' }, { preferred_language: [] }, { habitat_preference: 'reef' }, { habitat_preference: null }])('rejects unsupported preferences: %j', body => {
    expect(() => advisoryPreferenceInput(body)).toThrow();
  });
});

describe('next routine occurrence in Manila time', () => {
  const monday = { advisory_days: [1] as const, preferred_advisory_time: '05:00:00' };
  const schedule = { ...monday, advisory_days: [...monday.advisory_days] };
  it('returns no routine date for a paused schedule', () => {
    expect(nextRoutineAt({ ...schedule, advisory_days: [] })).toBeNull();
  });
  it('uses Manila Monday even while UTC is Sunday', () => {
    expect(nextRoutineAt(schedule, new Date('2026-10-18T20:30:00Z'))).toBe('2026-10-18T21:00:00.000Z');
  });
  it('does not schedule an already due occurrence when saving at the exact time', () => {
    expect(nextRoutineAt(schedule, new Date('2026-10-18T21:00:00Z'))).toBe('2026-10-25T21:00:00.000Z');
  });
  it('skips unselected days after the current day has passed', () => {
    expect(nextRoutineAt({ ...schedule, advisory_days: [1, 3] }, new Date('2026-10-18T22:00:00Z'))).toBe('2026-10-20T21:00:00.000Z');
  });
  it('handles Sunday and month/year rollover with second precision', () => {
    expect(nextRoutineAt({ advisory_days: [7], preferred_advisory_time: '00:00:15' }, new Date('2026-12-31T23:00:00Z'))).toBe('2027-01-02T16:00:15.000Z');
  });
});
