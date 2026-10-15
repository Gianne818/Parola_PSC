import type { WeatherTelemetry } from '../types';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import { isClientCoordinate } from '@/lib/frontend/coordinates';

/** Client absence representation only; not a new API contract or safety decision. */
export type ClientWeatherTelemetry = { [Key in keyof WeatherTelemetry]: WeatherTelemetry[Key] | null };
export const UNAVAILABLE_WEATHER: ClientWeatherTelemetry = {
  temp: null, windSpeed: null, windDirection: null, waveHeight: null, tide: null, stormSignal: null,
};
const finite = (value: unknown): number | null => typeof value === 'number' && Number.isFinite(value) ? value : null;

export async function fetchLiveWeather(lat: number, lng: number): Promise<ClientWeatherTelemetry> {
  if (!isClientCoordinate(lat, lng)) return { ...UNAVAILABLE_WEATHER };
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m,wind_direction_10m&timezone=Asia/Manila`;
  const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&current=wave_height&timezone=Asia/Manila`;
  const read = async (url: string) => {
    try {
      const response = await fetchWithTimeout(url, { timeoutMs: 8000, retries: 1 });
      return response.ok ? (await response.json())?.current : null;
    } catch { return null; }
  };
  const [weather, marine] = await Promise.all([read(weatherUrl), read(marineUrl)]);
  const degrees = finite(weather?.wind_direction_10m);
  const windDirection = degrees !== null && degrees >= 0 && degrees <= 360
    ? ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(degrees / 45) % 8] : null;
  return {
    temp: finite(weather?.temperature_2m), windSpeed: finite(weather?.wind_speed_10m), windDirection,
    waveHeight: finite(marine?.wave_height),
    // These providers do not supply tide state or an applicable PAGASA signal here.
    tide: null, stormSignal: null,
  };
}
