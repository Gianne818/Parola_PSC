import { describe, expect, it } from 'vitest';
import { advisoryState, manilaDate, maskedPhone, nearbyAreas, predictionPercent, retainWeather, reusableAreaWeather, smsOutcome, type DashboardWeather, type FishingArea } from './dashboard';
import { PHILIPPINE_REGIONS } from '@/data/philippineRegions';
import { DASHBOARD_COPY } from '@/components/dashboard/dashboard-copy';

const now = new Date('2026-10-14T04:00:00Z');
function weather(): DashboardWeather {
  const reading = (value: number) => ({ value, source: 'Forecast', observedAt: now.toISOString() });
  return { wind: reading(12), waves: reading(0.8), temperature: reading(29), stormSignal: reading(0),
    hold: { available: true, active: false, checkedAt: now.toISOString(), reason: null }, receivedAt: now.toISOString() };
}

describe('daily advisory', () => {
  it('reuses zone forecasts only while both local fields remain available and current', () => {
    const data = weather(); data.hold.available = false; data.stormSignal.value = null;
    expect(reusableAreaWeather(data, now)).toBe(true);
    data.waves.validUntil = '2026-10-14T03:59:00Z';
    expect(reusableAreaWeather(data, now)).toBe(false);
    data.waves.validUntil = null; data.wind.available = false;
    expect(reusableAreaWeather(data, now)).toBe(false);
    data.wind.available = true; data.waves.value = null;
    expect(reusableAreaWeather(data, now)).toBe(false);
  });
  it('only reports no detected hold with complete, dated readings and a regional check', () => {
    expect(advisoryState(weather(), false, false, now)).toBe('clear');
    expect(advisoryState(null, false, false, now)).toBe('incomplete');
    const incomplete = weather(); incomplete.stormSignal.value = null;
    expect(advisoryState(incomplete, false, false, now)).toBe('incomplete');
    incomplete.stormSignal.value = 0; incomplete.hold.available = false;
    expect(advisoryState(incomplete, false, false, now)).toBe('incomplete');
  });
  it.each(['wind', 'waves', 'stormSignal'] as const)('retains the existing %s hold threshold', field => {
    const data = weather(); data[field].value = field === 'wind' ? 20 * 1.852 : field === 'waves' ? 2 : 1;
    expect(advisoryState(data, false, false, now)).toBe('hold');
  });
  it('does not clear a hold on failed refresh or missing readings', () => {
    const previous = weather(); previous.waves.value = 2.4;
    const partial = weather(); partial.waves.value = null; partial.hold.available = false;
    const retained = retainWeather(previous, partial);
    expect(retained.waves.value).toBe(2.4);
    expect(retained.waves.observedAt).toBe(previous.waves.observedAt);
    expect(retained.waves.available).toBe(false);
    expect(advisoryState(retained, false, true, now)).toBe('hold');
    expect(advisoryState(null, true, true, now)).toBe('hold');
    previous.hold.active = true;
    expect(retainWeather(previous, partial).hold.active).toBe(true);
  });
  it('does not call previous-day readings current or turn a failed request into a clear advisory', () => {
    const old = weather(); old.wind.observedAt = '2026-10-13T00:00:00Z';
    expect(advisoryState(old, false, false, now)).toBe('incomplete');
    expect(advisoryState(weather(), false, true, now)).toBe('incomplete');
  });
  it('does not call expired provider intervals current', () => {
    const data = weather(); data.wind.validUntil = '2026-10-14T03:59:00Z';
    expect(advisoryState(data, false, false, now)).toBe('incomplete');
  });
  it('uses Manila dates across midnight and handles invalid dates', () => {
    expect(manilaDate('2026-10-13T17:00:00Z')).toBe('2026-10-14');
    expect(manilaDate('not-a-date')).toBeNull();
  });
});

describe('fishing guidance', () => {
  const area = (id: string, lat: number, lng: number, type: FishingArea['type'] = 'pelagic'): FishingArea => ({
    id, name: id, lat, lng, type, species: [], depth: 0, lastUpdated: '', predictionDate: null,
    source: 'model', speciesAdjusted: false, habitatKnown: true, distanceKm: 0, compassBearing: '',
  });
  it('sorts by home-port distance and excludes other regions and habitats', () => {
    const region = PHILIPPINE_REGIONS.find(item => item.id === 'reg-7')!;
    const result = nearbyAreas([area('far', 10.7, 123.8), area('near', 10.32, 123.89), area('outside', 16, 121), area('bottom', 10.4, 123.9, 'demersal')], region, 10.3157, 123.8854, 'pelagic');
    expect(result.map(item => item.id)).toEqual(['near', 'far']);
    expect(result[0].compassBearing).toBeTruthy();
  });
  it('includes mixed habitats and rejects invalid coordinates', () => {
    const region = PHILIPPINE_REGIONS.find(item => item.id === 'reg-7')!;
    expect(nearbyAreas([area('mixed', 10.4, 123.9, 'both'), area('bad', NaN, 123.9)], region, 10.3157, 123.8854, 'demersal').map(item => item.id)).toEqual(['mixed']);
  });
  it('never invents missing model estimates', () => {
    expect(predictionPercent(undefined)).toBeNull(); expect(predictionPercent(NaN)).toBeNull();
    expect(predictionPercent(0.84)).toBe(84); expect(predictionPercent(84)).toBe(84);
  });
});

describe('SMS results and language support', () => {
  it('distinguishes mock previews and accepted dispatches', () => {
    expect(smsOutcome(true, { success: true, mode: 'MOCK_DRY_RUN' })).toBe('simulated');
    expect(smsOutcome(true, { success: true, mode: 'LIVE_DISPATCH' })).toBe('accepted');
  });
  it.each([[false, { success: true }], [true, { success: false }], [true, {}], [true, { success: true, mode: 'unknown' }]])('rejects unconfirmed or failed dispatches', (ok, data) => {
    expect(() => smsOutcome(ok as boolean, data as { success?: boolean; mode?: string })).toThrow();
  });
  it('masks phone numbers without supplying a fallback recipient', () => {
    expect(maskedPhone('0917 123 4567')).toBe('•••• ••• 4567'); expect(maskedPhone('')).toBe('');
  });
  it.each(['tl', 'ceb', 'hil'] as const)('provides all dashboard copy in %s', language => {
    expect(Object.keys(DASHBOARD_COPY[language]).sort()).toEqual(Object.keys(DASHBOARD_COPY.en).sort());
    expect(Object.values(DASHBOARD_COPY[language]).every(value => value.length > 0)).toBe(true);
  });
});
