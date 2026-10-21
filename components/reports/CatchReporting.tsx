'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { assertReportAction, permittedSubjects, readReportingContext, REPORTING_UNAVAILABLE,
  type CatchReport, type ReportCommand, type ReportingContext, type ReportingPort } from '@/lib/frontend/catch-reporting';
import AssistedReportPanel from './AssistedReportPanel';
import ReportHistory from './ReportHistory';
import TripReportForm from './TripReportForm';
import styles from './reporting.module.css';

export default function CatchReporting({ actorId, actorName, source, headingAs: Heading = 'h1' }: {
  actorId: string; actorName: string; source?: ReportingPort; headingAs?: 'h1' | 'h2';
}) {
  const [context, setContext] = useState<ReportingContext | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable' | 'error'>(source ? 'loading' : 'unavailable');
  const [fisherId, setFisherId] = useState(actorId);
  const [correction, setCorrection] = useState<CatchReport | null>(null);
  const [busy, setBusy] = useState(false);
  const loadVersion = useRef(0);
  const currentContext = useRef<ReportingContext | null>(null);
  const screen = useRef<HTMLDivElement>(null);
  const returnToForm = useRef(false);
  const reload = useCallback(async () => {
    const version = ++loadVersion.current;
    if (!source || !actorId) { setStatus('unavailable'); setContext(null); currentContext.current = null; return; }
    setStatus('loading');
    // Stale permission snapshots cannot authorize a new action while access is reloaded.
    currentContext.current = null;
    try {
      const next = readReportingContext(await source.load(actorId), actorId);
      if (version !== loadVersion.current) return;
      currentContext.current = next; setContext(next); setStatus('ready');
    } catch {
      if (version !== loadVersion.current) return;
      currentContext.current = null; setContext(null); setStatus('error');
    }
  }, [source, actorId]);
  useEffect(() => {
    let stopped = false;
    const version = loadVersion;
    const access = currentContext;
    queueMicrotask(() => { if (!stopped) void reload(); });
    return () => { stopped = true; version.current++; access.current = null; };
  }, [reload]);
  useEffect(() => {
    if (!correction && returnToForm.current) {
      returnToForm.current = false;
      screen.current?.querySelector('form')?.closest('section')?.querySelector('h2')?.focus();
    }
  }, [correction]);

  const subjects = context ? permittedSubjects(context) : [];
  const subject = subjects.find(item => item.id === fisherId);
  const submit = async (command: ReportCommand) => {
    const access = currentContext.current;
    if (!source || !access || command.actorId !== actorId) throw new Error(REPORTING_UNAVAILABLE);
    assertReportAction(access, command.fisherId, correction);
    return source.submit(command);
  };
  const saved = (report: CatchReport) => {
    const access = currentContext.current;
    if (!access) return;
    const next = { ...access, reports: [report, ...access.reports.filter(item => item.id !== report.id)] };
    currentContext.current = next; setContext(next);
  };
  const canSubmit = status === 'ready' && Boolean(context && subject && (correction ? context.reports.some(item => item.id === correction.id && item.canCorrect) : context.canCreate));
  return <div ref={screen} className={styles.reporting} lang="en">
    <header className={styles.pageHeading}><div><p className={styles.eyebrow}>Parola · trip records</p><Heading className={styles.pageTitle}>Catch reporting</Heading>
      <p>Every trip has a place here, including zero catch.</p></div><span className={styles.optional}>Always optional</span></header>
    <p className={styles.intro}>Reporting is voluntary and does not affect access to advisories. Use an approximate area; precise GPS is optional.</p>
    {(status === 'unavailable' || status === 'error') && <p className={styles.notice} role="status">{REPORTING_UNAVAILABLE} You can prepare details here while this page stays open.</p>}
    <AssistedReportPanel context={status === 'ready' ? context : null} fisherId={fisherId} disabled={busy || status !== 'ready'}
      select={id => { if (!busy && subjects.some(item => item.id === id)) { setFisherId(id); setCorrection(null); } }} />
    <div className={styles.columns}>
      <TripReportForm key={`${actorId}:${fisherId}:${correction ? `${correction.id}:${correction.revision}` : 'new'}`} actorId={actorId} fisherId={fisherId}
        fisherName={subject?.label ?? (fisherId === actorId ? actorName : 'Access unavailable')}
        units={context?.units ?? null} canSubmit={canSubmit} correction={correction} submit={submit} saved={saved} busyChanged={setBusy}
        cancel={() => { returnToForm.current = true; setCorrection(null); }} />
      <ReportHistory reports={context?.reports ?? []} subjects={subjects} status={status} retry={() => { if (!busy) void reload(); }} busy={busy}
        correct={report => { if (!busy && status === 'ready' && report.canCorrect) { setFisherId(report.fisherId); setCorrection(report); } }} />
    </div>
  </div>;
}
