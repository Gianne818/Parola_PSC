// Test-only synthetic transports. Production routes/components remain connected to real services.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import AdvisoriesPage from '@/app/alerts/page';
import DashboardPage from '@/app/dashboard/page';
import { FixtureContext } from './state';
import '@/app/globals.css';

type WeatherMode = 'complete' | 'warning' | 'missing' | 'expired' | 'failed' | 'empty';
type ProfileMode = 'live' | 'demo' | 'denied' | 'failed' | 'paused' | 'mismatch' | 'unknown';
const nativeFetch = window.fetch.bind(window);
const mock = { weather: 'complete' as WeatherMode, profile: 'live' as ProfileMode, outcome: 'simulated', holdSms: false, holdProfile: false,
  releaseSms: null as null | (() => void), releaseProfile: null as null | (() => void), smsCalls: 0, requests: [] as string[] };
window.fetch = async (input, init) => {
  const url = new URL(String(input), location.origin);
  if (!['/api/dashboard/weather', '/api/users/profile', '/api/sms/send', '/api/advisories/nearest'].includes(url.pathname)) return nativeFetch(input, init);
  mock.requests.push(url.pathname);
  if (url.pathname === '/api/dashboard/weather') {
    if (mock.weather === 'failed') return Response.json({ error: 'Test outage' }, { status: 503 });
    if (mock.weather === 'empty') return Response.json({});
    const now = Date.now();
    const reading = { value: 1, source: 'Open-Meteo forecast', observedAt: new Date(now - 60000).toISOString(), validUntil: new Date(now + 3600000).toISOString(), available: true };
    const missing = { value: null, source: 'Unavailable', observedAt: null, available: false };
    return Response.json({ wind: mock.weather === 'warning' ? { value: 'malformed' } : mock.weather === 'missing' ? missing : { ...reading, value: 10 },
      waves: mock.weather === 'warning' || mock.weather === 'missing' ? missing : mock.weather === 'expired' ? { ...reading, validUntil: new Date(now - 1000).toISOString() } : reading,
      temperature: { ...reading, value: 29 }, stormSignal: { ...reading, value: mock.weather === 'warning' ? 2 : 0, source: 'Parola regional hold record' },
      hold: { available: mock.weather !== 'missing', active: mock.weather === 'warning', checkedAt: reading.observedAt, reason: mock.weather === 'warning' ? 'Test-only regional restriction' : null },
      location: { requested: { lat: Number(url.searchParams.get('lat')), lng: Number(url.searchParams.get('lng')) }, weatherGrid: null, marineGrid: null },
      receivedAt: new Date(now).toISOString() });
  }
  if (url.pathname === '/api/users/profile') {
    const mode = mock.profile;
    const profile = (window as Window & { fixture?: { userProfile: { id: string; phone: string } } }).fixture!.userProfile;
    if (mock.holdProfile) { mock.holdProfile = false; await new Promise<void>(resolve => { mock.releaseProfile = () => { mock.releaseProfile = null; resolve(); }; }); }
    if (mode === 'denied' || mode === 'failed') return Response.json({ error: 'Test-only profile error' }, { status: mode === 'denied' ? 403 : 503 });
    const paused = mode === 'paused';
    return Response.json({ id: mode === 'mismatch' ? 'another-account' : profile.id, phone_number: profile.phone,
      ...(mode === 'unknown' ? {} : { messaging_consent: mode !== 'demo' }), is_active: true,
      ...(mode === 'demo' ? { auth_mode: 'demo', contact_verified: false, messaging_eligible: false } : {}),
      advisory_days: paused ? [] : [1, 5], preferred_advisory_time: '05:00:00', preferred_language: 'en', habitat_preference: 'both',
      advisory_timezone: 'Asia/Manila', routine_paused: paused, next_routine_at: paused ? null : new Date(Date.now() + 86400000).toISOString(),
      language_status: { requested: 'en', message_language: 'en', reviewed: false, fallback: false } });
  }
  if (url.pathname === '/api/sms/send') {
    mock.smsCalls++;
    const outcome = mock.outcome;
    if (mock.holdSms) { mock.holdSms = false; await new Promise<void>(resolve => { mock.releaseSms = () => { mock.releaseSms = null; resolve(); }; }); }
    if (outcome === 'denied' || outcome === 'failed') return Response.json({ error: 'Test-only send error' }, { status: outcome === 'denied' ? 403 : 503 });
    return Response.json(outcome === 'unknown' ? { success: true, mode: 'queued' }
      : { success: true, mode: outcome === 'accepted' ? 'LIVE_DISPATCH' : 'MOCK_DRY_RUN' });
  }
  return Response.json({ hotspots: [{ grid_id: 1, target_lat: 14.05, target_lon: 123.05, model_type: 'both', catch_probability: .8, prediction_date: '2026-10-17' }] });
};

function Fixture() {
  const [page, setPage] = useState('alerts');
  const [revision, setRevision] = useState(0);
  const [userProfile, setUserProfile] = useState({ id: 'offline-tier03', port: 'Mercedes Fish Port', lat: 14.0122, lng: 123.0114,
    speciesPreference: 'both', regionId: 'reg-5', regionName: 'Bicol Region', province: 'Camarines Norte', phone: '09171234567', vesselName: '', boatType: '', licenseNo: '', fmaZone: '' });
  const route = (path: string) => { history.pushState({}, '', path); setPage(path === '/dashboard' ? 'dashboard' : 'alerts'); };
  Object.assign(window, { tier03: mock, fixture: { route, userProfile, remount: () => setRevision(value => value + 1),
    changeAccount: () => setUserProfile(previous => ({ ...previous, id: previous.id + '-next' })) } });
  const value = { isInitialized: true, isAuthenticated: true, language: 'en', changeLanguage() {}, fontScale: 0, changeFontScale() {},
    userProfile, notifications: [], theme: 'light', logout() {}, toggleTheme() {}, manualOverrideHold: false, showToast() {}, route };
  return <FixtureContext.Provider value={value}>
    {(window as Window & { offlineManual?: boolean }).offlineManual && <nav aria-label="Offline fixture controls" style={{ background: 'white', padding: 12 }}>
      <p>Synthetic safety/profile/SMS responses only. No provider, database or SMS access. Choose then refresh the corresponding panel.</p>
      <label>Weather response <select onChange={event => { mock.weather = event.target.value as WeatherMode; }}>{['complete', 'warning', 'missing', 'expired', 'failed', 'empty'].map(mode => <option key={mode}>{mode}</option>)}</select></label>
      <label>Profile response <select onChange={event => { mock.profile = event.target.value as ProfileMode; }}>{['live', 'demo', 'denied', 'failed', 'paused', 'mismatch', 'unknown'].map(mode => <option key={mode}>{mode}</option>)}</select></label>
      <label>SMS response <select onChange={event => { mock.outcome = event.target.value; }}>{['simulated', 'accepted', 'denied', 'failed', 'unknown'].map(mode => <option key={mode}>{mode}</option>)}</select></label>
      <button onClick={() => setRevision(value => value + 1)}>Fixture: remount</button>
      <button onClick={() => route(page === 'alerts' ? '/dashboard' : '/alerts')}>Fixture: switch page</button>
    </nav>}
    <React.Fragment key={revision}>{page === 'alerts' ? <AdvisoriesPage /> : <DashboardPage />}</React.Fragment>
  </FixtureContext.Provider>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
