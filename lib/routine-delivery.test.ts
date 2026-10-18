import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Pool } from 'pg';
import { applyVerifiedRoutineReceipt, claimRoutineAttempt, recordRoutineOutcome } from './routine-delivery';

const user = '11111111-1111-4111-8111-111111111111';
const date = '2026-10-19';
interface StoredAttempt { id: string; user_id: string; advisory_date: string; state: string; provider_message_id: string | null }
let attempt: StoredAttempt | undefined;
let job: string;
let eligible: boolean;
let receipts: Map<string, { attempt_id: string; state: string }>;
const query = vi.fn();
const release = vi.fn();
const connect = vi.fn();
const pool = { connect } as unknown as Pool;
const start = async () => (await claimRoutineAttempt(pool, user, date))!;

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('PAROLA_ROUTINE_DELIVERY_ENABLED', 'true');
  vi.stubEnv('PAROLA_ROUTINE_SCHEDULER_ENABLED', 'true');
  vi.stubEnv('PAROLA_AUTH_MODE', 'live');
  vi.stubEnv('PAROLA_SMS_MODE', 'live');
  vi.stubEnv('IPROG_MOCK_MODE', 'false');
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('No network permitted')));
  job = 'pending'; eligible = true; attempt = undefined; receipts = new Map();
  connect.mockResolvedValue({ query, release });
  query.mockImplementation(async (sql: string, values: string[] = []) => {
    if (sql.startsWith('SELECT j.user_id')) return { rows: eligible && job === 'pending' ? [{ user_id: user }] : [] };
    if (sql.startsWith('INSERT INTO public.routine_delivery_attempts')) {
      if (attempt) throw new Error('Daily identity constraint');
      attempt = { id: values[0], user_id: user, advisory_date: date, state: 'claimed', provider_message_id: null };
    } else if (sql.startsWith('SELECT * FROM public.routine_delivery_attempts')) {
      const matches = attempt && (sql.includes('provider_message_id =') ? attempt.provider_message_id : attempt.id) === values[0];
      return { rows: matches ? [{ ...attempt }] : [] };
    } else if (sql.startsWith('UPDATE public.routine_delivery_attempts')) {
      attempt!.state = values[1];
      if (sql.includes('provider_message_id =')) attempt!.provider_message_id = values[2];
    } else if (sql.startsWith('UPDATE public.routine_advisory_jobs')) {
      job = sql.includes("status = 'claimed'") ? 'claimed' : values[2];
    } else if (sql.startsWith('INSERT INTO public.routine_delivery_receipts')) {
      if (receipts.has(values[0])) return { rows: [] };
      receipts.set(values[0], { attempt_id: values[1], state: values[2] });
      return { rows: [{ event_id: values[0] }] };
    } else if (sql.startsWith('SELECT attempt_id, state')) return { rows: [receipts.get(values[0])] };
    return { rows: [], rowCount: 1 };
  });
});
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('routine delivery claims and outcomes (mocked storage)', () => {
  it.each(['PAROLA_ROUTINE_DELIVERY_ENABLED', 'PAROLA_ROUTINE_SCHEDULER_ENABLED', 'PAROLA_AUTH_MODE', 'PAROLA_SMS_MODE', 'IPROG_MOCK_MODE'])
  ('refuses tracking before connecting without live opt-in: %s', async key => {
    vi.stubEnv(key, undefined);
    await expect(start()).rejects.toThrow('disabled');
    expect(connect).not.toHaveBeenCalled();
  });
  it('rejects malformed job dates before connecting', async () => {
    await expect(claimRoutineAttempt(pool, user, '2026-02-30')).rejects.toThrow('Invalid');
    expect(connect).not.toHaveBeenCalled();
  });
  it('claims a daily job once across repeated worker calls', async () => {
    const claimed = await start();
    expect(claimed).toMatchObject({ user_id: user, advisory_date: date, state: 'claimed' });
    expect(job).toBe('claimed');
    expect(await claimRoutineAttempt(pool, user, date)).toBeNull();
    expect(query.mock.calls.filter(([sql]) => sql.startsWith('INSERT INTO public.routine_delivery_attempts'))).toHaveLength(1);
    expect(release).toHaveBeenCalledTimes(2);
  });
  it('does not claim revoked, paused, stale or otherwise ineligible jobs', async () => {
    eligible = false;
    expect(await claimRoutineAttempt(pool, user, date)).toBeNull();
    expect(attempt).toBeUndefined();
    expect(job).toBe('pending');
  });
  it('records submitted separately from delivered and accepts duplicate acknowledgement without rewriting', async () => {
    const claimed = await start();
    const result = { state: 'submitted' as const, provider_message_id: 'provider-message-a' };
    expect(await recordRoutineOutcome(pool, claimed.id, result)).toBe(true);
    expect(job).toBe('submitted');
    expect(await recordRoutineOutcome(pool, claimed.id, result)).toBe(false);
    expect(job).not.toBe('delivered');
    expect(await claimRoutineAttempt(pool, user, date)).toBeNull();
  });
  it.each(['', 'MOCK-PAROLA-123', 'LIVE-123456', ' provider-id '])('rejects missing/synthetic provider identities: %j', async provider_message_id => {
    const claimed = await start();
    query.mockClear();
    await expect(recordRoutineOutcome(pool, claimed.id, { state: 'submitted', provider_message_id })).rejects.toThrow('real provider');
    expect(query).not.toHaveBeenCalled();
    expect(job).toBe('claimed');
  });
  it.each(['unknown', 'rejected'] as const)('holds %s outcomes without creating an automatic resend', async state => {
    const claimed = await start();
    await recordRoutineOutcome(pool, claimed.id, { state });
    expect(job).toBe(state);
    expect(await claimRoutineAttempt(pool, user, date)).toBeNull();
    await expect(recordRoutineOutcome(pool, claimed.id, { state: 'submitted', provider_message_id: 'different-submission' })).rejects.toThrow('conflicting');
  });
  it('redacts failures and rolls back/release without a second claim', async () => {
    const normal = query.getMockImplementation()!;
    query.mockImplementation(async (sql: string, values?: string[]) => {
      if (sql.startsWith('INSERT INTO public.routine_delivery_attempts')) throw new Error('private credentials');
      return normal(sql, values);
    });
    await expect(start()).rejects.toThrow('no automatic retry');
    expect(query.mock.calls.at(-1)![0]).toBe('ROLLBACK');
    expect(release).toHaveBeenCalledTimes(1);
    expect(connect).toHaveBeenCalledTimes(1);
  });
  it('does not report success when an outcome update affects no row', async () => {
    const claimed = await start();
    const normal = query.getMockImplementation()!;
    query.mockImplementation(async (sql: string, values?: string[]) => {
      if (sql.startsWith('UPDATE public.routine_delivery_attempts')) return { rows: [], rowCount: 0 };
      return normal(sql, values);
    });
    await expect(recordRoutineOutcome(pool, claimed.id, { state: 'unknown' })).rejects.toThrow('unavailable');
    expect(job).toBe('claimed');
    expect(query.mock.calls.at(-1)![0]).toBe('ROLLBACK');
  });
});

