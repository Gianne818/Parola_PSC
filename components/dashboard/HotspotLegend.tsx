'use client';

import { hotspotAppearance } from '@/lib/frontend/hotspot-presentation';
import styles from './dashboard.module.css';

export default function HotspotLegend({ guidanceAvailable }: { guidanceAvailable: boolean }) {
  return <div className={styles.hotspotLegend} aria-label="Hotspot legend" lang="en">
    <div className={styles.legendHabitats}>{(['pelagic', 'demersal', 'both', 'unknown'] as const).map(type => {
      const appearance = hotspotAppearance({ type, catchProbability: .75 }, guidanceAvailable);
      return <span key={type} title={appearance.label}><i aria-hidden="true" style={{ background: appearance.color, borderColor: appearance.outline }}>{appearance.symbol}</i>{type === 'pelagic' ? 'Pelagic' : type === 'demersal' ? 'Demersal' : type === 'both' ? 'Mixed' : 'Unknown'}</span>;
    })}</div>
    <div className={styles.legendKeyRow}>
      {guidanceAvailable ? <span className={styles.legendScale} aria-label="More saturated means a higher model estimate">
        {(['pelagic', 'demersal'] as const).map(type => <span key={type} aria-hidden="true">{[.25, .6, .95].map(catchProbability => <i key={catchProbability} style={{ background: hotspotAppearance({ type, catchProbability }, true).color }} />)}</span>)}
        <span>Lower → higher estimate</span>
      </span> : <span>Estimates and saturation withheld</span>}
      <details className={styles.legendDetails} onKeyDown={event => {
        if (event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus(); }
      }}><summary>Map key</summary>
        <div>
          <p>Pelagic: sky blue to strong blue, surface water. Demersal: yellow-green to green, bottom &amp; reef.</p>
          <p>Colored outlines identify habitat only, including reference records. Mixed habitat and Unknown habitat stay neutral. Hollow markers: estimate unavailable. Black double ring: selected.</p>
          <p>{guidanceAvailable ? 'More saturated and darker = higher model estimate within each habitat. Select an area to see its percentage on the map and in the summary. Estimates are unverified, not catch probabilities.' : 'Safety checks withhold estimates and saturation. Neutral fills show reference records; habitat outlines remain visible.'}</p>
          <p>Home-port reference; this map does not track your boat.</p>
        </div>
      </details>
    </div>
  </div>;
}
