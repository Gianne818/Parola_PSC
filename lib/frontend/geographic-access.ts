/** Display-only interpretation of selection.geography; never access authority. */
export interface GeographicCoverage {
  status: 'not_evaluated' | 'filtered' | 'partial' | 'unavailable';
  deniedCount: number;
  unavailableCount: number;
}

export function readGeographicCoverage(value: unknown): GeographicCoverage | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  const { status, denied_count: denied, unavailable_count: unavailable } = item;
  if (typeof status !== 'string' || !['not_evaluated', 'filtered', 'partial', 'unavailable'].includes(status)
    || !Number.isSafeInteger(denied) || (denied as number) < 0
    || !Number.isSafeInteger(unavailable) || (unavailable as number) < 0) return null;
  if ((status === 'not_evaluated' && (denied !== 0 || unavailable !== 0))
    || (status === 'filtered' && unavailable !== 0)
    || (status === 'partial' && unavailable === 0)) return null;
  return { status: status as GeographicCoverage['status'], deniedCount: denied as number, unavailableCount: unavailable as number };
}

export const GEOGRAPHIC_LABELS: Record<GeographicCoverage['status'], { title: string; description: string }> = {
  not_evaluated: { title: 'Geographic access not evaluated', description: 'This preview has not been checked against verified geographic access or restriction coverage.' },
  filtered: { title: 'Selection geographically filtered', description: 'The server filtered candidates using its geographic checks within the declared coverage. This does not establish unrestricted access.' },
  partial: { title: 'Partial geographic coverage', description: 'Some candidates could not be evaluated. Returned records are an incomplete selection; unknown coverage does not mean access is allowed.' },
  unavailable: { title: 'Geographic coverage unavailable', description: 'The response cannot establish complete geographic coverage. Access remains unconfirmed.' },
};
