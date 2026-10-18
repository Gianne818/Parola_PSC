import type { Pool } from 'pg';

export type GeographicDecision = {
  status: 'allowed' | 'denied' | 'unavailable';
  reason: 'allowed' | 'restricted_area' | 'outside_permitted_area' | 'access_unverified'
    | 'boundary_policy_unresolved' | 'geographic_data_unavailable' | 'invalid_coordinates';
};

export function isProfileId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/** Caller resolves profileId from server authentication, never from a client region/tier.
 * No transport, clock override, migration, provider call or dataset activation occurs.
 */
export async function checkGeographicEligibility(db: Pick<Pool, 'query'>, profileId: string,
  lat: number, lon: number): Promise<GeographicDecision> {
  if (!isProfileId(profileId)) return { status: 'unavailable', reason: 'access_unverified' };
  if (typeof lat !== 'number' || typeof lon !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lon)
    || Math.abs(lat) > 90 || Math.abs(lon) > 180 || (lat === 0 && lon === 0)) {
    return { status: 'unavailable', reason: 'invalid_coordinates' };
  }
  try {
    const result = await db.query<GeographicDecision>(
      'SELECT status, reason FROM public.parola_geographic_eligibility($1::uuid, $2, $3, statement_timestamp())',
      [profileId, lat, lon]);
    const decision = result.rows[0];
    const reasons = { allowed: ['allowed'], denied: ['restricted_area','outside_permitted_area'],
      unavailable: ['access_unverified','boundary_policy_unresolved','geographic_data_unavailable','invalid_coordinates'] };
    if (decision && reasons[decision.status]?.includes(decision.reason)) return decision;
  } catch { /* Missing schema or failed storage is unavailable; never allow by fallback. */ }
  return { status: 'unavailable', reason: 'geographic_data_unavailable' };
}
