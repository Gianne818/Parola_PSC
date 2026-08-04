/**
 * Reverse and Forward Geocoding Service using OpenStreetMap Nominatim
 */

export interface GeocodingResult {
  name: string;
  lat: number;
  lng: number;
  locality?: string;
  province?: string;
  fullAddress?: string;
}

/**
 * Reverse Geocode coordinates to exact real location/address name.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en-US,en;q=0.9',
        },
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
        return parts.join(', ');
      }

      if (data.display_name) {
        const rawParts = data.display_name.split(',').map((s: string) => s.trim());
        return rawParts.slice(0, 3).join(', ');
      }
    }
  } catch (err) {
    console.warn('Reverse geocoding error:', err);
  }

  // Fallback string if offline or unmapped water area
  return `Coastal Spot (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
}

/**
 * Search locations by text query.
 */
export async function searchLocations(query: string): Promise<GeocodingResult[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ph&limit=5&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en-US,en;q=0.9',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.map((item: any) => {
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
    }
  } catch (err) {
    console.warn('Search geocoding error:', err);
  }

  return [];
}
