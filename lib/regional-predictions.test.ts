import { describe, expect, it, vi } from 'vitest';
import { isPredictionDate, loadPredictions, PREDICTION_QUERY_SQL } from './regional-predictions';

describe('prediction date input', () => {
  it.each(['2024-02-29', '2026-10-18', '0001-01-01', '9999-12-31'])('accepts real ISO dates: %s', value => {
    expect(isPredictionDate(value)).toBe(true);
  });
  it.each(['2026-02-29', '2026-04-31', '2026-13-01', '0000-01-01', '2026-10-18T00:00:00Z', '2026-1-01', ' 2026-10-18', ''])('rejects invalid/non-date input: %s', value => {
    expect(isPredictionDate(value)).toBe(false);
  });
});

describe('prediction selection availability', () => {
  it('treats a missing summary as storage failure, not an empty successful snapshot', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    await expect(loadPredictions({ query } as never, { lat: 10, lon: 123, limit: 1 })).rejects.toThrow('unavailable');
  });
  it('never retries a geographic query as an unrestricted preview after failure', async () => {
    const query = vi.fn().mockRejectedValue(new Error('function unavailable'));
    await expect(loadPredictions({ query } as never, { lat: 10, lon: 123, limit: 1,
      geographicProfileId: '11111111-1111-4111-8111-111111111111' })).rejects.toThrow('unavailable');
    expect(query).toHaveBeenCalledTimes(1);
  });
  it.each(['', 'reg-7', 'premium', null])('rejects unverified geographic identity %s instead of falling back', async profileId => {
    const query = vi.fn();
    await expect(loadPredictions({ query } as never, { lat: 10, lon: 123, limit: 1,
      geographicProfileId: profileId as string })).rejects.toThrow('identity unavailable');
    expect(query).not.toHaveBeenCalled();
  });
  it('does not present missing prediction inputs as a completed geographic evaluation', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ predictions: [], eligible_count: 0, prediction_dates: [],
      selected_date: null, as_of_date: '2026-10-18', pelagic_count: 0, demersal_count: 0,
      unlinked_count: 0, ingestion_run_ids: [], ingestion_run_count: 0,
      geographic_denied_count: 0, geographic_unavailable_count: 0 }] });
    const result = await loadPredictions({ query } as never, { lat: 10, lon: 123, limit: 1,
      geographicProfileId: '11111111-1111-4111-8111-111111111111' });
    expect(result.selection.geography.status).toBe('unavailable');
    expect(result.selection.operational_eligible).toBe(false);
  });

  it('selects current drift vector columns in prediction queries', () => {
    expect(PREDICTION_QUERY_SQL).toContain('current_u, current_v, current_speed, current_heading');
  });
});
