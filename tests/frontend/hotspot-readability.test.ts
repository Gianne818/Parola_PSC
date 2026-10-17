import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { hotspotAppearance, hotspotHabitat } from '@/lib/frontend/hotspot-presentation';
import SelectedEstimate from '@/components/dashboard/SelectedEstimate';
import HotspotLegend from '@/components/dashboard/HotspotLegend';
import { DASHBOARD_COPY } from '@/components/dashboard/dashboard-copy';
import type { FishingArea } from '@/lib/dashboard';

const area: FishingArea = { id: '1', name: 'Zone 1', type: 'pelagic', habitatKnown: true, catchProbability: .75,
  source: 'model', lat: 14.1, lng: 123.1, depth: NaN, species: [], lastUpdated: '', predictionDate: null,
  speciesAdjusted: false, distanceKm: 2, compassBearing: 'NE' };

describe('Hotspot readability without changing model semantics', () => {
  it.each(['pelagic', 'demersal'])('%s strictly increases saturation for increasing normalized scores', type => {
    const appearances = [.25, .5, .7, .8, .9, 1].map(catchProbability => hotspotAppearance({ type, catchProbability }, true));
    const saturations = appearances.map(a => Number(a.color.match(/ (\d+(?:\.\d+)?)%/)![1]));
    expect(saturations.every((s, i) => i === 0 || s > saturations[i - 1])).toBe(true);
    expect(hotspotAppearance({ type, catchProbability: .75 }, true)).toEqual(hotspotAppearance({ type, catchProbability: 75 }, true));
  });
  it('uses different hues for pelagic and demersal and neutral mixed/unknown habitats', () => {
    expect(hotspotAppearance(area, true).color).not.toBe(hotspotAppearance({ ...area, type: 'demersal' }, true).color);
    for (const value of [{ type: 'both' }, { type: 'other' }, { type: 'pelagic', habitatKnown: false }, {}]) {
      expect(hotspotAppearance({ ...value, catchProbability: .9 }, true).color).toBe('#e2e8ec');
    }
    expect(hotspotHabitat({ type: 'both', habitatKnown: true }).symbol).toBe('M');
    expect(hotspotHabitat({ type: 'both', habitatKnown: false }).symbol).toBe('?');
  });
  it.each([undefined, NaN, Infinity, -1, 101, null, '0.8'])('does not give invalid score %s a medium fallback', catchProbability => {
    const appearance = hotspotAppearance({ ...area, catchProbability: catchProbability as number }, true);
    expect(appearance.percent).toBeNull();
    expect(appearance.unavailable).toBe(true);
  });
  it('keeps measured zero available without changing its value', () => {
    expect(hotspotAppearance({ ...area, catchProbability: 0 }, true).percent).toBe(0);
  });
  it('uses a strong lightness range with sky-blue/blue and yellow-green/green endpoints', () => {
    const hsl = (type: string, catchProbability: number) => hotspotAppearance({ type, catchProbability }, true).color.match(/[\d.]+/g)!.map(Number);
    for (const type of ['pelagic', 'demersal']) {
      const low = hsl(type, 0), high = hsl(type, 100);
      expect(high[1] - low[1]).toBeGreaterThan(50);
      expect(low[2] - high[2]).toBeGreaterThan(30);
    }
    expect(hsl('pelagic', 0)[0]).toBe(208);
    expect(hsl('pelagic', 100)[0]).toBe(208);
    expect(hsl('demersal', 0)[0]).toBe(82);
    expect(hsl('demersal', 100)[0]).toBe(142);
  });
  it('retains fixed blue/green habitat outlines without leaking a withheld score', () => {
    const reference = (type: string, catchProbability: number) => hotspotAppearance({ type, catchProbability }, false);
    expect(reference('pelagic', .25).outline).not.toBe(reference('demersal', .25).outline);
    for (const type of ['pelagic', 'demersal']) {
      expect(reference(type, .25)).toEqual(reference(type, .95));
      expect(reference(type, .95).percent).toBeNull();
      expect(reference(type, .95).color).toBe('#e2e8ec');
      expect(reference(type, .95).outline).toBe(hotspotAppearance({ type }, true).outline);
    }
    expect(reference('both', .95).outline).toBe(reference('unknown', .95).outline);
  });
  it.each([false, true])('withholds values and score color during safety suppression (unsafe=%s)', isUnsafe => {
    const appearance = hotspotAppearance({ ...area, isUnsafe }, isUnsafe);
    expect(appearance.percent).toBeNull();
    expect(appearance.color).toBe('#e2e8ec');
    expect(appearance.status).toContain('withheld');
    const html = renderToStaticMarkup(React.createElement(SelectedEstimate, { area: { ...area, isUnsafe }, guidanceAvailable: isUnsafe, copy: DASHBOARD_COPY.en }));
    expect(html).toContain('Withheld');
    expect(html).not.toContain('75%');
  });
  it('shows an unavailable status for samples and absent scores, and an explicitly unverified estimate otherwise', () => {
    for (const record of [{ ...area, source: 'sample' as const }, { ...area, catchProbability: undefined }]) {
      const html = renderToStaticMarkup(React.createElement(SelectedEstimate, { area: record, guidanceAvailable: true, copy: DASHBOARD_COPY.en }));
      expect(html).toContain('Unavailable');
      expect(html).not.toContain('75%');
    }
    const html = renderToStaticMarkup(React.createElement(SelectedEstimate, { area, guidanceAvailable: true, copy: DASHBOARD_COPY.en }));
    expect(html).toContain('75%');
    expect(html).toContain('not a validated catch probability');
  });
  it('explains the legend letters, neutral habitats, unavailable and selected treatments', () => {
    const html = renderToStaticMarkup(React.createElement(HotspotLegend, { guidanceAvailable: true }));
    for (const label of ['Pelagic', 'Demersal', 'Mixed habitat', 'Unknown habitat', 'Hollow', 'Black double ring', 'More saturated']) expect(html).toContain(label);
  });
});
