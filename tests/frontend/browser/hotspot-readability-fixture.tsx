// Explicit development fixture. No production provider, cookie, database or SMS requests.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import DashboardPage from '@/app/dashboard/page';
import { FixtureContext } from './state';
import L from 'leaflet';
import '@/app/globals.css';

type Advisory = 'incomplete' | 'hold' | 'clear';
const fixture = { advisory: 'incomplete' as Advisory, requests: [] as string[], smsAttempts: 0, maps: [] as L.Map[], resizeEvents: 0 };
L.Map.addInitHook(function (this: L.Map) { fixture.maps.push(this); this.on('resize', () => { fixture.resizeEvents++; }); });
const rows = [
  ['pelagic', .5], ['pelagic', .7], ['pelagic', .9],
  ['demersal', .5], ['demersal', .7], ['demersal', .9],
  ['both', .8], ['unknown', .8], ['pelagic', null], ['demersal', -1],
  ['pelagic', 101], ['demersal', null],
].map(([model_type, catch_probability], index) => ({
  grid_id: index + 1, target_lat: 14.04 + (index % 4) * .023,
  target_lon: 123.04 + Math.floor(index / 4) * .028,
  model_type, catch_probability, prediction_date: '2026-10-18', created_at: '2026-10-18T01:00:00Z',
  environment_provenance: 'synthetic_test_only',
}));
window.fetch = async input => {
  const url = new URL(String(input), location.origin);
  fixture.requests.push(url.pathname + url.search);
  if (url.pathname.includes('sms')) fixture.smsAttempts++;
  if (url.pathname === '/api/dashboard/weather') {
    const now = new Date();
    const observedAt = now.toISOString();
    const available = fixture.advisory !== 'incomplete';
    const reading = (value: number) => ({ value: available ? value : null, source: 'Synthetic test forecast', observedAt: available ? observedAt : null, available,
      validUntil: new Date(now.getTime() + 3600000).toISOString() });
    return Response.json({ wind: reading(12), waves: reading(.6), temperature: reading(28), stormSignal: reading(0),
      hold: { available, active: fixture.advisory === 'hold', checkedAt: available ? observedAt : null,
        reason: fixture.advisory === 'hold' ? 'Synthetic coastal warning. Follow current port instructions.' : null }, receivedAt: observedAt });
  }
  if (url.pathname === '/api/advisories/nearest') return Response.json({ hotspots: rows, source: 'synthetic_test_only', provenance: 'unverified_fixture',
    species_status: url.searchParams.has('species') ? 'resolved' : 'not_requested',
    species_hsi_status: url.searchParams.has('species') ? 'unavailable' : 'not_requested',
    metadata: { region: 'reg-5', eligibleCount: rows.length, returnedCount: rows.length, predictionDates: ['2026-10-18'], capped: false } });
  throw new Error(`Fixture blocked request: ${url.pathname}`);
};

function Fixture() {
  const [advisory, setAdvisory] = useState<Advisory>('incomplete');
  const route = () => { /* Navigation stays inside this dashboard-only preview. */ };
  Object.assign(window, { readability: fixture, fixture: { route } });
  const context = { isInitialized: true, isAuthenticated: true, language: 'en', changeLanguage() {}, fontScale: 0, changeFontScale() {},
    userProfile: { id: 'isolated-readability-fixture', port: 'Mercedes Fish Port', lat: 14.0122, lng: 123.0114, speciesPreference: 'both',
      regionId: 'reg-5', regionName: 'Bicol Region', province: 'Camarines Norte', phone: '', vesselName: '', boatType: '', licenseNo: '', fmaZone: '' },
    notifications: [], theme: 'light', logout() {}, toggleTheme() {}, manualOverrideHold: false, showToast() {}, route };
  return <FixtureContext.Provider value={context}>
    <div lang="en" style={{ padding: '8px 16px', background: '#fff', color: '#12211e', font: '13px/1.5 sans-serif' }}>
      <strong>Synthetic local preview · {location.pathname.includes('before') ? 'Before' : 'After'}</strong>
      {' · No live account, model, tiles, database or SMS. '}
      <label>Advisory fixture <select aria-label="Advisory fixture" value={advisory} onChange={event => {
        const next = event.target.value as Advisory;
        fixture.advisory = next;
        setAdvisory(next);
      }}>{(['incomplete', 'hold', 'clear'] as const).map(state => <option key={state}>{state}</option>)}</select></label>
      {' · After choosing, press Refresh advisory. Null records represent absent/producer-omitted estimates.'}
    </div>
    <DashboardPage />
  </FixtureContext.Provider>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
