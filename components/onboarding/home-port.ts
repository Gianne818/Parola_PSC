import { detectPhilippineRegion, PHILIPPINE_REGIONS } from '@/data/philippineRegions';
import type { GeocodingResult } from '@/services/geocodingService';
import type { PhilippineRegion, UserProfile } from '@/types';

export interface PortSelection {
  name: string;
  coordinates: [number, number];
  province?: string;
  region: PhilippineRegion;
}

export const PORT_PRESETS: GeocodingResult[] = [
  { name: 'Cebu Port Authority (Pier 1)', lat: 10.2936, lng: 123.9056, province: 'Cebu' },
  { name: 'Bantayan Daanbantayan Port', lat: 11.2750, lng: 123.6820, province: 'Cebu' },
  { name: 'Mercedes Fish Port', lat: 14.0122, lng: 123.0114, province: 'Camarines Norte' },
  { name: 'Estancia Shoreline Port', lat: 11.4552, lng: 123.1491, province: 'Iloilo' },
  { name: 'Navotas Fish Port Complex', lat: 14.6406, lng: 120.9419, province: 'Metro Manila' },
  { name: 'General Santos Fish Port', lat: 6.0592, lng: 125.1436, province: 'South Cotabato' },
  { name: 'Batangas Coastal Pier', lat: 13.7565, lng: 121.0583, province: 'Batangas' },
  { name: 'Lucena Harbour Port', lat: 13.8967, lng: 121.6263, province: 'Quezon' },
  { name: 'Aparri Port Base', lat: 18.3551, lng: 121.6412, province: 'Cagayan' },
  { name: 'Zamboanga Port', lat: 6.9075, lng: 122.0785, province: 'Zamboanga' },
  { name: 'Nasugbu Fishing Bay', lat: 14.0722, lng: 120.6275, province: 'Batangas' },
  { name: 'Sual Fish Port', lat: 16.0689, lng: 120.1031, province: 'Pangasinan' },
  { name: 'Real Port Terminal', lat: 14.6625, lng: 121.6031, province: 'Quezon' },
  { name: 'Davao Gulf Base', lat: 7.0731, lng: 125.6128, province: 'Davao' },
  { name: 'Sariaya Shoreline', lat: 13.9167, lng: 121.5167, province: 'Quezon' },
  { name: 'Bredco Sea Port', lat: 10.6764, lng: 122.9322, province: 'Negros Occidental' },
];

export function isInCoverage(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= 4.5 && lat <= 21.5 && lng >= 116 && lng <= 127;
}

export function provinceFromAddress(address: string): string | undefined {
  const normalized = address.toLowerCase();
  return [...new Set(PHILIPPINE_REGIONS.flatMap((region) => region.provinces))]
    .sort((a, b) => b.length - a.length)
    .find((province) => normalized.includes(province.toLowerCase()));
}

export function createPortSelection(location: GeocodingResult): PortSelection {
  if (!isInCoverage(location.lat, location.lng)) throw new Error('Choose a home port inside Parola’s Philippine advisory coverage.');
  const province = location.province || provinceFromAddress(location.fullAddress || location.name);
  return {
    name: location.name,
    coordinates: [location.lat, location.lng],
    province,
    region: detectPhilippineRegion(location.lat, location.lng, `${location.fullAddress || location.name} ${province || ''}`),
  };
}

export function homePortProfilePatch(selection: PortSelection): Partial<UserProfile> {
  return {
    port: selection.name,
    lat: selection.coordinates[0],
    lng: selection.coordinates[1],
    province: selection.province || '',
    regionId: selection.region.id,
    regionName: selection.region.name,
    fmaZone: selection.region.fmaZone,
    regionalBounds: selection.region.bounds,
  };
}
