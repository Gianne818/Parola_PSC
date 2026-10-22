import { PHILIPPINE_REGIONS } from '@/data/philippineRegions';
import { authHeaders } from '@/utils/auth-fetch';
import { isClientCoordinate } from './coordinates';
import { predictionDay } from './timestamps';
import { readGeographicCoverage, type GeographicCoverage } from './geographic-access';

/** Local consumer models for the existing GeoJSON endpoint, not shared wire schemas. */
export interface PredictionExportQuery {
  lat: number; lng: number; regionId: string; habitat: 'pelagic' | 'demersal' | 'both'; species: string;
}
export interface PredictionArtifact {
  text: string;
  count: number;
  mode: 'demo_preview' | 'geographically_filtered';
  geography: GeographicCoverage;
  predictionDate: string | null;
  dateStatus: 'today' | 'historical' | 'unavailable';
  lineage: 'unavailable' | 'upload_identity_only' | 'mixed';
}
type ExportErrorKind = 'authentication' | 'denied' | 'unavailable' | 'invalid_query' | 'failure' | 'malformed';
const messages: Record<ExportErrorKind, string> = {
  authentication: 'Sign in again before requesting an export. No file was downloaded.',
  denied: 'The server denied this export request for your account. No file was downloaded; this is not an individual fishing-area decision.',
  unavailable: 'The export service or complete geographic coverage is unavailable. No file was downloaded.',
  invalid_query: 'This prediction query is unavailable or unsupported. Check the home port and fish filter before retrying.',
  failure: 'The export could not be downloaded. Check your connection and retry.',
  malformed: 'The export response could not be verified. No file was downloaded.',
};
export class PredictionExportError extends Error {
  constructor(public readonly kind: ExportErrorKind) { super(messages[kind]); this.name = 'PredictionExportError'; }
}

export function predictionExportParams(query: PredictionExportQuery): URLSearchParams {
  if (!isClientCoordinate(query.lat, query.lng) || !PHILIPPINE_REGIONS.some(region => region.id === query.regionId)
    || !['pelagic', 'demersal', 'both'].includes(query.habitat) || typeof query.species !== 'string' || query.species.length > 100) {
    throw new PredictionExportError('invalid_query');
  }
  const params = new URLSearchParams({ lat: String(query.lat), lon: String(query.lng), region: query.regionId, habitat: query.habitat, limit: '1000' });
  if (query.species.trim()) params.set('species', query.species.trim());
  return params;
}

function isRecord(candidate: unknown): candidate is Record<string, unknown> { return !!candidate && typeof candidate === 'object' && !Array.isArray(candidate); }
function isDay(candidate: unknown): candidate is string { return typeof candidate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(candidate) && predictionDay(candidate) === candidate; }
function isCount(candidate: unknown): candidate is number { return Number.isSafeInteger(candidate) && (candidate as number) >= 0; }

function exportGeography(selection: Record<string, unknown>, mode: unknown): GeographicCoverage {
  const geography = readGeographicCoverage(selection.geography);
  if (!geography || !((mode === 'demo_preview' && geography.status === 'not_evaluated')
    || (mode === 'geographically_filtered' && geography.status === 'filtered'))) throw new PredictionExportError('malformed');
  return geography;
}

function exportDate(selection: Record<string, unknown>): Pick<PredictionArtifact, 'predictionDate' | 'dateStatus'> {
  const selectedDay = selection.prediction_date;
  if ((selectedDay !== null && !isDay(selectedDay)) || !isDay(selection.as_of_date) || selection.requested_date !== null
    || selection.timezone !== 'Asia/Manila') throw new PredictionExportError('malformed');
  const dateStatus = selectedDay === null ? 'unavailable' : selectedDay === selection.as_of_date ? 'today' : 'historical';
  if (selection.date_status !== dateStatus || (typeof selectedDay === 'string' && selectedDay > selection.as_of_date)) throw new PredictionExportError('malformed');
  return { predictionDate: selectedDay, dateStatus };
}

function validLineage(selection: Record<string, unknown>): boolean {
  return typeof selection.lineage_status === 'string' && ['unavailable', 'upload_identity_only', 'mixed'].includes(selection.lineage_status)
    && Array.isArray(selection.ingestion_run_ids) && selection.ingestion_run_ids.length <= 10
    && selection.ingestion_run_ids.every(id => typeof id === 'string' && Boolean(id.trim()))
    && new Set(selection.ingestion_run_ids).size === selection.ingestion_run_ids.length
    && isCount(selection.ingestion_run_count) && selection.ingestion_run_count >= selection.ingestion_run_ids.length
    && selection.ingestion_run_ids_capped === (selection.ingestion_run_count > selection.ingestion_run_ids.length);
}

