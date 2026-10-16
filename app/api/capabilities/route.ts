import { getDbPool } from '@/lib/db';
import { CAPABILITY_IDS, capabilityStatus, type CapabilityRecord } from '@/lib/capabilities';

/** Public implementation metadata. No client input or environment flag proves readiness. */
export async function GET() {
  try {
    const db = getDbPool(3);
    if (!db) throw new Error('Unavailable');
    const result = await db.query<CapabilityRecord>(`SELECT capability_id,status,summary,evidence_reference,verified_at,valid_until
      FROM public.service_capabilities WHERE capability_id = ANY($1::text[]) ORDER BY capability_id`, [CAPABILITY_IDS]);
    if (result.rows.length !== CAPABILITY_IDS.length || new Set(result.rows.map(row => row.capability_id)).size !== CAPABILITY_IDS.length) throw new Error('Incomplete capability evidence');
    return Response.json({ source: 'database', capabilities: result.rows.map(row => capabilityStatus(row)),
      language: { supported_preferences: ['en','tl','ceb','hil'], message_language: 'en', reviewed_translations: false },
      weather_endpoint: '/api/dashboard/weather' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Capability status is unavailable.', code: 'capabilities_unavailable', capabilities: [] }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
