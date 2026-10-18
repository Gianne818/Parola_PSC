// Opt-in real account API acceptance. Never calls OTP/SMS or deletes accounts.
import assert from 'node:assert/strict';
import { randomBytes, randomInt, randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function checkDemoAccount(baseUrl, { allowWrites = false, fetcher = fetch, report = console.log, recordCreated = async () => {} } = {}) {
  const origin = new URL(baseUrl);
  if (origin.protocol !== 'http:' || !['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname)
    || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) {
    throw new Error('Use an HTTP localhost origin only. No requests made.');
  }
  if (!allowWrites) throw new Error('Requires --allow-demo-account-writes. No requests made.');
  const phone = `+639${String(randomInt(1_000_000_000)).padStart(9, '0')}`;
  const password = randomBytes(24).toString('base64url');
  const label = `SON-01 verification ${randomUUID()}`;
  let cookie = '';
  let checks = 0;
  const pass = name => { checks++; report(`PASS: ${name}`); };
  const call = async (path, method = 'GET', body, status = 200) => {
    let response;
    try {
      response = await fetcher(new URL(`/api/users/${path}`, origin), {
        method, redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(30000),
        headers: { 'Content-Type': 'application/json', Origin: origin.origin, ...(cookie ? { Cookie: cookie } : {}) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch { throw new Error(`${path} is unreachable; no retry made. If registration was attempted, its save outcome may be unknown.`); }
    if (response.status !== status) throw new Error(`${path}: expected HTTP ${status}, received ${response.status}. No retry made.`);
    const session = response.headers.get('set-cookie');
    if (session?.startsWith('parola-demo-session=')) {
      assert.match(session, /HttpOnly/i, 'Session must remain HttpOnly');
      cookie = /Max-Age=0(?:;|$)/i.test(session) ? '' : session.split(';')[0];
    }
    try { return await response.json(); }
    catch { throw new Error(`${path}: invalid JSON response. No retry made.`); }
  };
  const demo = account => {
    assert.equal(account.auth_mode, 'demo');
    assert.equal(account.contact_verified, false);
    assert.equal(account.messaging_eligible, false);
    assert.equal(account.messaging_consent, false);
    assert.equal(account.phone_number, phone);
    assert.equal(Object.hasOwn(account, 'password_hash'), false);
  };
  const prefs = account => ({ advisory_days: account.advisory_days, preferred_advisory_time: account.preferred_advisory_time,
    preferred_language: account.preferred_language, habitat_preference: account.habitat_preference });
  await call('profile', 'GET', undefined, 401);
  const account = await call('register', 'POST', { phone_number: phone, password, full_name: label,
    home_port_name: 'SON-01 test port', latitude: 14.1, longitude: 122.9 }, 201);
  demo(account);
  assert.match(account.id, /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i);
  assert.ok(cookie, 'Registration must return a saved account and session');
  await recordCreated({ id: account.id, phone_number: phone, test_label: label });
  pass('real demo registration returns an unverified saved account and cookie');
  const reload = async () => {
    const loaded = await call('profile');
    demo(loaded);
    assert.equal(loaded.id, account.id, 'Reload must return the same saved account');
    return loaded;
  };
  assert.equal((await reload()).home_port_name, 'SON-01 test port');
  await call('logout', 'POST', {});
  assert.equal(cookie, '', 'Logout must expire the browser cookie');
  await call('profile', 'GET', undefined, 401);
  pass('logout clears access and unsigned reload is denied');
  await call('login', 'POST', { phone_number: phone, password: `${password}-wrong` }, 401);
  assert.equal(cookie, '');
  demo(await call('login', 'POST', { phone_number: phone, password }));
  assert.ok(cookie, 'Password login must establish a session');
  await reload();
  pass('wrong password rejected; correct password and account reload accepted');
  const preferences = { advisory_days: [1, 2, 3, 4, 5], preferred_advisory_time: '04:30:17', preferred_language: 'ceb' };
  for (const habitat of ['pelagic', 'demersal', 'both']) {
    const expected = { ...preferences, habitat_preference: habitat };
    const updated = await call('profile', 'PUT', { phone_number: phone, ...expected });
    demo(updated);
    assert.deepEqual(prefs(updated), expected);
    assert.deepEqual(prefs(await reload()), expected);
    pass(`${habitat} habitat, five weekdays, time and language persist on reload`);
  }
  const saved = prefs(await reload());
  await call('profile', 'PUT', { phone_number: phone, advisory_days: [1, 2, 3, 4, 5, 6] }, 400);
  assert.deepEqual(prefs(await reload()), saved);
  await call('profile', 'PUT', { phone_number: phone, home_port_name: 'SON-01 changed port', latitude: 11.4552, longitude: 123.1491 });
  const port = await reload();
  assert.equal(port.home_port_name, 'SON-01 changed port');
  assert.equal(port.latitude, 11.4552);
  assert.equal(port.longitude, 123.1491);
  assert.deepEqual(prefs(port), saved);
  pass('sixth day rejected; port-only edit preserves every preference');
  const otherPhone = phone === '+639000000000' ? '+639000000001' : '+639000000000';
  await call('profile', 'PUT', { phone_number: otherPhone, full_name: 'Forbidden edit' }, 403);
  await call('profile', 'PUT', { phone_number: phone, actor_id: account.id }, 400);
  await call('consent', 'PUT', { messaging_consent: true, consent_version: 'messaging-v1' }, 401);
  assert.equal((await reload()).full_name, label);
  pass('cross-account/assisted edits and demo messaging consent denied');
  await call('profile', 'PUT', { phone_number: phone, advisory_days: [] });
  const paused = await reload();
  assert.deepEqual(paused.advisory_days, []);
  assert.equal(paused.routine_paused, true);
  assert.equal(paused.next_routine_at, null);
  await call('logout', 'POST', {});
  await call('profile', 'GET', undefined, 401);
  pass('test account left paused without SMS consent; final logout confirmed');
  return { checks, id: account.id };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length !== 1 || args[0] !== '--allow-demo-account-writes') {
    console.log('Start the local app in demo mode, then run: node scripts/check-demo-account.mjs --allow-demo-account-writes');
    console.log('Creates ONE real demo test account in the configured database. Edits only that account. No OTP/SMS, paid API, deletion or automatic retry.');
    console.log('On success the test account is left paused. Its ID/phone are saved privately in a Git-ignored .local report; no passwords or session tokens are saved.');
    process.exitCode = args.includes('--help') || !args.length ? 0 : 1;
  } else {
    console.log('Real demo account API acceptance through http://localhost:3000. No OTP/SMS or paid APIs.');
    try {
      const result = await checkDemoAccount('http://localhost:3000', {
        allowWrites: true,
        recordCreated: async account => {
          const filename = `.son-01-verification-${account.id}.local`;
          await writeFile(filename, JSON.stringify({ ...account, created_at: new Date().toISOString() }, null, 2), { flag: 'wx' });
          console.log(`Private test-account report: ${filename}`);
        },
      });
      console.log(`PASS: ${result.checks} database-backed account API checks. Full browser navigation remains a separate acceptance check.`);
    } catch (error) {
      // Never print server responses, assertion values, credentials or phone numbers.
      console.error(error instanceof assert.AssertionError ? 'FAIL: saved account/readback did not match the expected demo state.' : `FAIL: ${error.message}`);
      console.error('No automatic retry or account deletion performed. Inspect any private test-account report before retrying.');
      process.exitCode = 1;
    }
  }
}
