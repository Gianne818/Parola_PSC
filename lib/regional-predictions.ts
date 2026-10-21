import type { Pool } from 'pg';
import type { PhilippineRegion } from '@/types';
import type { FishingAreaMetadata } from './dashboard';
import { isProfileId } from './geographic-eligibility';

export interface PredictionRow {
  id: number;
  prediction_date?: string | Date | null;
  catch_probability: string | number;
  model_type?: string | null;
  sst?: string | number | null;
  chl_a?: string | number | null;
  dbscan_cluster_id?: number | null;
  created_at?: string | null;
  target_lat: number | string | null;
  target_lon: number | string | null;
  current_u?: number | string | null;
  current_v?: number | string | null;
  current_speed?: number | string | null;
  current_heading?: number | string | null;
}

type Habitat = 'pelagic' | 'demersal';
interface PredictionSummary {
  predictions: PredictionRow[]; eligible_count: number; prediction_dates: string[];
  selected_date: string | null; as_of_date: string;
  pelagic_count: number; demersal_count: number;
  unlinked_count: number; ingestion_run_ids: string[]; ingestion_run_count: number;
  geographic_denied_count: number; geographic_unavailable_count: number;
}

export function isPredictionDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/** Pick a national date before regional/score filtering. Never fill coverage gaps
 * with older locations or the other habitat. Date coherence is not run validity.
 */
function predictionQuery(geographic: boolean): string { return `
  WITH context AS (
    SELECT (statement_timestamp() AT TIME ZONE 'Asia/Manila')::date AS as_of_date
  ), selection AS (
    SELECT COALESCE($6::date, (
      SELECT MAX(prediction_date) FROM public.daily_grid_predictions
      WHERE prediction_date <= context.as_of_date
        AND ($5::text IS NULL OR model_type = $5)
    )) AS selected_date, as_of_date FROM context
  ), eligible AS (
    SELECT predictions.*, to_jsonb(predictions)->>'ingestion_run_id' AS observed_ingestion_run_id,
      ROW_NUMBER() OVER (
        PARTITION BY ST_X(centroid_geom), ST_Y(centroid_geom), model_type
        ORDER BY created_at DESC NULLS LAST, id DESC
      ) AS location_rank
    FROM public.daily_grid_predictions AS predictions
    WHERE prediction_date = (SELECT selected_date FROM selection)
      AND ($5::text IS NULL OR model_type = $5)
      AND ($1::text IS NULL OR ST_Contains(ST_GeomFromText($1, 4326), centroid_geom))
  ), ranked AS (
    SELECT * FROM eligible WHERE location_rank = 1 AND catch_probability >= 0.25
  ), assessed AS (
    SELECT ranked.*, ${geographic ? 'decision.status' : "'not_evaluated'::text"} AS geographic_status
    FROM ranked ${geographic ? `CROSS JOIN LATERAL public.parola_geographic_eligibility(
      $7::uuid, ST_Y(centroid_geom), ST_X(centroid_geom), statement_timestamp()) AS decision` : ''}
  ), areas AS (
    SELECT * FROM assessed ${geographic ? "WHERE geographic_status = 'allowed'" : ''}
  ), selected AS (
    SELECT id, prediction_date, model_type, catch_probability, dbscan_cluster_id,
      sst, chl_a, created_at, ST_Y(centroid_geom) AS target_lat, ST_X(centroid_geom) AS target_lon,
      current_u, current_v, current_speed, current_heading,
      ST_DistanceSphere(centroid_geom, ST_SetSRID(ST_MakePoint($2, $3), 4326)) AS distance_m
    FROM areas
    ORDER BY distance_m NULLS LAST, id
    LIMIT $4
  ), summary AS (
    SELECT COUNT(*)::int AS eligible_count,
      COUNT(*) FILTER (WHERE model_type = 'pelagic')::int AS pelagic_count,
      COUNT(*) FILTER (WHERE model_type = 'demersal')::int AS demersal_count,
      COUNT(*) FILTER (WHERE observed_ingestion_run_id IS NULL)::int AS unlinked_count,
      COUNT(DISTINCT observed_ingestion_run_id)::int AS ingestion_run_count,
      (COALESCE(ARRAY_AGG(DISTINCT observed_ingestion_run_id ORDER BY observed_ingestion_run_id)
        FILTER (WHERE observed_ingestion_run_id IS NOT NULL), ARRAY[]::text[]))[1:10] AS ingestion_run_ids,
      COALESCE(ARRAY_AGG(DISTINCT prediction_date::text ORDER BY prediction_date::text DESC), ARRAY[]::text[]) AS prediction_dates
    FROM areas
  )
  SELECT summary.*, selection.selected_date::text, selection.as_of_date::text,
    (SELECT COUNT(*)::int FROM assessed WHERE geographic_status = 'denied') AS geographic_denied_count,
    (SELECT COUNT(*)::int FROM assessed WHERE geographic_status = 'unavailable') AS geographic_unavailable_count,
    COALESCE((SELECT JSONB_AGG(selected ORDER BY distance_m NULLS LAST, id) FROM selected), '[]'::jsonb) AS predictions
  FROM summary CROSS JOIN selection`; }

