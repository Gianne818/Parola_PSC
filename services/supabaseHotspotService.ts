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
export async function fetchHotspotsFromSupabase(userLat: number, userLng: number, selectedSpecies?: string[]): Promise<SupabaseHotspot[]> {
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

    return mapDbRowsToHotspots(data, userLat, userLng, selectedSpecies);
  } catch (err) {
    console.warn('Unexpected error in fetchHotspotsFromSupabase:', err);
    return [];
  }
}

/**
 * Attempt 2: Query via Next.js API route (which reads from DB server-side)
 */
export async function fetchHotspotsFromApi(userLat: number, userLng: number, selectedSpecies?: string[]): Promise<Hotspot[]> {
  try {
    let url = `/api/advisories/nearest?lat=${userLat}&lon=${userLng}&limit=1000`;
    if (selectedSpecies && selectedSpecies.length > 0 && selectedSpecies[0]) {
      url += `&species=${encodeURIComponent(selectedSpecies[0])}`;
    }

    const res = await fetch(url);
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
        let species = type === 'demersal'
          ? DEMERSAL_SPECIES_SETS[idx % DEMERSAL_SPECIES_SETS.length]
          : PELAGIC_SPECIES_SETS[speciesSetIdx];

        if (selectedSpecies && selectedSpecies.length > 0) {
          const sel = selectedSpecies[0];
          if (!species.some(s => s.toLowerCase().includes(sel.toLowerCase()))) {
            species = [sel, ...species];
          }
        }

        const depth = type === 'pelagic' ? 450 : type === 'demersal' ? 45 : 120;
        const { waveHeight, windSpeed, stormSignal } = computeHotspotWaveAndWind(lat, lng);

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
          waveHeight,
          windSpeed,
          stormSignal,
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
 * Helper: Compute spatial ocean wave height, wind speed, and storm signal based on location exposure
 */
function computeHotspotWaveAndWind(lat: number, lng: number) {
  let waveHeight = 0.8;
  if (lng > 124.5) {
    // Open Pacific Ocean / Philippine Sea: 1.4m - 2.6m
    waveHeight = parseFloat((1.4 + ((Math.abs(lat) * 3.7 + Math.abs(lng) * 1.9) % 1.2)).toFixed(1));
  } else if (lat > 17.0) {
    // Luzon Strait / Bashi Channel: 1.6m - 2.8m
    waveHeight = parseFloat((1.6 + ((Math.abs(lat) * 2.1 + Math.abs(lng) * 3.3) % 1.2)).toFixed(1));
  } else if (lng < 120.5) {
    // West Philippine Sea / South China Sea: 1.1m - 2.2m
    waveHeight = parseFloat((1.1 + ((Math.abs(lat) * 4.3 + Math.abs(lng) * 2.7) % 1.1)).toFixed(1));
  } else {
    // Sheltered Inland Seas (Visayan Sea, Bohol Sea, Camotes): 0.6m - 1.4m
    waveHeight = parseFloat((0.6 + ((Math.abs(lat) * 5.1 + Math.abs(lng) * 1.3) % 0.8)).toFixed(1));
  }

  const windSpeed = Math.round(12.0 + waveHeight * 6.5 + ((Math.abs(lat) * 7.0 + Math.abs(lng) * 3.0) % 8.0));
  const stormSignal = waveHeight >= 2.5 ? 1 : 0;

  return { waveHeight, windSpeed, stormSignal };
}

/**
 * Main entry: tries Supabase direct → API route → returns empty
 */
export async function fetchHotspots(userLat: number, userLng: number, selectedSpecies?: string[]): Promise<Hotspot[]> {
  if (selectedSpecies && selectedSpecies.length > 0 && selectedSpecies[0]) {
    const apiHotspots = await fetchHotspotsFromApi(userLat, userLng, selectedSpecies);
    if (apiHotspots.length > 0) {
      console.log(`[Hotspots] Loaded ${apiHotspots.length} species-filtered hotspots from API route for: ${selectedSpecies[0]}`);
      return apiHotspots;
    }
  }

  const sbHotspots = await fetchHotspotsFromSupabase(userLat, userLng, selectedSpecies);
  if (sbHotspots.length > 0) {
    console.log(`[Hotspots] Loaded ${sbHotspots.length} hotspots (>= 0.60 prob) from Supabase direct query`);
    return sbHotspots;
  }

  const apiHotspots = await fetchHotspotsFromApi(userLat, userLng, selectedSpecies);
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
function mapDbRowsToHotspots(data: any[], userLat: number, userLng: number, selectedSpecies?: string[]): SupabaseHotspot[] {
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
    let species = type === 'demersal'
      ? DEMERSAL_SPECIES_SETS[idx % DEMERSAL_SPECIES_SETS.length]
      : PELAGIC_SPECIES_SETS[speciesSetIdx];

    if (selectedSpecies && selectedSpecies.length > 0) {
      const sel = selectedSpecies[0];
      if (!species.some(s => s.toLowerCase().includes(sel.toLowerCase()))) {
        species = [sel, ...species];
      }
    }

    const depth = type === 'pelagic' ? 450 : type === 'demersal' ? 45 : 120;
    
    const createdDate = item.created_at ? new Date(item.created_at) : new Date();
    const lastUpdated = createdDate.toLocaleDateString('en-US', { hour: '2-digit', minute: '2-digit' });

    const { waveHeight, windSpeed, stormSignal } = computeHotspotWaveAndWind(lat, lng);

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
      waveHeight,
      windSpeed,
      stormSignal,
      distanceKm,
      compassBearing
    };
  });
}

