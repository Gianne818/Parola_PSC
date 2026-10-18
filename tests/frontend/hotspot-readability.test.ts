import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { hotspotPresentation } from '@/lib/frontend/hotspot-presentation';
import { AreaDetails } from '@/components/dashboard/FishingAreas';
import { DASHBOARD_COPY } from '@/components/dashboard/dashboard-copy';
import { predictionPercent, type FishingArea } from '@/lib/dashboard';

const area: FishingArea = { id: 'test', name: 'Synthetic area', type: 'pelagic', lat: 14.05, lng: 123.05,
  depth: NaN, species: [], lastUpdated: '', source: 'model', habitatKnown: true, predictionDate: null,
  speciesAdjusted: false, distanceKm: 4, compassBearing: 'NE', catchProbability: .75 };

describe('dashboard habitat and estimate presentation', () => {
  it.each(['pelagic', 'demersal'] as const)('%s saturation increases across the existing normalized score range', type => {
    const levels = [0, .25, .5, .7, .9, 100].map(catchProbability => hotspotPresentation({ ...area, type, catchProbability }));
    const saturations = levels.map(level => Number(level.fill.match(/ ([\d.]+)%/)?.[1]));
    expect(saturations.every((value, index) => index === 0 || value > saturations[index - 1])).toBe(true);
    expect(new Set(levels.map(level => level.fill)).size).toBe(levels.length);
  });
  it.each([0, .25, .75, 1, 25, 75, 100])('reuses existing normalization for %s', value => {
    const presentation = hotspotPresentation({ ...area, catchProbability: value });
    expect(presentation.percent).toBe(predictionPercent(value));
  });
  it.each([undefined, NaN, Infinity, -1, 101])('keeps invalid/missing %s estimates hollow without a middle fallback', value => {
    const presentation = hotspotPresentation({ ...area, catchProbability: value });
    expect(presentation).toMatchObject({ percent: null, unavailable: true, fill: '#ffffff', letter: 'P' });
    const html = renderToStaticMarkup(React.createElement(AreaDetails, { area: { ...area, catchProbability: value }, copy: DASHBOARD_COPY.en }));
    expect(html).toContain('Unverified model estimate');
    expect(html).toContain('Unavailable');
    expect(html).not.toContain('%');
  });
  it('keeps sample values unavailable and known habitats distinct', () => {
    expect(hotspotPresentation({ ...area, source: 'sample' }).unavailable).toBe(true);
    expect(hotspotPresentation(area).letter).toBe('P');
    expect(hotspotPresentation({ ...area, type: 'demersal' }).letter).toBe('D');
    expect(hotspotPresentation({ ...area, type: 'demersal' }).fill).not.toBe(hotspotPresentation(area).fill);
  });
  it('gives mixed and unknown records distinct, score-independent neutral fills', () => {
    const mixed = hotspotPresentation({ ...area, type: 'both' });
    const unknown = hotspotPresentation({ ...area, habitatKnown: false });
    expect(mixed).toMatchObject({ letter: 'M', habitat: 'mixed' });
    expect(unknown).toMatchObject({ letter: '?', habitat: 'unknown' });
    expect(mixed.fill).not.toBe(unknown.fill);
    expect(hotspotPresentation({ ...area, type: 'both', catchProbability: .95 }).fill).toBe(mixed.fill);
  });
  it('does not infer score withholding from a safety flag', () => {
    expect(hotspotPresentation({ ...area, isUnsafe: true }).percent).toBe(75);
  });
});
