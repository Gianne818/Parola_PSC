import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadFishingAreas, loadFishingAreaResult, loadDashboardWeather } from '@/services/dashboardService';
vi.mock('@/utils/auth-fetch', () => ({ authHeaders: async () => ({}) }));
afterEach(() => vi.unstubAllGlobals());
const signal = new AbortController().signal;
describe('dashboard area loading', () => {
  it('rejects invalid request coordinates before any request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(loadFishingAreas(NaN, 123, '', signal)).rejects.toThrow('coordinates');
    await expect(loadDashboardWeather(10, Infinity, 'reg-7', signal)).rejects.toThrow('coordinates');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('omits malformed, swapped, Null Island and out-of-extent targets without coercion', async () => {
    const row = { grid_id: 1, model_type: 'pelagic', target_lat: 10.4, target_lon: 123.9 };
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ hotspots: [row,
      { ...row, target_lat: '10.4' }, { ...row, target_lat: null },
      { ...row, target_lat: 123.9, target_lon: 10.4 }, { ...row, target_lat: 0, target_lon: 0 },
      { ...row, target_lat: 90 },
    ] })));
    expect(await loadFishingAreas(10.3, 123.8, '', signal)).toHaveLength(1);
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ hotspots: [{ ...row, target_lat: null }] })));
    await expect(loadFishingAreas(10.3, 123.8, '', signal)).rejects.toThrow('coordinates');
  });
  it('rejects malformed forecast locations before they reach the area details', async () => {
    const reading = { value: 1, source: 'forecast', observedAt: '2026-10-14T04:00:00Z' };
    const weather = { wind: reading, waves: reading, temperature: reading, stormSignal: reading,
      hold: { available: false, active: false, checkedAt: null, reason: null }, receivedAt: '2026-10-14T04:00:00Z' };
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ ...weather, location: { requested: { lat: 'bad', lng: 124 }, weatherGrid: null, marineGrid: null } })));
    await expect(loadDashboardWeather(10.3, 124, 'reg-7', signal)).rejects.toThrow('Weather response');
    vi.stubGlobal('fetch', vi.fn(async () => Response.json(weather)));
    await expect(loadDashboardWeather(10.3, 124, 'reg-7', signal)).resolves.toEqual(weather);
  });
  it('requests regional areas and preserves cap/freshness metadata', async () => {
    const metadata = { region: 'reg-7', eligibleCount: 1200, returnedCount: 1000, predictionDates: ['2026-09-25'], capped: true };
    const fetchMock = vi.fn(async (_url: string) => Response.json({ hotspots: [], metadata }));
    vi.stubGlobal('fetch', fetchMock);
    const result = await loadFishingAreaResult(10.3, 123.8, '', signal, 'reg-7');
    expect(fetchMock.mock.calls[0][0]).toContain('region=reg-7');
    expect(result.metadata).toEqual(metadata);
  });
  it('does not use metadata from a different advisory region', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ hotspots: [], metadata: { region: 'reg-5', eligibleCount: 28, returnedCount: 28, predictionDates: ['2026-09-25'], capped: false } })));
    expect((await loadFishingAreaResult(10.3, 123.8, '', signal, 'reg-7')).metadata).toBeNull();
  });
  it('distinguishes empty predictions from failed loads', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ hotspots: [] })));
    expect(await loadFishingAreas(10.3, 123.8, '', signal)).toEqual([]);
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ hotspots: [], error: 'unavailable' }, { status: 503 })));
    await expect(loadFishingAreas(10.3, 123.8, '', signal)).rejects.toThrow();
  });
  it('shows the latest area once when multiple prediction dates share a location', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ hotspots: [
      { grid_id: 24, target_lat: 10.4, target_lon: 123.9, model_type: 'pelagic', prediction_date: '2026-10-14' },
      { grid_id: 23, target_lat: 10.4, target_lon: 123.9, model_type: 'pelagic', prediction_date: '2026-10-13' },
    ] })));
    const areas = await loadFishingAreas(10.3, 123.8, '', signal);
    expect(areas).toHaveLength(1); expect(areas[0].predictionDate).toBe('2026-10-14');
  });
  it('preserves prediction dates without invented fish, depth or probability', async () => {
    const fetchMock = vi.fn(async (_url: string) => Response.json({ hotspots: [{ grid_id: 23, target_lat: 10.4, target_lon: 123.9, model_type: 'pelagic', prediction_date: '2026-10-13' }] }));
    vi.stubGlobal('fetch', fetchMock);
    const [area] = await loadFishingAreas(10.3, 123.8, 'Tamban', signal);
    expect(fetchMock.mock.calls[0][0]).toContain('species=Tamban');
    expect(area).toMatchObject({ predictionDate: '2026-10-13', species: [], source: 'model', speciesAdjusted: false });
    expect(area.catchProbability).toBeUndefined();
  });
  it('recognizes only explicit HSI adjustment evidence from existing response variants', async () => {
    for (const [applied, expected] of [[true, true], ['Tamban', true], ['false', false], ['Other fish', false], [false, false]] as const) {
      vi.stubGlobal('fetch', vi.fn(async () => Response.json({ hotspots: [{ grid_id: 23, target_lat: 10.4, target_lon: 123.9, model_type: 'pelagic' }], species_hsi_applied: applied })));
      const [area] = await loadFishingAreas(10.3, 123.8, 'Tamban', signal);
      expect(area.speciesAdjusted).toBe(expected);
      expect(area.species).toEqual([]);
    }
  });
  it('maps ocean current telemetry when valid numbers are provided', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({
      hotspots: [
        {
          grid_id: 42, target_lat: 10.4, target_lon: 123.9, model_type: 'pelagic',
          current_speed: 0.45, current_heading: 135.2, current_u: 0.32, current_v: -0.31,
        },
        {
          grid_id: 43, target_lat: 10.5, target_lon: 123.9, model_type: 'demersal',
          current_speed: null, current_heading: 'invalid', current_u: NaN, current_v: Infinity,
        },
      ],
    })));
    const { areas } = await loadFishingAreaResult(10.3, 123.8, '', signal);
    const valid = areas.find(a => a.id === '42');
    expect(valid?.currentSpeed).toBe(0.45);
    expect(valid?.currentHeading).toBe(135.2);
    expect(valid?.currentU).toBe(0.32);
    expect(valid?.currentV).toBe(-0.31);

    const invalid = areas.find(a => a.id === '43');
    expect(invalid?.currentSpeed).toBeUndefined();
    expect(invalid?.currentHeading).toBeUndefined();
    expect(invalid?.currentU).toBeUndefined();
    expect(invalid?.currentV).toBeUndefined();
  });
});
