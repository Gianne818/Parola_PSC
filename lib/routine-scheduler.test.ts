import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Pool } from 'pg';
import { planRoutineAdvisories, routineJobForToday, routinePersistenceEnabled } from './routine-scheduler';

const recipient = { id: '11111111-1111-4111-8111-111111111111', eligible: true,
  advisory_days: [1] as [1], preferred_advisory_time: '05:00:00', preferred_language: 'en' as const, habitat_preference: 'both' as const };
const now = new Date('2026-10-18T21:00:00Z'); // Monday 05:00 Manila, Sunday UTC.
const query = vi.fn();
const release = vi.fn();
const connect = vi.fn();
const pool = { connect } as unknown as Pool;
const enable = () => {
  vi.stubEnv('PAROLA_ROUTINE_SCHEDULER_ENABLED', 'true');
  vi.stubEnv('PAROLA_AUTH_MODE', 'live');
  vi.stubEnv('PAROLA_SMS_MODE', 'live');
  vi.stubEnv('IPROG_MOCK_MODE', 'false');
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('PAROLA_ROUTINE_SCHEDULER_ENABLED', 'false');
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network forbidden')));
  connect.mockResolvedValue({ query, release });
  query.mockImplementation(async (sql: string) => {
    if (sql.includes('clock_timestamp()')) return { rows: [{ evaluated_at: now }] };
    if (sql.startsWith('SELECT u.id')) return { rows: [recipient] };
    return { rows: [], rowCount: 0 };
  });
});
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('Manila routine occurrence', () => {
  it('uses the Manila weekday/date across the UTC boundary and includes the exact due time', () => {
    expect(routineJobForToday(recipient, now)).toEqual({ user_id: recipient.id, advisory_date: '2026-10-19',
      scheduled_for: '2026-10-18T21:00:00.000Z', preferred_language: 'en', habitat_preference: 'both' });
  });
  it('plans the same occurrence before and after its due time without creating tomorrow or replaying yesterday', () => {
    expect(routineJobForToday(recipient, new Date('2026-10-18T16:00:00Z'))).toEqual(routineJobForToday(recipient, now));
    expect(routineJobForToday(recipient, new Date('2026-10-19T15:59:59Z'))).toEqual(routineJobForToday(recipient, now));
    expect(routineJobForToday(recipient, new Date('2026-10-19T16:00:00Z'))).toBeNull();
    expect(routineJobForToday(recipient, new Date('2026-10-18T15:59:59Z'))).toBeNull();
  });
  it('supports midnight and second precision', () => {
    expect(routineJobForToday({ ...recipient, preferred_advisory_time: '00:00:17' }, now)?.scheduled_for).toBe('2026-10-18T16:00:17.000Z');
    expect(routineJobForToday({ ...recipient, preferred_advisory_time: '23:59:59' }, now)?.scheduled_for).toBe('2026-10-19T15:59:59.000Z');
  });
  it('pauses for empty weekdays, rejects ineligible recipients and skips unselected days', () => {
    expect(routineJobForToday({ ...recipient, advisory_days: [] }, now)).toBeNull();
    expect(routineJobForToday({ ...recipient, eligible: false }, now)).toBeNull();
    expect(routineJobForToday({ ...recipient, advisory_days: [2] }, now)).toBeNull();
  });
  it.each(['pelagic', 'demersal', 'both'] as const)('preserves the %s preference without substituting a habitat', habitat => {
    expect(routineJobForToday({ ...recipient, habitat_preference: habitat, preferred_language: 'ceb' }, now))
      .toMatchObject({ habitat_preference: habitat, preferred_language: 'ceb' });
  });
  it.each([{ advisory_days: [1, 1] }, { advisory_days: [1, 2, 3, 4, 5, 6] },
    { preferred_advisory_time: '24:00' }, { preferred_language: 'invalid' }, { habitat_preference: 'invalid' }])
  ('rejects corrupt stored preferences instead of inventing defaults: %j', extra => {
    expect(() => routineJobForToday({ ...recipient, ...extra } as typeof recipient, now)).toThrow();
  });
  it('rejects an invalid clock', () => {
    expect(() => routineJobForToday(recipient, new Date('invalid'))).toThrow();
  });
});

