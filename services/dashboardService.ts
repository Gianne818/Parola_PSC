import type { DashboardWeather, FishingArea, FishingAreaResult, FishingAreaMetadata } from '@/lib/dashboard';
import { isClientCoordinate, isClientTargetCoordinate } from '@/lib/frontend/coordinates';
import { predictionDay, recordTimestamp } from '@/lib/frontend/timestamps';

function isReading(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const reading = value as Record<string, unknown>;
  return (reading.value === null || (typeof reading.value === 'number' && Number.isFinite(reading.value)))
    && typeof reading.source === 'string' && (reading.observedAt === null || typeof reading.observedAt === 'string')
    && (reading.available === undefined || typeof reading.available === 'boolean')
    && (reading.validUntil === undefined || reading.validUntil === null || typeof reading.validUntil === 'string');
}

function isDashboardWeather(value: unknown): value is DashboardWeather {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  if (!data.hold || typeof data.hold !== 'object') return false;
  const hold = data.hold as Record<string, unknown>;
  return [data.wind, data.waves, data.temperature, data.stormSignal].every(isReading)
    && typeof data.receivedAt === 'string' && typeof hold.available === 'boolean' && typeof hold.active === 'boolean'
    && (hold.checkedAt === null || typeof hold.checkedAt === 'string')
    && (hold.reason === null || typeof hold.reason === 'string') && isWeatherLocation(data.location);
}

function isWeatherLocation(value: unknown): boolean {
  if (value === undefined) return true; // Older responses remain compatible.
  if (!value || typeof value !== 'object') return false;
  const location = value as Record<string, unknown>;
  const coordinates = (value: unknown) => {
    if (!value || typeof value !== 'object') return false;
    const point = value as Record<string, unknown>;
    return typeof point.lat === 'number' && Number.isFinite(point.lat) && Math.abs(point.lat) <= 90
      && typeof point.lng === 'number' && Number.isFinite(point.lng) && Math.abs(point.lng) <= 180;
  };
  return coordinates(location.requested) && (location.weatherGrid === null || coordinates(location.weatherGrid))
    && (location.marineGrid === null || coordinates(location.marineGrid));
}

async function readResponse(response: Response): Promise<Record<string, unknown>> {
  const data = await response.json();
  if (!response.ok || !data || typeof data !== 'object' || data.error) throw new Error('Dashboard information is unavailable.');
  return data;
}

export async function loadDashboardWeather(lat: number, lng: number, regionId: string, signal: AbortSignal): Promise<DashboardWeather> {
  if (!isClientCoordinate(lat, lng)) throw new Error('Home-port coordinates are unavailable or invalid.');
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng), region: regionId });
  const response = await fetch(`/api/dashboard/weather?${params}`, { signal, cache: 'no-store' });
  const data = await readResponse(response);
  if (!isDashboardWeather(data)) throw new Error('Weather response could not be read.');
  if (data.location && (data.location.requested.lat !== lat || data.location.requested.lng !== lng)) {
    throw new Error('Weather response belongs to a different requested location.');
  }
  return data;
}

interface Prediction {
  grid_id: string | number;
  target_lat: number;
  target_lon: number;
  model_type: string;
  model_type_known?: boolean;
  catch_probability?: number;
  prediction_date?: string | null;
  created_at?: string | null;
  sst?: number;
}

function isPrediction(value: unknown): value is Prediction {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (typeof item.grid_id === 'number' || typeof item.grid_id === 'string')
    && isClientTargetCoordinate(item.target_lat, item.target_lon);
}

export async function loadFishingAreaResult(lat: number, lng: number, species: string, signal: AbortSignal, regionId?: string): Promise<FishingAreaResult> {
  if (!isClientCoordinate(lat, lng)) throw new Error('Home-port coordinates are unavailable or invalid.');
  const params = new URLSearchParams({ lat: String(lat), lon: String(lng), limit: '1000' });
  if (regionId) params.set('region', regionId);
  if (species) params.set('species', species);
  const data = await readResponse(await fetch(`/api/advisories/nearest?${params}`, { signal, cache: 'no-store' }));
  if (!Array.isArray(data.hotspots)) throw new Error('Fishing-area response could not be read.');
  if (data.hotspots.length && !data.hotspots.some(isPrediction)) throw new Error('Fishing-area coordinates are unavailable or invalid.');
  const seen = new Set<string>();
  const retrievedAt = new Date().toISOString(); // Client response receipt, never prediction age.
  const areas: FishingArea[] = data.hotspots.filter(isPrediction).filter(item => {
    const key = `${item.target_lat},${item.target_lon},${item.model_type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  })
    .map(item => ({
      id: String(item.grid_id), name: `Zone ${item.grid_id}`, lat: item.target_lat, lng: item.target_lon,
      type: item.model_type === 'pelagic' || item.model_type === 'demersal' ? item.model_type : 'both',
      // Legacy shared depth is required numeric; nonfinite means unavailable in client displays.
      species: [], depth: Number.NaN, lastUpdated: recordTimestamp(item.created_at) || '', retrievedAt,
      catchProbability: typeof item.catch_probability === 'number' && Number.isFinite(item.catch_probability) ? item.catch_probability : undefined,
      predictionDate: predictionDay(item.prediction_date),
      source: 'model', speciesAdjusted: data.species_hsi_applied === true
        || (Boolean(species.trim()) && typeof data.species_hsi_applied === 'string' && data.species_hsi_applied === species),
      habitatKnown: item.model_type_known !== false && ['pelagic', 'demersal', 'both'].includes(item.model_type),
      sst: typeof item.sst === 'number' && Number.isFinite(item.sst) ? item.sst : undefined, distanceKm: 0, compassBearing: '',
    }));
  const metadata = data.metadata as Partial<FishingAreaMetadata> | undefined;
  return { areas, metadata: metadata && metadata.region === regionId
    && Number.isInteger(metadata.eligibleCount) && Number.isInteger(metadata.returnedCount)
    && Array.isArray(metadata.predictionDates) && metadata.predictionDates.every(date => predictionDay(date) !== null)
    && typeof metadata.capped === 'boolean' ? metadata as FishingAreaMetadata : null };
}

/** Existing consumers retain the array interface. */
export async function loadFishingAreas(lat: number, lng: number, species: string, signal: AbortSignal): Promise<FishingArea[]> {
  return (await loadFishingAreaResult(lat, lng, species, signal)).areas;
}
