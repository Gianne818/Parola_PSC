import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/services/smsServiceInstance', () => ({ smsService: { getConfig: vi.fn(), sendSms: vi.fn() } }));
vi.mock('@/lib/route-auth', () => ({ requireUser: vi.fn(), getSupabaseUser: vi.fn() }));
vi.mock('@/lib/db', () => ({ getDbPool: vi.fn() }));
vi.mock('@/lib/rate-limit', async importOriginal => ({ ...await importOriginal<typeof import('@/lib/rate-limit')>(), checkRateLimit: vi.fn() }));
import { smsService } from '@/services/smsServiceInstance';
import { requireUser } from '@/lib/route-auth';
import { getDbPool } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';
import { POST } from './route';
const query = vi.fn();
const owner = { id: 'owner-id', phone: '+639171234567' };
function request() { return new Request('http://localhost/api/sms/send', { method: 'POST', body: JSON.stringify({ recipient: '09171234567', message: 'Advisory', category: 'weather' }) }); }
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true } as never);
  vi.mocked(smsService.getConfig).mockReturnValue({ mockMode: false } as never);
  vi.mocked(smsService.sendSms).mockResolvedValue({ success: true } as never);
  vi.mocked(requireUser).mockResolvedValue({ user: owner, error: null });
  vi.mocked(getDbPool).mockReturnValue({ query } as never);
  query.mockResolvedValue({ rows: [{ eligible: true }] });
});
describe('live SMS registration eligibility', () => {
  it('sends only when the persisted recipient and actor are eligible', async () => {
    expect((await POST(request())).status).toBe(200);
    expect(query.mock.calls[0][1]).toEqual(['+639171234567', 'messaging-v1', owner.id]);
    expect(smsService.sendSms).toHaveBeenCalledOnce();
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
});
