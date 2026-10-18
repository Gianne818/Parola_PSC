import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Wind } from 'lucide-react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ForecastReading from '@/components/dashboard/ForecastReading';
import Advisory, { WeatherDetails, displayTime } from '@/components/dashboard/Advisory';
import WeatherCoverage from '@/components/dashboard/WeatherCoverage';
import { AreaDetails } from '@/components/dashboard/FishingAreas';
import { DASHBOARD_COPY } from '@/components/dashboard/dashboard-copy';
import { GUIDANCE_COPY } from '@/components/dashboard/guidance-copy';
import { loadDashboardWeather } from '@/services/dashboardService';
import type { DashboardWeather, FishingArea, WeatherReading } from '@/lib/dashboard';

const now = new Date('2026-10-15T04:00:00Z');
const reading: WeatherReading = { value: 12, source: 'Open-Meteo forecast', observedAt: '2026-10-15T03:00:00Z', validUntil: '2026-10-15T05:00:00Z' };
function renderReading(value: WeatherReading) {
  return renderToStaticMarkup(React.createElement(ForecastReading, { label: 'Wind', reading: value, unit: 'km/h', icon: Wind, language: 'en', now }));
}
afterEach(() => vi.unstubAllGlobals());
describe('weather presentation with existing metadata', () => {
  it('renders missing, zero, retained, expired and undated readings distinctly', () => {
    expect(renderReading({ ...reading, value: null })).toContain('Unavailable');
    expect(renderReading({ ...reading, value: 0 })).toContain('>0<');
    expect(renderReading({ ...reading, available: false })).toContain('Last available update');
    expect(renderReading({ ...reading, validUntil: '2026-10-14T04:00:00Z' })).toContain('Outdated');
    expect(renderReading({ ...reading, observedAt: null })).toContain('Time unavailable');
    expect(renderReading(reading)).toContain('Open-Meteo forecast');
    expect(renderReading(reading)).not.toContain('NOAA');
    expect(renderReading(reading)).not.toContain('>Current<');
  });
  it('shows actual grids and unknown coverage instead of inferring safety from absent holds', () => {
    const data: DashboardWeather = { wind: reading, waves: { ...reading, value: null }, temperature: reading, stormSignal: { ...reading, value: null },
      hold: { active: false, available: false, checkedAt: null, reason: null }, receivedAt: now.toISOString(),
      location: { requested: { lat: 14.01, lng: 123.01 }, weatherGrid: { lat: 14.02, lng: 123 }, marineGrid: null } };
    const html = renderToStaticMarkup(React.createElement(WeatherCoverage, { data, regionName: 'Requested Bicol region', note: GUIDANCE_COPY.en.gridNote }));
    expect(html).toContain('14.0100, 123.0100'); expect(html).toContain('14.0200, 123.0000');
    expect(html).toContain(GUIDANCE_COPY.en.gridNote);
    expect(html).toContain('coverage completeness'); expect(html).toContain('missing hold record does not establish safety clearance');
    const details = renderToStaticMarkup(React.createElement(WeatherDetails, { data, state: 'incomplete', copy: DASHBOARD_COPY.en, language: 'en' }));
    expect(details).toContain('Current regional check unavailable');
    expect(details).toContain('Open-Meteo forecast');
    expect(displayTime('bad', 'en')).toBeNull();
  });
  it('surfaces active hold reasons, storm warnings and freshness badges in the dashboard advisory bar', () => {
    const data: DashboardWeather = {
      wind: { ...reading, available: false },
      waves: reading,
      temperature: reading,
      stormSignal: { ...reading, value: 2 },
      hold: { active: true, available: true, checkedAt: now.toISOString(), reason: 'Gale warning in effect for northern coastal waters.' },
      receivedAt: now.toISOString(),
    };
    const html = renderToStaticMarkup(React.createElement(Advisory, {
      data, state: 'hold', loading: false, failed: true, refresh() {}, openDetails() {}, copy: DASHBOARD_COPY.en, language: 'en',
    }));
    expect(html).toContain(DASHBOARD_COPY.en.hold);
    expect(html).toContain(DASHBOARD_COPY.en.lastAvailable);
    expect(html).toContain('Gale warning in effect for northern coastal waters.');
    expect(html).toContain(DASHBOARD_COPY.en.refreshFailed);
  });
  it('places the model percentage above area weather and preserves visibility without repeating list descriptions', () => {
    const area: FishingArea = {
      id: 'zone-1',
      name: 'Zone 1',
      lat: 14.05,
      lng: 123.05,
      type: 'pelagic',
      catchProbability: 0.75,
      sst: 28.4,
      chlA: 0.3,
      depth: NaN,
      species: [],
      lastUpdated: '2026-10-15T01:00:00Z',
      predictionDate: '2026-10-15',
      source: 'model',
      speciesAdjusted: false,
      habitatKnown: true,
      distanceKm: 6.2,
      compassBearing: 'NE',
    };
    const html = renderToStaticMarkup(React.createElement(AreaDetails, {
      area,
      copy: DASHBOARD_COPY.en,
      weather: React.createElement('section', { id: 'mock-area-weather' }, 'Area weather block'),
    }));
    expect(html).toContain('75%');
    expect(html).toContain(DASHBOARD_COPY.en.estimateNote);
    expect(html).not.toContain(DASHBOARD_COPY.en.areasDescription);
    expect(html.indexOf('75%')).toBeLessThan(html.indexOf('Area weather block'));
  });
  it('rejects a returned request location belonging to a different port', async () => {
    const data = { wind: reading, waves: reading, temperature: reading, stormSignal: reading,
      hold: { active: false, available: true, checkedAt: now.toISOString(), reason: null }, receivedAt: now.toISOString(),
      location: { requested: { lat: 10.31, lng: 123.89 }, weatherGrid: null, marineGrid: null } };
    vi.stubGlobal('fetch', vi.fn(async () => Response.json(data)));
    await expect(loadDashboardWeather(14.01, 123.01, 'reg-5', new AbortController().signal)).rejects.toThrow('different requested location');
  });
});
