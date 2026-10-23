import { GEOGRAPHIC_LABELS, type GeographicCoverage } from '@/lib/frontend/geographic-access';
import styles from './access-export.module.css';

export default function GeographicAccessStatus({ coverage, loading = false, failed = false }: {
  coverage?: GeographicCoverage | null; loading?: boolean; failed?: boolean;
}) {
  const current = loading || (failed && coverage?.status !== 'unavailable') ? null : coverage;
  const label = current ? GEOGRAPHIC_LABELS[current.status] : GEOGRAPHIC_LABELS.unavailable;
  return <section className={styles.access} aria-label="Geographic access status" aria-busy={loading} lang="en">
    <p className={styles.statusTitle} role="status">{loading ? 'Checking geographic coverage…' : label.title}</p>
    {(loading || failed) && <p>{loading ? 'The latest selection has not been confirmed.'
      : 'The latest request failed. Any retained map records do not confirm current access.'}</p>}
    <p className={styles.muted}>This is not navigation clearance or legal fishing permission. Missing coverage never means unrestricted access.</p>
    <details className={styles.supportingDetails}>
      <summary>Geographic coverage details</summary>
      <p>{label.description}</p>
      {current && current.status !== 'not_evaluated' && <p>{current.deniedCount} candidates denied; {current.unavailableCount} could not be evaluated, before the response limit. These are selection counts, not individual point decisions.</p>}
    </details>
  </section>;
}
