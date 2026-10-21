import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/db', () => ({ getDbPool: vi.fn() }));
vi.mock('@/lib/geographic-access', async original => ({ ...await original<typeof import('@/lib/geographic-access')>(), geographicReadProfile: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: vi.fn(async () => ({ allowed: true })), RATE_LIMITS: { nearest: {} }, rateLimitExceededResponse: vi.fn() }));
import { getDbPool } from '@/lib/db';
import { GET } from './route';
import { geographicReadProfile, GeographicAccessError } from '@/lib/geographic-access';

const request = (params = '') => new Request(`http://localhost/api/advisories/nearest?lat=10.3&lon=123.9&${params}`);
beforeEach(() => { vi.clearAllMocks(); vi.mocked(getDbPool).mockReturnValue(null); vi.mocked(geographicReadProfile).mockResolvedValue(undefined); });
const row = { id: 5, prediction_date: '2026-09-25', model_type: 'pelagic', catch_probability: 0.8, target_lon: 123.95, target_lat: 10.35 };
const stored = (predictions: unknown[] = [], overrides = {}) => ({ rows: [{
  predictions, eligible_count: predictions.length, prediction_dates: predictions.length ? ['2026-09-25'] : [],
  selected_date: '2026-09-25', as_of_date: '2026-10-18', pelagic_count: predictions.length, demersal_count: 0,
  unlinked_count: predictions.length, ingestion_run_ids: [], ingestion_run_count: 0, ...overrides,
}] });

