import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/db', () => ({ getDbPool: vi.fn() }));
import { getDbPool } from '@/lib/db';
import { CAPABILITY_IDS, capabilityStatus } from '@/lib/capabilities';
import { GET } from './route';
const query = vi.fn();
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getDbPool).mockReturnValue({ query } as never);
  query.mockResolvedValue({ rows: CAPABILITY_IDS.map(capability_id => ({ capability_id, status: 'implemented', summary: 'Stored implementation fact', evidence_reference: null, verified_at: null, valid_until: null })) });
});
describe('persisted capability evidence', () => {
  it('does not equate implementation or configuration with operational readiness', async () => {
    const response = await GET();
    expect(response.headers.get('cache-control')).toBe('no-store');
    const body = await response.json();
    expect(body.source).toBe('database');
    expect(body.capabilities.every((item: { ready: boolean }) => !item.ready)).toBe(true);
    expect(body.language.reviewed_translations).toBe(false);
  });
  it('fails closed for unavailable or incomplete records', async () => {
    query.mockResolvedValue({ rows: [] });
    expect((await GET()).status).toBe(503);
    vi.mocked(getDbPool).mockReturnValue(null);
    expect((await GET()).status).toBe(503);
  });
  it('redacts storage errors without fabricated fallback readiness', async () => {
    query.mockRejectedValue(new Error('private database credentials'));
    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('private');
  });
  it('requires current, non-future persisted evidence and expiry', () => {
    const now = new Date('2026-10-15T12:00:00Z');
    const row = { capability_id: 'phone_registration', status: 'verified' as const, summary: 'Verified by operator', evidence_reference: 'acceptance-record', verified_at: '2026-10-15T11:00:00Z', valid_until: '2026-10-16T12:00:00Z' };
    expect(capabilityStatus(row, now).ready).toBe(true);
    expect(capabilityStatus({ ...row, evidence_reference: null }, now).ready).toBe(false);
    expect(capabilityStatus({ ...row, verified_at: '2026-10-15T13:00:00Z' }, now).ready).toBe(false);
    expect(capabilityStatus({ ...row, valid_until: '2026-10-15T11:30:00Z' }, now).status).toBe('unavailable');
  });
});
