import { isWithinPhilippineGeofence } from '@/utils/spatial';

/** Client input hygiene only. This grants no marine permission or ocean classification. */
export function isClientCoordinate(lat: unknown, lng: unknown): boolean {
  return typeof lat === 'number' && Number.isFinite(lat) && Math.abs(lat) <= 90
    && typeof lng === 'number' && Number.isFinite(lng) && Math.abs(lng) <= 180;
}

/** Reuse the existing display extent; do not infer an ocean mask from its rectangle. */
export function isClientTargetCoordinate(lat: unknown, lng: unknown): boolean {
  return isClientCoordinate(lat, lng) && isWithinPhilippineGeofence(lat as number, lng as number);
}

/** Geocoder text is decimal input, not a JS coercion or a partially parsed number. */
export function parseCoordinateText(value: unknown): number | null {
  if (typeof value !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim())) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
