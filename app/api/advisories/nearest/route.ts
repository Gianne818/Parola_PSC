import { NextResponse } from 'next/server';
import { calculateDistance } from '../../../../utils/spatial';
import { getDbPool } from '@/lib/db';
import { RATE_LIMITS, checkRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit';
import type { Pool } from 'pg';

const DEFAULT_LAT = 14.0122;
const DEFAULT_LON = 123.0114;
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 1000; // Demo: allow maximum visuals; re-clamp to 200 post-demo
const MAX_SPECIES_CHARS = 100;

interface SpeciesBounds {
  temp_min: number;
  temp_opt_low: number;
  temp_opt_high: number;
  temp_max: number;
  depth_min?: number;
  depth_max?: number;
}

interface PredictionRow {
  id: number;
  catch_probability: string | number;
  model_type?: string | null;
  sst?: string | number | null;
  chl_a?: string | number | null;
  dbscan_cluster_id?: number | null;
  created_at?: string | null;
  centroid_wkt?: string | null;
}

/** Escape LIKE wildcards so user input can't force full-table wildcard scans. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

/**
 * Query public.pelagic_species or public.demersal_species to get species bounds.
 * Table names are hardcoded (never user input); values stay parameterized.
 */
async function getSpeciesBounds(db: Pool, speciesName: string): Promise<SpeciesBounds | null> {
  const cleanedName = speciesName.split(/[\/\(\),]/)[0].trim().slice(0, MAX_SPECIES_CHARS);
  if (!cleanedName) return null;
  const searchPattern = `%${escapeLike(cleanedName)}%`;

  const tables = ['public.demersal_species', 'public.pelagic_species'];
  for (const table of tables) {
    try {
      const res = await db.query(
        `SELECT temp_min, temp_opt_low, temp_opt_high, temp_max, depth_min, depth_max
         FROM ${table}
         WHERE common_name ILIKE $1 ESCAPE '\\'
            OR species_name ILIKE $1 ESCAPE '\\'
            OR family ILIKE $1 ESCAPE '\\'
            OR local_name ILIKE $1 ESCAPE '\\'
            OR name ILIKE $1 ESCAPE '\\'
            OR $2 ILIKE '%' || common_name || '%'
         LIMIT 1`,
        [searchPattern, cleanedName]
      ).catch(async () => {
        return await db.query(
          `SELECT temp_min, temp_opt_low, temp_opt_high, temp_max, depth_min, depth_max FROM ${table} LIMIT 1`
        ).catch(() => null);
      });

      if (res && res.rows && res.rows.length > 0) {
        const r = res.rows[0];
        if (r.temp_min !== undefined && r.temp_max !== undefined) {
          return {
            temp_min: parseFloat(r.temp_min),
            temp_opt_low: parseFloat(r.temp_opt_low),
            temp_opt_high: parseFloat(r.temp_opt_high),
            temp_max: parseFloat(r.temp_max),
            depth_min: r.depth_min !== null && r.depth_min !== undefined ? parseFloat(r.depth_min) : undefined,
            depth_max: r.depth_max !== null && r.depth_max !== undefined ? parseFloat(r.depth_max) : undefined,
          };
        }
      }
    } catch {
      console.error(`[Nearest API] bounds query failed for ${table}`);
    }
  }

  return null;
}

/**
 * Compute trapezoidal temperature suitability (S_temp) from sst and species temperature bounds
 */
function calculateSTemp(sst: number, bounds: SpeciesBounds): number {
  const { temp_min, temp_opt_low, temp_opt_high, temp_max } = bounds;

  if (sst < temp_min || sst > temp_max) {
    return 0.05;
  }
  if (sst >= temp_opt_low && sst <= temp_opt_high) {
    return 1.0;
  }
  if (sst >= temp_min && sst < temp_opt_low) {
    const denom = temp_opt_low - temp_min;
    if (denom === 0) return 1.0;
    return 0.05 + 0.95 * ((sst - temp_min) / denom);
  }
  if (sst > temp_opt_high && sst <= temp_max) {
    const denom = temp_max - temp_opt_high;
    if (denom === 0) return 1.0;
    return 0.05 + 0.95 * ((temp_max - sst) / denom);
  }
  return 1.0;
}

/**
 * Compute depth suitability (S_depth) based on bathymetry depth and species depth range
 */
function calculateSDepth(depth: number, depthMin?: number, depthMax?: number): number {
  if (depthMin === undefined || depthMax === undefined || depthMin === null || depthMax === null) {
    return 1.0;
  }
  if (depth >= depthMin && depth <= depthMax) {
    return 1.0;
  }
  const margin = Math.max(10, (depthMax - depthMin) * 0.5);
  if (depth >= Math.max(0, depthMin - margin) && depth <= depthMax + margin) {
    return 0.5;
  }
  return 0.1;
}

function parseCoordinate(raw: string | null, min: number, max: number, fallback: number): number | null {
  if (raw === null) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) return null;
  return value;
}

