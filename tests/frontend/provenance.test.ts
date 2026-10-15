import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { predictionDay, recordTimestamp } from '@/lib/frontend/timestamps';
import { loadFishingAreas } from '@/services/dashboardService';
import { AreaDetails } from '@/components/dashboard/FishingAreas';
import { DASHBOARD_COPY } from '@/components/dashboard/dashboard-copy';

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
describe('prediction timestamps and provenance', () => {
  it('does not parse ambiguous, relative or impossible dates into current dates', () => {
    for (const value of ['', 'Today, 04:00', '2026-02-31', '2026-10-01T12:00:00', null]) expect(predictionDay(value)).toBeNull();
    expect(recordTimestamp('2026-02-31T04:00:00Z')).toBeNull();
    expect(recordTimestamp('2026-10-01')).toBeNull();
    expect(predictionDay('2026-10-13T17:00:00Z')).toBe('2026-10-14');
    expect(predictionDay('2026-10-13')).toBe('2026-10-13');
  });
  it('keeps old prediction and record dates when fetched today and labels missing validity', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-15T06:00:00Z'));
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ hotspots: [{ grid_id: 23, target_lat: 10.4, target_lon: 123.9,
      model_type: 'pelagic', prediction_date: '2026-09-25', created_at: '2026-09-25T01:00:00Z' }] })));
    const [area] = await loadFishingAreas(10.3, 123.8, '', new AbortController().signal);
    expect(area.predictionDate).toBe('2026-09-25');
    expect(area.lastUpdated).toBe('2026-09-25T01:00:00Z');
    expect(area.retrievedAt).toBe('2026-10-15T06:00:00.000Z');
    const html = renderToStaticMarkup(React.createElement(AreaDetails, { area, copy: DASHBOARD_COPY.en }));
    expect(html).toContain('2026-09-25');
    expect(html).toContain('Prediction provenance and validity are unverified.');
    expect(html).toContain('Record created');
    expect(html).toContain('Retrieved by this portal');
    expect(html).not.toContain('Live');
  });
  it('retains unknown dates and distinguishes samples without fabricating observation times', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ hotspots: [{ grid_id: 1, target_lat: 10.4, target_lon: 123.9, model_type: 'pelagic', prediction_date: 'not-a-date' }] })));
    const [area] = await loadFishingAreas(10.3, 123.8, '', new AbortController().signal);
    expect(area.predictionDate).toBeNull(); expect(area.lastUpdated).toBe('');
    const html = renderToStaticMarkup(React.createElement(AreaDetails, { area: { ...area, source: 'sample' }, copy: DASHBOARD_COPY.en }));
    expect(html).toContain('Demo data; not operational guidance.');
    expect(html).toContain('Prediction date unavailable');
  });
});
