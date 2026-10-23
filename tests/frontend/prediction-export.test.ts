import { afterEach, describe, expect, it, vi } from 'vitest';
import { predictionExportParams, readPredictionArtifact, requestPredictionExport, startPredictionDownload, type PredictionExportQuery } from '@/lib/frontend/prediction-export';

vi.mock('@/utils/auth-fetch', () => ({ authHeaders: async () => ({ Authorization: 'Bearer isolated-test-token' }) }));
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
const query: PredictionExportQuery = { lat: 14.0122, lng: 123.0114, regionId: 'reg-5', habitat: 'both', species: '' };
function payload(mode = 'geographically_filtered') {
  return { type: 'FeatureCollection', export_mode: mode, operational_eligible: false, provenance: 'legacy_unverified',
    selection: { requested_date: null, prediction_date: '2026-10-22', as_of_date: '2026-10-22', timezone: 'Asia/Manila', date_status: 'today',
      coherence: 'prediction_date_only', validity_status: 'unverified', operational_eligible: false,
      geography: { status: mode === 'demo_preview' ? 'not_evaluated' : 'filtered', denied_count: 0, unavailable_count: 0 },
      lineage_status: 'unavailable', ingestion_run_ids: [], ingestion_run_count: 0, ingestion_run_ids_capped: false,
      habitats: { pelagic: { status: 'available', eligible_count: 1 }, demersal: { status: 'available', eligible_count: 1 } } },
    features: ['pelagic', 'demersal'].map((model_type, index) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [123.084, 14.128] },
      properties: { grid_id: index + 1, model_type, prediction_date: '2026-10-22', model_score: .8, validity_status: 'unverified' } })) };
}
const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/geo+json; charset=utf-8' } });
const signal = () => new AbortController().signal;