export async function GET(request: Request) {
  try {
    const rateLimit = await checkRateLimit(request, RATE_LIMITS.nearest);
    if (!rateLimit.allowed) {
      return rateLimitExceededResponse(RATE_LIMITS.nearest, rateLimit, 'nearest');
    }
    const { searchParams } = new URL(request.url);
    const lat = parseCoordinate(searchParams.get('lat'), -90, 90, DEFAULT_LAT);
    const lon = parseCoordinate(searchParams.get('lon'), -180, 180, DEFAULT_LON);
    if (lat === null) {
      return NextResponse.json({ error: 'lat must be between -90 and 90.', hotspots: [] }, { status: 400 });
    }
    if (lon === null) {
      return NextResponse.json({ error: 'lon must be between -180 and 180.', hotspots: [] }, { status: 400 });
    }

    const limitRaw = searchParams.get('limit');
    let limit = DEFAULT_LIMIT;
    if (limitRaw !== null) {
      const parsed = Number(limitRaw);
      if (!Number.isFinite(parsed)) {
        return NextResponse.json({ error: 'limit must be a number.', hotspots: [] }, { status: 400 });
      }
      limit = Math.min(Math.max(Math.floor(parsed), 1), MAX_LIMIT);
    }

    const speciesRaw = searchParams.get('species');
    if (speciesRaw !== null && speciesRaw.length > MAX_SPECIES_CHARS) {
      return NextResponse.json({ error: 'species is too long.', hotspots: [] }, { status: 400 });
    }
    const species = speciesRaw?.trim() ? speciesRaw.trim() : null;

    const db = getDbPool(3);
    if (!db) {
      return NextResponse.json({
        error: 'Advisory service unavailable.',
        hotspots: [],
      }, { status: 503 });
    }

    let speciesBounds: SpeciesBounds | null = null;
    if (species) {
      speciesBounds = await getSpeciesBounds(db, species);
    }

    const result = await db.query(
      `SELECT
        id,
        prediction_date,
        model_type,
        catch_probability,
        dbscan_cluster_id,
        sst,
        chl_a,
        created_at,
        ST_AsText(centroid_geom) as centroid_wkt
      FROM public.daily_grid_predictions
      WHERE (
        prediction_date >= (CURRENT_DATE - INTERVAL '2 days')
        OR prediction_date = (SELECT MAX(prediction_date) FROM public.daily_grid_predictions)
      )
        AND catch_probability >= 0.60
      ORDER BY prediction_date DESC, catch_probability DESC
      LIMIT $1`,
      [limit]
    );

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json({
        hotspots: [],
        source: 'postgres_direct',
        message: 'No predictions found for today. Pipeline may not have run yet.',
      });
    }

    const hotspots = (result.rows as PredictionRow[]).map((row) => {
      let itemLat = 0, itemLng = 0;
      if (row.centroid_wkt) {
        const match = row.centroid_wkt.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
        if (match) {
          itemLng = parseFloat(match[1]);
          itemLat = parseFloat(match[2]);
        }
      }

      let catchProb = Number(row.catch_probability);
      const sstVal = row.sst !== null && row.sst !== undefined ? Number(row.sst) : null;
      const spotType = row.model_type || 'pelagic';
      const cellDepth = spotType === 'demersal' ? 45 : 250; // Estimated bathymetry depth

      if (speciesBounds) {
        if (sstVal !== null && Number.isFinite(sstVal)) {
          const sTemp = calculateSTemp(sstVal, speciesBounds);
          catchProb = catchProb * sTemp;
        }
        if (speciesBounds.depth_min !== undefined || speciesBounds.depth_max !== undefined) {
          const sDepth = calculateSDepth(cellDepth, speciesBounds.depth_min, speciesBounds.depth_max);
          catchProb = catchProb * sDepth;
        }
      }

      const distKm = calculateDistance(lat, lon, itemLat, itemLng);
      const catchProbPercent = catchProb <= 1.0 ? catchProb * 100 : catchProb;
      const efficiencyRatio = distKm > 0 ? parseFloat((catchProbPercent / distKm).toFixed(2)) : catchProbPercent;

      return {
        grid_id: row.id,
        target_lat: itemLat,
        target_lon: itemLng,
        catch_probability: catchProb,
        distance_km: distKm,
        efficiency_ratio: efficiencyRatio,
        model_type: row.model_type || 'pelagic',
        sst: sstVal,
        chl_a: row.chl_a ? Number(row.chl_a) : null,
        dbscan_cluster_id: row.dbscan_cluster_id,
        created_at: row.created_at,
      };
    });

    return NextResponse.json(
      {
        hotspots,
        source: 'postgres_direct',
        count: hotspots.length,
        ...(speciesBounds ? { species_hsi_applied: species, species_bounds: speciesBounds } : {}),
      },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' } }
    );
  } catch {
    console.error('[Nearest API] request failed');
    return NextResponse.json({
      error: 'Internal server error',
      hotspots: [],
    }, { status: 500 });
  }
}
