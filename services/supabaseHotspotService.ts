'use client';

import { loadFishingAreaResult } from './dashboardService';
import { calculateDistance, calculateBearing } from '../utils/spatial';
import type { Hotspot } from '../types';

export interface SupabaseHotspot extends Hotspot {
  dbscan_cluster_id?: number;
}

/** Compatibility name only: raw geometry/database reads must not bypass the API. */
export async function fetchHotspotsFromSupabase(userLat: number, userLng: number, selectedSpecies?: string[]): Promise<SupabaseHotspot[]> {
  return fetchHotspotsFromApi(userLat, userLng, selectedSpecies);
}

/** Consume the same guarded feed as the dashboard, without invented enrichment. */
export async function fetchHotspotsFromApi(userLat: number, userLng: number, selectedSpecies?: string[]): Promise<Hotspot[]> {
  try {
    const { areas } = await loadFishingAreaResult(userLat, userLng, selectedSpecies?.[0]?.slice(0, 100) || '', AbortSignal.timeout(10000));
    return areas.map(area => ({ ...area,
      distanceKm: calculateDistance(userLat, userLng, area.lat, area.lng),
      compassBearing: calculateBearing(userLat, userLng, area.lat, area.lng),
    }));
  } catch {
    return []; // No database, geometry, generated species/weather or sample fallback.
  }
}

export async function fetchHotspots(userLat: number, userLng: number, selectedSpecies?: string[]): Promise<Hotspot[]> {
  return fetchHotspotsFromApi(userLat, userLng, selectedSpecies);
}
