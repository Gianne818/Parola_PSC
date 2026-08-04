import { NextResponse } from 'next/server';
// @ts-ignore
import { Pool } from 'pg';

// Server-side PostgreSQL pool for direct database queries
// Uses DATABASE_URL from .env to connect to Supabase PostGIS
let pool: Pool | null = null;

function getPool(): Pool | null {
  if (pool) return pool;
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return null;

  pool = new Pool({
    connectionString: dbUrl.replace('?pgbouncer=true', ''),
    max: 3,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: { rejectUnauthorized: false },
  });
  return pool;
}

interface SpeciesTempBounds {
  temp_min: number;
  temp_opt_low: number;
  temp_opt_high: number;
  temp_max: number;
}

/**
 * Query public.pelagic_species or public.demersal_species using PostgreSQL pool to get species temperature bounds
 */
async function getSpeciesTemperatureBounds(db: Pool, speciesName: string): Promise<SpeciesTempBounds | null> {
  if (!speciesName) return null;

  const cleanedName = speciesName.split(/[\/\(\),]/)[0].trim();
  const searchPattern = `%${cleanedName}%`;

  const tables = ['public.pelagic_species', 'public.demersal_species'];
  for (const table of tables) {
    try {
      const res = await db.query(
        `SELECT temp_min, temp_opt_low, temp_opt_high, temp_max
         FROM ${table}
         WHERE common_name ILIKE $1 
            OR species_name ILIKE $1 
            OR family ILIKE $1 
            OR local_name ILIKE $1
            OR name ILIKE $1
            OR $2 ILIKE '%' || common_name || '%'
         LIMIT 1`,
        [searchPattern, cleanedName]
      ).catch(async () => {
        // Fallback if specific search column names do not exist
        return await db.query(
          `SELECT temp_min, temp_opt_low, temp_opt_high, temp_max FROM ${table} LIMIT 1`
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
          };
        }
      }
    } catch (err) {
      console.warn(`Error querying bounds in ${table}:`, err);
    }
  }

  return null;
}

/**
 * Compute trapezoidal temperature suitability (S_temp) from sst and species temperature bounds
 */
function calculateSTemp(sst: number, bounds: SpeciesTempBounds): number {
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '14.0122');
    const lon = parseFloat(searchParams.get('lon') || '123.0114');
    const limit = parseInt(searchParams.get('limit') || '1000');
    const species = searchParams.get('species');

    const db = getPool();
    if (!db) {
      return NextResponse.json({
        error: 'DATABASE_URL not configured',
        hotspots: [],
      }, { status: 503 });
    }

    let speciesBounds: SpeciesTempBounds | null = null;
    if (species) {
      speciesBounds = await getSpeciesTemperatureBounds(db, species);
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
      WHERE prediction_date >= (CURRENT_DATE - INTERVAL '2 days')
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

    const hotspots = result.rows.map((row: any) => {
      let itemLat = 0, itemLng = 0;
      if (row.centroid_wkt) {
        const match = row.centroid_wkt.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
        if (match) {
          itemLng = parseFloat(match[1]);
          itemLat = parseFloat(match[2]);
        }
      }

      let catchProb = parseFloat(row.catch_probability);
      const sstVal = row.sst !== null && row.sst !== undefined ? parseFloat(row.sst) : null;

      if (speciesBounds && sstVal !== null && !isNaN(sstVal)) {
        const sTemp = calculateSTemp(sstVal, speciesBounds);
        catchProb = catchProb * sTemp;
      }

      return {
        grid_id: row.id,
        target_lat: itemLat,
        target_lon: itemLng,
        catch_probability: catchProb,
        model_type: row.model_type || 'pelagic',
        sst: sstVal,
        chl_a: row.chl_a ? parseFloat(row.chl_a) : null,
        dbscan_cluster_id: row.dbscan_cluster_id,
        created_at: row.created_at,
      };
    });

    return NextResponse.json({
      hotspots,
      source: 'postgres_direct',
      count: hotspots.length,
      ...(speciesBounds ? { species_hsi_applied: species, species_bounds: speciesBounds } : {}),
    });
  } catch (err: any) {
    console.error('Error in /api/advisories/nearest:', err);
    return NextResponse.json({
      error: err.message || 'Internal server error',
      hotspots: [],
    }, { status: 500 });
  }
}

