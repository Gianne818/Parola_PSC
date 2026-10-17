import { afterEach, describe, expect, it, vi } from 'vitest';
import { profilePatch, readProfile, readSchedule, requestProfile, validatePreferences } from '@/lib/frontend/profile-client';
import type { AdvisoryPreferences } from '@/types';

const preferences: AdvisoryPreferences = { advisory_days: [1, 3, 5], preferred_advisory_time: '04:30:17', preferred_language: 'ceb', habitat_preference: 'demersal' };
const account = { id: 'profile-a', phone_number: '+639171234567', full_name: 'Test operator', home_port_name: 'Estancia Shoreline Port', latitude: 11.4552, longitude: 123.1491,
  ...preferences, advisory_timezone: 'Asia/Manila', routine_paused: false, next_routine_at: '2026-10-18T20:30:17Z',
  language_status: { requested: 'ceb', message_language: 'en', fallback: true, reviewed: false } };
afterEach(() => vi.unstubAllGlobals());

describe('confirmed profile and advisory preferences', () => {
  it.each(['pelagic', 'demersal', 'both'] as const)('hydrates saved %s habitat and regional location from the server', habitat => {
    const profile = readProfile({ ...account, habitat_preference: habitat });
    expect(profile).toMatchObject({ id: 'profile-a', speciesPreference: habitat, port: account.home_port_name, lat: 11.4552, lng: 123.1491 });
    expect(profile.regionName).toBeTruthy();
    expect(profile.licenseNo).toBe('');
  });
  it('keeps a port-only patch free of unrelated preferences and personal fields', () => {
    expect(profilePatch({ port: 'Cebu Port', lat: 10.2936, lng: 123.9056, province: 'Cebu', regionId: 'reg-7' }))
      .toEqual({ home_port_name: 'Cebu Port', latitude: 10.2936, longitude: 123.9056 });
  });
  it('accepts pause and five days, rejects sixth/duplicate/noninteger/out-of-range days', () => {
    for (const days of [[], [1], [1, 2, 3, 4, 5]]) expect(validatePreferences({ ...preferences, advisory_days: days as AdvisoryPreferences['advisory_days'] })).toBeNull();
    for (const days of [[1, 2, 3, 4, 5, 6], [1, 1], [0], [8], [1.5], ['1']]) {
      expect(validatePreferences({ ...preferences, advisory_days: days as AdvisoryPreferences['advisory_days'] })).toContain('five different weekdays');
    }
  });
  it('validates time boundaries without dropping persisted seconds', () => {
    for (const time of ['00:00', '23:59:59', '04:30:17']) expect(validatePreferences({ ...preferences, preferred_advisory_time: time })).toBeNull();
    for (const time of ['', '24:00', '05:60', '05:00:60', '4:30']) expect(validatePreferences({ ...preferences, preferred_advisory_time: time })).toContain('Manila');
    expect(readSchedule(account)?.preferred_advisory_time).toBe('04:30:17');
  });
  it('keeps absent, invalid and inconsistent schedule responses unavailable', () => {
    for (const patch of [{ advisory_days: undefined }, { advisory_days: null }, { habitat_preference: 'reef' }, { preferred_language: 'xx' },
      { routine_paused: true }, { next_routine_at: undefined }, { next_routine_at: 'invalid' }, { advisory_timezone: 'UTC' }, { language_status: undefined }]) {
      expect(readSchedule({ ...account, ...patch })).toBeNull();
    }
    expect(readSchedule({ ...account, advisory_days: [], routine_paused: true, next_routine_at: null })).toMatchObject({ advisory_days: [], routine_paused: true });
  });
  it('rejects an incomplete or malformed profile instead of applying defaults', () => {
    for (const patch of [{ id: undefined }, { phone_number: '' }, { latitude: '11.45' }, { longitude: Infinity }, { home_port_name: '' }, { habitat_preference: 'reef' }]) {
      expect(() => readProfile({ ...account, ...patch })).toThrow('complete profile');
    }
  });
  it('uses a same-origin owner request and returns server readback without retries', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json(account)); vi.stubGlobal('fetch', fetcher);
    const body = { phone_number: account.phone_number, ...preferences };
    const saved = await requestProfile(body, { Authorization: 'Bearer test-owner' });
    expect(saved.schedule).toMatchObject(preferences);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][1]).toMatchObject({ method: 'PUT', credentials: 'same-origin', cache: 'no-store', body: JSON.stringify(body), headers: { Authorization: 'Bearer test-owner' } });
  });
  it.each([400, 401, 403, 503])('does not report HTTP %s as a saved profile', async status => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ error: 'rejected' }, { status })); vi.stubGlobal('fetch', fetcher);
    await expect(requestProfile({ phone_number: account.phone_number, ...preferences })).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('surfaces network failure and malformed acknowledgements', async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new TypeError('offline')).mockResolvedValueOnce(Response.json({ status: 'ok' })); vi.stubGlobal('fetch', fetcher);
    await expect(requestProfile({ ...preferences })).rejects.toThrow('offline');
    await expect(requestProfile({ ...preferences })).rejects.toThrow('complete profile');
  });
});
