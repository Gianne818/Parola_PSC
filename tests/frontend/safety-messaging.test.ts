import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { advisoryState, isReadingCurrent, retainWeather, type DashboardWeather } from '@/lib/dashboard';
import { loadDashboardWeather } from '@/services/dashboardService';
import { evidenceCoverage, readWeatherEvidence } from '@/lib/frontend/safety-presentation';
import { readMessagingOutcome, readMessagingProfile, requestOutcomeText } from '@/lib/frontend/messaging-status';
import SafetyEvidence from '@/components/dashboard/SafetyEvidence';
import MessagingStatus from '@/components/dashboard/MessagingStatus';
import { AreaDetails } from '@/components/dashboard/FishingAreas';
import { DASHBOARD_COPY } from '@/components/dashboard/dashboard-copy';

const now = new Date('2026-10-17T04:00:00Z');
const reading = { value: 1, source: 'Open-Meteo forecast', observedAt: '2026-10-17T03:00:00Z', validUntil: '2026-10-17T05:00:00Z', available: true };
const weather = (): DashboardWeather => ({ wind: reading, waves: reading, temperature: reading, stormSignal: { ...reading, value: 0, source: 'Parola regional hold record' },
  hold: { active: false, available: true, checkedAt: reading.observedAt, reason: null }, receivedAt: now.toISOString() });
const account = { id: 'account-a', phone_number: '+639171234567', messaging_consent: true, messaging_consent_at: reading.observedAt, messaging_consent_version: 'saved-version', is_active: true,
  advisory_days: [1, 5], preferred_advisory_time: '05:00:00', preferred_language: 'en', habitat_preference: 'both', advisory_timezone: 'Asia/Manila', routine_paused: false,
  next_routine_at: '2026-10-19T05:00:00+08:00', language_status: { requested: 'en', message_language: 'en', reviewed: false, fallback: false } };
const readProfile = (data: unknown) => readMessagingProfile(data, account.id, '09171234567');
afterEach(() => vi.unstubAllGlobals());

describe('independent safety evidence and existing enforcement', () => {
  it('keeps readable warnings when forecast fields are missing or malformed', async () => {
    const data = { ...weather(), wind: { value: 'bad' }, waves: null, hold: { ...weather().hold, active: true, reason: 'Regional restriction' } };
    vi.stubGlobal('fetch', vi.fn(async () => Response.json(data)));
    const value = await loadDashboardWeather(14, 123, 'reg-5', new AbortController().signal);
    expect(value.wind.value).toBeNull(); expect(value.waves.value).toBeNull();
    expect(advisoryState(value, false, false, now)).toBe('hold');
    const html = renderToStaticMarkup(React.createElement(SafetyEvidence, { data: value, now, failed: true }));
    expect(html).toContain('Regional restriction'); expect(html).toContain('last available record');
    expect(html).toContain('Official warning feed'); expect(html).toContain('Unavailable in this response');
    expect(html).not.toContain('NOAA');
  });
  it('retains known warnings across partial outages without calling them current', () => {
    const previous = weather(); previous.hold.active = true;
    const next = readWeatherEvidence({});
    const retained = retainWeather(previous, next);
    expect(retained.hold.active).toBe(true); expect(retained.hold.available).toBe(false);
    expect(isReadingCurrent(retained.wind, now)).toBe(false);
    expect(advisoryState(retained, false, true, now)).toBe('hold');
    const incomingWarning = { ...next, hold: { ...next.hold, active: true, reason: 'Independent warning' } };
    expect(retainWeather(weather(), incomingWarning).hold.reason).toBe('Independent warning');
  });
  it('preserves existing thresholds and manual/known-hazard precedence', () => {
    for (const data of [{ ...weather(), wind: { ...reading, value: 20 * 1.852 } }, { ...weather(), waves: { ...reading, value: 2 } }, { ...weather(), stormSignal: { ...reading, value: 1 } }]) {
      expect(advisoryState(data, false, true, now)).toBe('hold');
    }
    expect(advisoryState(null, true, true, now)).toBe('hold');
    expect(advisoryState(null, false, false, now)).toBe('incomplete');
  });
  it.each([NaN, Infinity, null])('never treats %s as a current reading', value => {
    expect(isReadingCurrent({ ...reading, value }, now)).toBe(false);
  });
  it('keeps missing, retained, undated, expired and zero evidence distinct', () => {
    expect(evidenceCoverage(undefined, now)).toBe('unavailable');
    expect(evidenceCoverage({ ...reading, available: false }, now)).toBe('retained');
    expect(evidenceCoverage({ ...reading, observedAt: null }, now)).toBe('undated');
    expect(evidenceCoverage({ ...reading, validUntil: '2026-10-17T03:01:00Z' }, now)).toBe('expired');
    expect(evidenceCoverage({ ...reading, value: 0 }, now)).toBe('available');
    expect(isReadingCurrent({ ...reading, observedAt: '2026-10-17T06:00:00Z' }, now)).toBe(false);
    expect(advisoryState({ ...weather(), hold: { ...weather().hold, checkedAt: '2026-10-17T06:00:00Z' } }, false, false, now)).toBe('incomplete');
    expect(advisoryState(readWeatherEvidence({ ...weather(), wind: { ...reading, validUntil: 'bad' } }), false, false, now)).toBe('incomplete');
  });
  it('withholds actionable estimates and species guidance while preserving reference evidence', () => {
    const area = { id: 'zone', name: 'Zone', lat: 14, lng: 123, type: 'both' as const, species: [], depth: NaN, lastUpdated: '', predictionDate: null,
      source: 'model' as const, speciesAdjusted: true, habitatKnown: true, distanceKm: 1, compassBearing: 'E', catchProbability: .8 };
    const html = renderToStaticMarkup(React.createElement(AreaDetails, { area, copy: DASHBOARD_COPY.en, guidanceAvailable: false }));
    expect(html).not.toContain('80%'); expect(html).not.toContain('Adjusted model guidance');
    expect(html).toContain('14.0000'); expect(html).toContain('Prediction provenance');
  });
});

