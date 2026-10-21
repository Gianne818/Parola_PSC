import { getDbPool } from './db';
import { phoneE164 } from './registration';
import { geographicEnforcementEnabled, GeographicAccessError } from './geographic-access';
import { checkGeographicEligibility, isProfileId } from './geographic-eligibility';

/** Only persisted recipient/target relationships supply a fishing-advisory message. */
export async function prepareGeographicAdvisory(advisoryId: string, recipient: string, authUserId?: string) {
  if (!geographicEnforcementEnabled()) throw new GeographicAccessError(503, 'geographic_enforcement_inactive', 'Live fishing advisory access is not activated.');
  if (!isProfileId(advisoryId)) throw new GeographicAccessError(400, 'invalid_advisory', 'A valid advisory_id is required.');
  const db = getDbPool(3);
  if (!db) throw new GeographicAccessError(503, 'geographic_data_unavailable', 'Advisory storage is unavailable.');
  const result = await db.query<{ id: string; lat: number; lon: number; advisory_date: string }>(`
    SELECT u.id, ST_Y(g.centroid_geom) AS lat, ST_X(g.centroid_geom) AS lon,
      a.advisory_date::text
    FROM public.daily_advisories a JOIN public.users u ON u.id = a.user_id
    JOIN public.daily_grid_predictions g ON g.id = a.target_grid_id
    WHERE a.id = $1::uuid AND u.phone_e164 = $2 AND u.is_active IS TRUE
      AND ($3::uuid IS NULL OR u.auth_user_id = $3::uuid)
      AND a.advisory_date = (statement_timestamp() AT TIME ZONE 'Asia/Manila')::date
      AND g.prediction_date = a.advisory_date AND a.safety_status = 'NORMAL'
      AND a.sent_at IS NULL AND a.sms_message_id IS NULL
      AND g.catch_probability >= 0.25 AND g.catch_probability <= 1
      AND (u.habitat_preference = 'both' OR u.habitat_preference = g.model_type)
    LIMIT 1`, [advisoryId, phoneE164(recipient), authUserId ?? null]);
  const target = result.rows[0];
  if (!target) throw new GeographicAccessError(403, 'advisory_unavailable', 'No current eligible advisory belongs to this recipient.');
  const decision = await checkGeographicEligibility(db, target.id, target.lat, target.lon);
  if (decision.status !== 'allowed') throw new GeographicAccessError(decision.status === 'denied' ? 403 : 503,
    decision.reason, 'This fishing target is not available for the recipient.');
  // Never transmit caller-supplied text/coordinates or a stale saved SMS body as a checked target.
  return { profileId: target.id, date: target.advisory_date, lat: target.lat, lon: target.lon,
    message: `Parola advisory ${target.advisory_date}. Target: ${target.lat.toFixed(5)}, ${target.lon.toFixed(5)}. Check current official safety advisories.` };
}
