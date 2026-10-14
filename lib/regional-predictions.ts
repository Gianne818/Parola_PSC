import type { Pool } from 'pg';
import type { PhilippineRegion } from '@/types';
import type { FishingAreaMetadata } from './dashboard';

export interface PredictionRow {
  id: number;
  prediction_date?: string | Date | null;
  catch_probability: string | number;
  model_type?: string | null;
  sst?: string | number | null;
  chl_a?: string | number | null;
  dbscan_cluster_id?: number | null;
  created_at?: string | null;
  centroid_wkt?: string | null;
}

interface RegionalSummary { predictions: PredictionRow[]; eligible_count: number; prediction_dates: string[] }

/** Scope and deduplicate before limiting; national ranking must not hide local areas. */
export const REGIONAL_PREDICTIONS_SQL = `
  WITH eligible AS (
    SELECT *, ROW_NUMBER() OVER (
      PARTITION BY ST_X(centroid_geom), ST_Y(centroid_geom), model_type
      ORDER BY prediction_date DESC, created_at DESC NULLS LAST, id DESC
    ) AS location_rank
    FROM public.daily_grid_predictions
    WHERE (prediction_date >= CURRENT_DATE - INTERVAL '2 days'
      OR prediction_date = (SELECT MAX(prediction_date) FROM public.daily_grid_predictions))
      AND catch_probability >= 0.60
      AND ST_Contains(ST_GeomFromText($1, 4326), centroid_geom)
  ), areas AS (
    SELECT * FROM eligible WHERE location_rank = 1
  ), summary AS (
    SELECT COUNT(*)::int AS eligible_count,
      COALESCE(ARRAY_AGG(DISTINCT prediction_date::text ORDER BY prediction_date::text DESC), ARRAY[]::text[]) AS prediction_dates
    FROM areas
  ), selected AS (
    SELECT id, prediction_date, model_type, catch_probability, dbscan_cluster_id,
      sst, chl_a, created_at, ST_AsText(centroid_geom) AS centroid_wkt,
      ST_DistanceSphere(centroid_geom, ST_SetSRID(ST_MakePoint($2, $3), 4326)) AS distance_m
    FROM areas
    ORDER BY distance_m, id
    LIMIT $4
  )
  SELECT summary.*, COALESCE((SELECT JSONB_AGG(selected ORDER BY distance_m, id) FROM selected), '[]'::jsonb) AS predictions
  FROM summary`;

export async function loadRegionalPredictions(db: Pick<Pool, 'query'>, region: PhilippineRegion, lat: number, lon: number, limit: number): Promise<{ rows: PredictionRow[]; metadata: FishingAreaMetadata }> {
  const ring = region.coordinates.map(([latitude, longitude]) => `${longitude} ${latitude}`).join(',');
  const result = await db.query<RegionalSummary>(REGIONAL_PREDICTIONS_SQL, [`POLYGON((${ring}))`, lon, lat, limit]);
  const row = result.rows[0];
  return {
    rows: row.predictions,
    metadata: { region: region.id, eligibleCount: row.eligible_count, returnedCount: row.predictions.length,
      predictionDates: row.prediction_dates, capped: row.eligible_count > row.predictions.length },
  };
}
