// Explicit backend health check. No account reads/writes, Auth, OTP or SMS.
import nextEnv from '@next/env';
import { registryHttpsQuery } from '../lib/registry-https.ts';

nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
if (process.argv.length !== 2) {
  console.error('Use node scripts/check-registration-https.mjs without arguments.');
  process.exit(1);
}
console.log('HTTPS registry health only. No accounts, OTP or SMS requested.');
try {
  const { rows } = await registryHttpsQuery('health', []);
  if (rows.length !== 1 || rows[0].protocol_version !== 1 || rows[0].transport !== 'https') {
    throw new Error('Invalid protocol');
  }
  console.log('PASS: backend credentials and registry HTTPS health operation accepted.');
  console.log('This does not verify registration, SQL ownership rules or profile persistence.');
} catch (error) {
  const allowed = new Set(['registry_https_config', 'registry_https_unavailable', 'registry_https_migration_required']);
  const code = allowed.has(error?.code) ? error.code : 'registry_https_invalid_protocol';
  console.error(`FAIL (${code}). No automatic fallback or retry was made.`);
  process.exitCode = 1;
}
