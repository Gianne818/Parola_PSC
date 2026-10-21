import { describe, expect, it } from 'vitest';
import { advisoryState, evaluateCurrentDrift, manilaDate, maskedPhone, nearbyAreas, predictionPercent, retainWeather, reusableAreaWeather, smsOutcome, type DashboardWeather, type FishingArea } from './dashboard';
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
  it('defaults to >= 50% threshold and includes >= 25% hotspots when threshold is lowered', () => {
    const region = PHILIPPINE_REGIONS.find(item => item.id === 'reg-7')!;
    const candidates = [
      { ...area('high', 10.35, 123.90), catchProbability: 0.72 },
      { ...area('border50', 10.36, 123.91), catchProbability: 0.50 },
      { ...area('low28', 10.37, 123.92), catchProbability: 0.28 },
      { ...area('border25', 10.38, 123.93), catchProbability: 0.25 },
      { ...area('below25', 10.39, 123.94), catchProbability: 0.20 },
    ];
    expect(nearbyAreas(candidates, region, 10.3157, 123.8854, 'both').map(item => item.id)).toEqual(['high', 'border50']);
    expect(nearbyAreas(candidates, region, 10.3157, 123.8854, 'both', 25).map(item => item.id)).toEqual(['high', 'border50', 'low28', 'border25']);
    expect(nearbyAreas(candidates, region, 10.3157, 123.8854, 'both', 70).map(item => item.id)).toEqual(['high']);
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

describe('ocean current drift evaluation', () => {
  it('returns null when speed or heading is missing or not finite', () => {
    expect(evaluateCurrentDrift(null, 90)).toBeNull();
    expect(evaluateCurrentDrift(undefined, 90)).toBeNull();
    expect(evaluateCurrentDrift(0.4, null)).toBeNull();
    expect(evaluateCurrentDrift(0.4, undefined)).toBeNull();
    expect(evaluateCurrentDrift(NaN, 90)).toBeNull();
    expect(evaluateCurrentDrift(0.4, NaN)).toBeNull();
    expect(evaluateCurrentDrift(Infinity, 90)).toBeNull();
    expect(evaluateCurrentDrift(0.4, -Infinity)).toBeNull();
  });

  it.each([
    { heading: 0, flowDir: 'N', upHeading: 180, upDir: 'S' },
    { heading: 45, flowDir: 'NE', upHeading: 225, upDir: 'SW' },
    { heading: 90, flowDir: 'E', upHeading: 270, upDir: 'W' },
    { heading: 135, flowDir: 'SE', upHeading: 315, upDir: 'NW' },
    { heading: 180, flowDir: 'S', upHeading: 0, upDir: 'N' },
    { heading: 225, flowDir: 'SW', upHeading: 45, upDir: 'NE' },
    { heading: 270, flowDir: 'W', upHeading: 90, upDir: 'E' },
    { heading: 315, flowDir: 'NW', upHeading: 135, upDir: 'SE' },
    { heading: 360, flowDir: 'N', upHeading: 180, upDir: 'S' },
    { heading: -90, flowDir: 'W', upHeading: 90, upDir: 'E' },
  ])('calculates cardinal/ordinal headings and upstream vectors for heading $heading', ({ heading, flowDir, upHeading, upDir }) => {
    const evalResult = evaluateCurrentDrift(0.35, heading);
    expect(evalResult).not.toBeNull();
    expect(evalResult!.flowDirection).toBe(flowDir);
    expect(evalResult!.upstreamHeading).toBe(upHeading);
    expect(evalResult!.upstreamDirection).toBe(upDir);
  });

  it.each([
    { speedMps: 0.10, expectedKnots: 0.2, strength: 'slack', label: 'Slack / Weak Current (< 0.3 kts)' },
    { speedMps: 0.14, expectedKnots: 0.3, strength: 'slack', label: 'Slack / Weak Current (< 0.3 kts)' },
    { speedMps: 0.15, expectedKnots: 0.3, strength: 'optimal', label: 'Moderate / Optimal Feeding Flow (0.3–1.2 kts)' },
    { speedMps: 0.40, expectedKnots: 0.8, strength: 'optimal', label: 'Moderate / Optimal Feeding Flow (0.3–1.2 kts)' },
    { speedMps: 0.60, expectedKnots: 1.2, strength: 'optimal', label: 'Moderate / Optimal Feeding Flow (0.3–1.2 kts)' },
    { speedMps: 0.61, expectedKnots: 1.2, strength: 'strong', label: 'Strong Drift Current (> 1.2 kts)' },
    { speedMps: 1.00, expectedKnots: 1.9, strength: 'strong', label: 'Strong Drift Current (> 1.2 kts)' },
  ])('categorizes flow speed $speedMps m/s correctly', ({ speedMps, expectedKnots, strength, label }) => {
    const result = evaluateCurrentDrift(speedMps, 90);
    expect(result).not.toBeNull();
    expect(result!.speedKnots).toBe(expectedKnots);
    expect(result!.currentStrength).toBe(strength);
    expect(result!.strengthLabel).toBe(label);
  });

  it('generates tactical advice tailored to pelagic and demersal habitats', () => {
    const pelagic = evaluateCurrentDrift(0.35, 90, 'pelagic');
    expect(pelagic!.tacticalAdvice).toBe(
      'Current flows E across the zone. Predatory pelagics face into oncoming current along the W rim. Enter on the W edge (Prime Feeding Line) and drift E with your lines.'
    );

    const demersal = evaluateCurrentDrift(0.35, 90, 'demersal');
    expect(demersal!.tacticalAdvice).toBe(
      'Current sweeps E into the reef slope. Fish or anchor along the up-current (W) face where incoming flow pushes bait and nutrients against the reef wall.'
    );

    const defaultHabitat = evaluateCurrentDrift(0.35, 90);
    expect(defaultHabitat!.tacticalAdvice).toBe(pelagic!.tacticalAdvice);
  });
});
