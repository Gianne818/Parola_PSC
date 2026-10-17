'use client';

import type { FishingArea } from '@/lib/dashboard';
import { hotspotAppearance } from '@/lib/frontend/hotspot-presentation';
import type { DashboardCopy } from './dashboard-copy';
import styles from './dashboard.module.css';

export default function SelectedEstimate({ area, guidanceAvailable, copy }: { area: FishingArea; guidanceAvailable: boolean; copy: DashboardCopy }) {
  const appearance = hotspotAppearance(area, guidanceAvailable);
  return <section className={styles.selectedEstimate} aria-label="Selected hotspot estimate" aria-live="polite" lang="en">
    <span>{copy.modelEstimate}</span>
    <strong data-status={appearance.withheld || appearance.percent === null ? 'unavailable' : 'estimate'}>{appearance.withheld ? 'Withheld · safety checks' : appearance.percent === null ? 'Unavailable' : `${appearance.percent}%`}</strong>
    <span className={styles.selectedHabitat}>{appearance.label}</span>
    <p>{appearance.withheld ? 'Reference only. Follow official warnings and port instructions.' : appearance.percent === null ? 'No valid model estimate supplied.' : 'Unverified estimate; not a validated catch probability.'}</p>
    <dl className={styles.summaryFacts}>
      <div><dt>From home port</dt><dd>{area.distanceKm.toFixed(1)} km <span>{area.compassBearing}</span></dd></div>
      <div><dt>{copy.predictionTime}</dt><dd>{area.predictionDate?.slice(0, 10) || copy.dateUnknown}</dd></div>
    </dl>
  </section>;
}
