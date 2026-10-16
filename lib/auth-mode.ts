export type AuthMode = 'demo' | 'live';

// Server-owned: request bodies and browser storage cannot enable the bypass.
export function getAuthMode(): AuthMode {
  const mode = process.env.PAROLA_AUTH_MODE ?? 'demo';
  if (mode !== 'demo' && mode !== 'live') throw new Error('Invalid PAROLA_AUTH_MODE');
  return mode;
}
