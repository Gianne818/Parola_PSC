import { readWeatherEvidence } from '@/lib/frontend/safety-presentation';
import type { DashboardWeather, FishingArea, FishingAreaResult, FishingAreaMetadata } from '@/lib/dashboard';
import { isClientCoordinate, isClientTargetCoordinate } from '@/lib/frontend/coordinates';
import { predictionDay, recordTimestamp } from '@/lib/frontend/timestamps';
import { AreaLoadError } from '@/lib/frontend/prediction-presentation';

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
  if (!isWeatherLocation(data.location)) throw new Error('Weather response location could not be read.');
  const location = data.location as DashboardWeather['location'];
  if (location && (location.requested.lat !== lat || location.requested.lng !== lng)) {
    throw new Error('Weather response belongs to a different requested location.');
  }
  return { ...readWeatherEvidence(data), ...(location ? { location } : {}) };
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
  chl_a?: number;
  environment_provenance?: unknown;
  dbscan_cluster_id?: unknown;
}

function isPrediction(value: unknown): value is Prediction {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return ((typeof item.grid_id === 'number' && Number.isFinite(item.grid_id)) || (typeof item.grid_id === 'string' && Boolean(item.grid_id.trim())))
    && isClientTargetCoordinate(item.target_lat, item.target_lon);
}

function latestAtEachLocation(predictions: Prediction[]): Prediction[] {
  const locations = new Map<string, Prediction>();
  for (const prediction of predictions) {
    const key = `${prediction.target_lat},${prediction.target_lon},${prediction.model_type}`;
    const previous = locations.get(key);
    const day = predictionDay(prediction.prediction_date) || '';
    const previousDay = predictionDay(previous?.prediction_date) || '';
    if (!previous || day > previousDay || (day === previousDay
      && (Date.parse(recordTimestamp(prediction.created_at) || '') || 0) > (Date.parse(recordTimestamp(previous.created_at) || '') || 0))) {
      locations.set(key, prediction);
    }
  }
  // Updating an existing key retains server selection order across distinct locations.
  return [...locations.values()];
}

export async function loadFishingAreaResult(lat: number, lng: number, species: string, signal: AbortSignal, regionId?: string): Promise<FishingAreaResult> {
  if (!isClientCoordinate(lat, lng)) throw new AreaLoadError('invalid_coordinates');
  const params = new URLSearchParams({ lat: String(lat), lon: String(lng), limit: '1000' });
  if (regionId) params.set('region', regionId);
  if (species) params.set('species', species);
  const response = await fetch(`/api/advisories/nearest?${params}`, { signal, cache: 'no-store' });
  const payload = await response.json();
  if (!response.ok || !payload || typeof payload !== 'object' || payload.error) {
    const code = payload?.code;
    throw new AreaLoadError(code === 'species_unsupported' || code === 'species_catalog_unavailable' ? code : 'unavailable');
  }
  const data = payload as Record<string, unknown>;
  if (!Array.isArray(data.hotspots)) throw new Error('Fishing-area response could not be read.');
  if (data.hotspots.length && !data.hotspots.some(isPrediction)) throw new Error('Fishing-area coordinates are unavailable or invalid.');
  const retrievedAt = new Date().toISOString(); // Client response receipt, never prediction age.
  const valid = data.hotspots.filter(isPrediction);
  const adjusted = data.species_hsi_applied === true
    || (Boolean(species.trim()) && typeof data.species_hsi_applied === 'string' && data.species_hsi_applied === species);
  const label = (value: unknown): string | null => typeof value === 'string' && value.trim() ? value : null;
  const areas: FishingArea[] = latestAtEachLocation(valid)
    .map(item => ({
      id: String(item.grid_id), name: `Zone ${item.grid_id}`, lat: item.target_lat, lng: item.target_lon,
      type: item.model_type === 'pelagic' || item.model_type === 'demersal' ? item.model_type : 'both',
      // Legacy shared depth is required numeric; nonfinite means unavailable in client displays.
      species: [], depth: Number.NaN, lastUpdated: recordTimestamp(item.created_at) || '', retrievedAt,
      catchProbability: typeof item.catch_probability === 'number' && Number.isFinite(item.catch_probability) && item.catch_probability >= 0 && item.catch_probability <= 100 ? item.catch_probability : undefined,
      predictionDate: predictionDay(item.prediction_date),
      source: 'model', speciesAdjusted: adjusted,
      habitatKnown: item.model_type_known !== false && ['pelagic', 'demersal', 'both'].includes(item.model_type),
      sst: typeof item.sst === 'number' && Number.isFinite(item.sst) ? item.sst : undefined,
      chlA: typeof item.chl_a === 'number' && Number.isFinite(item.chl_a) ? item.chl_a : undefined,
      evidence: { responseSource: label(data.source), provenance: label(data.provenance), environmentProvenance: label(item.environment_provenance),
        clusterId: typeof item.dbscan_cluster_id === 'number' && Number.isInteger(item.dbscan_cluster_id) ? String(item.dbscan_cluster_id) : null },
      distanceKm: 0, compassBearing: '',
    }));
  const metadata = data.metadata as Partial<FishingAreaMetadata> | undefined;
  return { areas, metadata: metadata && metadata.region === regionId
    && Number.isInteger(metadata.eligibleCount) && Number.isInteger(metadata.returnedCount)
    && metadata.returnedCount! >= 0 && metadata.eligibleCount! >= metadata.returnedCount!
    && Array.isArray(metadata.predictionDates) && metadata.predictionDates.every(date => predictionDay(date) !== null)
    && typeof metadata.capped === 'boolean' && metadata.capped === (metadata.eligibleCount! > metadata.returnedCount!) ? metadata as FishingAreaMetadata : null,
    coverage: { receivedCount: data.hotspots.length, rejectedCount: data.hotspots.length - valid.length, duplicateCount: valid.length - areas.length,
      speciesStatus: data.species_status === 'resolved' || data.species_status === 'not_requested' ? data.species_status : 'unknown',
      speciesAdjustment: adjusted ? 'applied' : data.species_hsi_status === 'unavailable' ? 'unavailable' : !species ? 'not_requested' : 'unknown' } };
}

/** Existing consumers retain the array interface. */
export async function loadFishingAreas(lat: number, lng: number, species: string, signal: AbortSignal): Promise<FishingArea[]> {
  return (await loadFishingAreaResult(lat, lng, species, signal)).areas;
}
