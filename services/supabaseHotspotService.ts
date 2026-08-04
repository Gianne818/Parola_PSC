'use client';

import { supabase } from '../lib/supabase';
import { calculateDistance, calculateBearing } from '../utils/spatial';
import { Hotspot } from '../types';

export interface SupabaseHotspot extends Hotspot {
  dbscan_cluster_id?: number;
}

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
      .gte('catch_probability', 0.5)
      .order('catch_probability', { ascending: false })
      .limit(50);

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
 * Attempt 2: Query via our Next.js API route (which reads from DB/S3 server-side)
 */
export async function fetchHotspotsFromApi(userLat: number, userLng: number): Promise<Hotspot[]> {
  try {
    const res = await fetch(`/api/advisories/nearest?lat=${userLat}&lon=${userLng}&limit=50`);
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

        const species = type === 'pelagic' 
          ? ["Tamban (Clupeidae)", "Tulingan (Scombridae)", "Galunggong (Carangidae)"] 
          : type === 'demersal'
            ? ["Lapu-lapu (Serranidae)", "Maya-maya (Lutjanidae)", "Bisugo (Nemipteridae)"]
            : ["Tulingan (Scombridae)", "Samaral (Siganidae)", "Maya-maya (Lutjanidae)"];

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
  // Try 1: Direct Supabase client query
  const sbHotspots = await fetchHotspotsFromSupabase(userLat, userLng);
  if (sbHotspots.length > 0) {
    console.log(`[Hotspots] Loaded ${sbHotspots.length} hotspots from Supabase direct query`);
    return sbHotspots;
  }

  // Try 2: Next.js API route (DB/S3 server-side)
  const apiHotspots = await fetchHotspotsFromApi(userLat, userLng);
  if (apiHotspots.length > 0) {
    console.log(`[Hotspots] Loaded ${apiHotspots.length} hotspots from API route`);
    return apiHotspots;
  }

  console.warn('[Hotspots] No live hotspot data available from any source');
  return [];
}

/**
 * Helper: Convert database rows to Hotspot objects
 */
function mapDbRowsToHotspots(data: any[], userLat: number, userLng: number): SupabaseHotspot[] {
  return data.map((item: any) => {
    let lat = 0, lng = 0;
    
    // Parse centroid_geom - could be WKT string or GeoJSON
    const geom = item.centroid_geom;
    if (typeof geom === 'string') {
      const match = geom.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
      if (match) {
        lng = parseFloat(match[1]);
        lat = parseFloat(match[2]);
      }
    } else if (geom && typeof geom === 'object') {
      // GeoJSON format
      if (geom.coordinates) {
        lng = geom.coordinates[0];
        lat = geom.coordinates[1];
      }
    }

    const distanceKm = calculateDistance(userLat, userLng, lat, lng);
    const compassBearing = calculateBearing(userLat, userLng, lat, lng);

    let type: 'pelagic' | 'demersal' | 'both' = 'both';
    if (item.model_type === 'pelagic') type = 'pelagic';
    else if (item.model_type === 'demersal') type = 'demersal';

    const species = type === 'pelagic' 
      ? ["Tamban (Clupeidae)", "Tulingan (Scombridae)", "Galunggong (Carangidae)"] 
      : type === 'demersal'
        ? ["Lapu-lapu (Serranidae)", "Maya-maya (Lutjanidae)", "Bisugo (Nemipteridae)"]
        : ["Tulingan (Scombridae)", "Samaral (Siganidae)", "Maya-maya (Lutjanidae)"];

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
