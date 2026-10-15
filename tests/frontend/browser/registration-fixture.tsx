import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import AuthPage from '@/components/auth/AuthPage';
import { MessagingConsentSettings } from '@/components/auth/MessagingConsent';
import { AppProvider, useApp } from '@/context/AppContext';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { installMockFetch, mocks, supabase } from './registration-mocks';
import '@/app/globals.css';

installMockFetch();
// Deliberately seed old fabricated credentials; the real provider must ignore them.
localStorage.setItem('parola-auth', 'true');
localStorage.setItem('parola-profile', JSON.stringify({ phone: '+639181111111', vesselName: 'Fabricated legacy owner' }));
localStorage.setItem('parola-registered-users', JSON.stringify([{ phone: '+639181111111', password: 'password123' }]));

function Probe({ restart }: { restart: () => void }) {
  const app = useApp();
  const [settings, setSettings] = useState(false);
  const [protectedPage, setProtectedPage] = useState(false);
  const [failSave, setFailSave] = useState(false);
  useEffect(() => {
    Object.assign(window, { fixture: { ...app, mocks, supabase, restart, setSettings, setProtectedPage } });
  }, [app, restart]);
  if (protectedPage) return <AuthLayout><p id="protected-registration-page">Protected fixture</p></AuthLayout>;
  return <>
    {(window as Window & { offlineManual?: boolean }).offlineManual && <nav aria-label="Offline registration fixture controls" style={{ padding: 12, background: 'white', color: 'black' }}>
      <p>Disconnected fixture only. Use 09171234567 and synthetic code 012345; no SMS is sent. Use only test details. Press Enter in the terminal to close and remove this profile.</p>
      <button onClick={() => setSettings(false)}>Fixture: Registration</button>{' '}
      <button disabled={!app.isAuthenticated} onClick={() => setSettings(true)}>Fixture: Consent settings</button>{' '}
      <label><input type="checkbox" checked={failSave} onChange={event => { setFailSave(event.target.checked); mocks.failPath = '/api/users/register'; mocks.failStatus = event.target.checked ? 503 : 0; }} />Fail mocked registration save</label>{' '}
      <button onClick={() => { mocks.version += '-new'; }}>Fixture: Change consent version</button>
    </nav>}
    {settings ? <main style={{ maxWidth: 500, margin: 'auto', padding: 24 }}><MessagingConsentSettings key={app.userProfile.id} /></main> : <AuthPage mode="register" />}
  </>;
}
function Fixture() {
  const [generation, setGeneration] = useState(0);
  return <AppProvider key={generation}><Probe restart={() => setGeneration(value => value + 1)} /></AppProvider>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
