import { randomUUID } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import { routinePersistenceEnabled } from '@/lib/routine-scheduler';
import { MESSAGING_CONSENT_VERSION } from '@/lib/registration';

type State = 'claimed' | 'submitted' | 'delivered' | 'delivery_failed' | 'rejected' | 'unknown';
interface Attempt { id: string; user_id: string; advisory_date: string; state: State; provider_message_id: string | null }
type Outcome = { state: 'submitted'; provider_message_id: string } | { state: 'rejected' | 'unknown' };
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const validId = (value: unknown): value is string => typeof value === 'string' && value.trim() === value
  && value.length > 0 && value.length <= 200 && !/[\x00-\x1f\x7f]/.test(value);

async function updateJob(client: PoolClient, attempt: Pick<Attempt, 'user_id' | 'advisory_date'>, state: State) {
  const updated = await client.query(`UPDATE public.routine_advisory_jobs SET status = $3, updated_at = NOW()
    WHERE user_id = $1 AND advisory_date = $2::date`, [attempt.user_id, attempt.advisory_date, state]);
  if (updated.rowCount !== 1) throw new Error('Job state was not saved');
}

// Internal persistence functions only. No sender, network call or public hook.
async function transaction<T>(pool: Pool, action: (client: PoolClient) => Promise<T>): Promise<T> {
  if (process.env.PAROLA_ROUTINE_DELIVERY_ENABLED !== 'true' || !routinePersistenceEnabled()) {
    throw new Error('Routine delivery tracking is disabled');
  }
  const client = await pool.connect().catch(() => { throw new Error('Delivery tracking unavailable; no automatic retry was made.'); });
  try {
    await client.query('BEGIN');
    await client.query("SET LOCAL statement_timeout = '10s'");
    // Same lock as the planner: planning and delivery-state changes cannot
    // reactivate or overwrite a claim in a competing scheduler transaction.
    await client.query('SELECT pg_advisory_xact_lock(731120, 1)');
    const result = await action(client);
    await client.query('COMMIT');
    return result;
  } catch {
    await client.query('ROLLBACK').catch(() => {});
    throw new Error('Delivery tracking unavailable or conflicting outcome; no automatic retry was made.');
  } finally { client.release(); }
}

export async function claimRoutineAttempt(pool: Pool, userId: string, date: string) {
  if (!uuid.test(userId) || !/^\d{4}-\d{2}-\d{2}$/.test(date)
    || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) throw new Error('Invalid routine job identity');
  return transaction(pool, async client => {
    const job = await client.query(`SELECT j.user_id FROM public.routine_advisory_jobs j
      JOIN public.users u ON u.id = j.user_id
      WHERE j.user_id = $1 AND j.advisory_date = $2::date AND j.status = 'pending'
        AND j.scheduled_for <= clock_timestamp()
        AND j.advisory_date = (clock_timestamp() AT TIME ZONE 'Asia/Manila')::date
        AND public.parola_sms_recipient_eligible(u.phone_e164, $3, NULL) IS TRUE
        AND extract(isodow FROM j.advisory_date)::smallint = ANY(u.advisory_days)
        AND j.scheduled_for = ((j.advisory_date + u.preferred_advisory_time) AT TIME ZONE 'Asia/Manila')
        AND j.preferred_language = u.preferred_language AND j.habitat_preference = u.habitat_preference
      FOR UPDATE OF j`, [userId, date, MESSAGING_CONSENT_VERSION]);
    if (!job.rows.length) return null;
    const id = randomUUID();
    const inserted = await client.query(`INSERT INTO public.routine_delivery_attempts (id, user_id, advisory_date, state)
      VALUES ($1, $2, $3::date, 'claimed')`, [id, userId, date]);
    if (inserted.rowCount !== 1) throw new Error('Attempt was not saved');
    await updateJob(client, { user_id: userId, advisory_date: date }, 'claimed');
    return { id, user_id: userId, advisory_date: date, state: 'claimed' as const };
  });
}

export async function recordRoutineOutcome(pool: Pool, id: string, outcome: Outcome) {
  if (!uuid.test(id) || !['submitted', 'rejected', 'unknown'].includes(outcome.state)) throw new Error('Invalid delivery outcome');
  const messageId = outcome.state === 'submitted' ? outcome.provider_message_id : null;
  if (outcome.state === 'submitted' && (!validId(messageId) || /^(?:MOCK-|LIVE-\d+$)/.test(messageId))) {
    throw new Error('A real provider message identity is required');
  }
  return transaction(pool, async client => {
    const result = await client.query<Attempt>('SELECT * FROM public.routine_delivery_attempts WHERE id = $1 FOR UPDATE', [id]);
    const attempt = result.rows[0];
    if (!attempt) throw new Error('Unknown attempt');
    if (attempt.state === outcome.state && attempt.provider_message_id === messageId) return false;
    if (outcome.state === 'submitted' && attempt.provider_message_id === messageId
      && ['delivered', 'delivery_failed'].includes(attempt.state)) return false;
    if (attempt.state !== 'claimed') throw new Error('Conflicting outcome');
    const updated = await client.query(`UPDATE public.routine_delivery_attempts SET state = $2, provider_message_id = $3,
      updated_at = NOW() WHERE id = $1`, [id, outcome.state, messageId]);
    if (updated.rowCount !== 1) throw new Error('Outcome was not saved');
    await updateJob(client, attempt, outcome.state);
    return true;
  });
}

// Call only after a future gateway adapter authenticates/normalizes its receipt.
// Deliberately not wired to the unrelated incoming-feedback webhook.
export async function applyVerifiedRoutineReceipt(pool: Pool, eventId: string, messageId: string, state: 'delivered' | 'delivery_failed') {
  if (!validId(eventId) || !validId(messageId) || !['delivered', 'delivery_failed'].includes(state)) throw new Error('Invalid delivery receipt');
  return transaction(pool, async client => {
    const result = await client.query<Attempt>('SELECT * FROM public.routine_delivery_attempts WHERE provider_message_id = $1 FOR UPDATE', [messageId]);
    const attempt = result.rows[0];
    // Do not mark an unmatched early receipt seen: a later authenticated retry
    // can be processed once submission recording commits.
    if (!attempt) return { matched: false, changed: false };
    const inserted = await client.query(`INSERT INTO public.routine_delivery_receipts(event_id, attempt_id, state)
      VALUES ($1, $2, $3) ON CONFLICT (event_id) DO NOTHING RETURNING event_id`, [eventId, attempt.id, state]);
    if (!inserted.rows.length) {
      const previous = await client.query('SELECT attempt_id, state FROM public.routine_delivery_receipts WHERE event_id = $1', [eventId]);
      if (previous.rows[0]?.attempt_id !== attempt.id || previous.rows[0]?.state !== state) throw new Error('Conflicting receipt');
      return { matched: true, changed: false };
    }
    // A delayed failure cannot downgrade confirmed delivery. A later delivery
    // confirmation can resolve an earlier failure for the same provider ID.
    if (attempt.state === 'delivered' || attempt.state === state) return { matched: true, changed: false };
    if (!['submitted', 'delivery_failed'].includes(attempt.state)) throw new Error('Invalid receipt transition');
    const updated = await client.query(`UPDATE public.routine_delivery_attempts SET state = $2, updated_at = NOW() WHERE id = $1`, [attempt.id, state]);
    if (updated.rowCount !== 1) throw new Error('Receipt state was not saved');
    await updateJob(client, attempt, state);
    return { matched: true, changed: true };
  });
}
