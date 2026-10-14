import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { PHILIPPINE_REGIONS } from '@/data/philippineRegions';
import type { DashboardWeather, WeatherReading, ForecastCoordinates } from '@/lib/dashboard';
import { checkRateLimit, RATE_LIMITS, rateLimitExceededResponse } from '@/lib/rate-limit';

interface CurrentForecast { latitude?: number; longitude?: number; current?: { time?: string; interval?: number; wind_speed_10m?: number; temperature_2m?: number; wave_height?: number } }
interface HoldRecord { check_timestamp: string | Date; is_hazardous: boolean; override_reason: string | null; pagasa_signal_level: number | null }

/** A failed provider leaves its fields unavailable; no synthetic readings are substituted. */
async function forecast(url: string): Promise<CurrentForecast | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000), cache: 'no-store' });
    return response.ok ? await response.json() : null;
  } catch { return null; }
}

function forecastCoordinates(data: CurrentForecast | null): ForecastCoordinates | null {
  return typeof data?.latitude === 'number' && Number.isFinite(data.latitude)
    && typeof data.longitude === 'number' && Number.isFinite(data.longitude)
    ? { lat: data.latitude, lng: data.longitude } : null;
}

function reading(value: unknown, source: string, timestamp: string | Date | undefined, interval?: number): WeatherReading {
  const time = timestamp instanceof Date ? timestamp.toISOString() : timestamp;
  const observedAt = time ? (/Z$|[+-]\d\d:\d\d$/.test(time) ? time : `${time}+08:00`) : null;
  return { value: typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null,
    source, observedAt: observedAt && Number.isFinite(Date.parse(observedAt)) ? observedAt : null,
    available: typeof value === 'number' && Number.isFinite(value) && value >= 0,
    validUntil: observedAt && Number.isFinite(Date.parse(observedAt)) && typeof interval === 'number' && Number.isFinite(interval) && interval > 0
      ? new Date(Date.parse(observedAt) + interval * 1000).toISOString() : null };
}

/** Missing or failed regional lookups cannot establish that no hold exists. */
async function loadHold(names: string[]): Promise<DashboardWeather['hold'] & { signal: WeatherReading }> {
  const missing = { available: false, active: false, checkedAt: null, reason: null,
    signal: reading(null, 'Parola regional hold record', undefined) };
  try {
    const db = getDbPool(3);
    if (!db) return missing;
    const result = await db.query<HoldRecord>(
      'SELECT check_timestamp, is_hazardous, override_reason, pagasa_signal_level FROM public.weather_safety_overrides WHERE LOWER(region_name) = ANY($1::text[]) ORDER BY check_timestamp DESC LIMIT 1',
      [names.map(name => name.toLowerCase())],
    );
    const row = result.rows[0];
    if (!row) return missing;
    return { available: true, active: row.is_hazardous === true, checkedAt: row.check_timestamp instanceof Date ? row.check_timestamp.toISOString() : row.check_timestamp,
      reason: row.override_reason, signal: reading(row.pagasa_signal_level, 'Parola regional hold record', row.check_timestamp) };
  } catch { return missing; }
}

export async function GET(request: Request) {
  const limit = await checkRateLimit(request, RATE_LIMITS.nearest);
  if (!limit.allowed) return rateLimitExceededResponse(RATE_LIMITS.nearest, limit, 'dashboard-weather');
  const params = new URL(request.url).searchParams;
  const lat = Number(params.get('lat'));
  const lng = Number(params.get('lng'));
  const region = PHILIPPINE_REGIONS.find(item => item.id === params.get('region'));
  if (!params.get('lat') || !params.get('lng') || !Number.isFinite(lat) || !Number.isFinite(lng)
    || lat < 4.5 || lat > 21.5 || lng < 115.5 || lng > 127.5 || !region) {
    return NextResponse.json({ error: 'Valid Philippine coordinates and advisory region are required.' }, { status: 400 });
  }
  const location = `latitude=${lat}&longitude=${lng}&timezone=Asia%2FManila`;
  const [weather, marine, hold] = await Promise.all([
    forecast(`https://api.open-meteo.com/v1/forecast?${location}&current=temperature_2m,wind_speed_10m`),
    forecast(`https://marine-api.open-meteo.com/v1/marine?${location}&current=wave_height`),
    loadHold([region.name, region.shortName, `Philippine ${region.shortName}`]),
  ]);
  const result: DashboardWeather = {
    location: { requested: { lat, lng }, weatherGrid: forecastCoordinates(weather), marineGrid: forecastCoordinates(marine) },
    wind: reading(weather?.current?.wind_speed_10m, 'Open-Meteo forecast', weather?.current?.time, weather?.current?.interval),
    waves: reading(marine?.current?.wave_height, 'Open-Meteo marine forecast', marine?.current?.time, marine?.current?.interval),
    temperature: reading(weather?.current?.temperature_2m, 'Open-Meteo forecast', weather?.current?.time, weather?.current?.interval),
    stormSignal: hold.signal,
    hold: { available: hold.available, active: hold.active, checkedAt: hold.checkedAt, reason: hold.reason },
    receivedAt: new Date().toISOString(),
  };
  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
}
