import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { isSmsDemoMode } from '../lib/sms-mode.mjs';

if (process.argv.includes('--help')) {
  console.log('Run from the repository root: node scripts/test-supabase-otp.mjs');
  console.log('Reads Supabase public configuration from .env and .env.local.');
  console.log('Prompts for your phone and SMS code; requests one real OTP (uses iPROG credits).');
  console.log('Does not print or save session tokens, enroll a profile, or change messaging consent.');
  process.exit(0);
}

// Respect existing shell settings, then Next-style local overrides, then .env.
for (const file of ['.env.local', '.env']) {
  try { process.loadEnvFile(file); } catch (error) {
    if (error.code !== 'ENOENT') throw new Error(`Unable to read ${file}`);
  }
}

if (isSmsDemoMode() || process.env.IPROG_MOCK_MODE !== 'false') {
  console.log('SMS demo mode is enabled. No real OTP was requested and no credits were used.');
  console.log('For a preview use /api/auth/otp/request. Live testing requires PAROLA_SMS_MODE=live and IPROG_MOCK_MODE=false.');
  process.exit(0);
}

const terminal = createInterface({ input: stdin, output: stdout });
try {
  const project = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '');
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (project.protocol !== 'https:' || project.username || project.password || !anonKey) {
    throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env first.');
  }

  console.log('This requests one real OTP through your configured Supabase SMS hook and uses iPROG credits.');
  const entered = (await terminal.question('Your own Philippine mobile number (09... or +639...): ')).trim();
  const digits = entered.replace(/[\s()-]/g, '');
  const phone = /^09\d{9}$/.test(digits) ? `+63${digits.slice(1)}`
    : /^\+?639\d{9}$/.test(digits) ? `+${digits.replace(/^\+/, '')}` : null;
  if (!phone) throw new Error('Invalid Philippine mobile number. No SMS requested.');

  async function authPost(path, payload) {
    let response;
    let data;
    try {
      response = await fetch(new URL(`/auth/v1/${path}`, project), {
        method: 'POST',
        headers: { apikey: anonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
        redirect: 'error',
      });
      data = await response.json();
    } catch {
      throw new Error('Supabase could not be reached or returned an unreadable response. No automatic retry was made.');
    }
    if (!response.ok) {
      const code = typeof data?.error_code === 'string' && /^[a-z0-9_]+$/i.test(data.error_code)
        ? `; ${data.error_code}` : '';
      throw new Error(`Supabase ${path} failed (HTTP ${response.status}${code}). Check Auth logs and the hook function logs. If CAPTCHA is enabled, use the browser flow with a valid CAPTCHA token.`);
    }
    return data;
  }

  await authPost('otp', { phone, channel: 'sms', create_user: true });
  console.log('OTP request accepted. Wait for the SMS; no automatic resend will occur.');
  const code = (await terminal.question('Six-digit code from your SMS (Enter to stop): ')).trim();
  if (!code) {
    console.log('Stopped before verification.');
  } else {
    if (!/^\d{6}$/.test(code)) throw new Error('Expected a six-digit code.');
    const result = await authPost('verify', { phone, token: code, type: 'sms' });
    if (!result.access_token || !result.refresh_token || !result.user?.id ||
        !result.user.phone_confirmed_at || `+${String(result.user.phone).replace(/^\+/, '')}` !== phone) {
      throw new Error('The response did not establish the expected confirmed phone and session.');
    }
    console.log('SUCCESS: Supabase verified your phone and issued a session. Session tokens were not printed or saved.');
    console.log('This verifies the Auth/SMS integration only. Profile registration, messaging consent and portal UI integration are separate.');
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'OTP test failed.');
  process.exitCode = 1;
} finally {
  terminal.close();
}
