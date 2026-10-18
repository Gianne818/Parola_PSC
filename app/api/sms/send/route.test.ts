import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/services/smsServiceInstance', () => ({ smsService: { getConfig: vi.fn(), sendSms: vi.fn() } }));
vi.mock('@/lib/route-auth', () => ({ requireUser: vi.fn(), getSupabaseUser: vi.fn() }));
vi.mock('@/lib/db', () => ({ getDbPool: vi.fn() }));
vi.mock('@/lib/geographic-sms', () => ({ prepareGeographicAdvisory: vi.fn() }));
vi.mock('@/lib/routine-delivery', () => ({ claimRoutineAttempt: vi.fn(), recordRoutineOutcome: vi.fn() }));
vi.mock('@/lib/geographic-eligibility', async original => ({ ...await original<typeof import('@/lib/geographic-eligibility')>(), checkGeographicEligibility: vi.fn() }));
vi.mock('@/lib/rate-limit', async importOriginal => ({ ...await importOriginal<typeof import('@/lib/rate-limit')>(), checkRateLimit: vi.fn() }));
import { smsService } from '@/services/smsServiceInstance';
import { requireUser } from '@/lib/route-auth';
import { getDbPool } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';
import { POST } from './route';
import { prepareGeographicAdvisory } from '@/lib/geographic-sms';
import { claimRoutineAttempt, recordRoutineOutcome } from '@/lib/routine-delivery';
import { checkGeographicEligibility } from '@/lib/geographic-eligibility';
import { GeographicAccessError } from '@/lib/geographic-access';
const query = vi.fn();
const owner = { id: 'owner-id', phone: '+639171234567' };
function request() { return new Request('http://localhost/api/sms/send', { method: 'POST', body: JSON.stringify({ recipient: '09171234567', message: 'Advisory', category: 'weather' }) }); }
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true } as never);
  vi.mocked(smsService.getConfig).mockReturnValue({ mockMode: false } as never);
  vi.mocked(smsService.sendSms).mockResolvedValue({ success: true, mode: 'LIVE_DISPATCH', messageId: 'provider-id' } as never);
  vi.mocked(claimRoutineAttempt).mockResolvedValue({ id: 'attempt-id' } as never);
  vi.mocked(recordRoutineOutcome).mockResolvedValue(true);
  vi.mocked(checkGeographicEligibility).mockResolvedValue({ status: 'allowed', reason: 'allowed' });
  vi.mocked(prepareGeographicAdvisory).mockResolvedValue({ profileId: '11111111-1111-4111-8111-111111111111',
    date: '2026-10-18', lat: 10.5, lon: 123.8, message: 'Server-generated checked target' });
  vi.mocked(requireUser).mockResolvedValue({ user: owner, error: null });
  vi.mocked(getDbPool).mockReturnValue({ query } as never);
  query.mockResolvedValue({ rows: [{ eligible: true }] });
});
describe('live SMS registration eligibility', () => {
  it('requires a stored advisory rather than user-authored live fishing guidance', async () => {
    expect((await POST(request())).status).toBe(403);
    expect(query.mock.calls[0][1]).toEqual(['+639171234567', 'messaging-v1', owner.id]);
    expect(smsService.sendSms).not.toHaveBeenCalled();
  });
  it('blocks unverified, non-consenting, inactive or unrelated contacts', async () => {
    query.mockResolvedValue({ rows: [{ eligible: false }] });
    expect((await POST(request())).status).toBe(403);
    expect(smsService.sendSms).not.toHaveBeenCalled();
  });
  it('does not let system/admin dispatch bypass recipient consent', async () => {
    vi.mocked(requireUser).mockResolvedValue({ user: null, error: null });
    query.mockResolvedValue({ rows: [{ eligible: false }] });
    expect((await POST(request())).status).toBe(403);
    expect(query.mock.calls[0][1][2]).toBeNull();
    expect(smsService.sendSms).not.toHaveBeenCalled();
  });
  it('fails closed on database/migration failure', async () => {
    query.mockRejectedValue(new Error('missing migration'));
    expect((await POST(request())).status).toBe(503);
    expect(smsService.sendSms).not.toHaveBeenCalled();
  });
  it('requires authentication for live dispatch', async () => {
    vi.mocked(requireUser).mockResolvedValue({ user: null, error: Response.json({ error: 'Unauthorized' }, { status: 401 }) });
    expect((await POST(request())).status).toBe(401);
    expect(query).not.toHaveBeenCalled();
    expect(smsService.sendSms).not.toHaveBeenCalled();
  });
  it('keeps mock messages separate from live eligibility', async () => {
    vi.mocked(smsService.getConfig).mockReturnValue({ mockMode: true } as never);
    expect((await POST(request())).status).toBe(200);
    expect(query).not.toHaveBeenCalled();
    expect(requireUser).not.toHaveBeenCalled();
  });
  it('keeps trusted operator warnings independent of geographic availability', async () => {
    vi.mocked(requireUser).mockResolvedValue({ user: null, error: null });
    expect((await POST(request())).status).toBe(200);
    expect(prepareGeographicAdvisory).not.toHaveBeenCalled();
    expect(smsService.sendSms).toHaveBeenCalledOnce();
  });
  const storedRequest = (extra = {}) => new Request('http://localhost/api/sms/send', { method: 'POST',
    body: JSON.stringify({ recipient: '09171234567', advisory_id: '11111111-1111-4111-8111-111111111111', ...extra }) });
  it('uses the checked persisted target message for live advisories', async () => {
    expect((await POST(storedRequest())).status).toBe(200);
    expect(prepareGeographicAdvisory).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111', '09171234567', owner.id);
    expect(smsService.sendSms).toHaveBeenCalledWith(expect.objectContaining({ message: 'Server-generated checked target' }));
    expect(recordRoutineOutcome).toHaveBeenCalledWith(expect.anything(), 'attempt-id', { state: 'submitted', provider_message_id: 'provider-id' });
  });
  it.each([403, 503])('never reaches the sender after a geographic %s failure', async status => {
    vi.mocked(prepareGeographicAdvisory).mockRejectedValue(new GeographicAccessError(status, 'restricted', 'Target unavailable'));
    expect((await POST(storedRequest())).status).toBe(status);
    expect(smsService.sendSms).not.toHaveBeenCalled();
  });
  it.each([{ message: 'Use a different target' }, { category: 'emergency' }, { advisory_id: 'bad-id' }])('rejects advisory overrides %j', async override => {
    expect((await POST(storedRequest(override))).status).toBe(400);
    expect(smsService.sendSms).not.toHaveBeenCalled();
  });
  it('does not send a second time when a repeated advisory no longer has a pending routine job', async () => {
    vi.mocked(claimRoutineAttempt).mockResolvedValueOnce({ id: 'attempt-id' } as never).mockResolvedValueOnce(null);
    expect((await POST(storedRequest())).status).toBe(200);
    expect((await POST(storedRequest())).status).toBe(409);
    expect(smsService.sendSms).toHaveBeenCalledTimes(1);
  });
  it('requires durable tracking activation before reaching the provider', async () => {
    vi.mocked(claimRoutineAttempt).mockRejectedValue(new Error('Tracking disabled'));
    expect((await POST(storedRequest())).status).toBe(503);
    expect(smsService.sendSms).not.toHaveBeenCalled();
  });
  it('rechecks geography after claiming and never sends a newly restricted target', async () => {
    vi.mocked(checkGeographicEligibility).mockResolvedValue({ status: 'denied', reason: 'restricted_area' });
    expect((await POST(storedRequest())).status).toBe(403);
    expect(smsService.sendSms).not.toHaveBeenCalled();
    expect(recordRoutineOutcome).toHaveBeenCalledWith(expect.anything(), 'attempt-id', { state: 'rejected' });
  });
  it('holds an ambiguous submission without an automatic resend', async () => {
    vi.mocked(smsService.sendSms).mockResolvedValue({ success: false, mode: 'LIVE_DISPATCH' } as never);
    expect((await POST(storedRequest())).status).toBe(503);
    expect(recordRoutineOutcome).toHaveBeenCalledWith(expect.anything(), 'attempt-id', { state: 'unknown' });
    expect(smsService.sendSms).toHaveBeenCalledTimes(1);
  });
});
