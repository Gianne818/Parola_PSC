import type { Pool } from 'pg';
import type { AdvisoryPreferences } from '@/types';
import { advisoryPreferenceInput, nextRoutineAt } from '@/lib/advisory-preferences';
import { getAuthMode } from '@/lib/auth-mode';
import { MESSAGING_CONSENT_VERSION } from '@/lib/registration';

interface Recipient extends AdvisoryPreferences { id: string; eligible: boolean }
const MANILA_OFFSET = 8 * 60 * 60 * 1000;

export function routineJobForToday(recipient: Recipient, now: Date) {
  if (!Number.isFinite(now.getTime())) throw new Error('Invalid scheduler clock');
  if (recipient.eligible !== true) return null;
  const preferences = advisoryPreferenceInput({ ...recipient });
  if (Object.keys(preferences).length !== 4) throw new Error('Incomplete advisory preferences');
  const date = new Date(now.getTime() + MANILA_OFFSET).toISOString().slice(0, 10);
  const midnight = new Date(`${date}T00:00:00+08:00`).getTime();
  const occurrence = nextRoutineAt(recipient, new Date(midnight - 1));
  if (!occurrence || new Date(Date.parse(occurrence) + MANILA_OFFSET).toISOString().slice(0, 10) !== date) return null;
  return { user_id: recipient.id, advisory_date: date, scheduled_for: occurrence,
    preferred_language: recipient.preferred_language, habitat_preference: recipient.habitat_preference };
}

export function routinePersistenceEnabled() {
  return process.env.PAROLA_ROUTINE_SCHEDULER_ENABLED === 'true'
    && getAuthMode() === 'live' && process.env.PAROLA_SMS_MODE === 'live'
    && process.env.IPROG_MOCK_MODE === 'false';
}

// Parameter values come only from persisted, verified/consenting profiles.
// A job contains no phone, message, target or assertion of safety/availability.
export async function planRoutineAdvisories(pool: Pool, dryRun = true) {
  if (typeof dryRun !== 'boolean') throw new Error('Invalid scheduler mode');
  if (!dryRun && !routinePersistenceEnabled()) throw new Error('Routine scheduling is disabled');
  const client = await pool.connect().catch(() => {
    throw new Error('Routine scheduling unavailable; no automatic retry was made.');
  });
  try {
    await client.query(dryRun ? 'BEGIN READ ONLY' : 'BEGIN');
    await client.query("SET LOCAL statement_timeout = '10s'");
    // All scheduler instances share this transaction lock; the PK also protects
    // recipient/day identity across restarts and repeated invocations.
    if (!dryRun) await client.query('SELECT pg_advisory_xact_lock(731120, 1)');
    const clock = await client.query<{ evaluated_at: Date | string }>('SELECT clock_timestamp() AS evaluated_at');
    const now = new Date(clock.rows[0].evaluated_at);
    const recipients = await client.query<Recipient>(`SELECT u.id, u.advisory_days,
      u.preferred_advisory_time::text, u.preferred_language, u.habitat_preference, TRUE AS eligible
      FROM public.users u WHERE u.is_active IS TRUE AND cardinality(u.advisory_days) > 0
        AND public.parola_sms_recipient_eligible(u.phone_e164, $1, NULL) IS TRUE`, [MESSAGING_CONSENT_VERSION]);
    const jobs = recipients.rows.map(recipient => routineJobForToday(recipient, now)).filter(job => job !== null);
    const date = new Date(now.getTime() + MANILA_OFFSET).toISOString().slice(0, 10);
    let changed: number | null = null;
    let cancelled: number | null = null;
    if (!dryRun) {
      const cancellations = await client.query(`UPDATE public.routine_advisory_jobs SET status = 'cancelled', updated_at = NOW()
        WHERE status = 'pending' AND NOT (advisory_date = $1::date AND user_id = ANY($2::uuid[]))`,
      [date, jobs.map(job => job.user_id)]);
      cancelled = cancellations.rowCount ?? 0;
      const updates = await client.query(`INSERT INTO public.routine_advisory_jobs AS existing
        (user_id, advisory_date, scheduled_for, preferred_language, habitat_preference)
        SELECT user_id, advisory_date, scheduled_for, preferred_language, habitat_preference
        FROM jsonb_to_recordset($1::jsonb) AS planned(user_id uuid, advisory_date date,
          scheduled_for timestamptz, preferred_language text, habitat_preference text)
        WHERE true
        ON CONFLICT (user_id, advisory_date) DO UPDATE SET scheduled_for = EXCLUDED.scheduled_for,
          preferred_language = EXCLUDED.preferred_language, habitat_preference = EXCLUDED.habitat_preference,
          status = 'pending', updated_at = NOW()
        WHERE existing.status IN ('pending', 'cancelled')
          AND (existing.scheduled_for, existing.preferred_language, existing.habitat_preference, existing.status)
          IS DISTINCT FROM (EXCLUDED.scheduled_for, EXCLUDED.preferred_language, EXCLUDED.habitat_preference, 'pending')`,
      [JSON.stringify(jobs)]);
      changed = updates.rowCount ?? 0;
    }
    await client.query(dryRun ? 'ROLLBACK' : 'COMMIT');
    return { dry_run: dryRun, persisted: !dryRun, advisory_date: date, evaluated_at: now.toISOString(),
      timezone: 'Asia/Manila', planned: jobs.length, due: jobs.filter(job => Date.parse(job.scheduled_for) <= now.getTime()).length,
      changed, cancelled, sent: 0 };
  } catch {
    await client.query('ROLLBACK').catch(() => {});
    throw new Error('Routine scheduling unavailable; no automatic retry was made.');
  } finally { client.release(); }
}