function validHabitatCoverage(candidate: unknown): boolean {
  return isRecord(candidate) && isCount(candidate.eligible_count) && typeof candidate.status === 'string'
    && ['available', 'unavailable', 'not_requested'].includes(candidate.status)
    && (candidate.status === 'available') === (candidate.eligible_count > 0);
}

function validExportFeature(feature: unknown, selectedDay: string | null): boolean {
  if (!isRecord(feature) || feature.type !== 'Feature' || !isRecord(feature.geometry) || feature.geometry.type !== 'Point'
    || !Array.isArray(feature.geometry.coordinates) || feature.geometry.coordinates.length !== 2 || !isRecord(feature.properties)) return false;
  const [lon, lat] = feature.geometry.coordinates;
  const properties = feature.properties;
  return isClientCoordinate(lat, lon) && !(lat === 0 && lon === 0)
    && ((typeof properties.grid_id === 'string' && Boolean(properties.grid_id.trim())) || isCount(properties.grid_id))
    && (properties.model_type === null || (typeof properties.model_type === 'string' && Boolean(properties.model_type.trim())))
    && typeof properties.model_score === 'number' && Number.isFinite(properties.model_score) && properties.model_score >= 0 && properties.model_score <= 1
    && properties.validity_status === 'unverified' && isDay(properties.prediction_date) && properties.prediction_date === selectedDay;
}

export function readPredictionArtifact(text: string): PredictionArtifact {
  let collection: unknown;
  try { collection = JSON.parse(text); } catch (error) {
    if (error instanceof SyntaxError) throw new PredictionExportError('malformed');
    throw error;
  }
  if (!isRecord(collection) || collection.type !== 'FeatureCollection' || !Array.isArray(collection.features) || collection.features.length > 1000
    || collection.error || collection.operational_eligible !== false || collection.provenance !== 'legacy_unverified' || !isRecord(collection.selection)) throw new PredictionExportError('malformed');
  const selection = collection.selection;
  if (selection.validity_status !== 'unverified' || selection.operational_eligible !== false || selection.coherence !== 'prediction_date_only'
    || !validLineage(selection) || !isRecord(selection.habitats) || !['pelagic', 'demersal'].every(habitat => validHabitatCoverage((selection.habitats as Record<string, unknown>)[habitat]))) throw new PredictionExportError('malformed');
  const geography = exportGeography(selection, collection.export_mode);
  const selectedDate = exportDate(selection);
  if (!collection.features.every(feature => validExportFeature(feature, selectedDate.predictionDate))) throw new PredictionExportError('malformed');
  return { text, count: collection.features.length, mode: collection.export_mode as PredictionArtifact['mode'], geography, ...selectedDate,
    lineage: selection.lineage_status as PredictionArtifact['lineage'] };
}

export async function requestPredictionExport(query: PredictionExportQuery, signal: AbortSignal): Promise<PredictionArtifact> {
  const params = predictionExportParams(query);
  try {
    const headers = await authHeaders();
    signal.throwIfAborted();
    const response = await fetch(`/api/advisories/export?${params}`, { headers, signal, cache: 'no-store', credentials: 'same-origin' });
    if (!response.ok) throw new PredictionExportError(response.status === 401 ? 'authentication' : response.status === 403 ? 'denied'
      : response.status === 503 ? 'unavailable' : [400, 422].includes(response.status) ? 'invalid_query' : 'failure');
    if (response.redirected || response.status !== 200 || response.headers.get('content-type')?.split(';')[0].trim() !== 'application/geo+json') {
      throw new PredictionExportError('malformed');
    }
    const artifact = readPredictionArtifact(await response.text());
    signal.throwIfAborted();
    return artifact;
  } catch (error) {
    if (signal.aborted) throw error;
    throw error instanceof PredictionExportError ? error : new PredictionExportError('failure');
  }
}

/** Browser handoff only. The browser cannot confirm that a file was saved to disk. */
export function startPredictionDownload(artifact: PredictionArtifact): void {
  const blob = new Blob([artifact.text], { type: 'application/geo+json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  try {
    anchor.href = url;
    anchor.download = artifact.mode === 'demo_preview' ? 'parola-demo-predictions-unverified.geojson' : 'parola-predictions-unverified.geojson';
    document.body.appendChild(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    // Allow the browser to consume the object URL before releasing it.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
