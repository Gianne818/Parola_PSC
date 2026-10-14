import type { AlertNotification } from '@/types';

const sampleIds = new Set(['n1', 'n2', 'n-eval-today']);

export function updateProvenance(item: AlertNotification): 'verified' | 'sample' | 'legacy' {
  if (sampleIds.has(item.id) || item.provenance === 'sample') return 'sample';
  return item.provenance === 'verified' ? 'verified' : 'legacy';
}

export function isVerifiedUpdate(item: AlertNotification): boolean {
  return updateProvenance(item) === 'verified';
}

export function updateTime(item: AlertNotification): string | null {
  // Legacy relative labels are never converted into fabricated event dates.
  const value = item.occurredAt;
  return value && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value)) ? value : null;
}

export function newestUpdates(items: AlertNotification[]): AlertNotification[] {
  return items.map((item, index) => ({ item, index })).sort((a, b) => {
    const aTime = updateTime(a.item);
    const bTime = updateTime(b.item);
    if (!aTime || !bTime) return aTime ? -1 : bTime ? 1 : a.index - b.index;
    return Date.parse(bTime) - Date.parse(aTime) || a.index - b.index;
  }).map(entry => entry.item);
}

export function readUpdates(items: AlertNotification[], id?: string): AlertNotification[] {
  return items.map(item => (id ? item.id === id : isVerifiedUpdate(item)) && !item.read ? { ...item, read: true } : item);
}