describe('verified receipt persistence (no public callback is installed)', () => {
  const submitted = async () => {
    const claimed = await start();
    await recordRoutineOutcome(pool, claimed.id, { state: 'submitted', provider_message_id: 'provider-message-a' });
    return claimed;
  };
  it('applies delivered once and deduplicates by a persisted receipt ID', async () => {
    const claimed = await submitted();
    expect(await applyVerifiedRoutineReceipt(pool, 'receipt-a', 'provider-message-a', 'delivered')).toEqual({ matched: true, changed: true });
    expect(await applyVerifiedRoutineReceipt(pool, 'receipt-a', 'provider-message-a', 'delivered')).toEqual({ matched: true, changed: false });
    expect(receipts.size).toBe(1);
    expect(job).toBe('delivered');
    expect(await recordRoutineOutcome(pool, claimed.id, { state: 'submitted', provider_message_id: 'provider-message-a' })).toBe(false);
    expect(job).toBe('delivered');
  });
  it('does not downgrade delivery on a delayed failure receipt', async () => {
    await submitted();
    await applyVerifiedRoutineReceipt(pool, 'delivery', 'provider-message-a', 'delivered');
    expect(await applyVerifiedRoutineReceipt(pool, 'late-failure', 'provider-message-a', 'delivery_failed')).toEqual({ matched: true, changed: false });
    expect(job).toBe('delivered');
  });
  it('can resolve an earlier failure with later delivery for the same provider message', async () => {
    await submitted();
    await applyVerifiedRoutineReceipt(pool, 'failure', 'provider-message-a', 'delivery_failed');
    expect(job).toBe('delivery_failed');
    await applyVerifiedRoutineReceipt(pool, 'delivery', 'provider-message-a', 'delivered');
    expect(job).toBe('delivered');
  });
  it('does not discard a receipt that arrives before submission is recorded', async () => {
    expect(await applyVerifiedRoutineReceipt(pool, 'early', 'provider-message-a', 'delivered')).toEqual({ matched: false, changed: false });
    expect(receipts.size).toBe(0);
    await submitted();
    expect(await applyVerifiedRoutineReceipt(pool, 'early', 'provider-message-a', 'delivered')).toEqual({ matched: true, changed: true });
  });
  it('rejects a reused event ID with conflicting contents', async () => {
    await submitted();
    await applyVerifiedRoutineReceipt(pool, 'receipt-a', 'provider-message-a', 'delivered');
    await expect(applyVerifiedRoutineReceipt(pool, 'receipt-a', 'provider-message-a', 'delivery_failed')).rejects.toThrow('conflicting');
    expect(job).toBe('delivered');
  });
  it('rejects malformed receipt data before storage', async () => {
    await expect(applyVerifiedRoutineReceipt(pool, '', 'provider-message-a', 'delivered')).rejects.toThrow('Invalid');
    expect(connect).not.toHaveBeenCalled();
  });
});
