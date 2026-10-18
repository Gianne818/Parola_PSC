import { habitatFill } from '@/lib/frontend/hotspot-presentation';
import styles from './dashboard.module.css';

export default function HotspotLegend() {
  return <section className={styles.habitatLegend} aria-label="Habitat and estimate saturation key" lang="en">
    <div className={styles.habitatScales}>
      {(['pelagic', 'demersal'] as const).map(habitat => <div key={habitat}>
        <strong>{habitat === 'pelagic' ? 'P · Pelagic' : 'D · Demersal'}</strong>
        <span className={styles.habitatScale} aria-hidden="true" style={{ background: `linear-gradient(to right, ${habitatFill(habitat, 0)}, ${habitatFill(habitat, 100)})` }} />
      </div>)}
    </div>
    <p>Lower → higher unverified model estimate. No catch guarantee or departure clearance.</p>
    <p><span className={styles.mixedSwatch} aria-hidden="true" /> M · Mixed <span className={styles.unknownSwatch} aria-hidden="true" /> ? · Unknown <span className={styles.unavailableSwatch} aria-hidden="true" /> Hollow/dashed · Estimate unavailable</p>
  </section>;
}
