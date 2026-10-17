// Synthetic, isolated review only. Production page, adapters, workspace and Leaflet are real.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import DashboardPage from '@/app/dashboard/page';
import { FixtureContext } from './state';
import '@/app/globals.css';

// Next's server font loader is outside this in-memory fixture; use an explicit system fallback.
document.documentElement.style.setProperty('--font-parola-body', 'Arial, sans-serif');
document.documentElement.style.setProperty('--font-parola-display', 'Arial, sans-serif');

const nativeFetch = window.fetch.bind(window);
const mock = { safety: 'clear', areaWeather: 'normal', failAreas: false, phone: '', smsMode: 'MOCK_DRY_RUN', smsRequests: [] as string[] };
function configureSafety(safety: string) { mock.safety = safety; }
function configurePhone(phone: string) { mock.phone = phone; }
function configureSms(mode: string) { mock.smsMode = mode; }
function configureAreaWeather(mode: string) { mock.areaWeather = mode; }
let resolveSms: (() => void) | null = null;
const habitats = ['pelagic', 'pelagic', 'pelagic', 'demersal', 'demersal', 'demersal', 'both', 'unknown', 'pelagic', 'demersal', 'both', 'pelagic'];
const scores = [.55, .75, .95, .55, .75, .95, .8, .8, null, -3, 101, 'invalid'];
const records = habitats.map((model_type, i) => ({ grid_id: i + 1, target_lat: 14.05 + Math.floor(i / 4) * .07,
  target_lon: 123.05 + (i % 4) * .07, model_type, catch_probability: scores[i], prediction_date: '2026-10-17', sst: 0,
  created_at: '2026-10-17T01:00:00Z', depth: null, environment_provenance: 'legacy_unverified' }));
window.fetch = async (input, init) => {
  const url = new URL(String(input), location.origin);
  if (url.pathname === '/api/users/profile') return Response.json({
    id: 'offline-readability', phone_number: mock.phone, messaging_consent: true, is_active: true,
    contact_verified: true, messaging_eligible: true,
  });
  if (url.pathname === '/api/sms/send') {
    mock.smsRequests.push(String(init?.body));
    if (mock.smsMode === 'pending') return new Promise<Response>(resolve => {
      resolveSms = () => { resolveSms = null; resolve(Response.json({ success: true, mode: 'LIVE_DISPATCH' })); };
    });
    return mock.smsMode === 'failed' ? Response.json({ error: 'Synthetic failure' }, { status: 503 })
      : Response.json({ success: true, mode: mock.smsMode });
  }
  if (url.pathname === '/api/dashboard/weather') {
    // Evidence predates the component's sampled clock, as real returned observations do.
    const time = new Date(Date.now() - 60000).toISOString();
    const areaMode = Number(url.searchParams.get('lat')) === 14.0122 ? 'normal' : mock.areaWeather;
    if (areaMode === 'failed') return Response.json({ error: 'Synthetic weather outage' }, { status: 503 });
    const reading = (value: number) => ({ value: mock.safety === 'incomplete' || areaMode === 'missing' ? null : value, source: 'Synthetic review fixture',
      observedAt: areaMode === 'stale' ? new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() : time, available: mock.safety !== 'incomplete' });
    return Response.json({ wind: reading(areaMode === 'warning' ? 45 : 5), waves: reading(.5), temperature: reading(28), stormSignal: reading(0),
      hold: { available: mock.safety !== 'incomplete', active: mock.safety === 'hold', checkedAt: time, reason: mock.safety === 'hold' ? 'Synthetic hold' : null }, receivedAt: time });
  }
  if (url.pathname === '/api/advisories/nearest') {
    if (mock.failAreas) return Response.json({ error: 'Synthetic unavailable' }, { status: 503 });
    return Response.json({ hotspots: records, source: 'postgres_direct', provenance: 'legacy_unverified',
      metadata: { region: 'reg-5', eligibleCount: records.length, returnedCount: records.length, predictionDates: ['2026-10-17'], capped: false } });
  }
  return nativeFetch(input, init);
};

function Fixture() {
  const [revision, setRevision] = useState(0);
  const route = (path: string) => history.pushState({}, '', path);
  const setSafety = (safety: string) => { configureSafety(safety); setRevision(previous => previous + 1); };
  const setPhone = (phone: string) => { configurePhone(phone); setRevision(previous => previous + 1); };
  const setAreaWeather = (mode: string) => { configureAreaWeather(mode); setRevision(previous => previous + 1); };
  Object.assign(window, { fixture: { route, setSafety, setPhone, setAreaWeather, setSmsMode: configureSms, resolveSms: () => resolveSms?.() }, readability: mock });
  const value = { isInitialized: true, isAuthenticated: true, language: 'en', changeLanguage() {}, fontScale: 0, changeFontScale() {},
    userProfile: { id: 'offline-readability', port: 'Mercedes Fish Port', lat: 14.0122, lng: 123.0114, regionId: 'reg-5', phone: mock.phone },
    notifications: [], theme: 'light', logout() {}, toggleTheme() {}, manualOverrideHold: mock.safety === 'hold', showToast() {}, route };
  return <FixtureContext.Provider value={value}>
    {(window as Window & { offlineManual?: boolean }).offlineManual && <nav aria-label="Offline fixture controls" style={{ background: '#fff', padding: 8 }}>
      <span>Synthetic review only · no live services. </span>
      <label>Safety fixture <select onChange={e => setSafety(e.target.value)}><option>clear</option><option>hold</option><option>incomplete</option></select></label>
    </nav>}
    <DashboardPage key={revision} />
  </FixtureContext.Provider>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
