import { describe, expect, it, vi } from 'vitest';
import { checkGeographicEligibility } from './geographic-eligibility';

const owner = '11111111-1111-4111-8111-111111111111';
describe('server geographic eligibility', () => {
  it.each([
    { status: 'allowed', reason: 'allowed' }, { status: 'denied', reason: 'restricted_area' },
    { status: 'denied', reason: 'outside_permitted_area' }, { status: 'unavailable', reason: 'boundary_policy_unresolved' },
    { status: 'unavailable', reason: 'access_unverified' }, { status: 'unavailable', reason: 'geographic_data_unavailable' },
  ])('preserves a database $status / $reason decision', async decision => {
    const query = vi.fn().mockResolvedValue({ rows: [decision] });
    expect(await checkGeographicEligibility({ query } as never, owner, 10.3, 123.9)).toEqual(decision);
    expect(query.mock.calls[0][1]).toEqual([owner, 10.3, 123.9]);
  });
  it.each([[Number.NaN, 123], [91, 123], [10, 181], [0, 0], [null, 123], ['10', 123]])('rejects invalid coordinates before storage: %j', async (lat, lon) => {
    const query = vi.fn();
    expect(await checkGeographicEligibility({ query } as never, owner, lat as number, lon as number))
      .toEqual({ status: 'unavailable', reason: 'invalid_coordinates' });
    expect(query).not.toHaveBeenCalled();
  });
  it('does not treat a client region or tier as a verified owner identity', async () => {
    const query = vi.fn();
    expect(await checkGeographicEligibility({ query } as never, 'reg-7', 10, 123))
      .toEqual({ status: 'unavailable', reason: 'access_unverified' });
    expect(query).not.toHaveBeenCalled();
  });
  it.each([[], [{ status: 'allowed', reason: 'restricted_area' }], [{ status: 'unknown', reason: 'allowed' }]].map(rows => ({ rows })))('fails unavailable for a missing or invalid decision: %j', async ({ rows }) => {
    const query = vi.fn().mockResolvedValue({ rows });
    expect(await checkGeographicEligibility({ query } as never, owner, 10, 123))
      .toEqual({ status: 'unavailable', reason: 'geographic_data_unavailable' });
    expect(query).toHaveBeenCalledTimes(1);
  });
  it('does not retry or allow after a missing migration or storage failure', async () => {
    const query = vi.fn().mockRejectedValue(new Error('private database detail'));
    expect(await checkGeographicEligibility({ query } as never, owner, 10, 123))
      .toEqual({ status: 'unavailable', reason: 'geographic_data_unavailable' });
    expect(query).toHaveBeenCalledTimes(1);
  });
});
