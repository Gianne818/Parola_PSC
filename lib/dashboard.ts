import type { Hotspot, PhilippineRegion } from '@/types';
import { isCoordinateInRegion } from '@/data/philippineRegions';
import { calculateBearing, calculateDistance } from '@/utils/spatial';
import { isClientCoordinate, isClientTargetCoordinate } from '@/lib/frontend/coordinates';

export interface WeatherReading {
  value: number | null;
  source: string;
  observedAt: string | null;
  available?: boolean;
  validUntil?: string | null;
}

export interface DashboardWeather {
  location?: { requested: ForecastCoordinates; weatherGrid: ForecastCoordinates | null; marineGrid: ForecastCoordinates | null };
  wind: WeatherReading;
  waves: WeatherReading;
  temperature: WeatherReading;
  stormSignal: WeatherReading;
  hold: { available: boolean; active: boolean; checkedAt: string | null; reason: string | null };
  receivedAt: string;
}

export interface ForecastCoordinates { lat: number; lng: number }

export interface FishingAreaMetadata {
  region: string; eligibleCount: number; returnedCount: number; predictionDates: string[]; capped: boolean;
}

export interface FishingAreaResult { areas: FishingArea[]; metadata: FishingAreaMetadata | null }

export function reusableAreaWeather(data: DashboardWeather, now = new Date()): boolean {
  return [data.wind, data.waves].every(reading => isReadingCurrent(reading, now));
}

export interface FishingArea extends Hotspot {
  retrievedAt?: string;
  predictionDate: string | null;
  source: 'model' | 'sample';
  speciesAdjusted: boolean;
  habitatKnown: boolean;
  distanceKm: number;
  compassBearing: string;
}

export type AdvisoryState = 'hold' | 'incomplete' | 'clear';

export function isReadingCurrent(reading: WeatherReading, now = new Date()): boolean {
  if (!reading.observedAt) return false;
  return reading.available !== false && reading.value !== null
    && manilaDate(reading.observedAt) === manilaDate(now)
    && (!reading.validUntil || (Number.isFinite(Date.parse(reading.validUntil)) && now.getTime() <= Date.parse(reading.validUntil)));
}

export function manilaDate(value: string | Date): string | null {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date);
}

export function advisoryState(weather: DashboardWeather | null, manualHold: boolean, failed = false, now = new Date()): AdvisoryState {
  if (manualHold || weather?.hold.active || (weather?.wind.value != null && weather.wind.value / 1.852 >= 20)
    || (weather?.waves.value != null && weather.waves.value >= 2)
    || (weather?.stormSignal.value != null && weather.stormSignal.value > 0)) return 'hold';
  if (!weather || failed || !weather.hold.available) return 'incomplete';
  const readings = [weather.wind, weather.waves, weather.stormSignal];
  return readings.every(reading => isReadingCurrent(reading, now))
    && weather.hold.checkedAt && manilaDate(weather.hold.checkedAt) === manilaDate(now) ? 'clear' : 'incomplete';
}

export function retainWeather(previous: DashboardWeather | null, next: DashboardWeather): DashboardWeather {
  if (!previous) return next;
  const retain = (old: WeatherReading, incoming: WeatherReading): WeatherReading => incoming.value === null
    ? { ...old, available: false } : incoming;
  return { ...next, wind: retain(previous.wind, next.wind), waves: retain(previous.waves, next.waves),
    temperature: retain(previous.temperature, next.temperature), stormSignal: retain(previous.stormSignal, next.stormSignal),
    hold: next.hold.available ? next.hold : { ...previous.hold, available: false },
  };
}

export const MIN_THRESHOLD_PERCENT = 25;
export const DEFAULT_THRESHOLD_PERCENT = 50;
export const MAX_THRESHOLD_PERCENT = 95;

export function meetsThreshold(value: number | undefined, minThresholdPercent = DEFAULT_THRESHOLD_PERCENT): boolean {
  if (value === undefined || !Number.isFinite(value)) return true;
  const pct = value <= 1 ? value * 100 : value;
  return pct + 1e-6 >= minThresholdPercent;
}

export function nearbyAreas(
  areas: FishingArea[],
  region: PhilippineRegion,
  lat: number,
  lng: number,
  habitat: Hotspot['type'],
  minThresholdPercent = DEFAULT_THRESHOLD_PERCENT
): FishingArea[] {
  if (!isClientCoordinate(lat, lng)) return [];
  return areas.filter(area => isClientTargetCoordinate(area.lat, area.lng)
    && isCoordinateInRegion(area.lat, area.lng, region.id)
    && (habitat === 'both' || (area.habitatKnown && (area.type === habitat || area.type === 'both')))
    && meetsThreshold(area.catchProbability, minThresholdPercent))
    .map(area => ({ ...area, distanceKm: calculateDistance(lat, lng, area.lat, area.lng), compassBearing: calculateBearing(lat, lng, area.lat, area.lng) }))
    .sort((a, b) => a.distanceKm - b.distanceKm || a.id.localeCompare(b.id));
}

export function predictionPercent(value: number | undefined): number | null {
  if (value === undefined || !Number.isFinite(value) || value < 0 || value > 100) return null;
  return Math.round(value <= 1 ? value * 100 : value);
}

export function maskedPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits ? `•••• ••• ${digits.slice(-4)}` : '';
}

export function smsOutcome(responseOk: boolean, data: { success?: boolean; mode?: string; error?: string }): 'simulated' | 'accepted' {
  if (!responseOk || data.success !== true) throw new Error(data.error || 'SMS request failed.');
  if (data.mode === 'MOCK_DRY_RUN') return 'simulated';
  if (data.mode === 'LIVE_DISPATCH') return 'accepted';
  throw new Error('SMS response could not be confirmed.');
}
