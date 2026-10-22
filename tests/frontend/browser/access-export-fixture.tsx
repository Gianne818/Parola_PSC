// Explicit development/test data only. Normal routes never import this file.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import DashboardPage from '@/app/dashboard/page';
import { FixtureContext } from './state';
import '@/app/globals.css';

type Mode = 'filtered' | 'demo' | 'partial' | 'unavailable' | 'empty' | 'authentication' | 'denied' | 'failure' | 'malformed' | 'delayed' | 'download_failure';
type CurrentMode = 'optimal' | 'slack' | 'strong' | 'missing' | 'invalid';
const fixture = { coverage: 'demo' as Mode, export: 'demo' as Mode, requests: [] as string[], downloads: [] as { filename: string; text: string }[],
  current: 'optimal' as CurrentMode, exportCalls: 0, aborted: 0, resolveExport: () => {}, resolveNearest: () => {}, account: 'isolated-access-account', headers: {} as Record<string, string> };
const date = '2026-10-22';
const rows = ['pelagic', 'demersal'].map((model_type, index) => ({ grid_id: index + 1, target_lat: 14.08 + index * .04, target_lon: 123.08 + index * .04,
  model_type, catch_probability: .7 + index * .1, prediction_date: date, created_at: date + 'T01:00:00Z',
  current_u: .3, current_v: .2, current_speed: .36, current_heading: 56.3, environment_provenance: 'synthetic_test_only' }));
function selection(mode: Mode) {
  return { requested_date: null, prediction_date: mode === 'empty' ? null : date, as_of_date: date, timezone: 'Asia/Manila',
    date_status: mode === 'empty' ? 'unavailable' : 'today', coherence: 'prediction_date_only', validity_status: 'unverified', operational_eligible: false,
    geography: { status: mode === 'demo' ? 'not_evaluated' : mode === 'partial' ? 'partial' : mode === 'unavailable' ? 'unavailable' : 'filtered',
      denied_count: mode === 'demo' || mode === 'empty' ? 0 : 2, unavailable_count: mode === 'partial' || mode === 'unavailable' ? 3 : 0 },
    lineage_status: 'unavailable', ingestion_run_ids: [], ingestion_run_count: 0, ingestion_run_ids_capped: false,
    habitats: { pelagic: { status: mode === 'empty' ? 'unavailable' : 'available', eligible_count: mode === 'empty' ? 0 : 1 },
      demersal: { status: mode === 'empty' ? 'unavailable' : 'available', eligible_count: mode === 'empty' ? 0 : 1 } } };
}
function exportResponse(mode: Mode, url: URL) {
  const selected = rows.filter(row => url.searchParams.get('habitat') === 'both' || row.model_type === url.searchParams.get('habitat'));
  const data = { type: 'FeatureCollection', features: mode === 'empty' ? [] : selected.map(row => ({ type: 'Feature',
    geometry: { type: 'Point', coordinates: [row.target_lon, row.target_lat] }, properties: { grid_id: row.grid_id, model_type: row.model_type,
      prediction_date: row.prediction_date, model_score: row.catch_probability, validity_status: 'unverified' } })),
    selection: selection(mode), export_mode: mode === 'demo' ? 'demo_preview' : 'geographically_filtered', operational_eligible: false,
    provenance: 'legacy_unverified', synthetic_fixture_only: true };
  if (mode === 'malformed') data.operational_eligible = true;
  return new Response(JSON.stringify(data, null, 2), { headers: { 'Content-Type': 'application/geo+json' } });
}
const blobs = new Map<string, Blob>();
const createUrl = URL.createObjectURL.bind(URL);
URL.createObjectURL = blob => {
  if (fixture.export === 'download_failure') throw new Error('Synthetic browser handoff failure');
  const url = createUrl(blob); if (blob instanceof Blob) blobs.set(url, blob); return url;
};
document.addEventListener('click', event => {
  const anchor = event.target instanceof Element ? event.target.closest('a[download]') as HTMLAnchorElement | null : null;
  if (!anchor) return;
  event.preventDefault();
  const blob = blobs.get(anchor.href);
  if (blob) void blob.text().then(text => fixture.downloads.push({ filename: anchor.download, text }));
}, true);

