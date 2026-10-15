// Runs only against the caller's rollback-only fixture inside its transaction.
export async function verifyAdvisoryPreferences(client, actor, assert) {
  const columns = 'advisory_days, preferred_advisory_time::text, preferred_language, habitat_preference';
  const read = async () => (await client.query(`SELECT ${columns} FROM public.users WHERE id=$1`, [actor])).rows[0];
  const defaults = await read();
  assert(defaults.advisory_days.length === 0 && defaults.preferred_language === 'en'
    && defaults.habitat_preference === 'both' && defaults.preferred_advisory_time === '05:00:00', 'Preference defaults failed.');
  await client.query(`UPDATE public.users SET advisory_days=ARRAY[1,2,3,4,5]::smallint[],
    preferred_advisory_time='04:30:15', preferred_language='ceb', habitat_preference='demersal' WHERE id=$1`, [actor]);
  const saved = await read();
  assert(JSON.stringify(saved.advisory_days) === '[1,2,3,4,5]' && saved.preferred_advisory_time === '04:30:15'
    && saved.preferred_language === 'ceb' && saved.habitat_preference === 'demersal', 'Preferences did not persist.');
  await client.query("UPDATE public.users SET home_port_name='Changed test port' WHERE id=$1", [actor]);
  assert(JSON.stringify(await read()) === JSON.stringify(saved), 'Unrelated profile edit reset preferences.');
  const rejected = [
    "advisory_days=ARRAY[1,1]::smallint[]", "advisory_days=ARRAY[1,2,3,4,5,6]::smallint[]",
    "advisory_days=ARRAY[0]::smallint[]", "advisory_days=ARRAY[8]::smallint[]",
    "advisory_days=ARRAY[NULL]::smallint[]", "advisory_days=ARRAY[[1,2],[3,4]]::smallint[]",
    "advisory_days='[2:3]={1,2}'::smallint[]", "advisory_days=NULL",
    "preferred_language='invalid'", "preferred_language=NULL", "habitat_preference='invalid'", "habitat_preference=NULL",
  ];
  for (const assignment of rejected) {
    await client.query('SAVEPOINT invalid_preference');
    let code;
    try { await client.query(`UPDATE public.users SET ${assignment} WHERE id=$1`, [actor]); }
    catch (error) { code = error.code; }
    await client.query('ROLLBACK TO SAVEPOINT invalid_preference');
    await client.query('RELEASE SAVEPOINT invalid_preference');
    assert(code === '23514' || code === '23502', 'Database accepted invalid preferences or failed unexpectedly.');
  }
  await client.query("UPDATE public.users SET advisory_days='{}'::smallint[] WHERE id=$1", [actor]);
  assert((await read()).advisory_days.length === 0, 'Routine pause did not persist.');
}
