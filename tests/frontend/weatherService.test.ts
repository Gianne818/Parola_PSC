import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchLiveWeather, UNAVAILABLE_WEATHER } from '@/services/weatherService';

afterEach(() => vi.unstubAllGlobals());
describe('legacy client telemetry without simulation', () => {
  it('keeps missing/failed readings unavailable rather than generating coordinate weather', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({}, { status: 503 })));
    expect(await fetchLiveWeather(10.31, 123.89)).toEqual(UNAVAILABLE_WEATHER);
    expect(await fetchLiveWeather(14.01, 123.01)).toEqual(UNAVAILABLE_WEATHER);
  });
  it('preserves measured zeros and partial provider data without invented tide/signal/direction', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => Response.json(url.includes('marine-api') ? {} : {
      current: { temperature_2m: 0, wind_speed_10m: 0 },
    })));
    expect(await fetchLiveWeather(10.31, 123.89)).toEqual({ ...UNAVAILABLE_WEATHER, temp: 0, windSpeed: 0 });
  });
  it('does not fetch for invalid coordinates', async () => {
    const request = vi.fn(); vi.stubGlobal('fetch', request);
    expect(await fetchLiveWeather(NaN, 123)).toEqual(UNAVAILABLE_WEATHER);
    expect(request).not.toHaveBeenCalled();
  });
});
