// Offline browser fixture: actual UI/CSS, synthetic context, no backend provider.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { OfflineGeoPackModal } from '@/components/ui/OfflineGeoPackModal';
import ToastContainer from '@/components/ui/ToastContainer';
import SettingsPage from '@/app/settings/page';
import HomePortOnboarding from '@/components/onboarding/HomePortOnboarding';
import DashboardShell from '@/components/dashboard/DashboardShell';
import DashboardWorkspace from '@/components/dashboard/DashboardWorkspace';
import { DASHBOARD_COPY } from '@/components/dashboard/dashboard-copy';
import { PHILIPPINE_REGIONS } from '@/data/philippineRegions';
import { FixtureContext } from './state';
import '@/app/globals.css';

function Fixture() {
  const [screen, setScreen] = useState('settings');
  const [language, changeLanguage] = useState<'en' | 'tl' | 'ceb' | 'hil'>('en');
  const [fontScale, changeFontScale] = useState(0);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<null | { message: string; type: 'info' | 'error' | 'success' }>(null);
  const [failed, setFailed] = useState(false);
  const [habitat, setHabitat] = useState<'both' | 'pelagic' | 'demersal'>('both');
  const [species, setSpecies] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [userProfile, setUserProfile] = useState({ port: 'Mercedes Fish Port', lat: 14.0122, lng: 123.0114,
    regionName: 'Bicol Region', province: 'Camarines Norte', phone: '', vesselName: '', boatType: '', licenseNo: '', fmaZone: '' });
  const [saveFails, setSaveFails] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const copy = DASHBOARD_COPY[language];
  const route = (path: string) => { history.pushState({}, '', path); setScreen(path.startsWith('/onboarding') ? 'port' : path.startsWith('/dashboard') ? 'dashboard' : 'settings'); };
  Object.assign(window, { fixture: { setScreen, changeLanguage, changeFontScale, setFailed, setSaveFails, saveFails,
    setShowWeather, route, showToast: (type: 'info' | 'error' | 'success') => setToast({ type, message: `${type}: offline fixture message` }) } });
  const value = { isInitialized: true, isAuthenticated: true, language, changeLanguage, fontScale, changeFontScale,
    userProfile, notifications: [], theme: 'light', toast, hideToast: () => setToast(null), logout: () => {}, toggleTheme: () => {},
    manualOverrideHold: false, showToast: (message: string, type: 'info' | 'error' | 'success') => setToast({ message, type }),
    updateProfile: async (patch: object) => { if (saveFails) throw new Error('Mock save failure'); setUserProfile(previous => ({ ...previous, ...patch })); }, route };
  return <FixtureContext.Provider value={value}>
    {(window as Window & { offlineManual?: boolean }).offlineManual && <nav aria-label="Offline fixture controls" style={{ padding: 12, background: 'white', color: 'black' }}>
      <p>Offline fixtures only: no account, backend, geolocation or SMS. Exports are captured in memory. Press Enter in the terminal to close and remove this profile.</p>
      <button onClick={() => route('/settings')}>Fixture: Settings</button>{' '}
      <button onClick={() => route('/onboarding?from=profile')}>Fixture: Edit port</button>{' '}
      <button onClick={() => route('/onboarding')}>Fixture: Port setup</button>{' '}
      <button onClick={() => route('/dashboard')}>Fixture: Empty map</button>{' '}
      <button onClick={() => setScreen('sample')}>Fixture: Sample exports</button>{' '}
      <button onClick={() => setToast({ type: 'info', message: 'Offline fixture information' })}>Fixture: Information toast</button>{' '}
      <button onClick={() => setToast({ type: 'error', message: 'Offline fixture error' })}>Fixture: Error toast</button>{' '}
      <label><input type="checkbox" checked={saveFails} onChange={event => setSaveFails(event.target.checked)} />Fail mocked port save</label>
    </nav>}
    {screen === 'settings' ? <SettingsPage /> : screen === 'port' ? <HomePortOnboarding /> : screen === 'dashboard' ?
      <DashboardShell collapsed={collapsed} toggleSidebar={() => setCollapsed(!collapsed)}><DashboardWorkspace
        areas={[]} loading={false} failed={failed} retry={() => setFailed(false)} region={PHILIPPINE_REGIONS[0]} lat={userProfile.lat} lng={userProfile.lng}
        areaMetadata={null} habitat={habitat} species={species} setFilters={(nextHabitat, nextSpecies) => { setHabitat(nextHabitat); setSpecies(nextSpecies); }}
        state="incomplete" weather={null} weatherStale={false} phone="" port={userProfile.port} copy={copy} language={language}
        showWeather={showWeather} closeWeather={() => setShowWeather(false)} /></DashboardShell> :
      <main><h1>Offline sample controls</h1><button type="button" onClick={() => setOpen(true)}>Open sample export</button>
        <button type="button" onClick={() => setToast({ type: 'info', message: 'Offline information' })}>Show information</button></main>}
    <OfflineGeoPackModal isOpen={open} onClose={() => setOpen(false)} />
    <ToastContainer />
  </FixtureContext.Provider>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