export const PREDICTION_QUERY_SQL = predictionQuery(false);
export const GEOGRAPHIC_PREDICTION_QUERY_SQL = predictionQuery(true);

export async function loadPredictions(db: Pick<Pool, 'query'>, options: {
  region?: PhilippineRegion; lat: number; lon: number; limit: number;
  habitat?: Habitat; predictionDate?: string;
  /** Server-resolved owner only; no public route accepts this as a client permission. */
  geographicProfileId?: string;
}) {
  const { region, lat, lon, limit, habitat, predictionDate, geographicProfileId } = options;
  const geographic = geographicProfileId !== undefined;
  if (geographic && !isProfileId(geographicProfileId)) throw new Error('Geographic access identity unavailable.');
  const ring = region?.coordinates.map(([latitude, longitude]) => `${longitude} ${latitude}`).join(',');
  const params: (string | number | null)[] = [region ? `POLYGON((${ring}))` : null, lon, lat, limit, habitat ?? null, predictionDate ?? null];
  if (geographic) params.push(geographicProfileId);
  const result = await db.query<PredictionSummary>(geographic ? GEOGRAPHIC_PREDICTION_QUERY_SQL : PREDICTION_QUERY_SQL, params);
  const row = result.rows[0];
  if (!row) throw new Error('Prediction selection unavailable.');
  const habitatStatus = (model: Habitat, count: number) => ({
    status: habitat && habitat !== model ? 'not_requested' : count > 0 ? 'available' : 'unavailable',
    eligible_count: count,
  });
  const selection = {
    requested_date: predictionDate ?? null,
    prediction_date: row.selected_date,
    as_of_date: row.as_of_date, timezone: 'Asia/Manila',
    date_status: row.selected_date === null ? 'unavailable'
      : row.selected_date === row.as_of_date ? 'today'
        : row.selected_date < row.as_of_date ? 'historical' : 'future',
    coherence: 'prediction_date_only', validity_status: 'unverified', operational_eligible: false,
    geography: {
      status: !geographic ? 'not_evaluated' : row.geographic_unavailable_count > 0
        ? row.eligible_count > 0 ? 'partial' : 'unavailable'
        : row.eligible_count === 0 && row.geographic_denied_count === 0 ? 'unavailable' : 'filtered',
      denied_count: row.geographic_denied_count, unavailable_count: row.geographic_unavailable_count,
    },
    lineage_status: row.eligible_count === 0 || row.unlinked_count === row.eligible_count ? 'unavailable'
      : row.unlinked_count > 0 || row.ingestion_run_ids.length !== 1 ? 'mixed' : 'upload_identity_only',
    ingestion_run_ids: row.ingestion_run_ids,
    ingestion_run_count: row.ingestion_run_count,
    ingestion_run_ids_capped: row.ingestion_run_count > row.ingestion_run_ids.length,
    habitats: { pelagic: habitatStatus('pelagic', row.pelagic_count), demersal: habitatStatus('demersal', row.demersal_count) },
  };
  return {
    rows: row.predictions, selection,
    metadata: region ? { region: region.id, eligibleCount: row.eligible_count, returnedCount: row.predictions.length,
      predictionDates: row.prediction_dates, capped: row.eligible_count > row.predictions.length } satisfies FishingAreaMetadata : undefined,
  };
}
