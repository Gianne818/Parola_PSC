export class DuplicateCleanupError extends Error {}

function check(condition, message) {
  if (!condition) throw new DuplicateCleanupError(message);
}
const quote = value => `"${String(value).replaceAll('"', '""')}"`;
function phone(value) {
  if (typeof value !== 'string' || value.length > 32) return null;
  const cleaned = value.replace(/[\s()-]/g, '');
  return /^(09\d{9}|9\d{9}|\+?639\d{9})$/.test(cleaned)
    ? `+63${cleaned.replace(/\D/g, '').slice(-10)}` : null;
}

// Caller owns BEGIN/COMMIT/ROLLBACK. This function only targets the exact pair
// approved in the local plan. It never deletes Auth identities or related rows.
export async function removeApprovedDuplicatePair(client, plan, saveBackup) {
  const expected = plan?.profiles;
  check(plan?.version === 1 && Array.isArray(expected) && expected.length === 2,
    'Cleanup requires the approved two-profile local plan.');
  const ids = expected.map(profile => profile.id);
  check(new Set(ids).size === 2 && ids.every(id => typeof id === 'string' && /^[0-9a-f-]{36}$/i.test(id)),
    'Invalid approved profile IDs.');
  check(typeof plan.normalized_phone === 'string' && expected.every(profile => phone(profile.phone_number) === plan.normalized_phone),
    'Approved profiles must have the same normalized phone.');
  // With row_security off PostgreSQL throws rather than silently hiding rows
  // from a role that cannot bypass an applicable RLS policy.
  await client.query('SET LOCAL row_security = off');
  const selected = await client.query('SELECT to_jsonb(u) AS profile FROM public.users u WHERE u.id=ANY($1::uuid[]) ORDER BY u.id FOR UPDATE', [ids]);
  const profiles = selected.rows.map(row => row.profile);
  check(profiles.length === 2, 'Approved profiles changed or were already removed; cleanup stopped.');
  for (const profile of profiles) {
    const snapshot = expected.find(item => item.id === profile.id);
    check(snapshot && profile.phone_number === snapshot.phone_number && profile.created_at === snapshot.created_at,
      'An approved profile no longer matches its snapshot; cleanup stopped.');
    check(!profile.auth_user_id && !profile.phone_verified_at,
      'An approved profile is now linked/verified; cleanup stopped.');
  }
  const deleteTriggers = await client.query(`SELECT t.oid FROM pg_trigger t
    WHERE t.tgrelid='public.users'::regclass AND NOT t.tgisinternal
      AND pg_get_triggerdef(t.oid) ~ 'DELETE'`);
  check(deleteTriggers.rows.length === 0, 'Custom profile DELETE triggers require review before cleanup.');
  const references = await client.query(`SELECT n.nspname AS schema_name,c.relname AS table_name,
      a.attname AS column_name,r.attname AS referenced_column,
      cardinality(f.conkey) AS key_columns
    FROM pg_constraint f JOIN pg_class c ON c.oid=f.conrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace
    JOIN pg_attribute a ON a.attrelid=f.conrelid AND a.attnum=f.conkey[1]
    JOIN pg_attribute r ON r.attrelid=f.confrelid AND r.attnum=f.confkey[1]
    WHERE f.contype='f' AND f.confrelid='public.users'::regclass`);
  for (const reference of references.rows) {
    check(reference.key_columns === 1 && reference.referenced_column === 'id',
      'A complex profile foreign key requires review before cleanup.');
    const related = await client.query(`SELECT count(*)::int AS count FROM ${quote(reference.schema_name)}.${quote(reference.table_name)} WHERE ${quote(reference.column_name)}=ANY($1::uuid[])`, [ids]);
    check(related.rows[0].count === 0,
      'Linked profile history exists; cleanup stopped without deleting accounts or history.');
  }
  // saveBackup must finish durably before DELETE. Its errors abort the outer
  // transaction. Full original rows include the original geometry/preferences.
  const backupPath = await saveBackup({ version: 1, saved_at: new Date().toISOString(), profiles });
  check(typeof backupPath === 'string' && backupPath.length > 0, 'Profile backup was not confirmed; cleanup stopped.');
  await client.query('SET LOCAL row_security = on');
  const removed = await client.query('DELETE FROM public.users WHERE id=ANY($1::uuid[]) RETURNING id', [ids]);
  check(removed.rowCount === 2, 'Unexpected cleanup count; transaction must be rolled back.');
  return { removed: 2, backupPath };
}
