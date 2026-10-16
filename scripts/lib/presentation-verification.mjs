export async function verifyPresentation(client, assert) {
  const fields = await client.query(`SELECT table_name,column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name IN ('pelagic_species','demersal_species')`);
  for (const table of ['pelagic_species', 'demersal_species']) {
    assert(['id','common_name','family','representative_species'].every(name => fields.rows.some(row => row.table_name === table && row.column_name === name)), 'Deployed species catalog is missing expected fields; review schema before MAP-03 integration.');
  }
  const permissions = await client.query(`SELECT
    (SELECT relrowsecurity FROM pg_class WHERE oid='public.service_capabilities'::regclass) AS rls,
    NOT has_table_privilege('anon','public.service_capabilities','UPDATE') AS anon_denied,
    NOT has_table_privilege('authenticated','public.service_capabilities','UPDATE') AS user_denied`);
  assert(Object.values(permissions.rows[0]).every(value => value === true), 'Capability evidence write protection failed.');
  await client.query('SAVEPOINT capability_verification');
  await client.query("INSERT INTO public.service_capabilities(capability_id,status,summary) VALUES ('__verification','implemented','Rollback fixture')");
  await client.query('SAVEPOINT invalid_capability');
  let code;
  try { await client.query("UPDATE public.service_capabilities SET status='verified' WHERE capability_id='__verification'"); }
  catch (error) { code = error.code; }
  await client.query('ROLLBACK TO SAVEPOINT invalid_capability');
  assert(code === '23514', 'Capability readiness accepted without evidence.');
  await client.query("UPDATE public.service_capabilities SET status='verified',evidence_reference='rollback-test',verified_at=NOW(),valid_until=NOW()+INTERVAL '1 day' WHERE capability_id='__verification'");
  const persisted = await client.query("SELECT status FROM public.service_capabilities WHERE capability_id='__verification'");
  assert(persisted.rows[0].status === 'verified', 'Capability evidence did not persist.');
  await client.query('ROLLBACK TO SAVEPOINT capability_verification');
  await client.query('RELEASE SAVEPOINT capability_verification');
}
