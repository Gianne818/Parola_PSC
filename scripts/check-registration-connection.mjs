// Connection/authentication only: no SQL, account writes, OTP or SMS requests.
import nextEnv from '@next/env';
import pg from 'pg';
import net from 'node:net';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const direct = process.argv.includes('--direct');
const network = process.argv.includes('--network');
const diagnose = process.argv.includes('--diagnose');
if (process.argv.slice(2).some(arg => !['--direct', '--network', '--diagnose'].includes(arg)) || [direct, network, diagnose].filter(Boolean).length > 1) {
  console.error('Use node scripts/check-registration-connection.mjs [--direct | --network | --diagnose]');
  process.exit(1);
}
if (diagnose) {
  let pooler, api;
  try {
    pooler = new URL(process.env.DATABASE_URL || process.env.DIRECT_URL).hostname;
    api = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
  } catch { console.error('Database and Supabase URLs must be configured. No network test made.'); process.exit(1); }
  const localPython = fileURLToPath(new URL(process.platform === 'win32' ? '../.venv/Scripts/python.exe' : '../.venv/bin/python', import.meta.url));
  const python = existsSync(localPython) ? localPython : (process.platform === 'win32' ? 'python' : 'python3');
  const result = spawnSync(python, [fileURLToPath(new URL('./check-registration-network.py', import.meta.url)),
    '--pooler-host', pooler, '--api-host', api], { encoding: 'utf8', timeout: 20000, windowsHide: true });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.error || result.status !== 0) {
    console.error('Independent check could not finish; verify Python is available and rerun. Raw details withheld.');
    process.exit(1);
  }
  process.exit(0);
}
if (direct) {
  if (!process.env.DIRECT_URL) {
    console.error('DIRECT_URL is not configured. No connection attempted.');
    process.exit(1);
  }
  // This process only: never rewrite .env or switch the running application.
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}
if (network) {
  console.log('Network-only check: no credentials, SQL or SMS. Five-second timeout per endpoint.');
  const settings = ['DATABASE_URL', 'DIRECT_URL'].filter(name => process.env[name]);
  await Promise.all(settings.map(name => new Promise(resolve => {
    let address;
    try { address = new URL(process.env[name]); }
    catch { console.log(`${name}: INVALID_URL`); resolve(); return; }
    const port = Number(address.port || 5432);
    let connected = false;
    let finished = false;
    const socket = net.createConnection({ host: address.hostname, port });
    const finish = result => {
      if (finished) return;
      finished = true;
      socket.destroy();
      console.log(`${name} port ${port}: ${result}`);
      resolve();
    };
    socket.setTimeout(5000);
    socket.once('connect', () => {
      connected = true;
      // Standard PostgreSQL SSLRequest: no username/password or SQL follows.
      const request = Buffer.alloc(8);
      request.writeInt32BE(8, 0);
      request.writeInt32BE(80877103, 4);
      socket.write(request);
    });
    socket.once('data', data => finish(data[0] === 83 ? 'TCP_AND_POSTGRES_SSL_REACHABLE' : 'TCP_REACHABLE_SSL_NOT_ACCEPTED'));
    socket.once('timeout', () => finish(connected ? 'TCP_CONNECTED_POSTGRES_SSL_TIMEOUT' : 'TCP_CONNECTION_TIMEOUT'));
    socket.once('error', error => finish(typeof error.code === 'string' && /^[A-Z0-9_]+$/.test(error.code) ? error.code : 'NETWORK_ERROR'));
    socket.once('end', () => finish('REMOTE_CLOSED_CONNECTION'));
  })));
  process.exit(0);
}
const candidates = ['DATABASE_URL', 'DIRECT_URL'].filter(name => process.env[name]);
const secrets = new Set();
for (const name of candidates) {
  const value = process.env[name];
  secrets.add(value);
  try {
    const address = new URL(value);
    for (const part of [address.username, address.password, address.hostname, address.pathname.slice(1)]) {
      if (part.length > 2) {
        secrets.add(part);
        try { secrets.add(decodeURIComponent(part)); } catch {}
      }
    }
  } catch {}
}
function redactedMessage(error) {
  let message = typeof error?.message === 'string' && error.message.trim() ? error.message : 'Connection error without a message';
  for (const value of [...secrets].sort((a, b) => b.length - a.length)) {
    if (value) message = message.replaceAll(value, '<redacted>');
  }
  return message.replace(/postgres(?:ql)?:\/\/\S+/gi, '<redacted-url>').replace(/[\r\n]/g, ' ').slice(0, 300);
}

console.log('Connection-only diagnosis. No SQL, account changes or SMS.');
console.log(`Checking ${direct ? 'DIRECT_URL' : 'app DATABASE_URL'} configuration.`);
const { getDbPool } = await import('../lib/db.ts');
let pool;
try {
  pool = getDbPool();
  if (!pool) throw new Error('Database URL is not configured');
  const client = await pool.connect();
  client.release();
  console.log('App database connection: PASS');
} catch (error) {
  const code = typeof error?.code === 'string' && /^[A-Z0-9_]{2,64}$/.test(error.code) ? error.code : 'NO_ERROR_CODE';
  console.log(`App database connection: FAIL (${code})`);
  console.log(`Reason: ${redactedMessage(error)}`);
  if (error?.cause) console.log(`Cause: ${redactedMessage(error.cause)}`);
  if (Array.isArray(error?.errors)) {
    for (const nested of error.errors.slice(0, 3)) console.log(`Nested reason: ${redactedMessage(nested)}`);
  }
  process.exitCode = 1;
} finally {
  if (pool) await pool.end().catch(() => {});
}
