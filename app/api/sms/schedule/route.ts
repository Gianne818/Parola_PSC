import { requireAdmin } from '@/lib/route-auth';
import { getDbPool } from '@/lib/db';
import { boundedJson, RequestBodyError } from '@/lib/request-body';
import { planRoutineAdvisories, routinePersistenceEnabled } from '@/lib/routine-scheduler';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const body = await boundedJson(request);
    if (!body || typeof body !== 'object' || Array.isArray(body)
      || Object.keys(body).some(key => key !== 'dry_run')
      || ('dry_run' in body && typeof body.dry_run !== 'boolean')) {
      return json({ error: 'Use only an optional boolean dry_run field.' }, 400);
    }
    const dryRun = !('dry_run' in body) || body.dry_run === true;
    if (!dryRun && !routinePersistenceEnabled()) {
      return json({ error: 'Routine job persistence is disabled.', code: 'routine_disabled' }, 409);
    }
    const pool = getDbPool(3);
    if (!pool) return json({ error: 'Routine scheduling database is unavailable.' }, 503);
    return json(await planRoutineAdvisories(pool, dryRun));
  } catch (error) {
    if (error instanceof RequestBodyError) return json({ error: error.message, code: error.code }, error.status);
    return json({ error: 'Routine scheduling unavailable. No automatic retry was made.' }, 503);
  }
}
