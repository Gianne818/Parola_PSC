'use client';

import { supabase } from '../lib/supabase';
import { calculateDistance, calculateBearing } from '../utils/spatial';
import { Hotspot } from '../types';

export interface SupabaseHotspot extends Hotspot {
  dbscan_cluster_id?: number;
}

export async function fetchHotspotsFromSupabase(userLat: number, userLng: number): Promise<SupabaseHotspot[]> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('daily_grid_predictions')
      .select('id, prediction_date, model_type, catch_probability, dbscan_cluster_id, sst, chl_a, created_at, centroid_geom:centroid_geom::text')
      .eq('prediction_date', today)
      .gte('catch_probability', 0.5)
      .order('catch_probability', { ascending: false })
      .limit(20);

    if (error) {
      console.warn('Error fetching hotspots from Supabase:', error.message);
      return [];
    }
    
    if (!data) return [];

    return data.map((item: any) => {
      let lat = 0, lng = 0;
      if (item.centroid_geom) {
        const match = item.centroid_geom.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
        if (match) {
          lng = parseFloat(match[1]);
          lat = parseFloat(match[2]);
        }
      }

      const distanceKm = calculateDistance(userLat, userLng, lat, lng);
      const compassBearing = calculateBearing(userLat, userLng, lat, lng);

      let type: 'pelagic' | 'demersal' | 'both' = 'both';
      if (item.model_type === 'pelagic') {
        type = 'pelagic';
      } else if (item.model_type === 'demersal') {
        type = 'demersal';
      }

      const species = type === 'pelagic' 
        ? ["Tamban", "Tuna", "Galunggong"] 
        : type === 'demersal'
          ? ["Lapu-lapu", "Maya-maya", "Alimasag"]
          : ["Tuna", "Maya-maya", "Sapsap"];

      const depth = type === 'pelagic' ? 450 : type === 'demersal' ? 45 : 120;
      
      const createdDate = item.created_at ? new Date(item.created_at) : new Date();
      const lastUpdated = createdDate.toLocaleDateString('en-US', { hour: '2-digit', minute: '2-digit' });

      return {
        id: item.id.toString(),
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
  } catch (err) {
    console.warn('Unexpected error in fetchHotspotsFromSupabase:', err);
    return [];
  }
}

export async function fetchHotspotsDirect(apiBaseUrl: string, lat: number, lng: number): Promise<Hotspot[]> {
  try {
    const res = await fetch(`${apiBaseUrl}/api/advisories/nearest?lat=${lat}&lon=${lng}&limit=20`);
    if (!res.ok) {
      console.warn('Error fetching hotspots from API:', res.statusText);
      return [];
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('Unexpected error in fetchHotspotsDirect:', err);
    return [];
  }
}

export async function fetchHotspots(userLat: number, userLng: number): Promise<Hotspot[]> {
  const sbHotspots = await fetchHotspotsFromSupabase(userLat, userLng);
  if (sbHotspots.length > 0) return sbHotspots;
  
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (apiBaseUrl) {
    return fetchHotspotsDirect(apiBaseUrl, userLat, userLng);
  }
  
  return [];
}
