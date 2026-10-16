import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadFishingAreaResult } from '@/services/dashboardService';
import { fetchHotspots } from '@/services/supabaseHotspotService';
import { nearbyAreas } from '@/lib/dashboard';
import { PHILIPPINE_REGIONS } from '@/data/philippineRegions';
import FishingAreas, { AreaDetails } from '@/components/dashboard/FishingAreas';
import { DASHBOARD_COPY } from '@/components/dashboard/dashboard-copy';
import { prediction, resolvedResponse } from './fixtures/species-contract';

afterEach(() => vi.unstubAllGlobals());
const signal = new AbortController().signal;
function respond(body: unknown, status = 200) {
  const mock = vi.fn(async () => Response.json(body, { status }));
  vi.stubGlobal('fetch', mock);
  return mock;
}
const load = (species = 'pelagic:1') => loadFishingAreaResult(10.3, 123.8, species, signal, 'reg-7');
const details = async () => renderToStaticMarkup(React.createElement(AreaDetails, { area: (await load()).areas[0], copy: DASHBOARD_COPY.en }));

describe('MAP-03 published response consumption', () => {
  it('retains catalog names separately from species presence and consumes scoped IDs verbatim', async () => {
    respond(resolvedResponse);
    const { areas: [area] } = await load();
    expect(area.modelEvidence).toMatchObject({ scope: 'habitat_model', speciesStatus: 'resolved', hsiStatus: 'unavailable', depthStatus: 'unavailable',
      environmentProvenance: 'legacy_unverified', profile: { species_name: 'Sample sardine', local_name: null, representative_species: 'Sample scientific name' } });
    expect(area.species).toEqual([]);
    expect(area.speciesAdjusted).toBe(false);
    const html = await details();
    expect(html).toContain('Habitat-model score'); expect(html).toContain('60%');
    expect(html).toContain('Species HSI'); expect(html).toContain('habitat scores are unchanged');
    expect(html).toContain('Verified species presence'); expect(html).toContain('no species evidence supplied');
    expect(html).toContain('<dt>Local name</dt><dd>Unavailable</dd>');
    expect(html).toContain('<dt>Scientific representative</dt><dd>Sample scientific name</dd>');
  });

  it.each(['species_unsupported', 'species_catalog_unavailable'] as const)('keeps %s distinct and never accepts accompanying predictions', async code => {
    respond({ code, error: 'untrusted provider detail', hotspots: [prediction] }, code === 'species_unsupported' ? 422 : 503);
    await expect(load()).rejects.toMatchObject({ code });
    await expect(fetchHotspots(10.3, 123.8, ['unknown'])).rejects.toMatchObject({ code });
  });

  it.each(['unsupported', 'unavailable'])('rejects an explicit %s status even in an HTTP-success payload', async species_status => {
    respond({ ...resolvedResponse, species_status });
    await expect(load()).rejects.toHaveProperty('code', species_status === 'unsupported' ? 'species_unsupported' : 'species_catalog_unavailable');
  });

  it('preserves raw alias spelling without local matching, prepending or truncation', async () => {
    const requested = '  Sample / Exact (Alias), With punctuation; ' + 'x'.repeat(100);
    const request = vi.fn(async (_url: string) => Response.json(resolvedResponse));
    vi.stubGlobal('fetch', request);
    const [area] = await fetchHotspots(10.3, 123.8, [requested]);
    expect(new URL(request.mock.calls[0][0], 'https://offline.invalid').searchParams.get('species')).toBe(requested);
    expect(area.species).toEqual([]);
  });

  it.each([null, undefined, '', '0', false])('shows absent or malformed environment value %s as unavailable', async value => {
    respond({ ...resolvedResponse, hotspots: [{ ...prediction, sst: value, chl_a: value, depth: 0 }] });
    const { areas: [area] } = await load();
    expect(area.sst).toBeUndefined(); expect(area.chlorophyll).toBeUndefined();
    expect(Number.isNaN(area.depth)).toBe(true);
    const html = await details();
    expect(html).toContain('<dt>Depth</dt><dd>Unavailable</dd>');
    expect(html).toContain('<dt>Stored SST (unverified)</dt><dd>Unavailable</dd>');
    expect(html).not.toContain('0 °C'); expect(html).not.toContain('NaN');
  });

  it('preserves measured/stored zero values without promoting legacy data to measurements', async () => {
    respond({ ...resolvedResponse, hotspots: [{ ...prediction, catch_probability: 0 }] });
    const { areas: [area] } = await load();
    expect(area).toMatchObject({ sst: 0, chlorophyll: 0, catchProbability: 0 });
    const html = await details();
    expect(html).toContain('0%'); expect(html).toContain('0 °C');
    expect(html).toContain('<dt>Stored chlorophyll (unverified; units unavailable)</dt><dd>0</dd>');
    expect(html).toContain('Stored values are not verified measured conditions');
  });

  it('handles empty resolution results and legacy metadata without inventing an adjustment', async () => {
    respond({ hotspots: [], species_status: 'resolved', prediction_scope: 'habitat_model', species_hsi_status: 'unavailable' });
    expect((await load()).areas).toEqual([]);
    respond({ hotspots: [prediction], species_hsi_applied: true });
    expect((await load()).areas[0]).toMatchObject({ speciesAdjusted: false, modelEvidence: { speciesStatus: 'unverified', profile: null } });
  });

  it('honors unavailable HSI metadata over obsolete adjustment flags and rejects malformed profiles', async () => {
    respond({ ...resolvedResponse, species_hsi_applied: true, species_profile: { id: 1, category: 'unknown', representative_species: 'Do not relabel' } });
    const { areas: [area] } = await load();
    expect(area).toMatchObject({ speciesAdjusted: false, modelEvidence: { hsiStatus: 'unavailable', profile: null } });
    expect(area.species).toEqual([]);
    expect(await details()).not.toContain('Do not relabel');
  });

  it('preserves pelagic, demersal and both filtering', async () => {
    respond({ hotspots: ['pelagic', 'demersal', 'both'].map((model_type, i) => ({ ...prediction, grid_id: i, target_lat: 10.4 + i / 100, model_type })) });
    const { areas } = await load('');
    const region = PHILIPPINE_REGIONS.find(region => region.id === 'reg-7')!;
    expect(nearbyAreas(areas, region, 10.3, 123.8, 'both')).toHaveLength(3);
    expect(nearbyAreas(areas, region, 10.3, 123.8, 'pelagic').map(area => area.type)).toEqual(['pelagic', 'both']);
    expect(nearbyAreas(areas, region, 10.3, 123.8, 'demersal').map(area => area.type)).toEqual(['demersal', 'both']);
  });

  it.each(['species_unsupported', 'species_catalog_unavailable'] as const)('renders recoverable English fallback for %s', speciesFailure => {
    const html = renderToStaticMarkup(React.createElement(FishingAreas, { areas: [], loading: false, failed: true, retry() {},
      limit: 3, showMore() {}, select() {}, filtered: true, clearFilters() {}, hold: false, speciesUnavailable: false,
      speciesFailure, copy: DASHBOARD_COPY.tl }));
    expect(html).toContain('role="status" lang="en"');
    expect(html).toContain(speciesFailure === 'species_unsupported' ? 'unsupported or ambiguous' : 'catalog is unavailable');
    expect(html).not.toContain(DASHBOARD_COPY.tl.noMatches);
    expect(html).not.toContain('untrusted provider detail');
  });
});