describe('current prediction export consumer', () => {
  it('sends only supported parameters, preserving coordinates and the request habitat', () => {
    const params = predictionExportParams({ ...query, habitat: 'demersal', species: ' Tamban ' });
    expect(Object.fromEntries(params)).toEqual({ lat: '14.0122', lon: '123.0114', region: 'reg-5', habitat: 'demersal', species: 'Tamban', limit: '1000' });
    expect(params.has('prediction_date')).toBe(false); expect(params.has('user_id')).toBe(false); expect(params.has('min_threshold')).toBe(false);
  });
  it.each([{ lat: NaN }, { lng: 190 }, { regionId: 'unknown' }, { habitat: 'forecast' }, { species: 'x'.repeat(101) }])('rejects unsupported queries before transport: %j', async patch => {
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    await expect(requestPredictionExport({ ...query, ...patch } as PredictionExportQuery, signal())).rejects.toMatchObject({ kind: 'invalid_query' });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each(['geographically_filtered', 'demo_preview'])('preserves exact server text, metadata, both habitats and coordinate order: %s', mode => {
    const data = payload(mode); const text = JSON.stringify({ ...data, producer_extra: { untouched: true } }, null, 2);
    const artifact = readPredictionArtifact(text);
    expect(artifact).toMatchObject({ count: 2, text, mode, predictionDate: '2026-10-22', dateStatus: 'today', lineage: 'unavailable' });
    expect(JSON.parse(artifact.text).features[0].geometry.coordinates).toEqual([123.084, 14.128]);
    expect(JSON.parse(artifact.text).features.map((f: { properties: { model_type: string } }) => f.properties.model_type)).toEqual(['pelagic', 'demersal']);
    expect(JSON.parse(artifact.text).operational_eligible).toBe(false);
  });
  it('distinguishes a valid empty server response without creating targets', () => {
    const data = payload(); data.features = []; data.selection.prediction_date = null as unknown as string; data.selection.date_status = 'unavailable';
    const result = readPredictionArtifact(JSON.stringify(data));
    expect(result.count).toBe(0); expect(result.predictionDate).toBeNull();
  });
  it('keeps an older selected date historical instead of relabeling it current', () => {
    const data = payload(); data.selection.as_of_date = '2026-10-23'; data.selection.date_status = 'historical';
    expect(readPredictionArtifact(JSON.stringify(data)).dateStatus).toBe('historical');
  });
  it.each(['partial', 'unavailable', 'allowed', 'denied', 'unknown'])('never downloads %s as complete geographic coverage', status => {
    const data = payload(); data.selection.geography.status = status;
    expect(() => readPredictionArtifact(JSON.stringify(data))).toThrow('could not be verified');
  });
  it.each([
    (d: ReturnType<typeof payload>) => { d.operational_eligible = true; },
    (d: ReturnType<typeof payload>) => { d.selection.operational_eligible = true; },
    (d: ReturnType<typeof payload>) => { d.provenance = 'validated'; },
    (d: ReturnType<typeof payload>) => { d.selection.validity_status = 'validated'; },
    (d: ReturnType<typeof payload>) => { d.features[0].properties.validity_status = 'validated'; },
    (d: ReturnType<typeof payload>) => { d.features[0].geometry.coordinates = [14.128, 123.084]; },
    (d: ReturnType<typeof payload>) => { d.features[0].geometry.coordinates = [0, 0]; },
    (d: ReturnType<typeof payload>) => { d.features[0].geometry.coordinates = [123, 14, 1]; },
    (d: ReturnType<typeof payload>) => { d.features[0].properties.model_score = -1; },
    (d: ReturnType<typeof payload>) => { d.features[0].properties.model_score = 80; },
    (d: ReturnType<typeof payload>) => { d.features[0].properties.prediction_date = '2026-10-21'; },
    (d: ReturnType<typeof payload>) => { d.selection.date_status = 'future'; },
    (d: ReturnType<typeof payload>) => { d.selection.as_of_date = '2026-10-21'; },
    (d: ReturnType<typeof payload>) => { d.selection.requested_date = '2026-10-22' as unknown as null; },
    (d: ReturnType<typeof payload>) => { d.selection.timezone = 'UTC'; },
    (d: ReturnType<typeof payload>) => { d.selection.habitats.pelagic.eligible_count = -1; },
    (d: ReturnType<typeof payload>) => { d.selection.ingestion_run_count = 1; },
    (d: ReturnType<typeof payload>) => { d.export_mode = 'demo_preview'; },
  ])('rejects inconsistent labels, coordinates, scores, dates or metadata', mutate => {
    const data = payload(); mutate(data);
    expect(() => readPredictionArtifact(JSON.stringify(data))).toThrow('could not be verified');
  });
  it.each(['not JSON', '{}', '[]', '{"type":"FeatureCollection","features":[]}'])('does not manufacture missing metadata from %s', text => {
    expect(() => readPredictionArtifact(text)).toThrow('could not be verified');
  });
  it('preserves real individual zero coordinates and zero scores without coercion', () => {
    const data = payload(); data.features[0].geometry.coordinates = [123, 0]; data.features[0].properties.model_score = 0;
    expect(readPredictionArtifact(JSON.stringify(data)).count).toBe(2);
  });
  it('uses the existing bearer helper and same-origin cookies with no-store', async () => {
    const fetcher = vi.fn(async () => response(payload())); vi.stubGlobal('fetch', fetcher);
    expect((await requestPredictionExport(query, signal())).count).toBe(2);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fetch).mock.calls[0][0]).toMatch(/^\/api\/advisories\/export\?/);
    expect(vi.mocked(fetch).mock.calls[0][1]).toMatchObject({ headers: { Authorization: 'Bearer isolated-test-token' }, credentials: 'same-origin', cache: 'no-store' });
  });
  it.each([[401, 'authentication'], [403, 'denied'], [503, 'unavailable'], [400, 'invalid_query'], [422, 'invalid_query'], [429, 'failure'], [500, 'failure']])('does not turn HTTP %i into a download', async (status, kind) => {
    const fetcher = vi.fn(async () => response({ error: 'Private backend diagnostic' }, Number(status))); vi.stubGlobal('fetch', fetcher);
    await expect(requestPredictionExport(query, signal())).rejects.toMatchObject({ kind });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('allows an explicit retry after a network failure without a sample fallback', async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(response(payload())); vi.stubGlobal('fetch', fetcher);
    await expect(requestPredictionExport(query, signal())).rejects.toMatchObject({ kind: 'failure' });
    expect((await requestPredictionExport(query, signal())).count).toBe(2); expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('rejects a successful HTML/login response and never downloads it', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>Sign in</html>', { headers: { 'Content-Type': 'text/html' } })));
    await expect(requestPredictionExport(query, signal())).rejects.toMatchObject({ kind: 'malformed' });
  });
  it('does not request with an aborted signal', async () => {
    const controller = new AbortController(); controller.abort(); const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    await expect(requestPredictionExport(query, controller.signal)).rejects.toBeDefined(); expect(fetcher).not.toHaveBeenCalled();
  });
  it('hands off the original returned GeoJSON with a safe filename and releases the URL', async () => {
    vi.useFakeTimers();
    const artifact = readPredictionArtifact(JSON.stringify(payload('demo_preview')));
    const clicked = vi.fn(), removed = vi.fn(), appended = vi.fn();
    const anchor = { href: '', download: '', click: clicked, remove: removed };
    vi.stubGlobal('document', { body: { appendChild: appended }, createElement: () => anchor });
    const created = vi.fn(() => 'blob:isolated'), revoked = vi.fn();
    vi.stubGlobal('URL', { createObjectURL: created, revokeObjectURL: revoked });
    startPredictionDownload(artifact);
    expect(anchor.download).toBe('parola-demo-predictions-unverified.geojson'); expect(anchor.href).toBe('blob:isolated');
    expect(clicked).toHaveBeenCalledTimes(1); expect(removed).toHaveBeenCalledTimes(1);
    const blob = (created.mock.calls as unknown as [Blob][])[0][0];
    expect(await blob.text()).toBe(artifact.text); expect(blob.type).toBe('application/geo+json');
    vi.runAllTimers(); expect(revoked).toHaveBeenCalledWith('blob:isolated');
  });
});