describe('existing messaging response boundaries', () => {
  it('does not infer eligibility or verification from consent, phone or a saved schedule', () => {
    const data = readProfile(account);
    expect(data.consent).toBe(true); expect(data.eligible).toBeNull(); expect(data.contactVerified).toBeNull();
    expect(data.schedule?.advisory_days).toEqual([1, 5]);
    const html = renderToStaticMarkup(React.createElement(MessagingStatus, { data, status: 'ready', refresh() {}, language: 'en' }));
    expect(html).toContain('may occur any day'); expect(html).toContain('callback-backed');
    expect(html).toContain('Sponsor consent'); expect(html).toContain('not include sponsor messages');
    expect(html).toContain('scheduled, not a dispatch promise');
  });
  it('shows explicit demo, denied, loading and unavailable states', () => {
    const data = readProfile({ ...account, messaging_consent: false, auth_mode: 'demo', contact_verified: false, messaging_eligible: false });
    expect(data.eligible).toBe(false); expect(data.contactVerified).toBe(false); expect(data.consent).toBe(false);
    for (const status of ['ready', 'denied', 'loading', 'unavailable'] as const) {
      const html = renderToStaticMarkup(React.createElement(MessagingStatus, { data: status === 'ready' ? data : null, status, refresh() {}, language: 'en' }));
      expect(html).toContain(status === 'ready' ? 'live SMS is unavailable' : status === 'denied' ? 'access denied' : status === 'loading' ? 'Loading messaging status' : 'status unavailable');
      expect(html).toContain('role="status"');
    }
  });
  it('does not invent missing consent or accept a cross-account/contact response', () => {
    expect(readProfile({ ...account, messaging_consent: 'true' }).consent).toBeNull();
    expect(() => readProfile({ ...account, id: 'account-b' })).toThrow('match');
    expect(() => readProfile({ ...account, phone_number: '09171111111' })).toThrow('match');
    expect(() => readProfile(null)).toThrow();
  });
  it('keeps a paused routine schedule separate from any-day alerts', () => {
    const data = readProfile({ ...account, advisory_days: [], routine_paused: true, next_routine_at: null });
    const html = renderToStaticMarkup(React.createElement(MessagingStatus, { data, status: 'ready', refresh() {}, language: 'en' }));
    expect(html).toContain('Routine schedule paused'); expect(html).toContain('may occur any day');
  });
  it.each([
    [true, 200, { success: true, mode: 'MOCK_DRY_RUN' }, 'simulated'],
    [true, 200, { success: true, mode: 'LIVE_DISPATCH', status: 'delivered' }, 'accepted'],
    [false, 403, { error: 'denied' }, 'denied'], [false, 401, null, 'denied'],
    [false, 503, null, 'failed'], [false, 429, {}, 'failed'],
    [true, 200, {}, 'unknown'], [true, 200, null, 'unknown'],
    [true, 200, { success: false }, 'failed'], [true, 200, { success: true, mode: 'queued' }, 'unknown'],
  ])('maps supported send response to %s / %s / %s → %s', (ok, status, data, outcome) => {
    expect(readMessagingOutcome(ok as boolean, status as number, data)).toBe(outcome);
  });
  it('never equates gateway acceptance with receipt', () => {
    expect(requestOutcomeText.accepted).toContain('Delivery has not been confirmed');
    expect(requestOutcomeText.unknown).toContain('unknown');
    expect(requestOutcomeText.failed).toContain('duplicate');
  });
});