describe('routine queue transaction', () => {
  it('redacts connection failures without retrying', async () => {
    connect.mockRejectedValue(new Error('private connection credentials'));
    await expect(planRoutineAdvisories(pool)).rejects.toThrow('no automatic retry');
    expect(connect).toHaveBeenCalledTimes(1);
    expect(query).not.toHaveBeenCalled();
  });
  it('defaults to a read-only preview with no queue writes or provider calls', async () => {
    expect(await planRoutineAdvisories(pool)).toMatchObject({ dry_run: true, persisted: false, planned: 1, due: 1,
      changed: null, cancelled: null, sent: 0, timezone: 'Asia/Manila' });
    expect(query.mock.calls[0][0]).toBe('BEGIN READ ONLY');
    expect(query.mock.calls.at(-1)![0]).toBe('ROLLBACK');
    expect(query.mock.calls.some(([sql]) => /INSERT|UPDATE|DELETE/.test(sql))).toBe(false);
    expect(query.mock.calls.find(([sql]) => sql.startsWith('SELECT u.id'))![1]).toEqual(['messaging-v1']);
    expect(release).toHaveBeenCalledTimes(1);
  });
  it.each(['PAROLA_ROUTINE_SCHEDULER_ENABLED', 'PAROLA_AUTH_MODE', 'PAROLA_SMS_MODE', 'IPROG_MOCK_MODE'])
  ('blocks persistence before connecting when %s is not explicitly enabled for live use', async key => {
    enable();
    vi.stubEnv(key, undefined);
    expect(routinePersistenceEnabled()).toBe(false);
    await expect(planRoutineAdvisories(pool, false)).rejects.toThrow('disabled');
    expect(connect).not.toHaveBeenCalled();
  });
  it('serializes persistence, uses stable daily upserts and commits only after reconciliation', async () => {
    enable();
    await planRoutineAdvisories(pool, false);
    await planRoutineAdvisories(pool, false);
    const writes = query.mock.calls.filter(([sql]) => sql.startsWith('INSERT'));
    expect(writes).toHaveLength(2);
    expect(writes[0][0]).toContain('ON CONFLICT (user_id, advisory_date) DO UPDATE');
    expect(writes[0][0]).toContain("WHERE existing.status IN ('pending', 'cancelled')");
    expect(writes[0][1]).toEqual(writes[1][1]);
    expect(JSON.parse(writes[0][1][0])).toEqual([routineJobForToday(recipient, now)]);
    expect(query.mock.calls[2][0]).toContain('pg_advisory_xact_lock');
    expect(query.mock.calls.at(-1)![0]).toBe('COMMIT');
    expect(release).toHaveBeenCalledTimes(2);
  });
  it('cancels obsolete pending jobs when no eligible recipient selected today', async () => {
    enable();
    query.mockImplementation(async (sql: string) => ({ rows: sql.includes('clock_timestamp()') ? [{ evaluated_at: now }] : [], rowCount: 0 }));
    expect(await planRoutineAdvisories(pool, false)).toMatchObject({ planned: 0, due: 0, sent: 0 });
    const cancellation = query.mock.calls.find(([sql]) => sql.startsWith('UPDATE'))!;
    expect(cancellation[0]).toContain("status = 'pending'");
    expect(cancellation[1]).toEqual(['2026-10-19', []]);
  });
  it('updates unsent time/language/habitat after saved preferences change, retaining daily identity', async () => {
    enable();
    await planRoutineAdvisories(pool, false);
    query.mockImplementation(async (sql: string) => {
      if (sql.includes('clock_timestamp()')) return { rows: [{ evaluated_at: now }] };
      if (sql.startsWith('SELECT u.id')) return { rows: [{ ...recipient, preferred_advisory_time: '06:30:17', preferred_language: 'hil', habitat_preference: 'demersal' }] };
      return { rows: [], rowCount: 0 };
    });
    expect(await planRoutineAdvisories(pool, false)).toMatchObject({ planned: 1, due: 0 });
    const writes = query.mock.calls.filter(([sql]) => sql.startsWith('INSERT'));
    const job = JSON.parse(writes[1][1][0])[0];
    expect(job).toMatchObject({ user_id: recipient.id, advisory_date: '2026-10-19',
      scheduled_for: '2026-10-18T22:30:17.000Z', preferred_language: 'hil', habitat_preference: 'demersal' });
  });
  it.each(['SELECT u.id', 'INSERT', 'COMMIT'])('rolls back and releases on %s failure without retrying or leaking SQL', async phase => {
    enable();
    const normal = query.getMockImplementation()!;
    query.mockImplementation(async (sql: string) => {
      if (sql.startsWith(phase)) throw new Error('private SQL / credentials');
      return normal(sql);
    });
    await expect(planRoutineAdvisories(pool, false)).rejects.toThrow('no automatic retry');
    expect(query.mock.calls.at(-1)![0]).toBe('ROLLBACK');
    expect(query.mock.calls.filter(([sql]) => sql.startsWith('INSERT')).length).toBeLessThanOrEqual(1);
    expect(connect).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledTimes(1);
  });
});