window.fetch = async (input, options) => {
  const url = new URL(String(input), location.origin);
  if (url.origin !== location.origin) throw new Error('Fixture blocked external request');
  fixture.requests.push(url.pathname + url.search);
  if (url.pathname === '/api/dashboard/weather') {
    const reading = { value: null, source: 'Synthetic test only', observedAt: null, available: false };
    return Response.json({ wind: reading, waves: reading, temperature: reading, stormSignal: reading,
      hold: { available: false, active: false, checkedAt: null, reason: null }, receivedAt: new Date().toISOString() });
  }
  const mode = url.pathname === '/api/advisories/export' ? fixture.export : fixture.coverage;
  if (!['/api/advisories/nearest', '/api/advisories/export'].includes(url.pathname)) throw new Error('Fixture blocked unknown request');
  if (url.pathname === '/api/advisories/export') fixture.exportCalls++;
  if (mode === 'failure') throw new Error('Synthetic offline failure');
  if (mode === 'authentication' || mode === 'denied') return Response.json({ error: 'Synthetic account rejection', code: 'geographic_auth_required' }, { status: mode === 'authentication' ? 401 : 403 });
  if (mode === 'unavailable' || (mode === 'partial' && url.pathname.endsWith('/export'))) return Response.json({ error: 'Synthetic incomplete coverage',
    code: 'geographic_data_unavailable', selection: selection(mode) }, { status: 503 });
  if (mode === 'delayed' && url.pathname.endsWith('/export')) return new Promise(resolve => {
    options?.signal?.addEventListener('abort', () => { fixture.aborted++; }, { once: true });
    fixture.resolveExport = () => resolve(exportResponse('filtered', url)); // Deliberately late; consumer must ignore obsolete replies.
  });
  if (mode === 'delayed') return new Promise(resolve => { fixture.resolveNearest = () => resolve(Response.json({ hotspots: rows, selection: selection('filtered') })); });
  if (url.pathname.endsWith('/export')) return exportResponse(mode, url);
  const currentSpeed = { optimal: .36, slack: .08, strong: .85, missing: null, invalid: 'invalid' }[fixture.current];
  const currentRows = rows.map(row => ({ ...row, current_speed: currentSpeed }));
  return Response.json({ hotspots: mode === 'empty' ? [] : currentRows, selection: mode === 'malformed' ? { geography: { status: 'allowed' } } : selection(mode),
    source: 'synthetic_test_only', provenance: 'legacy_unverified',
    metadata: { region: 'reg-5', eligibleCount: mode === 'empty' ? 0 : 2, returnedCount: mode === 'empty' ? 0 : 2,
      predictionDates: mode === 'empty' ? [] : [date], capped: false } });
};

function Fixture() {
  const [coverage, setCoverage] = useState<Mode>('demo');
  const [exportMode, setExport] = useState<Mode>('demo');
  const [current, setCurrent] = useState<CurrentMode>('optimal');
  const [account, setAccount] = useState(fixture.account);
  Object.assign(window, { accessFixture: fixture, fixture: { route() {} }, switchFixtureAccount: () => setAccount(previous => previous + '-changed') });
  const context = { isInitialized: true, isAuthenticated: true, language: 'en', changeLanguage() {}, fontScale: 0, changeFontScale() {},
    userProfile: { id: account, port: 'Mercedes Fish Port', lat: 14.0122, lng: 123.0114, speciesPreference: 'both',
      regionId: 'reg-5', regionName: 'Bicol Region', phone: '', vesselName: '', boatType: '', licenseNo: '', fmaZone: '' },
    notifications: [], theme: 'light', logout() {}, toggleTheme() {}, manualOverrideHold: false, showToast() {} };
  const modes: Mode[] = ['demo', 'filtered', 'partial', 'unavailable', 'empty', 'authentication', 'denied', 'failure', 'malformed', 'delayed', 'download_failure'];
  return <FixtureContext.Provider value={context}>
    <div style={{ padding: '8px 16px', background: '#fff', color: '#12211e', font: '13px/1.5 system-ui', overflowWrap: 'anywhere' }}>
      <strong>Synthetic TIER-05 preview</strong> · No live account, database, model, tiles, SMS or real download.
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <label>Coverage fixture <select value={coverage} onChange={event => { const next = event.target.value as Mode; fixture.coverage = next; setCoverage(next); }}>
          {modes.filter(mode => mode !== 'download_failure').map(mode => <option key={mode}>{mode}</option>)}</select></label>
        <label>Export fixture <select value={exportMode} onChange={event => { const next = event.target.value as Mode; fixture.export = next; setExport(next); }}>
          {modes.map(mode => <option key={mode}>{mode}</option>)}</select></label>
        <label>Current fixture <select value={current} onChange={event => { const next = event.target.value as CurrentMode; fixture.current = next; setCurrent(next); }}>
          {(['optimal', 'slack', 'strong', 'missing', 'invalid'] as const).map(mode => <option key={mode}>{mode}</option>)}</select></label>
        <span>After changing coverage, use Refresh areas. Downloads are captured in memory.</span>
      </div>
    </div>
    <DashboardPage />
  </FixtureContext.Provider>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
