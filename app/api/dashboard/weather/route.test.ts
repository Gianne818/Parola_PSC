import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/db', () => ({ getDbPool: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: vi.fn(async () => ({ allowed: true })), RATE_LIMITS: { nearest: {} }, rateLimitExceededResponse: vi.fn() }));
import { getDbPool } from '@/lib/db';
import { GET } from './route';

beforeEach(() => { vi.resetAllMocks(); vi.mocked(getDbPool).mockReturnValue(null); });
const request = () => new Request('http://localhost/api/dashboard/weather?lat=10.3157&lng=123.8854&region=reg-7');

describe('dashboard weather provenance', () => {
  it('requests the selected coordinates and preserves distinct provider grid locations', async () => {
    const fetchMock = vi.fn(async (url: string) => Response.json(url.includes('marine-api')
      ? { latitude: 10.4, longitude: 124.05, current: { time: '2026-10-14T12:00', interval: 3600, wave_height: 1.1 } }
      : { latitude: 10.35, longitude: 124.01, current: { time: '2026-10-14T12:00', interval: 900, wind_speed_10m: 17 } }));
    vi.stubGlobal('fetch', fetchMock);
    const result = await (await GET(new Request('http://localhost/api/dashboard/weather?lat=10.37&lng=124.03&region=reg-7'))).json();
    expect(fetchMock.mock.calls.every(([url]) => url.includes('latitude=10.37&longitude=124.03'))).toBe(true);
    expect(result.location).toEqual({ requested: { lat: 10.37, lng: 124.03 }, weatherGrid: { lat: 10.35, lng: 124.01 }, marineGrid: { lat: 10.4, lng: 124.05 } });
    expect(result.wind.validUntil).toBe('2026-10-14T04:15:00.000Z');
  });
  it('preserves successful readings independently when marine data fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => url.includes('marine-api') ? new Response('unavailable', { status: 503 })
      : Response.json({ current: { time: '2026-10-14T12:00', wind_speed_10m: 0, temperature_2m: 29 } })));
    const result = await (await GET(request())).json();
    expect(result.wind).toMatchObject({ value: 0, source: 'Open-Meteo forecast', observedAt: '2026-10-14T12:00+08:00' });
    expect(result.waves.value).toBeNull(); expect(result.stormSignal.value).toBeNull(); expect(result.hold.available).toBe(false);
    expect(result.location.marineGrid).toBeNull();
  });
  it('never substitutes simulation when the weather provider fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    const result = await (await GET(request())).json();
    expect(result.wind.value).toBeNull(); expect(result.waves.value).toBeNull();
  });
  it('queries only matching regions and keeps database observation timestamps', async () => {
    const observed = new Date('2026-10-14T04:00:00Z');
    const query = vi.fn(async () => ({ rows: [{ check_timestamp: observed, is_hazardous: true, override_reason: 'Recorded hold', pagasa_signal_level: 1 }] }));
    vi.mocked(getDbPool).mockReturnValue({ query } as unknown as NonNullable<ReturnType<typeof getDbPool>>);
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ current: { time: '2026-10-14T12:00', wave_height: 0.8, wind_speed_10m: 12 } })));
    const result = await (await GET(request())).json();
    expect(query.mock.calls[0]).toEqual(expect.arrayContaining([expect.stringContaining('LOWER(region_name) = ANY')]));
    expect(result.hold).toMatchObject({ active: true, checkedAt: observed.toISOString() });
    expect(result.stormSignal.observedAt).toBe(observed.toISOString());
  });
  it('rejects missing and invalid coordinates before fetching', async () => {
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    expect((await GET(new Request('http://localhost/api/dashboard/weather?region=reg-7'))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
