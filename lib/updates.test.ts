import { describe, expect, it } from 'vitest';
import type { AlertNotification } from '@/types';
import { isVerifiedUpdate, newestUpdates, readUpdates, updateProvenance, updateTime } from './updates';

const record = (id: string, patch: Partial<AlertNotification> = {}): AlertNotification => ({
  id, type: 'weather', title: { en: 'Wind update', tl: '', ceb: '', hil: '' },
  message: { en: 'Check local guidance.', tl: '', ceb: '', hil: '' }, timestamp: 'Today', read: false, priority: 'high', ...patch,
});

describe('saved update provenance and reading', () => {
  it('does not promote legacy messages or known sample IDs to verified updates', () => {
    expect(isVerifiedUpdate(record('legacy'))).toBe(false);
    expect(updateProvenance(record('n1', { provenance: 'verified' }))).toBe('sample');
    expect(isVerifiedUpdate(record('real', { provenance: 'verified' }))).toBe(true);
  });
  it('keeps relative or invalid timestamps unknown', () => {
    expect(updateTime(record('a'))).toBeNull();
    expect(updateTime(record('b', { occurredAt: '10 mins ago' }))).toBeNull();
    expect(updateTime(record('c', { occurredAt: '2026-99-42T00:00:00Z' }))).toBeNull();
  });
  it('orders genuine timestamps newest first and preserves unknown record order', () => {
    const items = [record('unknown-a'), record('older', { occurredAt: '2026-10-01T00:00:00Z' }), record('unknown-b'), record('newer', { occurredAt: '2026-10-14T00:00:00Z' })];
    expect(newestUpdates(items).map(item => item.id)).toEqual(['newer', 'older', 'unknown-a', 'unknown-b']);
    expect(items[0].id).toBe('unknown-a');
  });
  it('marks all verified updates in one operation while preserving legacy and sample state', () => {
    const items = [record('a', { provenance: 'verified' }), record('b', { provenance: 'verified' }), record('legacy'), record('sample', { provenance: 'sample' })];
    expect(readUpdates(items).map(item => item.read)).toEqual([true, true, false, false]);
    expect(items.every(item => !item.read)).toBe(true);
    expect(readUpdates(readUpdates(items, 'a'), 'b').filter(item => item.read)).toHaveLength(2);
  });
});
