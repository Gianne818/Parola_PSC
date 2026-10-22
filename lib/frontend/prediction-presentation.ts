import type { FishingArea } from '@/lib/dashboard';
import { predictionDay } from './timestamps';
import type { GeographicCoverage } from './geographic-access';

/** Client display evidence from the existing nearest-area response, not a shared API contract. */
export interface PredictionEvidence {
  responseSource: string | null;
  provenance: string | null;
  environmentProvenance: string | null;
  clusterId: string | null;
}

export interface PredictionCoverage {
  receivedCount: number;
  rejectedCount: number;
  duplicateCount: number;
  speciesStatus: 'resolved' | 'not_requested' | 'unknown';
  speciesAdjustment: 'applied' | 'unavailable' | 'not_requested' | 'unknown';
  geography?: GeographicCoverage | null;
}

export type AreaLoadErrorKind = 'species_unsupported' | 'species_catalog_unavailable' | 'invalid_coordinates' | 'unavailable' | 'authentication' | 'denied' | 'geography_unavailable';
export class AreaLoadError extends Error {
  constructor(public readonly kind: AreaLoadErrorKind, public readonly geography: GeographicCoverage | null = null) {
    super(kind === 'species_unsupported' ? 'The selected fish is unsupported or ambiguous. Clear the fish filter or choose another name.'
      : kind === 'species_catalog_unavailable' ? 'The species catalog is unavailable. Retry or clear the fish filter to request general habitat areas.'
        : kind === 'authentication' ? 'Sign in again to check geographic access.'
          : kind === 'denied' ? 'The server denied this prediction request for your account. This is not an individual fishing-area decision.'
            : kind === 'geography_unavailable' ? 'Geographic coverage is unavailable. Access remains unconfirmed.'
        : kind === 'invalid_coordinates' ? 'Home-port coordinates are unavailable or invalid. Change your home port.'
          : 'Fishing-area information is unavailable.');
    this.name = 'AreaLoadError';
  }
}

export function availablePredictionDays(areas: FishingArea[]): string[] {
  return [...new Set(areas.map(area => predictionDay(area.predictionDate)).filter((day): day is string => day !== null))].sort().reverse();
}

/** Filters only returned records. No historical query, validity or forecast is inferred. */
export function areasOnDay(areas: FishingArea[], day: string): FishingArea[] {
  return day === 'all' ? areas : areas.filter(area => day === 'unknown' ? !predictionDay(area.predictionDate) : predictionDay(area.predictionDate) === day);
}

export function predictionDayLabel(value: string | null, today: string | null): string {
  if (!value) return 'Prediction date unavailable';
  if (!today) return `Prediction date · ${value}`;
  return `${value < today ? 'Earlier prediction' : value > today ? 'Future-dated prediction' : 'Prediction dated today'} · ${value}`;
}
