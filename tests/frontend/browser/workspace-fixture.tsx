// Explicit synthetic preview. Normal app routes never import this fixture.
import React, { useLayoutEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FixtureContext } from './state';
import PreferenceFlow from '@/components/workspace/PreferenceFlow';
import PlanWorkspace from '@/components/workspace/PlanWorkspace';
import WorkspaceEntry from '@/app/workspace/page';
import HomePortOnboarding from '@/components/onboarding/HomePortOnboarding';
import AuthPage from '@/components/auth/AuthPage';
import SettingsPage from '@/app/settings/page';
import { isPlanId } from '@/lib/frontend/workspace-preferences';
import '@/app/globals.css';

const fixture = { account: 'synthetic-account-a', mode: 'demo', failSave: false, authJourney: false, registrations: 0, logins: 0, requests: [] as string[], profileWrites: [] as unknown[], downloads: [] as string[], route: (_path: string) => {}, accountChange: (_id: string) => {}, signedIn: (_value: boolean) => {} };
const date = '2026-10-22';
const selection = (mode: string) => ({ requested_date: null, prediction_date: date, as_of_date: date, timezone: 'Asia/Manila', date_status: 'today', coherence: 'prediction_date_only', validity_status: 'unverified', operational_eligible: false,
  geography: { status: mode === 'demo' ? 'not_evaluated' : mode === 'partial' ? 'partial' : 'filtered', denied_count: 0, unavailable_count: mode === 'partial' ? 1 : 0 },
  lineage_status: 'unavailable', ingestion_run_ids: [], ingestion_run_count: 0, ingestion_run_ids_capped: false,
  habitats: { pelagic: { status: 'available', eligible_count: 1 }, demersal: { status: 'unavailable', eligible_count: 0 } } });
window.fetch = async input => {
  const url = new URL(String(input), location.origin);
  if (url.origin !== location.origin) throw new Error('External request blocked');
  fixture.requests.push(url.pathname + url.search);
  if (url.pathname === '/api/dashboard/weather') {
    const reading = { value: null, source: 'synthetic_only', observedAt: null, available: false };
    return Response.json({ wind: reading, waves: reading, temperature: reading, stormSignal: reading, hold: { available: false, active: false, checkedAt: null, reason: null }, receivedAt: date + 'T01:00:00Z' });
  }
  if (!['/api/advisories/export', '/api/advisories/nearest'].includes(url.pathname)) throw new Error('Unknown request blocked');
  if (fixture.mode === 'offline') throw new Error('Synthetic offline failure');
  if (fixture.mode === 'denied' || fixture.mode === 'authentication' || fixture.mode === 'unavailable') return Response.json({ error: 'synthetic rejection', code: 'geographic_data_unavailable' }, { status: fixture.mode === 'denied' ? 403 : fixture.mode === 'authentication' ? 401 : 503 });
  const data = selection(fixture.mode);
  if (url.pathname.endsWith('/nearest')) return Response.json({ hotspots: [], selection: data, source: 'synthetic_only', provenance: 'legacy_unverified' });
  if (fixture.mode === 'partial') return Response.json({ error: 'synthetic partial coverage', selection: data }, { status: 503 });
  return new Response(JSON.stringify({ type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [123.08, 14.08] }, properties: { grid_id: 1, model_type: 'pelagic', prediction_date: date, model_score: .7, validity_status: 'unverified' } }], selection: data,
    export_mode: fixture.mode === 'demo' ? 'demo_preview' : 'geographically_filtered', operational_eligible: false, provenance: 'legacy_unverified', synthetic_fixture_only: true }), { headers: { 'Content-Type': 'application/geo+json' } });
};
const blobs = new Map<string, Blob>();
const createUrl = URL.createObjectURL.bind(URL);
URL.createObjectURL = blob => { const url = createUrl(blob); if (blob instanceof Blob) blobs.set(url, blob); return url; };
document.addEventListener('click', event => {
  const anchor = event.target instanceof Element ? event.target.closest('a[download]') as HTMLAnchorElement | null : null;
  if (!anchor) return;
  event.preventDefault(); const blob = blobs.get(anchor.href);
  if (blob) void blob.text().then(text => fixture.downloads.push(text));
}, true);

function Fixture() {
  const [path, setPath] = useState(location.pathname === '/' ? '/onboarding/welcome' : location.pathname + location.search);
  const [account, setAccount] = useState(fixture.account);
  const [authenticated, setAuthenticated] = useState(true);
  const [profile, setProfile] = useState({ port: 'Mercedes Fish Port', lat: 14.0122, lng: 123.0114, regionId: 'reg-5', regionName: 'Bicol Region', speciesPreference: 'both', vesselName: 'Original vessel', full_name: 'Original account' });
  useLayoutEffect(() => {
    fixture.route = next => { history.pushState({}, '', next); setPath(next); };
    fixture.accountChange = id => { fixture.account = id; setAccount(id); };
    fixture.signedIn = value => setAuthenticated(value);
    Object.assign(window, { workspaceFixture: fixture, fixture });
  }, []);
  const plan = path.split('/')[2];
  const context = { isInitialized: true, isAuthenticated: authenticated, userProfile: { ...profile, id: account }, language: 'en', fontScale: 0,
    notifications: [], theme: 'light', manualOverrideHold: false, changeLanguage() {}, changeFontScale() {}, advisorySchedule: null, toggleTheme() {}, logout() { setAuthenticated(false); }, showToast() {},
    async updateProfile(patch: object) { fixture.profileWrites.push(patch); if (fixture.failSave) throw new Error('Synthetic save failed'); setProfile(previous => ({ ...previous, ...patch })); },
    async register() { fixture.registrations++; if (fixture.failSave) return { ok: false, error: 'Synthetic registration failed' }; setAuthenticated(true); return { ok: true }; },
    async login() { fixture.logins++; setAuthenticated(true); return { ok: true }; } };
  return <FixtureContext.Provider value={context}><div style={{ padding: '8px 16px', color: '#12211e', background: '#fff', font: '13px/1.5 system-ui' }}><strong>Synthetic TIER-07 preview</strong> · No real account, database, SMS, basemap tiles, payment or disk download.</div>
    {path === '/register' || (path === '/login' && fixture.authJourney) ? <AuthPage key={path} mode={path === '/register' ? 'register' : 'login'} /> : path.startsWith('/onboarding/welcome') ? <PreferenceFlow /> : path.startsWith('/onboarding') ? <HomePortOnboarding /> : path === '/workspace/preferences' ? <PreferenceFlow editing /> : isPlanId(plan) ? <PlanWorkspace plan={plan} /> : path === '/workspace' ? <WorkspaceEntry /> : path === '/settings' ? <SettingsPage /> : <main><h1>{path === '/login' ? 'Signed out fixture' : path === '/profile' ? 'Profile fixture' : 'Existing dashboard fixture'}</h1><a href="/workspace">My workspace</a></main>}
  </FixtureContext.Provider>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
