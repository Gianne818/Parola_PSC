import Link from 'next/link';
import type { MessagingProfile } from '@/lib/frontend/messaging-status';
import { displayTime } from './Advisory';
import styles from './safety-status.module.css';
import dashboardStyles from './dashboard.module.css';

const choice = (value: boolean | null | undefined, yes: string, no: string) => value === true ? yes : value === false ? no : 'Unavailable';
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function MessagingStatus({ data, status, refresh, language }: {
  data: MessagingProfile | null; status: 'loading' | 'ready' | 'denied' | 'unavailable'; refresh: () => void; language: string;
}) {
  const schedule = data?.schedule;
  return <div className={styles.status} lang="en">
    <p role="status" aria-live="polite">{status === 'loading' ? 'Loading messaging status…' : status === 'denied' ? 'Messaging status access denied. Sign in again before retrying.'
      : status === 'unavailable' ? 'Messaging status unavailable. Consent and eligibility cannot be confirmed.'
        : data?.demo ? 'Demo account: contact unverified; live SMS is unavailable.' : 'Messaging profile loaded. Dispatch checks still apply.'}</p>
    <details>
      <summary>Consent, routine schedule and delivery</summary>
      <dl className={styles.facts}>
        <div><dt>Messaging consent</dt><dd>{choice(data?.consent, 'Granted in the saved profile', 'Not granted')}{data?.consentAt && ` · ${displayTime(data.consentAt, language)} PHT`}{data?.consentVersion && ` · Version ${data.consentVersion}`}</dd></div>
        <div><dt>Contact verification</dt><dd>{choice(data?.contactVerified, 'Verified by the service', 'Unverified')}</dd></div>
        <div><dt>Live messaging eligibility</dt><dd>{choice(data?.eligible, 'Eligible according to the service; dispatch checks still apply', 'Not eligible')}</dd></div>
        <div><dt>Sponsor consent and eligibility</dt><dd>Unavailable. Messaging consent does not include sponsor messages.</dd></div>
      </dl>
      <h3>Routine advisories</h3>
      <p>Up to five selected weekdays. A saved schedule does not confirm enrollment or delivery.</p>
      <p>{schedule ? schedule.routine_paused ? 'Routine schedule paused: no weekdays selected.'
        : `${schedule.advisory_days.map(day => days[day - 1]).join(', ')} · ${schedule.preferred_advisory_time} PHT` : 'Saved routine schedule unavailable.'}</p>
      <p>Next scheduled routine time: {schedule?.routine_paused ? 'Paused' : displayTime(schedule?.next_routine_at, language) ? `${displayTime(schedule?.next_routine_at, language)} PHT (scheduled, not a dispatch promise)` : 'Unavailable'}.</p>
      <h3>Critical alerts</h3>
      <p>Separate from routine weekdays and pauses; applicable critical alerts may occur any day. Delivery and enrollment are unconfirmed. Critical warnings must not be hidden by routine budgets or sponsor eligibility.</p>
      <h3>Delivery history</h3>
      <p>Unavailable. No last-attempt or callback-backed queued, submitted, delivered or failed history is supplied. A portal request or gateway acceptance does not confirm receipt.</p>
      <h3>Segments and costs</h3>
      <p>Message length and encoding can change segment use and provider charges. No confirmed segment count, contracted rate, charge or sponsor funding is supplied here. Budgets do not establish safety clearance.</p>
      <p>Reading a delivered SMS needs cellular service, without mobile data or a portal login. Delivery is not guaranteed.</p>
      <Link className={dashboardStyles.textButton} href="/settings">Review saved routine preferences</Link>
    </details>
    <button type="button" className={dashboardStyles.textButton} onClick={refresh} disabled={status === 'loading'}>Refresh messaging status</button>
  </div>;
}
