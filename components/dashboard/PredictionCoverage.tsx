import type { FishingAreaMetadata } from '@/lib/dashboard';
import type { PredictionCoverage as Coverage } from '@/lib/frontend/prediction-presentation';
import styles from './dashboard.module.css';

/** Counts describe the response/display, never authoritative marine coverage. */
export default function PredictionCoverage({ metadata, coverage, displayed, received, species }: {
  metadata: FishingAreaMetadata | null; coverage?: Coverage; displayed: number; received: number | null; species: string;
}) {
  return <details className={styles.coverage} lang="en">
    <summary>Prediction coverage and selection</summary>
    {received === null ? <p>No usable prediction response is available. Counts remain unavailable.</p>
      : <p>{displayed} areas match the current habitat and date filters; {received} usable areas were returned for this query.</p>}
    {metadata ? <p>Server selection: {metadata.returnedCount} returned from {metadata.eligibleCount} eligible records in the requested region.
      {metadata.capped ? ' The response is capped; showing more expands this returned list only.' : ' The server reports no response cap.'}
      {metadata.predictionDates.length > 0 && ` Server prediction dates: ${metadata.predictionDates.join(', ')}.`}</p>
      : <p>Server eligibility counts, response cap and regional coverage are unavailable.</p>}
    {coverage && (coverage.rejectedCount > 0 || coverage.duplicateCount > 0) && <p>{coverage.receivedCount} records received; {coverage.rejectedCount} invalid targets omitted; {coverage.duplicateCount} older or duplicate locations omitted. Omitted records were not replaced.</p>}
    {species && <p>Requested fish: {species}. Catalog resolution: {coverage?.speciesStatus === 'resolved' ? 'resolved by server' : 'unavailable'}.
      {' '}Species adjustment: {coverage?.speciesAdjustment === 'applied' ? 'reported by server; not evidence of fish presence' : 'unavailable; returned values remain habitat model scores'}.</p>}
    <p>Ordered by distance from your home port. Highest-score ranking, combined ranking and next-best rotation are unavailable. These counts do not measure fishing pressure or vessel activity.</p>
    <p>Ocean-mask validation, geographic coverage, input quality, run health and publication status are unavailable. An empty list does not establish that no fish are present or that waters are safe or permitted.</p>
  </details>;
}
