import type { CatchReport, ReportSubject } from '@/lib/frontend/catch-reporting';
import styles from './reporting.module.css';

const stateLabels = { pending: 'Pending review', flagged: 'Flagged', reviewed: 'Reviewed' };
export default function ReportHistory({ reports, subjects, status, retry, correct, busy }: {
  reports: CatchReport[]; subjects: ReportSubject[]; status: 'loading' | 'ready' | 'unavailable' | 'error';
  retry: () => void; correct: (report: CatchReport) => void; busy: boolean;
}) {
  return <section className={styles.history} aria-labelledby="report-history-heading" aria-busy={status === 'loading'}>
    <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Your records</p><h2 id="report-history-heading">Report history</h2></div>
      <button type="button" onClick={retry} disabled={busy || status === 'loading'}>Reload history</button></div>
    <p className={styles.muted}>Review status is separate from scientific eligibility. A reviewed report does not establish eligibility for research or model training.</p>
    {status === 'loading' && <p role="status">Loading report history…</p>}
    {status === 'unavailable' && <p className={styles.notice}>History is unavailable. This does not mean you have no reports.</p>}
    {status === 'error' && <p className={styles.error} role="alert">History could not be loaded. Retry with Reload history; your open draft is kept.</p>}
    {status === 'ready' && !reports.length && <div className={styles.empty}><h3>No reports yet</h3><p>Your confirmed trip reports will appear here. Reporting is optional.</p></div>}
    {status === 'ready' && reports.length > 0 && <ul className={styles.records}>{reports.map(report => <li key={report.id}>
      <div className={styles.recordHeading}><h3>{report.trip.date}</h3><span className={styles.badge} data-state={report.state}>{stateLabels[report.state]}</span></div>
      <p className={styles.recordArea}>{report.trip.area}</p>
      <p className={styles.hint}>For {subjects.find(subject => subject.id === report.fisherId)?.label || 'Unavailable account'}</p>
      <dl><div><dt>Catch</dt><dd>{report.trip.weight} {report.trip.units.weight}{report.trip.weight === 0 ? ' · Zero catch' : ''}</dd></div>
        <div><dt>Species</dt><dd>{report.trip.species || 'None reported'}</dd></div>
        <div><dt>Effort</dt><dd>{report.trip.effort} {report.trip.units.effort}</dd></div>
        <div><dt>Location</dt><dd>{report.trip.gps ? 'Optional coordinates provided' : 'Approximate area only'}</dd></div></dl>
      {report.trip.gps && <details><summary>View reported coordinates</summary><p>{report.trip.gps.latitude}, {report.trip.gps.longitude}</p></details>}
      <p className={styles.hint}>{report.state === 'pending' ? 'Awaiting review; no reviewed outcome is confirmed.' : report.state === 'flagged' ? 'Needs attention. Read the review note before correcting.' : 'Recorded as reviewed by the reporting service.'}</p>
      {report.reviewNote && <p className={styles.reviewNote}>Review note: {report.reviewNote}</p>}
      <button type="button" disabled={busy || !report.canCorrect} onClick={() => correct(report)} aria-label={`Correct report ${report.id}`}>Correct report</button>
      {!report.canCorrect && <p className={styles.hint}>Correction is not permitted for this record.</p>}
    </li>)}</ul>}
  </section>;
}
