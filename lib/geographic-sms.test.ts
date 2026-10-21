import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('./db', () => ({ getDbPool: vi.fn() }));
vi.mock('./registration', () => ({ phoneE164: (phone: string) => phone }));
vi.mock('./geographic-access', async original => ({ ...await original<typeof import('./geographic-access')>(), geographicEnforcementEnabled: vi.fn(() => true) }));
vi.mock('./geographic-eligibility', async original => ({ ...await original<typeof import('./geographic-eligibility')>(), checkGeographicEligibility: vi.fn() }));
import { getDbPool } from './db';
import { checkGeographicEligibility } from './geographic-eligibility';
import { prepareGeographicAdvisory } from './geographic-sms';
import { IProgSmsService } from '@/services/iprogSmsService';
const id = '11111111-1111-4111-8111-111111111111';
const query = vi.fn();
beforeEach(() => {
  vi.clearAllMocks(); vi.mocked(getDbPool).mockReturnValue({ query } as never);
  query.mockResolvedValue({ rows: [{ id, lat: 10.5, lon: 123.8, advisory_date: '2026-10-18' }] });
  vi.mocked(checkGeographicEligibility).mockResolvedValue({ status: 'allowed', reason: 'allowed' });
});
afterEach(() => vi.unstubAllEnvs());
describe('SMS target geography', () => {
  it('checks the recipient profile and renders canonical coordinates from storage', async () => {
    const prepared = await prepareGeographicAdvisory(id, '+639171234567', id);
    expect(checkGeographicEligibility).toHaveBeenCalledWith(expect.anything(), id, 10.5, 123.8);
    expect(query.mock.calls[0][1]).toEqual([id, '+639171234567', id]);
    expect(prepared.message).toContain('10.50000, 123.80000');
    expect(prepared).toMatchObject({ profileId: id, date: '2026-10-18' });
  });
  it.each([{ status: 'denied', reason: 'restricted_area' }, { status: 'unavailable', reason: 'geographic_data_unavailable' }] as const)('rejects $status targets', async decision => {
    vi.mocked(checkGeographicEligibility).mockResolvedValue(decision);
    await expect(prepareGeographicAdvisory(id, '+639171234567')).rejects.toMatchObject({ status: decision.status === 'denied' ? 403 : 503 });
  });
  it('does not reuse missing, stale, suppressed or unrelated advisory records', async () => {
    query.mockResolvedValue({ rows: [] });
    await expect(prepareGeographicAdvisory(id, '+639171234567')).rejects.toMatchObject({ status: 403 });
    expect(checkGeographicEligibility).not.toHaveBeenCalled();
  });
  it.each(['PAROLA_AUTH_MODE', 'PAROLA_SMS_MODE'])('makes %s=demo prevent provider calls even if mock mode was toggled off', async key => {
    vi.stubEnv(key, 'demo');
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    const service = new IProgSmsService({ mockMode: false, apiKey: 'fixture-only-provider-key' });
    expect((await service.sendSms({ recipient: '09171234567', message: 'Demo' })).mode).toBe('MOCK_DRY_RUN');
    expect(service.getConfig().mockMode).toBe(true);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
