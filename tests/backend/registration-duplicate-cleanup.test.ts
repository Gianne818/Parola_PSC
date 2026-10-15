import { describe, expect, it, vi } from 'vitest';
import { removeApprovedDuplicatePair } from '../../scripts/lib/registration-duplicate-cleanup.mjs';

const profiles = [
  { id: '11111111-1111-4111-8111-111111111111', phone_number: '+639171234567', created_at: '2026-09-25T00:00:00+00:00', home_port_geom: 'original-geometry', auth_user_id: null },
  { id: '22222222-2222-4222-8222-222222222222', phone_number: '09171234567', created_at: '2026-10-15T00:00:00+00:00', home_port_geom: 'original-geometry', auth_user_id: null },
];
const plan = { version: 1, normalized_phone: '+639171234567', profiles };
function setup(options: { history?: number; linked?: boolean; changed?: boolean; deleteTrigger?: boolean; complex?: boolean; backupFails?: boolean; deleted?: number } = {}) {
  let backedUp = false;
  const saveBackup = vi.fn(async () => {
    if (options.backupFails) throw new Error('Disk unavailable');
    backedUp = true;
    return '.registration-duplicate-backup-test.local';
  });
  const query = vi.fn(async (sql: string) => {
    if (sql.startsWith('SELECT to_jsonb')) return { rows: profiles.map((profile, index) => ({ profile: {
      ...profile,
      ...(options.linked && index === 0 ? { auth_user_id: 'linked-owner' } : {}),
      ...(options.changed && index === 0 ? { phone_number: '09170000000' } : {}),
    } })), rowCount: 2 };
    if (sql.includes('FROM pg_trigger')) return { rows: options.deleteTrigger ? [{ oid: 1 }] : [] };
    if (sql.includes('FROM pg_constraint')) return { rows: [{ schema_name: 'public', table_name: 'daily_advisories', column_name: 'user_id', referenced_column: 'id', key_columns: options.complex ? 2 : 1 }] };
    if (sql.startsWith('SELECT count')) return { rows: [{ count: options.history || 0 }] };
    if (sql.startsWith('DELETE')) {
      expect(backedUp).toBe(true);
      return { rows: [], rowCount: options.deleted ?? 2 };
    }
    return { rows: [], rowCount: 0 };
  });
  return { client: { query }, query, saveBackup };
}

describe('approved legacy duplicate cleanup', () => {
  it('backs up full rows before deleting only the approved pair', async () => {
    const { client, query, saveBackup } = setup();
    expect(await removeApprovedDuplicatePair(client, plan, saveBackup)).toEqual({ removed: 2, backupPath: '.registration-duplicate-backup-test.local' });
    expect(saveBackup).toHaveBeenCalledWith(expect.objectContaining({ profiles }));
    expect(query).toHaveBeenCalledWith('DELETE FROM public.users WHERE id=ANY($1::uuid[]) RETURNING id', [profiles.map(profile => profile.id)]);
    expect(query.mock.calls.every(([sql]) => !sql.includes('auth.users'))).toBe(true);
  });

  it.each([
    [{ history: 1 }, /Linked profile history/],
    [{ linked: true }, /now linked\/verified/],
    [{ changed: true }, /no longer matches/],
    [{ deleteTrigger: true }, /DELETE triggers/],
    [{ complex: true }, /complex profile foreign key/],
    [{ backupFails: true }, /Disk unavailable/],
  ] as const)('refuses unsafe deletion: %j', async (options, message) => {
    const { client, query, saveBackup } = setup(options);
    await expect(removeApprovedDuplicatePair(client, plan, saveBackup)).rejects.toThrow(message);
    expect(query.mock.calls.some(([sql]) => sql.startsWith('DELETE'))).toBe(false);
  });

  it('rejects an invalid plan before querying the database', async () => {
    const { client, query, saveBackup } = setup();
    await expect(removeApprovedDuplicatePair(client, { ...plan, profiles: [profiles[0]] }, saveBackup)).rejects.toThrow(/two-profile/);
    expect(query).not.toHaveBeenCalled();
    expect(saveBackup).not.toHaveBeenCalled();
  });

  it('rejects an unexpected deletion count so the caller rolls back', async () => {
    const { client, saveBackup } = setup({ deleted: 1 });
    await expect(removeApprovedDuplicatePair(client, plan, saveBackup)).rejects.toThrow(/Unexpected cleanup count/);
  });
});
