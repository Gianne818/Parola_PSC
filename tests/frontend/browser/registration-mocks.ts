// Replaces the Supabase module at bundle resolution. No real client is imported.
const phone = '+639171234567';
const user = { id: 'mock-owner', phone: phone.slice(1), phone_confirmed_at: '2026-10-15T00:00:00Z' };
const listeners = new Set<(event: string, session: typeof mocks.session) => void>();
export const mocks = {
  session: null as null | { access_token: string; refresh_token: string; user: typeof user },
  row: null as Record<string, unknown> | null,
  calls: [] as { path: string; method: string; body: Record<string, unknown>; token: string | null }[],
  version: 'fixture-consent-v1', text: 'Fixture consent: advisories and safety alerts by SMS. Withdraw in the portal. Sponsors excluded.',
  failPath: '', failStatus: 0, failRead: false, failSession: false, failSignOut: false, failUser: false,
  lostRegistration: false, holdRead: false, readHeld: false, releaseRead: () => {},
  emit(event: string) { listeners.forEach(callback => callback(event, mocks.session)); },
};
export const supabase = {
  auth: {
    onAuthStateChange(callback: (event: string, session: typeof mocks.session) => void) { listeners.add(callback); return { data: { subscription: { unsubscribe: () => listeners.delete(callback) } } }; },
    async getSession() { return { data: { session: mocks.session }, error: null }; },
    async getUser() { return { data: { user: mocks.failUser ? null : mocks.session?.user ?? null }, error: mocks.failUser ? new Error('Mock rejected session') : null }; },
    async setSession(tokens: { access_token: string; refresh_token: string }) {
      if (mocks.failSession) return { data: { session: null, user: null }, error: new Error('Mock session failure') };
      mocks.session = { ...tokens, user }; mocks.emit('SIGNED_IN');
      return { data: { session: mocks.session, user }, error: null };
    },
    async signOut() {
      if (mocks.failSignOut) return { error: new Error('Mock sign-out failure') };
      mocks.session = null; mocks.emit('SIGNED_OUT'); return { error: null };
    },
  },
  from(table: string) {
    if (table !== 'users') throw new Error('Unexpected database read');
    return { select: () => ({ eq: (field: string, id: string) => ({ async maybeSingle() {
      if (mocks.holdRead) await new Promise<void>(resolve => { mocks.readHeld = true; mocks.releaseRead = () => { mocks.readHeld = false; resolve(); }; });
      if (field !== 'auth_user_id' || id !== user.id) throw new Error('Owner read violation');
      return { data: mocks.failRead ? null : mocks.row, error: mocks.failRead ? new Error('Mock read failure') : null };
    } }) }) };
  },
};
function json(value: unknown, status = 200) { return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json', ...(status === 429 ? { 'Retry-After': '2' } : {}) } }); }
export function installMockFetch() {
  const blockedFetch = window.fetch.bind(window);
  window.fetch = async (input, options) => {
    const path = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (!['/api/auth/otp/request', '/api/auth/otp/verify', '/api/users/register', '/api/users/profile', '/api/users/consent'].includes(path)) return blockedFetch(input, options);
    const body = JSON.parse(String(options?.body ?? '{}'));
    const token = new Headers(options?.headers).get('Authorization');
    const method = options?.method ?? 'GET';
    mocks.calls.push({ path, body, token, method });
    if (mocks.failPath === path && mocks.failStatus) return json({ error: `Mock HTTP ${mocks.failStatus}` }, mocks.failStatus);
    if (path === '/api/auth/otp/request') return json({ status: 'code_requested' }, 202);
    if (path === '/api/auth/otp/verify') return body.code === '012345' ? json({ status: 'phone_verified', user: { id: user.id, phone_number: phone }, session: { access_token: 'mock-access', refresh_token: 'mock-refresh' } }) : json({ error: 'Mock invalid or expired code' }, 400);
    if (!mocks.session || token !== `Bearer ${mocks.session.access_token}`) return json({ error: 'Mock owner required' }, 401);
    if (path === '/api/users/consent' && method === 'GET') return json({ consent_version: mocks.version, consent_text: mocks.text,
      consent: mocks.row ? { messaging_consent: mocks.row.messaging_consent, messaging_consent_version: mocks.row.messaging_consent_version, messaging_consent_at: mocks.row.messaging_consent_at } : null });
    if ((path === '/api/users/register' || path === '/api/users/consent') && body.consent_version !== mocks.version) return json({ error: 'Mock stale consent version' }, 409);
    const consent = { messaging_consent: body.messaging_consent, messaging_consent_version: body.consent_version, messaging_consent_at: '2026-10-15T01:00:00Z' };
    if (path === '/api/users/register') {
      if (mocks.row) return json({ error: 'Mock duplicate account; legacy linking requires review' }, 409);
      mocks.row = { id: 'mock-profile', auth_user_id: user.id, phone_number: phone, full_name: body.full_name, home_port_name: body.home_port_name, phone_verified_at: user.phone_confirmed_at, ...consent };
      if (mocks.lostRegistration) throw new Error('Mock response lost after server commit');
      return json({ ...mocks.row, status: 'registered', contact_verified: true, messaging_eligible: body.messaging_consent }, 201);
    }
    if (!mocks.row) return json({ error: 'Mock no registration' }, 404);
    if (path === '/api/users/consent') { Object.assign(mocks.row, consent); return json({ ...consent, messaging_eligible: body.messaging_consent }); }
    Object.assign(mocks.row, body); return json(mocks.row);
  };
}
