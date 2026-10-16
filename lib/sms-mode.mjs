// Server-owned switch. Missing/unknown values stay in demo mode.
export const DEMO_SMS_CODE = '482910';
export function isSmsDemoMode(env = process.env) {
  return env.PAROLA_SMS_MODE !== 'live' || env.IPROG_MOCK_MODE !== 'false';
}
