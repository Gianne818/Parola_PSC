import { GET as nearest } from '../nearest/route';
import { geographicOwner, GeographicAccessError } from '@/lib/geographic-access';
import { getAuthMode } from '@/lib/auth-mode';

/** Current prediction data only; not a paid Geo-Pack, forecast or device certification. */
export async function GET(request: Request) {
  try {
    await geographicOwner(request);
    const url = new URL(request.url);
    url.pathname = '/api/advisories/nearest';
    const response = await nearest(new Request(url, { headers: request.headers }));
    if (!response.ok) return response;
    const data = await response.json();
    const geographicStatus = data.selection?.geography?.status;
    const preview = geographicStatus === 'not_evaluated' && getAuthMode() === 'demo';
    if (geographicStatus !== 'filtered' && !preview) {
      return Response.json({ error: 'Complete geographic coverage is unavailable for this export.',
        code: 'geographic_data_unavailable' }, { status: 503 });
    }
    const features = data.hotspots.map((row: { grid_id: number; target_lat: number; target_lon: number;
      model_type: string; prediction_date: string; catch_probability: number }) => ({
      type: 'Feature', geometry: { type: 'Point', coordinates: [row.target_lon, row.target_lat] },
      properties: { grid_id: row.grid_id, model_type: row.model_type, prediction_date: row.prediction_date,
        model_score: row.catch_probability, validity_status: 'unverified' },
    }));
    return new Response(JSON.stringify({ type: 'FeatureCollection', features, selection: data.selection,
      export_mode: preview ? 'demo_preview' : 'geographically_filtered',
      operational_eligible: false, provenance: 'legacy_unverified' }), {
      headers: { 'Content-Type': 'application/geo+json', 'Cache-Control': 'no-store',
        'Content-Disposition': 'attachment; filename="parola-predictions-unverified.geojson"' },
    });
  } catch (error) {
    if (error instanceof GeographicAccessError) return Response.json({ error: error.message, code: error.code }, { status: error.status });
    return Response.json({ error: 'Prediction export unavailable.' }, { status: 503 });
  }
}
