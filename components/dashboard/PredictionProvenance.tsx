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
      <div><dt>Response source / provenance</dt><dd>{area.evidence?.responseSource || 'Unavailable'} / {area.evidence?.provenance || 'Unavailable'}</dd></div>
      <div><dt>Observation / model generation time</dt><dd>Unavailable</dd></div>
      <div><dt>Prediction validity interval / run version</dt><dd>Unavailable</dd></div>
      <div><dt>Depth</dt><dd>Unavailable; no validated depth evidence supplied</dd></div>
      <div><dt>Species presence</dt><dd>Unavailable; habitat or species adjustment is not a sighting</dd></div>
      <div><dt>Environmental features</dt><dd>SST: {Number.isFinite(area.sst) ? `${area.sst} °C` : 'Unavailable'}; chlorophyll-a: {Number.isFinite(area.chlA) ? `${area.chlA} (unit unavailable)` : 'Unavailable'}. Provenance: {area.evidence?.environmentProvenance || 'Unavailable'}. Feature observation time and quality are unverified.</dd></div>
      <div><dt>Historical nighttime vessel activity</dt><dd>{area.evidence?.clusterId ? `Cluster identifier: ${area.evidence.clusterId}. ` : ''}VIIRS source, observation age, cluster/noise meaning and coverage are unavailable. Historical vessel activity would be supporting evidence, not catch or species ground truth.</dd></div>
    </dl>
    <p className={styles.panelDescription}>Retrieval and record creation times do not establish prediction age or validity. Source labels alone do not verify a model run. Score calibration and score units are unverified; a model estimate is not a measured catch probability.</p>
  </div>;
}
