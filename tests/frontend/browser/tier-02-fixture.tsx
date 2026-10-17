// Test-only responses: real dashboard/hooks/adapters/Leaflet; no normal route or real service.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import DashboardPage from '@/app/dashboard/page';
import { FixtureContext } from './state';
import '@/app/globals.css';

type Mode = 'records' | 'empty' | 'failed' | 'unsupported' | 'catalog' | 'malformed';
const nativeFetch = window.fetch.bind(window);
const mock = { mode: 'records' as Mode, holdNext: false, pending: null as null | (() => void), requests: [] as string[] };
const records = Array.from({ length: 12 }, (_, i) => ({ grid_id: i + 1, target_lat: 14.05 + i * .01, target_lon: 123.05 + i * .01,
  model_type: i % 3 === 0 ? 'both' : i % 3 === 1 ? 'pelagic' : 'demersal',
  prediction_date: i % 3 === 0 ? null : i % 3 === 1 ? '2026-09-25' : '2027-01-02',
  catch_probability: i === 0 ? null : .7, sst: i === 0 ? 0 : null, chl_a: null,
  created_at: '2026-09-25T01:00:00Z', depth: null, environment_provenance: 'legacy_unverified', dbscan_cluster_id: i === 0 ? 0 : null }));
window.fetch = async (input, init) => {
  const url = new URL(String(input), location.origin);
  if (url.pathname === '/api/dashboard/weather') {
    const missing = { value: null, source: 'Unavailable', observedAt: null, available: false };
    return Response.json({ wind: missing, waves: missing, temperature: missing, stormSignal: missing,
      hold: { available: false, active: false, checkedAt: null, reason: null }, receivedAt: '2026-10-17T01:00:00Z' });
  }
  if (url.pathname !== '/api/advisories/nearest') return nativeFetch(input, init);
  mock.requests.push(url.search);
  const mode = mock.mode;
  if (mock.holdNext) { mock.holdNext = false; await new Promise<void>(resolve => { mock.pending = () => { mock.pending = null; resolve(); }; }); }
  // Deliberately allow an obsolete response to resolve; the hook must ignore it.
  if (mode === 'failed') return Response.json({ error: 'Offline unavailable' }, { status: 503 });
  if (mode === 'unsupported' || mode === 'catalog') return Response.json({ error: 'Test-only error', code: mode === 'unsupported' ? 'species_unsupported' : 'species_catalog_unavailable' }, { status: mode === 'unsupported' ? 422 : 503 });
  const rows = mode === 'empty' ? [] : mode === 'malformed' ? [{ ...records[0], target_lat: null }] : records;
  return Response.json({ hotspots: rows, source: 'postgres_direct', provenance: 'legacy_unverified',
    species_status: url.searchParams.has('species') ? 'resolved' : 'not_requested', species_hsi_status: url.searchParams.has('species') ? 'unavailable' : 'not_requested',
    metadata: { region: 'reg-5', eligibleCount: 1200, returnedCount: rows.length, predictionDates: ['2026-09-25', '2027-01-02'], capped: true } });
};

function Fixture() {
  const [userProfile, setUserProfile] = useState({ id: 'offline-tier02', port: 'Mercedes Fish Port', lat: 14.0122, lng: 123.0114,
    speciesPreference: 'both', regionId: 'reg-5', regionName: 'Bicol Region', province: 'Camarines Norte', phone: '', vesselName: '', boatType: '', licenseNo: '', fmaZone: '' });
  const route = (path: string) => history.pushState({}, '', path);
  Object.assign(window, { tier02: mock, fixture: { route, setInvalidPort: (invalid: boolean) => setUserProfile(previous => ({ ...previous, lat: invalid ? NaN : 14.0122 })) } });
  const value = { isInitialized: true, isAuthenticated: true, language: 'en', changeLanguage() {}, fontScale: 0, changeFontScale() {},
    userProfile, notifications: [], theme: 'light', logout() {}, toggleTheme() {}, manualOverrideHold: false, showToast() {}, route };
  return <FixtureContext.Provider value={value}>
    {(window as Window & { offlineManual?: boolean }).offlineManual && <nav aria-label="Offline fixture controls" style={{ background: 'white', padding: 12 }}>
      <p>Isolated synthetic predictions only. No account, database, model, SMS or live map access. Choose a response then press Refresh areas.</p>
      <label>Fixture response <select defaultValue="records" onChange={event => { mock.mode = event.target.value as Mode; }}>
        {['records', 'empty', 'failed', 'unsupported', 'catalog', 'malformed'].map(mode => <option key={mode}>{mode}</option>)}
      </select></label>
      <button onClick={() => setUserProfile(previous => ({ ...previous, lat: Number.isNaN(previous.lat) ? 14.0122 : NaN }))}>Fixture: toggle invalid port</button>
    </nav>}
    <DashboardPage />
  </FixtureContext.Provider>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
