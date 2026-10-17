import { NextResponse } from 'next/server';
import { calculateDistance } from '../../../../utils/spatial';
import { getDbPool } from '@/lib/db';
import { RATE_LIMITS, checkRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit';
import { loadSpeciesProfile, environmentalNumber, type SpeciesProfile } from '@/lib/species-catalog';
import { PHILIPPINE_REGIONS } from '@/data/philippineRegions';
import { loadRegionalPredictions, type PredictionRow } from '@/lib/regional-predictions';

const DEFAULT_LAT = 14.0122;
const DEFAULT_LON = 123.0114;
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 1000; // Demo: allow maximum visuals; re-clamp to 200 post-demo
const MAX_SPECIES_CHARS = 100;

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
    const regionId = searchParams.get('region');
    const region = PHILIPPINE_REGIONS.find(item => item.id === regionId);
    if (regionId !== null && !region) {
      return NextResponse.json({ error: 'Unknown advisory region.', hotspots: [] }, { status: 400 });
    }

    const db = getDbPool(3);
    if (!db) {
      return NextResponse.json({
        error: 'Advisory service unavailable.',
        hotspots: [],
      }, { status: 503 });
    }

    let speciesProfile: SpeciesProfile | null = null;
    if (species) {
      try { speciesProfile = await loadSpeciesProfile(db, species); }
      catch { return NextResponse.json({ error: 'Species catalog is unavailable.', code: 'species_catalog_unavailable', species_status: 'unavailable', hotspots: [] }, { status: 503 }); }
      if (!speciesProfile) return NextResponse.json({ error: 'Species is unsupported or ambiguous. Use a catalog identifier.', code: 'species_unsupported', species_status: 'unsupported', hotspots: [] }, { status: 422 });
    }

    const result = region ? await loadRegionalPredictions(db, region, lat, lon, limit, speciesProfile?.category) : await db.query(
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
        AND catch_probability >= 0.25
        AND ($2::text IS NULL OR model_type = $2)
      ORDER BY prediction_date DESC, catch_probability DESC
      LIMIT $1`,
      [limit, speciesProfile?.category ?? null]
    );

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json({
        hotspots: [],
        source: 'postgres_direct',
        message: 'No stored predictions match this query.',
        species_status: speciesProfile ? 'resolved' : 'not_requested',
        prediction_scope: 'habitat_model', species_hsi_status: species ? 'unavailable' : 'not_requested',
        ...('metadata' in result ? { metadata: result.metadata } : {}),
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

      const catchProb = Number(row.catch_probability);
      const sstVal = environmentalNumber(row.sst);
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
        model_type: row.model_type ?? null,
        model_type_known: row.model_type === 'pelagic' || row.model_type === 'demersal' || row.model_type === 'both',
        sst: sstVal,
        chl_a: environmentalNumber(row.chl_a),
        depth: null, depth_status: 'unavailable', depth_unit: 'm',
        environment_provenance: 'legacy_unverified',
        prediction_scope: 'habitat_model', species_hsi_status: species ? 'unavailable' : 'not_requested',
        dbscan_cluster_id: row.dbscan_cluster_id,
        created_at: row.created_at,
        prediction_date: row.prediction_date,
      };
    });

    return NextResponse.json(
      {
        hotspots,
        source: 'postgres_direct',
        count: hotspots.length,
        ...('metadata' in result ? { metadata: result.metadata } : {}),
        species_status: speciesProfile ? 'resolved' : 'not_requested',
        ...(speciesProfile ? { species_profile: speciesProfile } : {}),
        prediction_scope: 'habitat_model',
        species_hsi_status: species ? 'unavailable' : 'not_requested',
        species_hsi_reason: species ? 'Validated HSI inputs and real depth are not available; habitat scores are unchanged.' : null,
        weather_endpoint: '/api/dashboard/weather',
        provenance: 'legacy_unverified',
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
