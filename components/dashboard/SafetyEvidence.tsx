import type { DashboardWeather } from '@/lib/dashboard';
import { isReadingCurrent, manilaDate } from '@/lib/dashboard';
import { recordTimestamp } from '@/lib/frontend/timestamps';
import { displayTime } from './Advisory';
import styles from './safety-status.module.css';
import { evidenceCoverage } from '@/lib/frontend/safety-presentation';

/** Regional records are labelled as records, never promoted to an official feed. */
export default function SafetyEvidence({ data, failed = false, now = new Date(), language = 'en' }: {
  data: DashboardWeather | null; failed?: boolean; now?: Date; language?: string;
}) {
  const hold = data?.hold;
  const checked = recordTimestamp(hold?.checkedAt);
  const current = Boolean(hold?.available && checked && Date.parse(checked) <= now.getTime() && manilaDate(checked) === manilaDate(now));
  const signal = data?.stormSignal;
  const warning = hold?.active || (signal?.value != null && signal.value > 0);
  return <section className={styles.evidence} lang="en" aria-label="Warning evidence and safety coverage">
    <h3>Warnings and coverage</h3>
    {warning && <p className={styles.warning} role="status">Recorded warning remains visible. Follow current official warnings and port instructions.</p>}
    {hold?.active && <p><strong>Regional hold: </strong>{hold.reason || 'Active; reason unavailable.'}
      {(!current || failed) && ' Last available record; current status is unconfirmed.'}</p>}
    {signal?.value != null && signal.value > 0 && <p><strong>Recorded storm signal: </strong>{signal.value}. Source: {signal.source || 'Unavailable'}. Record time: {displayTime(signal.observedAt, language) || 'Unavailable'} PHT.
      {!isReadingCurrent(signal, now) && ' Last available record; current status is unconfirmed.'}</p>}
    <dl className={styles.facts}>
      <div><dt>Wind / wave evidence</dt><dd>{evidenceCoverage(data?.wind, now)} / {evidenceCoverage(data?.waves, now)}. Provider validity and regional checks must still be reviewed.</dd></div>
      <div><dt>Regional hold check</dt><dd>{failed ? 'Refresh failed; last available record only' : current ? 'Recorded today; coverage unverified' : hold ? 'Missing, stale or undated check' : 'Unavailable'}</dd></div>
      <div><dt>Record time (PHT)</dt><dd>{displayTime(hold?.checkedAt, language) || 'Unavailable'}</dd></div>
      <div><dt>Record source</dt><dd>{data ? 'Parola regional hold record' : 'Unavailable'}</dd></div>
      <div><dt>Official warning feed</dt><dd>Unavailable in this response. No complete applicable-warning list, official issue/expiry times or source links supplied.</dd></div>
      <div><dt>Safety decision and rule version</dt><dd>Authoritative vessel-specific decision unavailable. Existing Parola hold checks remain in effect.</dd></div>
    </dl>
    <p>An absent warning is not safety clearance. A weather outage does not cancel a separately recorded warning. Check current official notices before departure.</p>
  </section>;
}
