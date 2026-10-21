// Explicit development fixture. Never imported by an application route.
import { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import CatchReporting from '@/components/reports/CatchReporting';
import ReportsPage from '@/app/reports/page';
import type { CatchReport, ReportCommand, ReportingContext, ReportingPort } from '@/lib/frontend/catch-reporting';
import { FixtureContext } from './state';
import '@/app/globals.css';

const units = { weight: 'kg · fixture', effort: 'hours at sea · fixture' };
const trip = { date: '2026-10-19', area: 'Sample coastal area', species: 'Sample sardine', weight: 4, effort: 3, gps: null, units };
const initialReports: CatchReport[] = [
  { id: 'pending-1', fisherId: 'owner', enteredBy: 'owner', revision: '1', state: 'pending', reviewNote: null, canCorrect: true, trip },
  { id: 'flagged-1', fisherId: 'permitted', enteredBy: 'owner', revision: '1', state: 'flagged', reviewNote: 'Check the reported effort with the fisher.', canCorrect: true, trip: { ...trip, weight: 0, species: '' } },
  { id: 'reviewed-1', fisherId: 'owner', enteredBy: 'owner', revision: '1', state: 'reviewed', reviewNote: null, canCorrect: false, trip },
];
let reports = structuredClone(initialReports);
let requests: ReportCommand[] = [];
let nextSave = 'success';
let historyFails = false;
let delay = 120;
const acknowledgements = new Map<string, unknown>();
let chooseScenario: (name: string) => void = () => {};
const fixture = {
  scenario: (name: string) => chooseScenario(name),
  nextSave: (mode: string) => { nextSave = mode; },
  failHistory: (value: boolean) => { historyFails = value; },
  delay: (ms: number) => { delay = ms; },
  requests: () => structuredClone(requests),
  records: () => structuredClone(reports),
};
Object.assign(window, { catchFixture: fixture });

function portFor(scenario: string): ReportingPort {
  return {
    async load() {
      if (scenario === 'loading') return new Promise(() => {});
      await new Promise(resolve => setTimeout(resolve, 80));
      if (historyFails) throw new Error('Synthetic history outage');
      const context: ReportingContext = {
        actorId: 'owner', self: { id: 'owner', label: 'Sample account' }, canCreate: scenario !== 'denied-create',
        assistance: scenario === 'denied-assistance' ? 'denied' : 'allowed',
        permittedFishers: [{ id: 'permitted', label: 'Sample permitted fisher' }],
        units: scenario === 'missing-units' ? null : units,
        reports: reports.filter(report => scenario !== 'denied-assistance' || report.fisherId === 'owner'),
      };
      return structuredClone(context);
    },
    async submit(command) {
      requests.push(structuredClone(command));
      const outcome = nextSave; nextSave = 'success';
      await new Promise(resolve => setTimeout(resolve, delay));
      if (outcome === 'denied') throw new Error('Reporting permission was denied or revoked.');
      if (outcome === 'failure') throw new Error('Synthetic connection failure; submission is unconfirmed.');
      if (outcome === 'malformed') return { success: true };
      if (acknowledgements.has(command.requestId)) return structuredClone(acknowledgements.get(command.requestId));
      const report: CatchReport = {
        id: command.correction?.reportId ?? `sample-${acknowledgements.size + 1}`, fisherId: command.fisherId,
        enteredBy: command.actorId, revision: String(Number(command.correction?.revision ?? 0) + 1),
        state: 'pending', reviewNote: null, canCorrect: true, trip: structuredClone(command.trip),
      };
      const acknowledgement = { requestId: command.requestId, report };
      reports = [report, ...reports.filter(item => item.id !== report.id)];
      acknowledgements.set(command.requestId, acknowledgement);
      if (outcome === 'uncertain') throw new Error('Synthetic lost acknowledgement; server outcome is unknown.');
      return structuredClone(acknowledgement);
    },
  };
}

function Preview() {
  const [view, setView] = useState(() => ({ name: 'ready', key: 0, source: portFor('ready') }));
  const [language, changeLanguage] = useState<'en' | 'tl' | 'ceb' | 'hil'>('en');
  const selectScenario = useCallback((name: string) => {
    reports = name === 'empty' ? [] : structuredClone(initialReports);
    requests = []; acknowledgements.clear(); nextSave = 'success'; historyFails = name === 'history-error'; delay = 120;
    history.replaceState({}, '', name === 'shell' ? '/reports' : '/');
    window.dispatchEvent(new Event('popstate'));
    setView(current => ({ name, key: current.key + 1, source: portFor(name) }));
  }, []);
  useEffect(() => { chooseScenario = selectScenario; return () => { chooseScenario = () => {}; }; }, [selectScenario]);
  return <>
    <aside aria-label="Synthetic development controls" style={{ background: '#12211e', color: '#fff', padding: '16px 24px', font: '14px/1.6 system-ui' }}>
      <strong>Synthetic development preview · TIER-04</strong>
      <p style={{ margin: '4px 0 12px' }}>Provisional units, accounts and permissions. No live saves, database, SMS or research eligibility. System fonts.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{['ready', 'empty', 'unavailable', 'loading', 'history-error', 'denied-create', 'denied-assistance', 'missing-units', 'shell'].map(name =>
        <button key={name} type="button" onClick={() => selectScenario(name)} style={{ minHeight: 44, padding: '8px 12px', border: '1px solid #dae5e0', borderRadius: 8, background: '#fff', color: '#12211e', font: 'inherit' }}>{name}</button>)}</div>
      <label style={{ display: 'block', marginTop: 12 }}>Next synthetic submission: <select aria-label="Next synthetic submission" onChange={event => { nextSave = event.target.value; }} defaultValue="success" style={{ font: 'inherit', minHeight: 44, maxWidth: '100%' }}>
        {['success', 'failure', 'malformed', 'denied', 'uncertain'].map(value => <option key={value}>{value}</option>)}
      </select></label>
    </aside>
    {view.name === 'shell' ? <FixtureContext.Provider value={{ isInitialized: true, isAuthenticated: true,
      userProfile: { id: 'owner', vesselName: 'Sample account', port: 'Sample home port' }, language, changeLanguage, fontScale: 0,
      notifications: [], logout: () => {}, theme: 'light', toggleTheme: () => {} }}>
      <ReportsPage />
    </FixtureContext.Provider> : <main style={{ padding: '24px 16px', background: '#eaf1ec', minHeight: '100vh' }}>
      <CatchReporting key={view.key} actorId="owner" actorName="Sample account" source={view.name === 'unavailable' ? undefined : view.source} />
    </main>}
  </>;
}
createRoot(document.getElementById('root')!).render(<Preview />);
