import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/db', () => ({ getDbPool: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: vi.fn(async () => ({ allowed: true })), RATE_LIMITS: { nearest: {} }, rateLimitExceededResponse: vi.fn() }));
import { getDbPool } from '@/lib/db';
import { GET } from './route';

const request = (params = '') => new Request(`http://localhost/api/advisories/nearest?lat=10.3&lon=123.9&${params}`);
beforeEach(() => vi.mocked(getDbPool).mockReturnValue(null));
const row = { id: 5, prediction_date: '2026-09-25', model_type: 'pelagic', catch_probability: 0.8, centroid_wkt: 'POINT(123.95 10.35)' };

describe('regional area API', () => {
  it('rejects unknown regions without querying the database', async () => {
    expect((await GET(request('region=unknown'))).status).toBe(400);
  });
  it('preserves prediction dates and reports the full count when the response is capped', async () => {
    const query = vi.fn(async () => ({ rows: [{ predictions: [row], eligible_count: 28, prediction_dates: ['2026-09-25'] }] }));
    vi.mocked(getDbPool).mockReturnValue({ query } as unknown as NonNullable<ReturnType<typeof getDbPool>>);
    const result = await (await GET(request('region=reg-7&limit=1'))).json();
    expect(result.hotspots[0]).toMatchObject({ grid_id: 5, prediction_date: '2026-09-25', target_lat: 10.35, target_lon: 123.95, catch_probability: 0.8 });
    expect(result.metadata).toEqual({ region: 'reg-7', eligibleCount: 28, returnedCount: 1, predictionDates: ['2026-09-25'], capped: true });
  });
  it('returns successful empty regional results separately from unavailable storage', async () => {
    const query = vi.fn(async () => ({ rows: [{ predictions: [], eligible_count: 0, prediction_dates: [] }] }));
    vi.mocked(getDbPool).mockReturnValue({ query } as unknown as NonNullable<ReturnType<typeof getDbPool>>);
    const response = await GET(request('region=reg-7'));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ hotspots: [], metadata: { eligibleCount: 0, returnedCount: 0, capped: false } });
    vi.mocked(getDbPool).mockReturnValue(null);
    expect((await GET(request('region=reg-7'))).status).toBe(503);
  });
  it('keeps the existing response for consumers without a region', async () => {
    const query = vi.fn(async () => ({ rows: [row] }));
    vi.mocked(getDbPool).mockReturnValue({ query } as unknown as NonNullable<ReturnType<typeof getDbPool>>);
    const result = await (await GET(request('limit=1'))).json();
    expect(result.hotspots).toHaveLength(1);
    expect(result.metadata).toBeUndefined();
  });
  it('does not present a failed regional query as an empty success', async () => {
    const query = vi.fn(async () => { throw new Error('offline'); });
    vi.mocked(getDbPool).mockReturnValue({ query } as unknown as NonNullable<ReturnType<typeof getDbPool>>);
    const response = await GET(request('region=reg-7'));
    expect(response.status).toBe(500);
    expect((await response.json()).error).toBeTruthy();
  });
});
