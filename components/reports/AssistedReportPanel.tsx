import type { ReportingContext } from '@/lib/frontend/catch-reporting';
import { permittedSubjects } from '@/lib/frontend/catch-reporting';
import styles from './reporting.module.css';

export default function AssistedReportPanel({ context, fisherId, select, disabled }: {
  context: ReportingContext | null; fisherId: string; select: (id: string) => void; disabled: boolean;
}) {
  const allowed = context?.assistance === 'allowed';
  return <section className={styles.assistance} aria-labelledby="assistance-heading">
    <div><p className={styles.eyebrow}>Reporting account</p><h2 id="assistance-heading">Who is this report for?</h2></div>
    {allowed ? <label className={styles.field}>Permitted fisher
      <select value={fisherId} onChange={event => select(event.target.value)} disabled={disabled}>
        {permittedSubjects(context).map(subject => <option key={subject.id} value={subject.id}>{subject.label}{subject.id === context.actorId ? ' (your account)' : ''}</option>)}
      </select><span className={styles.hint}>Only accounts within your confirmed assistance scope are listed. Changing fisher starts a new draft.</span>
    </label> : <p className={styles.muted}>{context?.assistance === 'denied'
      ? 'Assisted entry is not permitted for this account.' : 'Assisted-entry permissions are unavailable. Another fisher cannot be selected.'}</p>}
    {context && <p className={styles.hint}>Entered by {context.self.label}.{fisherId !== context.self.id ? ' You are acting for the selected fisher.' : ' Reporting for your own account.'}</p>}
  </section>;
}
