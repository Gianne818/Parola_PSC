// Isolated test entry: real provider/screens, in-memory owner responses, no network.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider, useApp } from '@/context/AppContext';
import SettingsPage from '@/app/settings/page';
import HomePortOnboarding from '@/components/onboarding/HomePortOnboarding';
import ToastContainer from '@/components/ui/ToastContainer';
import '@/app/globals.css';

const mock = {
  account: { id: 'fixture-owner-a', phone_number: '+639171234567', full_name: 'Fixture captain', home_port_name: 'Estancia Shoreline Port',
    latitude: 11.4552, longitude: 123.1491, advisory_days: [1, 3, 5], preferred_advisory_time: '04:30:17', preferred_language: 'ceb', habitat_preference: 'demersal',
    advisory_timezone: 'Asia/Manila', routine_paused: false, next_routine_at: '2026-10-18T20:30:17Z' as string | null, auth_mode: 'demo',
    language_status: { requested: 'ceb', message_language: 'en', fallback: true, reviewed: false } },
  requests: [] as { method: string; body?: Record<string, unknown> }[],
  failNext: false, malformedNext: false, holdNext: false, unavailable: false,
  release: () => {},
};
window.fetch = async (input, init) => {
  if (String(input) !== '/api/users/profile') throw new Error('Offline fixture rejected request: ' + String(input));
  const body = init?.body ? JSON.parse(String(init.body)) : undefined;
  mock.requests.push({ method: init?.method || 'GET', body });
  if (mock.holdNext) { mock.holdNext = false; await new Promise<void>(resolve => { mock.release = resolve; }); }
  if (mock.failNext) { mock.failNext = false; return Response.json({ error: 'Fixture database unavailable' }, { status: 503 }); }
  if (mock.malformedNext) { mock.malformedNext = false; return Response.json({ status: 'ok' }); }
  if (body) {
    Object.assign(mock.account, body);
    mock.account.routine_paused = mock.account.advisory_days.length === 0;
    mock.account.next_routine_at = mock.account.routine_paused ? null : '2026-10-18T20:30:17Z';
    mock.account.language_status = { requested: mock.account.preferred_language, message_language: 'en', fallback: mock.account.preferred_language !== 'en', reviewed: false };
  }
  const response: Record<string, unknown> = structuredClone(mock.account);
  if (mock.unavailable) delete response.advisory_days;
  return Response.json(response);
};

function Content() {
  const context = useApp();
  const [screen, setScreen] = useState('settings');
  const route = (path: string) => { history.pushState({}, '', path); setScreen(path.startsWith('/onboarding') ? 'port' : path.startsWith('/login') ? 'signed-out' : 'settings'); };
  Object.assign(window, { tierContext: context, tierMock: mock, fixture: { route } });
  return <>
    {screen === 'settings' ? <SettingsPage /> : screen === 'port' ? <HomePortOnboarding /> : <main>Signed out fixture</main>}
    <ToastContainer />
  </>;
}
function Fixture() {
  const [generation, setGeneration] = useState(0);
  Object.assign(window, { remountTier: () => setGeneration(value => value + 1) });
  return <AppProvider key={generation} authMode="demo"><Content /></AppProvider>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
