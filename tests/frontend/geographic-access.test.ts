import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readGeographicCoverage } from '@/lib/frontend/geographic-access';
import GeographicAccessStatus from '@/components/predictions/GeographicAccessStatus';
import { loadFishingAreaResult } from '@/services/dashboardService';

vi.mock('@/utils/auth-fetch', () => ({ authHeaders: async () => ({ Authorization: 'Bearer isolated-test-token' }) }));
afterEach(() => vi.unstubAllGlobals());
const geography = (status = 'filtered', denied_count = 2, unavailable_count = 0) => ({ status, denied_count, unavailable_count });
const signal = new AbortController().signal;

describe('geographic selection display boundary', () => {
  it.each([
    ['not_evaluated', 0, 0], ['filtered', 0, 0], ['filtered', 10, 0], ['partial', 3, 4], ['unavailable', 0, 0], ['unavailable', 2, 5],
  ])('preserves aggregate %s without inventing point permissions', (status, denied, unavailable) => {
    expect(readGeographicCoverage(geography(String(status), Number(denied), Number(unavailable))))
      .toEqual({ status, deniedCount: denied, unavailableCount: unavailable });
  });
  it.each([
    null, {}, [], { status: 'allowed' }, { status: 'denied' }, geography('unknown'), geography('filtered', -1), geography('filtered', 1.2),
    geography('filtered', 1, 3), geography('not_evaluated', 1), geography('not_evaluated', 0, 1), geography('partial', 0, 0),
    { ...geography(), denied_count: '2' }, { ...geography(), unavailable_count: null }, { ...geography(), status: ['filtered'] },
  ])('withholds malformed/point-shaped coverage: %j', value => expect(readGeographicCoverage(value)).toBeNull());
  it.each([
    ['not_evaluated', 0, 0, 'not evaluated'], ['filtered', 3, 0, 'geographically filtered'], ['partial', 1, 2, 'Partial'], ['unavailable', 0, 0, 'unavailable'],
  ])('explains %s separately from individual or legal clearance', (status, denied, unavailable, label) => {
    const html = renderToStaticMarkup(React.createElement(GeographicAccessStatus, {
      coverage: readGeographicCoverage(geography(String(status), Number(denied), Number(unavailable))),
    }));
    expect(html).toContain(label); expect(html).toContain('not navigation clearance or legal fishing permission');
    expect(html).toContain('Missing coverage never means unrestricted access');
    expect(html).not.toContain('Access granted');
    if (status !== 'not_evaluated') expect(html).toContain(`${denied} candidates denied`);
  });
  it('does not present retained filtered coverage as current after failure or during refresh', () => {
    for (const props of [{ failed: true }, { loading: true }]) {
      const html = renderToStaticMarkup(React.createElement(GeographicAccessStatus, { coverage: readGeographicCoverage(geography()), ...props }));
      expect(html).not.toContain('Selection geographically filtered');
      expect(html).not.toContain('2 candidates denied');
      expect(html).toContain(props.failed ? 'latest request failed' : 'Checking geographic coverage');
    }
  });
  it('keeps a missing response unknown, not unrestricted', () => {
    const html = renderToStaticMarkup(React.createElement(GeographicAccessStatus, {}));
    expect(html).toContain('Geographic coverage unavailable');
    expect(html).not.toContain('0 candidates denied');
  });
  it('adds scoped metadata without changing rows, scores or current vectors', async () => {
    const row = { grid_id: 1, target_lat: 14.1, target_lon: 123.1, model_type: 'pelagic', prediction_date: '2026-10-22',
      catch_probability: .7, current_u: .3, current_v: -.2, current_speed: .36, current_heading: 120 };
    const fetcher = vi.fn(async () => Response.json({ hotspots: [row], selection: { geography: geography('partial', 2, 1) } }));
    vi.stubGlobal('fetch', fetcher);
    const result = await loadFishingAreaResult(14, 123, '', signal, 'reg-5');
    expect(result.coverage?.geography).toEqual({ status: 'partial', deniedCount: 2, unavailableCount: 1 });
    expect(result.areas[0]).toMatchObject({ catchProbability: .7, currentU: .3, currentV: -.2, currentSpeed: .36, currentHeading: 120 });
    expect(fetcher.mock.calls).toHaveLength(1);
    expect(vi.mocked(fetch).mock.calls[0][1]).toMatchObject({ headers: { Authorization: 'Bearer isolated-test-token' }, credentials: 'same-origin', cache: 'no-store' });
  });
  it('keeps genuine empty results and all-denied selection counts separate', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ hotspots: [], selection: { geography: geography('filtered', 8, 0) } })));
    const result = await loadFishingAreaResult(14, 123, '', signal, 'reg-5');
    expect(result.areas).toEqual([]); expect(result.coverage?.geography?.deniedCount).toBe(8);
  });
  it.each([[401, 'authentication'], [403, 'denied'], [503, 'geography_unavailable']])('preserves HTTP %i failure without an unrestricted fallback', async (status, kind) => {
    const fetcher = vi.fn(async () => Response.json({ error: 'Private diagnostic', code: 'geographic_data_unavailable',
      selection: { geography: geography('unavailable', 1, 2) } }, { status: Number(status) }));
    vi.stubGlobal('fetch', fetcher);
    await expect(loadFishingAreaResult(14, 123, '', signal, 'reg-5')).rejects.toMatchObject({ kind, geography: { status: 'unavailable', deniedCount: 1, unavailableCount: 2 } });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