describe('regional area API', () => {
  it('rejects unsupported species before fetching any predictions', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ id: 1, category: 'pelagic', species_name: 'Tamban', family: 'Clupeidae', local_name: 'Sardines' }] });
    vi.mocked(getDbPool).mockReturnValue({ query } as never);
    const response = await GET(request('species=unknown'));
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ code: 'species_unsupported', hotspots: [] });
    expect(query).toHaveBeenCalledTimes(1);
  });
  it('preserves habitat scores and exposes missing depth/HSI without fabricated values', async () => {
    const query = vi.fn().mockResolvedValueOnce({ rows: [{ id: 1, category: 'pelagic', species_name: 'Tamban', family: 'Clupeidae', local_name: 'Sardines' }] })
      .mockResolvedValueOnce(stored([{ ...row, sst: 29, chl_a: 0 }]));
    vi.mocked(getDbPool).mockReturnValue({ query } as never);
    const body = await (await GET(request('species=Tamban'))).json();
    expect(body.species_hsi_applied).toBeUndefined();
    expect(body).toMatchObject({ species_status: 'resolved', prediction_scope: 'habitat_model', species_hsi_status: 'unavailable' });
    expect(body.hotspots[0]).toMatchObject({ catch_probability: 0.8, chl_a: 0, depth: null, depth_status: 'unavailable' });
    expect(query.mock.calls[1][1]).toEqual([null, 123.9, 10.3, 100, 'pelagic', null]);
  });
  it('rejects unknown regions without querying the database', async () => {
    expect((await GET(request('region=unknown'))).status).toBe(400);
  });
  it('preserves prediction dates and reports the full count when the response is capped', async () => {
    const query = vi.fn(async () => stored([row], { eligible_count: 28 }));
    vi.mocked(getDbPool).mockReturnValue({ query } as unknown as NonNullable<ReturnType<typeof getDbPool>>);
    const result = await (await GET(request('region=reg-7&limit=1'))).json();
    expect(result.hotspots[0]).toMatchObject({ grid_id: 5, prediction_date: '2026-09-25', target_lat: 10.35, target_lon: 123.95, catch_probability: 0.8 });
    expect(result.metadata).toEqual({ region: 'reg-7', eligibleCount: 28, returnedCount: 1, predictionDates: ['2026-09-25'], capped: true });
  });
  it('returns successful empty regional results separately from unavailable storage', async () => {
    const query = vi.fn(async () => stored());
    vi.mocked(getDbPool).mockReturnValue({ query } as unknown as NonNullable<ReturnType<typeof getDbPool>>);
    const response = await GET(request('region=reg-7'));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ hotspots: [], metadata: { eligibleCount: 0, returnedCount: 0, capped: false } });
    vi.mocked(getDbPool).mockReturnValue(null);
    expect((await GET(request('region=reg-7'))).status).toBe(503);
  });
  it('keeps the existing response for consumers without a region', async () => {
    const query = vi.fn(async () => stored([row]));
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

  it.each(['pelagic', 'demersal', 'both'])('passes the %s habitat selection to storage without substituting another model', async (habitat) => {
    const query = vi.fn().mockResolvedValue(stored());
    vi.mocked(getDbPool).mockReturnValue({ query } as never);
    const response = await GET(request(`habitat=${habitat}&limit=2`));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ hotspots: [], habitat_status: 'unavailable', requested_habitat: habitat });
    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0][1]).toEqual([null, 123.9, 10.3, 2, habitat === 'both' ? null : habitat, null]);
  });

  it('rejects a conflicting species and habitat instead of silently switching habitat', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ id: 1, category: 'pelagic', species_name: 'Tamban', family: 'Clupeidae' }] });
    vi.mocked(getDbPool).mockReturnValue({ query } as never);
    const response = await GET(request('species=Tamban&habitat=demersal'));
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ code: 'species_habitat_conflict', hotspots: [] });
    expect(query).toHaveBeenCalledTimes(1);
  });

  it.each(['habitat=reef', 'habitat=', 'lat=', 'lon=%20', 'limit=', 'prediction_date=',
    'prediction_date=2026-02-30', 'prediction_date=2026-2-03', 'prediction_date=0000-01-01'])('rejects invalid query input %s before storage', async (params) => {
    // set replaces the request helper's existing coordinate, rather than adding a duplicate.
    const url = new URL(request().url);
    for (const [key, value] of new URLSearchParams(params)) url.searchParams.set(key, value);
    expect((await GET(new Request(url))).status).toBe(400);
    expect(getDbPool).not.toHaveBeenCalled();
  });

  it.each([
    { target_lat: undefined }, { target_lon: null }, { target_lat: '' },
    { target_lon: 'not-a-number' }, { target_lat: 91 }, { target_lon: -181 },
    { target_lat: Number.NaN }, { catch_probability: 1.1 }, { catch_probability: null },
    { target_lat: 0, target_lon: 0 },
  ])('reports invalid stored data as unavailable rather than fabricating a target: %j', async (invalid) => {
    const query = vi.fn().mockResolvedValue(stored([{ ...row, ...invalid }]));
    vi.mocked(getDbPool).mockReturnValue({ query } as never);
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: 'prediction_data_unavailable', hotspots: [] });
  });

  it('keeps numeric coordinate strings and real zero readings in the existing consumer response', async () => {
    const query = vi.fn().mockResolvedValue(stored([{ ...row, target_lat: '1.035e1', target_lon: '123.95', sst: 0, chl_a: 0 }]));
    vi.mocked(getDbPool).mockReturnValue({ query } as never);
    const body = await (await GET(request('habitat=both'))).json();
    expect(body).toMatchObject({ habitat_status: 'available', requested_habitat: 'both' });
    expect(body.hotspots[0]).toMatchObject({ target_lat: 10.35, target_lon: 123.95, sst: 0, chl_a: 0 });
    expect(body.hotspots[0].distance_km).toBeGreaterThan(0);
  });

  it('preserves both model rows at one location and the storage nearest order', async () => {
    const query = vi.fn().mockResolvedValue(stored([
      { ...row, id: 8, model_type: 'demersal', catch_probability: 0.25 }, row,
    ], { pelagic_count: 1, demersal_count: 1 }));
    vi.mocked(getDbPool).mockReturnValue({ query } as never);
    const body = await (await GET(request('habitat=both'))).json();
    expect(body.hotspots.map((item: { grid_id: number; model_type: string }) => [item.grid_id, item.model_type])).toEqual([[8, 'demersal'], [5, 'pelagic']]);
    expect(body.hotspots[0].catch_probability).toBe(0.25);
  });

  it('keeps a valid coordinate on the equator and does not reject zero-valued request coordinates', async () => {
    const query = vi.fn().mockResolvedValue(stored([{ ...row, target_lat: 0 }]));
    vi.mocked(getDbPool).mockReturnValue({ query } as never);
    const response = await GET(new Request('http://localhost/api/advisories/nearest?lat=0&lon=0'));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.hotspots[0]).toMatchObject({ target_lat: 0, target_lon: 123.95 });
  });

  it('reports regional data errors without returning a partly fabricated selection', async () => {
    const query = vi.fn().mockResolvedValue(stored([row, { ...row, target_lat: null }]));
    vi.mocked(getDbPool).mockReturnValue({ query } as never);
    const response = await GET(request('region=reg-7'));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: 'prediction_data_unavailable', hotspots: [] });
  });

  it.each(['pelagic', 'demersal', 'both'])('preserves regional scope with the %s habitat', async (habitat) => {
    const query = vi.fn().mockResolvedValue(stored());
    vi.mocked(getDbPool).mockReturnValue({ query } as never);
    const response = await GET(request(`region=reg-7&habitat=${habitat}`));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ habitat_status: 'unavailable', metadata: { region: 'reg-7', eligibleCount: 0 } });
    const params = query.mock.calls[0][1];
    expect(params[0]).toMatch(/^POLYGON\(\(/);
    expect(params.slice(1)).toEqual([123.9, 10.3, 100, habitat === 'both' ? null : habitat, null]);
  });

  it('labels old stored predictions as historical with unavailable lineage, never operational readiness', async () => {
    const query = vi.fn().mockResolvedValue(stored([row]));
    vi.mocked(getDbPool).mockReturnValue({ query } as never);
    const response = await GET(request());
    const body = await response.json();
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(body.selection).toMatchObject({ prediction_date: '2026-09-25', as_of_date: '2026-10-18',
      timezone: 'Asia/Manila', date_status: 'historical', coherence: 'prediction_date_only',
      lineage_status: 'unavailable', validity_status: 'unverified', operational_eligible: false,
      habitats: { pelagic: { status: 'available' }, demersal: { status: 'unavailable' } } });
    expect(body.provenance).toBe('legacy_unverified');
  });

  it('reports both habitat counts before limiting, even when only one model is returned', async () => {
    const query = vi.fn().mockResolvedValue(stored([row], { eligible_count: 20, pelagic_count: 18, demersal_count: 2 }));
    vi.mocked(getDbPool).mockReturnValue({ query } as never);
    const body = await (await GET(request('habitat=both&limit=1'))).json();
    expect(body.selection.habitats).toEqual({ pelagic: { status: 'available', eligible_count: 18 }, demersal: { status: 'available', eligible_count: 2 } });
  });

  it('allows explicit historical dates without relabeling them as current or inventing verification', async () => {
    const query = vi.fn().mockResolvedValue(stored([row]));
    vi.mocked(getDbPool).mockReturnValue({ query } as never);
    const body = await (await GET(request('prediction_date=2026-09-25&habitat=pelagic'))).json();
    expect(query.mock.calls[0][1]).toEqual([null, 123.9, 10.3, 100, 'pelagic', '2026-09-25']);
    expect(body.selection).toMatchObject({ requested_date: '2026-09-25', date_status: 'historical',
      habitats: { demersal: { status: 'not_requested' } } });
  });

  it('reports a missing selected day explicitly rather than falling back to older rows', async () => {
    const query = vi.fn().mockResolvedValue(stored([], { selected_date: null }));
    vi.mocked(getDbPool).mockReturnValue({ query } as never);
    const response = await GET(request());
    const body = await response.json();
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(body).toMatchObject({ hotspots: [], habitat_status: 'unavailable',
      selection: { prediction_date: null, date_status: 'unavailable', operational_eligible: false } });
    expect(query).toHaveBeenCalledTimes(1);
  });

  it.each([
    { unlinked_count: 0, ingestion_run_ids: ['upload-a'], ingestion_run_count: 1, lineage_status: 'upload_identity_only' },
    { unlinked_count: 1, ingestion_run_ids: ['upload-a'], ingestion_run_count: 1, lineage_status: 'mixed' },
    { unlinked_count: 0, ingestion_run_ids: ['upload-a', 'upload-b'], ingestion_run_count: 2, lineage_status: 'mixed' },
  ])('does not equate stored upload identities with a validated run: $lineage_status', async (lineage) => {
    const query = vi.fn().mockResolvedValue(stored([row, { ...row, id: 6 }], { ...lineage, selected_date: '2026-10-18' }));
    vi.mocked(getDbPool).mockReturnValue({ query } as never);
    const body = await (await GET(request())).json();
    expect(body.selection).toMatchObject({ lineage_status: lineage.lineage_status,
      date_status: 'today', validity_status: 'unverified', operational_eligible: false });
  });

  it('distinguishes an explicitly requested future date from current data', async () => {
    const query = vi.fn().mockResolvedValue(stored([row], { selected_date: '2026-10-19' }));
    vi.mocked(getDbPool).mockReturnValue({ query } as never);
    const body = await (await GET(request('prediction_date=2026-10-19'))).json();
    expect(body.selection).toMatchObject({ date_status: 'future', operational_eligible: false });
  });

  it('reports a bounded sample when more upload identities exist than are returned', async () => {
    const ids = Array.from({ length: 10 }, (_, i) => `upload-${i}`);
    const query = vi.fn().mockResolvedValue(stored([row], { eligible_count: 11, unlinked_count: 0,
      ingestion_run_ids: ids, ingestion_run_count: 11 }));
    vi.mocked(getDbPool).mockReturnValue({ query } as never);
    const body = await (await GET(request())).json();
    expect(body.selection).toMatchObject({ ingestion_run_count: 11, ingestion_run_ids_capped: true, lineage_status: 'mixed' });
    expect(body.selection.ingestion_run_ids).toHaveLength(10);
  });
  it('passes only the server-resolved account to the geographic query', async () => {
    const owner = '11111111-1111-4111-8111-111111111111';
    vi.mocked(geographicReadProfile).mockResolvedValue(owner);
    const query = vi.fn().mockResolvedValue(stored([row], { geographic_denied_count: 2, geographic_unavailable_count: 0 }));
    vi.mocked(getDbPool).mockReturnValue({ query } as never);
    const body = await (await GET(request('user_id=forged&geographicProfileId=forged'))).json();
    expect(query.mock.calls[0][1][6]).toBe(owner);
    expect(body.selection.geography).toMatchObject({ status: 'filtered', denied_count: 2 });
  });
  it('returns unavailable rather than empty success for missing enforced coverage', async () => {
    vi.mocked(geographicReadProfile).mockResolvedValue('11111111-1111-4111-8111-111111111111');
    const query = vi.fn().mockResolvedValue(stored([], { geographic_denied_count: 0, geographic_unavailable_count: 2 }));
    vi.mocked(getDbPool).mockReturnValue({ query } as never);
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: 'geographic_data_unavailable', hotspots: [] });
  });
  it('rejects unsigned enforced reads before prediction storage is accessed', async () => {
    vi.mocked(geographicReadProfile).mockRejectedValue(new GeographicAccessError(401, 'geographic_auth_required', 'Sign in'));
    expect((await GET(request())).status).toBe(401);
    expect(getDbPool).not.toHaveBeenCalled();
  });
  it('serializes current vector attributes when present', async () => {
    const query = vi.fn().mockResolvedValue(stored([{
      ...row,
      current_u: 0.15,
      current_v: -0.22,
      current_speed: 0.27,
      current_heading: 145.7,
    }]));
    vi.mocked(getDbPool).mockReturnValue({ query } as never);
    const body = await (await GET(request())).json();
    expect(body.hotspots[0]).toMatchObject({
      current_u: 0.15,
      current_v: -0.22,
      current_speed: 0.27,
      current_heading: 145.7,
    });
  });
});
