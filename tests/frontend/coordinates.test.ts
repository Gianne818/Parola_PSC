import { afterEach, describe, expect, it, vi } from 'vitest';
import { isClientCoordinate, isClientTargetCoordinate, parseCoordinateText } from '@/lib/frontend/coordinates';
import { fetchHotspots, fetchHotspotsFromSupabase } from '@/services/supabaseHotspotService';
import { reverseGeocode, searchLocations } from '@/services/geocodingService';

afterEach(() => vi.unstubAllGlobals());

describe('frontend coordinate boundaries', () => {
  it('rejects coercion, nonfinite and invalid ranges; preserves shore ports', () => {
    for (const [lat, lng] of [[null, 123], ['10', 123], [NaN, 123], [10, Infinity], [123, 10], [91, 181]]) {
      expect(isClientCoordinate(lat, lng)).toBe(false);
    }
    expect(isClientCoordinate(10.31, 123.89)).toBe(true);
    expect(isClientTargetCoordinate(0, 0)).toBe(false);
    expect(isClientTargetCoordinate(8, 120)).toBe(true);
    for (const value of ['', '10junk', 'Infinity', '0x10', null]) expect(parseCoordinateText(value)).toBeNull();
    expect(parseCoordinateText(' 10.31 ')).toBe(10.31);
  });
  it('uses only the existing API, including the legacy-named entry point, with no fallback', async () => {
    const fetchMock = vi.fn(async (_url: string) => Response.json({ hotspots: [] }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchHotspots(10.31, 123.89)).toEqual([]);
    expect(await fetchHotspotsFromSupabase(10.31, 123.89)).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.every(call => String(call[0]).startsWith('/api/advisories/nearest?'))).toBe(true);
    expect(await fetchHotspots(Infinity, 123)).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('drops malformed geocoder coordinates and refuses invalid reverse lookups', async () => {
    const fetchMock = vi.fn(async () => Response.json([
      { lat: '10.31junk', lon: '123.89', display_name: 'Broken' },
      { lat: '', lon: '123.89', display_name: 'Empty' },
      { lat: '123.89', lon: '10.31', display_name: 'Swapped' },
      { lat: '10.31', lon: '123.89', display_name: 'Cebu' },
    ]));
    vi.stubGlobal('fetch', fetchMock);
    expect(await searchLocations('coordinate-fixture')).toEqual([expect.objectContaining({ name: 'Cebu', lat: 10.31, lng: 123.89 })]);
    await expect(reverseGeocode(NaN, 123)).rejects.toThrow('invalid');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('does not enrich API targets with selected fish, depth or invented weather', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ hotspots: [{
      grid_id: 3, target_lat: 10.4, target_lon: 123.9, model_type: 'pelagic', species_hsi_applied: false,
    }] })));
    const [area] = await fetchHotspots(10.31, 123.89, ['Unknown fish']);
    expect(area.species).toEqual([]);
    expect(Number.isNaN(area.depth)).toBe(true);
    expect(area.waveHeight).toBeUndefined();
    expect(area.windSpeed).toBeUndefined();
    expect(area.stormSignal).toBeUndefined();
    expect(area.lastUpdated).toBe('');
  });
});
