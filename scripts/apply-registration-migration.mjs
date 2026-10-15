import { readFile, writeFile } from 'node:fs/promises';
import { randomUUID, randomInt, X509Certificate } from 'node:crypto';
import { DuplicateCleanupError, removeApprovedDuplicatePair } from './lib/registration-duplicate-cleanup.mjs';

if (process.argv.includes('--help')) {
  console.log('From the repository root: node scripts/apply-registration-migration.mjs [--dry-run | --verify-only | --check-duplicates | --remove-reported-duplicates]');
  console.log('Applies REG-02 migration and checks the real database in one transaction.');
  console.log('--dry-run rolls back the migration too; --verify-only checks an already applied migration.');
  console.log('Temporary verification records are always rolled back. Makes no OTP/SMS requests.');
  console.log('TLS: set SUPABASE_DB_CA_FILE to the downloaded Supabase root certificate path, or SUPABASE_DB_CA to PEM content.');
  console.log('--check-duplicates is read-only and saves duplicate profile details in .registration-duplicates.local (ignored).');
  console.log('--remove-reported-duplicates uses the approved local pair plan, backs up full rows, refuses linked history, then applies/verifies atomically.');
  process.exit(0);
}
const options = process.argv.slice(2);
if (options.some(option => !['--dry-run', '--verify-only', '--check-duplicates', '--remove-reported-duplicates'].includes(option)) || options.length > 1) {
  console.error('Use --help for valid options.');
  process.exit(1);
}
for (const file of ['.env.local', '.env']) {
  try { process.loadEnvFile(file); } catch (error) {
    if (error.code !== 'ENOENT') throw new Error(`Unable to read ${file}`);
  }
}
const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!connectionString) {
  console.error('DATABASE_URL or DIRECT_URL is required. No database changes made.');
  process.exit(1);
}
let pg;
try { pg = await import('pg'); }
catch {
  // Existing offline tooling is an optional fallback for an incomplete root
  // node_modules. Normal checkouts only need the declared pg dependency.
  try { pg = await import('../.tools/registration-checks/node_modules/pg/lib/index.js'); }
  catch {
    console.error('The pg dependency is unavailable. Install the project dependencies first.');
    process.exit(1);
  }
}
const { Client } = pg.default || pg;
let client;
let configuringCa = false;
try {
  const address = new URL(connectionString);
  if (!['postgres:', 'postgresql:'].includes(address.protocol)) throw new Error('Invalid protocol');
  const caFile = process.env.SUPABASE_DB_CA_FILE?.trim() || address.searchParams.get('sslrootcert');
  let ca = process.env.SUPABASE_DB_CA;
  configuringCa = true;
  if (caFile) ca = await readFile(caFile, 'utf8');
  if (ca) {
    const certificates = ca.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g);
    if (!certificates?.length || certificates.some(certificate => !new X509Certificate(certificate).ca)) {
      throw new Error('Expected a PEM certificate authority');
    }
    ca = certificates.join('\n');
  }
  configuringCa = false;
  // pg's connection-string SSL parameters otherwise override the explicit
  // verification options. Load the CA above, then pass it explicitly.
  for (const name of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'pgbouncer']) address.searchParams.delete(name);
  client = new Client({
    connectionString: address.toString(),
    ssl: { rejectUnauthorized: true, ...(ca ? { ca } : {}) },
    connectionTimeoutMillis: 8000,
    query_timeout: 45000,
  });
} catch {
  console.error(configuringCa
    ? 'Unable to read a valid PEM root certificate. Check SUPABASE_DB_CA_FILE (or SUPABASE_DB_CA). No database changes made.'
    : 'Invalid database connection configuration. No database changes made.');
  process.exit(1);
}
class VerificationError extends Error {}
function assert(condition, message) { if (!condition) throw new VerificationError(message); }
let connected = false;
let stage = 'connect';
let committing = false;
const DUPLICATE_REPORT = '.registration-duplicates.local';
async function checkDuplicates() {
  // Inline the migration's normalization: the migration may have rolled back,
  // so its generated column/function cannot be assumed to exist yet.
  const result = await client.query(`WITH profiles AS (
    SELECT u.id, u.phone_number, u.full_name, u.created_at, u.is_active,
      to_jsonb(u)->>'auth_user_id' AS auth_user_id,
      CASE WHEN length(u.phone_number)<=32
        AND regexp_replace(u.phone_number, '[\\s()-]', '', 'g') ~ '^(09[0-9]{9}|9[0-9]{9}|\\+?639[0-9]{9})$'
        THEN '+63' || right(regexp_replace(u.phone_number, '[^0-9]', '', 'g'),10)
        ELSE NULL END AS normalized_phone
    FROM public.users u
  ) SELECT normalized_phone, count(*)::int AS profile_count,
    jsonb_agg(jsonb_build_object('id',id,'phone_number',phone_number,'full_name',full_name,
      'created_at',created_at,'is_active',is_active,'auth_user_id',auth_user_id)
      ORDER BY created_at,id) AS profiles
    FROM profiles WHERE normalized_phone IS NOT NULL
    GROUP BY normalized_phone HAVING count(*)>1 ORDER BY normalized_phone`);
  const groups = result.rows;
  await writeFile(DUPLICATE_REPORT, JSON.stringify({ generated_at: new Date().toISOString(), groups }, null, 2) + '\n', { mode: 0o600 });
  return { groups: groups.length, profiles: groups.reduce((total, group) => total + group.profile_count, 0) };
}
try {
  await client.connect(); connected = true;
  await client.query(options.includes('--check-duplicates') ? 'BEGIN READ ONLY' : 'BEGIN');
  await client.query("SET LOCAL lock_timeout = '5s'; SET LOCAL statement_timeout = '30s'");
  const before = await client.query('SELECT count(*)::int AS count FROM public.users');
  if (options.includes('--remove-reported-duplicates')) {
    stage = 'approved duplicate cleanup';
    let plan;
    try { plan = JSON.parse(await readFile('.registration-duplicate-removal.local', 'utf8')); }
    catch { throw new VerificationError('Approved local cleanup plan is missing or invalid.'); }
    const cleanup = await removeApprovedDuplicatePair(client, plan, async backup => {
      const path = `.registration-duplicate-backup-${randomUUID()}.local`;
      await writeFile(path, JSON.stringify(backup, null, 2) + '\n', { flag: 'wx', mode: 0o600, flush: true });
      return path;
    });
    before.rows[0].count -= cleanup.removed;
    console.log(`Backed up ${cleanup.removed} approved duplicate profiles to ${cleanup.backupPath}. Removal will commit only if migration verification passes.`);
  }
  if (!options.includes('--verify-only')) {
    stage = 'check duplicate contacts';
    const duplicates = await checkDuplicates();
    console.log(`Duplicate contact groups: ${duplicates.groups}; affected profiles: ${duplicates.profiles}. Details saved to ${DUPLICATE_REPORT}; phone numbers are not printed.`);
    if (options.includes('--check-duplicates')) {
      await client.query('ROLLBACK');
      console.log('Read-only check complete. No accounts or schema changed. No SMS requested.');
      if (duplicates.groups) process.exitCode = 1;
      // finally closes the connection; skip all migration/fixture writes.
    } else {
      assert(duplicates.groups === 0, `Duplicate phone profiles require review. See ${DUPLICATE_REPORT}. No accounts were merged or deleted.`);
    }
  }
  if (!options.includes('--check-duplicates')) {
  if (!options.includes('--verify-only')) {
    stage = 'apply migration';
    const source = await readFile(new URL('../backend/migrations/02_verified_registration.sql', import.meta.url), 'utf8');
    await client.query(source.replace(/^BEGIN;\s*$/m, '').replace(/^COMMIT;\s*$/m, ''));
  }
  stage = 'schema and permissions';
  const after = await client.query('SELECT count(*)::int AS count FROM public.users');
  assert(before.rows[0].count === after.rows[0].count, 'Migration changed the account count.');
  const access = await client.query(`SELECT
    public.parola_phone_e164('0917 123 4567') = '+639171234567' AS local_ok,
    public.parola_phone_e164('+63 (917) 123-4567') = '+639171234567' AS intl_ok,
    public.parola_phone_e164('+14155552671') IS NULL AS foreign_rejected,
    (SELECT relrowsecurity FROM pg_class WHERE oid='public.users'::regclass) AS users_rls,
    (SELECT relrowsecurity FROM pg_class WHERE oid='public.registration_consent_events'::regclass) AS audit_rls,
    NOT has_table_privilege('authenticated', 'public.users', 'UPDATE') AS direct_update_denied,
    NOT has_table_privilege('anon', 'public.users', 'INSERT') AS anonymous_insert_denied,
    NOT has_function_privilege('authenticated', 'public.parola_sms_recipient_eligible(text,text,uuid)', 'EXECUTE') AS eligibility_private,
    has_function_privilege('service_role', 'public.parola_sms_recipient_eligible(text,text,uuid)', 'EXECUTE') AS dispatch_allowed`);
  assert(Object.values(access.rows[0]).every(value => value === true), 'Normalization, RLS or privilege checks failed.');

  stage = 'rollback-only consent fixtures';
  await client.query('SAVEPOINT registration_verification');
  const actor = randomUUID();
  let phone;
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = `+639${String(randomInt(0, 1000000000)).padStart(9, '0')}`;
    const existing = await client.query('SELECT EXISTS(SELECT 1 FROM auth.users WHERE public.parola_phone_e164(phone)=$1) OR EXISTS(SELECT 1 FROM public.users WHERE phone_e164=$1) AS taken', [candidate]);
    if (!existing.rows[0].taken) { phone = candidate; break; }
  }
  assert(phone, 'Could not allocate a rollback-only fixture contact.');
  await client.query('INSERT INTO auth.users(id, phone, phone_confirmed_at) VALUES ($1,$2,NOW())', [actor, phone]);
  await client.query(`INSERT INTO public.users(id, auth_user_id, phone_number, full_name, home_port_name, home_port_geom,
    preferred_advisory_time, phone_verified_at, messaging_consent, messaging_consent_version, messaging_consent_at, messaging_consent_actor_id)
    VALUES ($1,$1,$2,'REG-02 rollback verification','Test port',ST_SetSRID(ST_MakePoint(0,0),4326),'05:00',NOW(),FALSE,'messaging-v1',NOW(),$1)`, [actor, phone]);
  async function eligible(owner = actor, version = 'messaging-v1') {
    const result = await client.query('SELECT public.parola_sms_recipient_eligible($1,$2,$3) AS eligible', [phone, version, owner]);
    return result.rows[0].eligible;
  }
  assert(await eligible() === false, 'No-consent contact was eligible.');
  await client.query('UPDATE public.users SET messaging_consent=TRUE, messaging_consent_at=NOW() WHERE id=$1', [actor]);
  assert(await eligible() === true, 'Verified consenting contact was ineligible.');
  assert(await eligible(randomUUID()) === false, 'Unrelated owner was eligible.');
  assert(await eligible(actor, 'old-version') === false, 'Outdated consent version was eligible.');
  await client.query('UPDATE public.users SET messaging_consent=FALSE, messaging_consent_at=NOW() WHERE id=$1', [actor]);
  assert(await eligible() === false, 'Consent withdrawal did not stop eligibility.');
  const audit = await client.query('SELECT count(*)::int AS count FROM public.registration_consent_events WHERE user_id=$1 AND actor_id=$1', [actor]);
  assert(audit.rows[0].count === 3, 'Consent audit provenance is incomplete.');

  stage = 'owner read isolation';
  await client.query('SET LOCAL ROLE authenticated');
  await client.query("SELECT set_config('request.jwt.claim.sub',$1,true), set_config('request.jwt.claims',$2,true)", [actor, JSON.stringify({ sub: actor })]);
  const own = await client.query('SELECT id FROM public.users WHERE id=$1', [actor]);
  const ownAudit = await client.query('SELECT id FROM public.registration_consent_events WHERE user_id=$1', [actor]);
  assert(own.rows.length === 1 && ownAudit.rows.length === 3, 'Owner could not read their profile/audit.');
  const stranger = randomUUID();
  await client.query("SELECT set_config('request.jwt.claim.sub',$1,true), set_config('request.jwt.claims',$2,true)", [stranger, JSON.stringify({ sub: stranger })]);
  const other = await client.query('SELECT id FROM public.users WHERE id=$1', [actor]);
  const otherAudit = await client.query('SELECT id FROM public.registration_consent_events WHERE user_id=$1', [actor]);
  assert(other.rows.length === 0 && otherAudit.rows.length === 0, 'Another owner could read the fixture profile/audit.');
  await client.query('RESET ROLE');

  stage = 'revoked Auth confirmation';
  await client.query('UPDATE public.users SET messaging_consent=TRUE, messaging_consent_at=NOW() WHERE id=$1', [actor]);
  await client.query('UPDATE auth.users SET phone_confirmed_at=NULL WHERE id=$1', [actor]);
  assert(await eligible() === false, 'Unconfirmed Auth phone remained eligible.');
  await client.query('ROLLBACK TO SAVEPOINT registration_verification');
  const fixtures = await client.query('SELECT EXISTS(SELECT 1 FROM public.users WHERE id=$1) OR EXISTS(SELECT 1 FROM auth.users WHERE id=$1) AS remain', [actor]);
  assert(fixtures.rows[0].remain === false, 'Verification fixtures were not removed.');
  stage = 'finish transaction';
  if (options.includes('--dry-run') || options.includes('--verify-only')) {
    await client.query('ROLLBACK');
    console.log(options.includes('--verify-only') ? 'PASS: existing migration verified. No changes committed.' : 'PASS: migration and checks passed in dry-run. No changes committed.');
  } else {
    committing = true;
    await client.query('COMMIT');
    console.log(options.includes('--remove-reported-duplicates')
      ? 'PASS: removed the two approved duplicate profiles and applied/verified the migration. Other account count preserved; verification fixtures rolled back.'
      : 'PASS: registration migration applied and verified. Existing account count preserved; verification fixtures rolled back.');
  }
  console.log('Checks: phone normalization, RLS/privileges, owner isolation, consent grant/withdrawal/audit, eligibility and Auth revocation. No OTP or SMS requested.');
  }
} catch (error) {
  if (connected) await client.query('ROLLBACK').catch(() => {});
  const code = typeof error.code === 'string' && /^[A-Z0-9_]+$/.test(error.code) ? ` (${error.code})` : '';
  const knownGuard = error.code === 'P0001' && error.message === 'Duplicate normalized phones require reviewed reconciliation before REG-02 migration';
  const safeMessage = error instanceof VerificationError || error instanceof DuplicateCleanupError ? error.message : knownGuard
    ? 'Duplicate phone profiles blocked migration. Run with --check-duplicates to inspect them without changing data.'
    : 'Database operation failed; raw details redacted.';
  console.error(`FAIL at ${stage}${code}. ${safeMessage}`);
  if (['SELF_SIGNED_CERT_IN_CHAIN', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY'].includes(error.code)) {
    console.error('Download the root certificate from Supabase Database settings > SSL Configuration. Set SUPABASE_DB_CA_FILE to its path in .env.local, then rerun. Certificate verification remains enabled.');
  }
  console.error(committing ? 'Commit outcome is uncertain. Check the database with --verify-only before retrying.'
    : connected ? 'Transaction rollback attempted; no successful commit was issued.' : 'No database changes made.');
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
