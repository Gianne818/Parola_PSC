'use client';

import { supabase } from '../lib/supabase';
import { calculateDistance, calculateBearing } from '../utils/spatial';
import { Hotspot } from '../types';

export interface SupabaseHotspot extends Hotspot {
  dbscan_cluster_id?: number;
}

// Pelagic species groups for dynamic distribution
const PELAGIC_SPECIES_SETS = [
  ["Tamban (Clupeidae)", "Tulingan (Scombridae)", "Galunggong (Carangidae)"],
  ["Galunggong (Carangidae)", "Alumahan (Scombridae)", "Dilis (Engraulidae)"],
  ["Tamban (Clupeidae)", "Kipalkipal (Belonidae)", "Bahi (Belonidae)"],
  ["Alumahan (Scombridae)", "Tulingan (Scombridae)", "Dilis (Engraulidae)"],
  ["Tamban (Clupeidae)", "Galunggong (Carangidae)", "Kipalkipal (Belonidae)"],
];

// Demersal species groups for dynamic distribution
const DEMERSAL_SPECIES_SETS = [
  ["Lapu-lapu (Serranidae)", "Maya-maya (Lutjanidae)", "Bisugo (Nemipteridae)"],
  ["Maya-maya (Lutjanidae)", "Samaral (Siganidae)", "Katambak (Lethrinidae)"],
  ["Lapu-lapu (Serranidae)", "Bisugo (Nemipteridae)", "Dugso (Lethrinidae)"],
  ["Samaral (Siganidae)", "Katambak (Lethrinidae)", "Maya-maya (Lutjanidae)"],
];

/**
 * Attempt 1: Query Supabase directly via JS client (requires valid anon key)
 */
export async function fetchHotspotsFromSupabase(userLat: number, userLng: number): Promise<SupabaseHotspot[]> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('daily_grid_predictions')
      .select('id, prediction_date, model_type, catch_probability, dbscan_cluster_id, sst, chl_a, created_at, centroid_geom')
      .eq('prediction_date', today)
      .gte('catch_probability', 0.60)
      .order('catch_probability', { ascending: false })
      .limit(1000);

    if (error) {
      console.warn('Supabase direct query error:', error.message);
      return [];
    }
    
    if (!data || data.length === 0) return [];

    return mapDbRowsToHotspots(data, userLat, userLng);
  } catch (err) {
    console.warn('Unexpected error in fetchHotspotsFromSupabase:', err);
    return [];
  }
}

/**
 * Attempt 2: Query via Next.js API route (which reads from DB server-side)
 */
export async function fetchHotspotsFromApi(userLat: number, userLng: number): Promise<Hotspot[]> {
  try {
    const res = await fetch(`/api/advisories/nearest?lat=${userLat}&lon=${userLng}&limit=1000`);
    if (!res.ok) {
      console.warn('API route error:', res.statusText);
      return [];
    }
    const data = await res.json();
    
    if (data.hotspots && data.hotspots.length > 0) {
      return data.hotspots.map((item: any, idx: number) => {
        const lat = item.target_lat || 0;
        const lng = item.target_lon || 0;
        const distanceKm = calculateDistance(userLat, userLng, lat, lng);
        const compassBearing = calculateBearing(userLat, userLng, lat, lng);

        let type: 'pelagic' | 'demersal' | 'both' = 'pelagic';
        if (item.model_type === 'demersal') type = 'demersal';
        else if (item.model_type === 'both') type = 'both';

        // Assign species dynamically based on cluster ID and index for variety
        const speciesSetIdx = (idx + Math.floor(lat * 10)) % PELAGIC_SPECIES_SETS.length;
        const species = type === 'demersal'
          ? DEMERSAL_SPECIES_SETS[idx % DEMERSAL_SPECIES_SETS.length]
          : PELAGIC_SPECIES_SETS[speciesSetIdx];

        const depth = type === 'pelagic' ? 450 : type === 'demersal' ? 45 : 120;

        return {
          id: `api-${item.grid_id || idx}`,
          name: `Grid Zone ${lat.toFixed(2)}°N ${lng.toFixed(2)}°E`,
          type,
          species,
          lat,
          lng,
          depth,
          lastUpdated: 'AWS ML Model (Live)',
          catchProbability: item.catch_probability,
          dbscan_cluster_id: item.dbscan_cluster_id,
          sst: item.sst,
          chlA: item.chl_a,
          distanceKm,
          compassBearing
        } as Hotspot;
      });
    }
    
    return [];
  } catch (err) {
    console.warn('Unexpected error in fetchHotspotsFromApi:', err);
    return [];
  }
}

/**
 * Main entry: tries Supabase direct → API route → returns empty
 */
export async function fetchHotspots(userLat: number, userLng: number): Promise<Hotspot[]> {
  const sbHotspots = await fetchHotspotsFromSupabase(userLat, userLng);
  if (sbHotspots.length > 0) {
    console.log(`[Hotspots] Loaded ${sbHotspots.length} hotspots (>= 0.60 prob) from Supabase direct query`);
    return sbHotspots;
  }

  const apiHotspots = await fetchHotspotsFromApi(userLat, userLng);
  if (apiHotspots.length > 0) {
    console.log(`[Hotspots] Loaded ${apiHotspots.length} hotspots (>= 0.60 prob) from API route`);
    return apiHotspots;
  }

  console.warn('[Hotspots] No live hotspot data available from any source');
  return [];
}

/**
 * Helper: Convert database rows to Hotspot objects
 */
function mapDbRowsToHotspots(data: any[], userLat: number, userLng: number): SupabaseHotspot[] {
  return data.map((item: any, idx: number) => {
    let lat = 0, lng = 0;
    
    const geom = item.centroid_geom;
    if (typeof geom === 'string') {
      const match = geom.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
      if (match) {
        lng = parseFloat(match[1]);
        lat = parseFloat(match[2]);
      }
    } else if (geom && typeof geom === 'object' && geom.coordinates) {
      lng = geom.coordinates[0];
      lat = geom.coordinates[1];
    }

    const distanceKm = calculateDistance(userLat, userLng, lat, lng);
    const compassBearing = calculateBearing(userLat, userLng, lat, lng);

    let type: 'pelagic' | 'demersal' | 'both' = 'pelagic';
    if (item.model_type === 'demersal') type = 'demersal';
    else if (item.model_type === 'both') type = 'both';

    const speciesSetIdx = (idx + Math.floor(lat * 10)) % PELAGIC_SPECIES_SETS.length;
    const species = type === 'demersal'
      ? DEMERSAL_SPECIES_SETS[idx % DEMERSAL_SPECIES_SETS.length]
      : PELAGIC_SPECIES_SETS[speciesSetIdx];

    const depth = type === 'pelagic' ? 450 : type === 'demersal' ? 45 : 120;
    
    const createdDate = item.created_at ? new Date(item.created_at) : new Date();
    const lastUpdated = createdDate.toLocaleDateString('en-US', { hour: '2-digit', minute: '2-digit' });

    return {
      id: (item.id || Math.random()).toString(),
      name: `Grid Zone ${lat.toFixed(2)}°N ${lng.toFixed(2)}°E`,
      type,
      species,
      lat,
      lng,
      depth,
      lastUpdated,
      catchProbability: item.catch_probability,
      dbscan_cluster_id: item.dbscan_cluster_id,
      sst: item.sst,
      chlA: item.chl_a,
      distanceKm,
      compassBearing
    };
  });
}
