/**
 * Reverse and Forward Geocoding Service using OpenStreetMap Nominatim
 */
import { fetchWithTimeout } from "../utils/fetchWithTimeout";

// Nominatim usage policy (https://operations.osmfoundation.org/policies/nominatim/):
// identify the application via User-Agent/Referer and cache results.
// Note: browsers strip forbidden headers (User-Agent/Referer) automatically —
// the headers below apply to server-side calls and are harmless client-side.
const NOMINATIM_HEADERS: Record<string, string> = {
  'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent': 'Parola_PSC/1.0 (municipal-fisherfolk-safety-app)',
  'Referer': 'https://parola-psc.app/',
};

const GEOCODE_TIMEOUT_MS = 8000;
const GEOCODE_RETRIES = 1;

export interface GeocodingResult {
  name: string;
  lat: number;
  lng: number;
  locality?: string;
  province?: string;
  fullAddress?: string;
}

// Lightweight in-memory result caches to respect the 1 req/s policy
// and keep repeated reverse lookups instant.
const REVERSE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const SEARCH_CACHE_TTL_MS = 10 * 60 * 1000;
const reverseCache = new Map<string, { timestamp: number; value: string }>();
const searchCache = new Map<string, { timestamp: number; value: GeocodingResult[] }>();

/**
 * Reverse Geocode coordinates to exact real location/address name.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const fallback = `Coastal Spot (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  // Serve cached results instantly (Nominatim policy: cache + max 1 req/s)
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = reverseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < REVERSE_CACHE_TTL_MS) {
    return cached.value;
  }

  try {
    const response = await fetchWithTimeout(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
      {
        headers: NOMINATIM_HEADERS,
        timeoutMs: GEOCODE_TIMEOUT_MS,
        retries: GEOCODE_RETRIES,
      }
    );

    if (response.ok) {
      const data = await response.json();
      const addr = data.address || {};

      const barangay = addr.village || addr.suburb || addr.neighbourhood || addr.quarter || addr.hamlet || '';
      const municipality = addr.town || addr.city || addr.municipality || addr.county || '';
      const province = addr.province || addr.state || addr.region || '';

      const parts: string[] = [];
      if (barangay) parts.push(barangay.startsWith('Barangay') || barangay.startsWith('Brgy') ? barangay : `Brgy. ${barangay}`);
      if (municipality) parts.push(municipality);
      if (province && province !== municipality) parts.push(province);

      if (parts.length > 0) {
        const value = parts.join(', ');
        reverseCache.set(cacheKey, { timestamp: Date.now(), value });
        return value;
      }

      if (data.display_name) {
        const rawParts = data.display_name.split(',').map((s: string) => s.trim());
        const value = rawParts.slice(0, 3).join(', ');
        reverseCache.set(cacheKey, { timestamp: Date.now(), value });
        return value;
      }
    }
  } catch (err) {
    console.warn('Reverse geocoding error:', err);
  }

  // Fallback string if offline or unmapped water area
  return fallback;
}

/**
 * Search locations by text query.
 */
export async function searchLocations(query: string): Promise<GeocodingResult[]> {
  if (!query || query.trim().length < 2) return [];

  const cacheKey = query.trim().toLowerCase();
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < SEARCH_CACHE_TTL_MS) {
    return cached.value;
  }

  try {
    const response = await fetchWithTimeout(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ph&limit=5&addressdetails=1`,
      {
        headers: NOMINATIM_HEADERS,
        timeoutMs: GEOCODE_TIMEOUT_MS,
        retries: GEOCODE_RETRIES,
      }
    );

    if (response.ok) {
      const data = await response.json();
      const results: GeocodingResult[] = data.map((item: any) => {
        const addr = item.address || {};
        const barangay = addr.village || addr.suburb || addr.neighbourhood || '';
        const municipality = addr.town || addr.city || addr.municipality || addr.county || '';
        const province = addr.province || addr.state || '';

        const titleParts: string[] = [];
        if (barangay) titleParts.push(barangay);
        if (municipality) titleParts.push(municipality);

        const name = titleParts.length > 0 ? titleParts.join(', ') : item.display_name.split(',')[0];

        return {
          name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          locality: municipality,
          province,
          fullAddress: item.display_name,
        };
      });
      searchCache.set(cacheKey, { timestamp: Date.now(), value: results });
      return results;
    }
  } catch (err) {
    console.warn('Search geocoding error:', err);
  }

  return [];
}
