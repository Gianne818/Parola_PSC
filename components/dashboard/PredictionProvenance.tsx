import type { FishingArea } from '@/lib/dashboard';
import { displayTime } from './Advisory';
import styles from './dashboard.module.css';

/** Explicit English fallback until these additional metadata labels receive D10 review. */
export default function PredictionProvenance({ area }: { area: FishingArea }) {
  const created = displayTime(area.lastUpdated, 'en');
  const received = displayTime(area.retrievedAt, 'en');
  return <div lang="en">
    <p className={styles.notice}>{area.source === 'sample' ? 'Demo data; not operational guidance.' : 'Prediction provenance and validity are unverified.'}</p>
    <dl className={styles.sourceList}>
      <div><dt>Record created</dt><dd>{created ? `${created} PHT` : 'Unavailable'}</dd></div>
      <div><dt>Retrieved by this portal</dt><dd>{received ? `${received} PHT` : 'Unavailable'}</dd></div>
    </dl>
    <p className={styles.panelDescription}>Retrieval and record creation times do not establish prediction age. Observation time, model generation time, validity interval, source and run version are unavailable in this response.</p>
  </div>;
}
