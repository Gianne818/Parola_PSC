import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadFishingAreaResult } from '@/services/dashboardService';
import { nearbyAreas } from '@/lib/dashboard';
import { PHILIPPINE_REGIONS } from '@/data/philippineRegions';
import { AreaLoadError, areasOnDay, availablePredictionDays, predictionDayLabel } from '@/lib/frontend/prediction-presentation';
import PredictionCoverage from '@/components/dashboard/PredictionCoverage';
import { AreaDetails } from '@/components/dashboard/FishingAreas';
import { DASHBOARD_COPY } from '@/components/dashboard/dashboard-copy';
vi.mock('@/utils/auth-fetch', () => ({ authHeaders: async () => ({}) }));

const signal = new AbortController().signal;
const row = { grid_id: 1, target_lat: 14.1, target_lon: 123.1, model_type: 'pelagic', prediction_date: '2026-10-15' };
function response(body: unknown, status = 200) { vi.stubGlobal('fetch', vi.fn(async () => Response.json(body, { status }))); }
const load = (species = '') => loadFishingAreaResult(14.0122, 123.0114, species, signal, 'reg-5');
afterEach(() => vi.unstubAllGlobals());

describe('TIER-02 existing-response display boundary', () => {
  it.each(['species_unsupported', 'species_catalog_unavailable'] as const)('keeps %s distinguishable without fallback targets', async code => {
    response({ error: 'Internal provider details must not be displayed', code, hotspots: [] }, 422);
    await expect(load('Unrecognized fish')).rejects.toMatchObject({ kind: code });
    await expect(load('Unrecognized fish')).rejects.not.toThrow('Internal provider');
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2); // one request per explicit load; no fallback/retry
  });
  it('rejects an invalid home port before a request', async () => {
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    await expect(loadFishingAreaResult(NaN, 123, '', signal)).rejects.toBeInstanceOf(AreaLoadError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('selects newest duplicate independently of payload ordering and reports omissions', async () => {
    response({ hotspots: [row, { ...row, grid_id: 2, prediction_date: '2026-10-17' }, { ...row, target_lat: '14.1' }] });
    const result = await load();
    expect(result.areas).toHaveLength(1);
    expect(result.areas[0].predictionDate).toBe('2026-10-17');
    expect(result.coverage).toMatchObject({ receivedCount: 3, rejectedCount: 1, duplicateCount: 1 });
  });
  it('retains server selection order across distinct locations while updating duplicates', async () => {
    response({ hotspots: [row, { ...row, grid_id: 2, target_lat: 14.2, prediction_date: '2026-10-18' }, { ...row, grid_id: 3, prediction_date: '2026-10-17' }] });
    expect((await load()).areas.map(area => area.id)).toEqual(['3', '2']);
  });
  it('keeps habitats separate and filters only returned prediction days, including unknown', async () => {
    response({ hotspots: [row, { ...row, grid_id: 2, model_type: 'demersal', prediction_date: null },
      { ...row, grid_id: 3, model_type: 'both', prediction_date: '2026-10-18' }] });
    const { areas } = await load();
    const region = PHILIPPINE_REGIONS.find(item => item.id === 'reg-5')!;
    expect(nearbyAreas(areas, region, 14.0122, 123.0114, 'both')).toHaveLength(3);
    expect(nearbyAreas(areas, region, 14.0122, 123.0114, 'pelagic').map(area => area.type).sort()).toEqual(['both', 'pelagic']);
    expect(nearbyAreas(areas, region, 14.0122, 123.0114, 'demersal').map(area => area.type).sort()).toEqual(['both', 'demersal']);
    expect(availablePredictionDays(areas)).toEqual(['2026-10-18', '2026-10-15']);
    expect(areasOnDay(areas, 'unknown')).toHaveLength(1);
    expect(areasOnDay(areas, '2026-10-18')).toHaveLength(1);
    expect(areasOnDay(areas, '2026-10-19')).toEqual([]);
  });
  it.each([Infinity, '', null])('rejects invalid identifiers %s', async grid_id => {
    response({ hotspots: [{ ...row, grid_id }] });
    await expect(load()).rejects.toThrow('coordinates');
  });
  it.each([-1, 101, '0.9', null])('leaves malformed score %s unavailable', async catch_probability => {
    response({ hotspots: [{ ...row, catch_probability }] });
    expect((await load()).areas[0].catchProbability).toBeUndefined();
  });
  it('preserves measured zero features without accepting an invented depth or species presence', async () => {
    response({ source: 'postgres_direct', provenance: 'legacy_unverified', species_status: 'resolved', species_hsi_status: 'unavailable',
      hotspots: [{ ...row, sst: 0, chl_a: 0, depth: 50, species: ['Invented fish'], environment_provenance: 'legacy_unverified', dbscan_cluster_id: 0 }] });
    const result = await load('Tamban'); const area = result.areas[0];
    expect(area).toMatchObject({ sst: 0, chlA: 0, species: [], speciesAdjusted: false, evidence: { clusterId: '0' } });
    expect(Number.isNaN(area.depth)).toBe(true);
    expect(result.coverage).toMatchObject({ speciesStatus: 'resolved', speciesAdjustment: 'unavailable' });
    const html = renderToStaticMarkup(React.createElement(AreaDetails, { area, copy: DASHBOARD_COPY.en }));
    expect(html).toContain('SST: 0 °C'); expect(html).toContain('chlorophyll-a: 0');
    expect(html).toContain('Cluster identifier: 0'); expect(html).toContain('no validated depth');
    expect(html).not.toContain('Invented fish'); expect(html).not.toContain('50 m');
  });
  it.each([
    { eligibleCount: -1, returnedCount: 0, capped: false },
    { eligibleCount: 1, returnedCount: 2, capped: false },
    { eligibleCount: 3, returnedCount: 1, capped: false },
    { eligibleCount: 1, returnedCount: 1, capped: true },
  ])('does not present contradictory counts as coverage: %j', async counts => {
    response({ hotspots: [], metadata: { region: 'reg-5', predictionDates: [], ...counts } });
    expect((await load()).metadata).toBeNull();
  });
  it('explains capped/unknown coverage without claiming fish absence or safe waters', () => {
    const html = renderToStaticMarkup(React.createElement(PredictionCoverage, { metadata: { region: 'reg-5', eligibleCount: 1100, returnedCount: 1000, predictionDates: ['2026-10-15'], capped: true }, displayed: 3, received: 998, species: '' }));
    expect(html).toContain('response is capped'); expect(html).toContain('showing more expands this returned list only');
    expect(html).toContain('Ocean-mask validation'); expect(html).toContain('unavailable');
    expect(html).toContain('does not establish that no fish');
    const unavailable = renderToStaticMarkup(React.createElement(PredictionCoverage, { metadata: null, displayed: 0, received: null, species: '' }));
    expect(unavailable).toContain('Counts remain unavailable'); expect(unavailable).not.toContain('0 usable areas were returned');
  });
  it('distinguishes future/earlier/unknown from validity', () => {
    expect(predictionDayLabel('2026-10-18', '2026-10-17')).toContain('Future-dated');
    expect(predictionDayLabel('2026-10-16', '2026-10-17')).toContain('Earlier');
    expect(predictionDayLabel(null, '2026-10-17')).toContain('unavailable');
  });
});
