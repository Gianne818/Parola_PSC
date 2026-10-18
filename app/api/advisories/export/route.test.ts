import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../nearest/route', () => ({ GET: vi.fn() }));
vi.mock('@/lib/geographic-access', async original => ({ ...await original<typeof import('@/lib/geographic-access')>(), geographicOwner: vi.fn() }));
import { GET as nearest } from '../nearest/route';
import { geographicOwner, GeographicAccessError } from '@/lib/geographic-access';
import { GET } from './route';
const request = () => new Request('http://localhost/api/advisories/export?habitat=demersal&limit=2', { headers: { cookie: 'fixture-session' } });
beforeEach(() => {
  vi.clearAllMocks(); vi.stubEnv('PAROLA_AUTH_MODE', 'demo'); vi.mocked(geographicOwner).mockResolvedValue('owner');
  vi.mocked(nearest).mockResolvedValue(Response.json({ hotspots: [{ grid_id: 1, target_lat: 10.5, target_lon: 123.8,
    model_type: 'demersal', prediction_date: '2026-10-18', catch_probability: 0.8 }],
    selection: { geography: { status: 'filtered' } } }));
});
afterEach(() => vi.unstubAllEnvs());
describe('geographically filtered current-data export', () => {
  it('uses the guarded API and exports longitude/latitude without scientific/device claims', async () => {
    const response = await GET(request()); const body = await response.json();
    expect(response.headers.get('content-type')).toBe('application/geo+json');
    expect(body.features[0].geometry.coordinates).toEqual([123.8, 10.5]);
    expect(body.features[0].properties.model_type).toBe('demersal');
    expect(body.operational_eligible).toBe(false);
    const forwarded = vi.mocked(nearest).mock.calls[0][0];
    expect(forwarded.url).toContain('habitat=demersal&limit=2');
    expect(forwarded.headers.get('cookie')).toBe('fixture-session');
  });
  it.each(['partial', 'unavailable'])('does not download a file when coverage is %s', async status => {
    vi.mocked(nearest).mockResolvedValue(Response.json({ hotspots: [], selection: { geography: { status } } }));
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(response.headers.get('content-disposition')).toBeNull();
  });
  it('requires an authenticated persisted account before reading predictions', async () => {
    vi.mocked(geographicOwner).mockRejectedValue(new GeographicAccessError(401, 'auth_required', 'Sign in'));
    expect((await GET(request())).status).toBe(401);
    expect(nearest).not.toHaveBeenCalled();
  });
  it('labels an explicitly unevaluated demo download as a preview', async () => {
    vi.mocked(nearest).mockResolvedValue(Response.json({ hotspots: [], selection: { geography: { status: 'not_evaluated' } } }));
    const body = await (await GET(request())).json();
    expect(body.export_mode).toBe('demo_preview');
    expect(body.operational_eligible).toBe(false);
  });
  it.each(['not_evaluated', undefined])('does not export unevaluated or missing geography in live mode: %s', async status => {
    vi.stubEnv('PAROLA_AUTH_MODE', 'live');
    vi.mocked(nearest).mockResolvedValue(Response.json({ hotspots: [], selection: { geography: { status } } }));
    expect((await GET(request())).status).toBe(503);
  });
});
