import { NextResponse } from 'next/server';
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '14.0122');
    const lon = parseFloat(searchParams.get('lon') || '123.0114');
    const limit = parseInt(searchParams.get('limit') || '1000');

    const db = getPool();
    if (!db) {
      return NextResponse.json({
        error: 'DATABASE_URL not configured',
        hotspots: [],
      }, { status: 503 });
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

      return {
        grid_id: row.id,
        target_lat: itemLat,
        target_lon: itemLng,
        catch_probability: parseFloat(row.catch_probability),
        model_type: row.model_type || 'pelagic',
        sst: row.sst ? parseFloat(row.sst) : null,
        chl_a: row.chl_a ? parseFloat(row.chl_a) : null,
        dbscan_cluster_id: row.dbscan_cluster_id,
        created_at: row.created_at,
      };
    });

    return NextResponse.json({
      hotspots,
      source: 'postgres_direct',
      count: hotspots.length,
    });
  } catch (err: any) {
    console.error('Error in /api/advisories/nearest:', err);
    return NextResponse.json({
      error: err.message || 'Internal server error',
      hotspots: [],
    }, { status: 500 });
  }
}
