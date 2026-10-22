export const PLAN_IDS = ['municipal', 'small', 'medium', 'large'] as const;
export type PlanId = typeof PLAN_IDS[number];
export const PLANS: Record<PlanId, { name: string; price: string; scope: string; description: string }> = {
  municipal: { name: 'Municipal', price: 'Free', scope: 'Your home port', description: 'Home-port guidance and access to available current data.' },
  small: { name: 'Small', price: '₱799', scope: 'Home-port radius proposal', description: 'A proposed local radius around your home port. Radius access is not activated.' },
  medium: { name: 'Medium', price: '₱2,499', scope: 'Selected FMA proposal', description: 'A proposed selected Fisheries Management Area. FMA selection and access are not available.' },
  large: { name: 'Large', price: '₱6,199', scope: 'EEZ proposal', description: 'A proposed Philippine Exclusive Economic Zone scope. EEZ access is not granted.' },
};

export interface WorkspacePreferences {
  version: 1;
  preferredPlan: PlanId;
  nickname: string;
  onboardingCompleted: boolean;
  browserNoticeSeen: boolean;
}
export interface PreferenceSnapshot { preferences: WorkspacePreferences; notice: string | null }
type PreferenceStorage = Pick<Storage, 'getItem' | 'setItem'>;
const MEMORY_NOTICE = 'Browser storage is unavailable. Preferences are kept in memory for this account during this visit and may be lost after reload. You can continue or retry browser storage.';
const RECOVERY_NOTICE = 'Saved browser preferences could not be read. Using Municipal defaults in memory. Choose your preferences again or retry browser storage.';

export function isPlanId(value: unknown): value is PlanId { return PLAN_IDS.some(plan => plan === value); }
export function workspacePath(plan: PlanId) { return `/workspace/${plan}`; }
export function preferenceKey(accountId: string) {
  if (!accountId.trim()) throw new Error('A persisted account ID is required.');
  return `parola:workspace:v1:${encodeURIComponent(accountId)}`;
}
export function normalizeNickname(value: string): string {
  if (/[\p{Cc}\p{Cf}]/u.test(value)) throw new Error('Use a nickname without control characters.');
  const nickname = value.trim();
  if (Array.from(nickname).length > 50) throw new Error('Use 50 characters or fewer.');
  return nickname;
}
export function defaultPreferences(): WorkspacePreferences {
  return { version: 1, preferredPlan: 'municipal', nickname: '', onboardingCompleted: false, browserNoticeSeen: false };
}
export function parsePreferences(raw: string): WorkspacePreferences | null {
  try {
    const value = JSON.parse(raw);
    if (!value || value.version !== 1 || !isPlanId(value.preferredPlan) || typeof value.nickname !== 'string'
      || normalizeNickname(value.nickname) !== value.nickname || typeof value.onboardingCompleted !== 'boolean'
      || typeof value.browserNoticeSeen !== 'boolean') return null;
    return { version: 1, preferredPlan: value.preferredPlan, nickname: value.nickname,
      onboardingCompleted: value.onboardingCompleted, browserNoticeSeen: value.browserNoticeSeen };
  } catch { return null; }
}

/** Account-scoped client preferences only. This store never changes a profile or entitlement. */
export function createPreferenceStore(storage: () => PreferenceStorage) {
  const snapshots = new Map<string, PreferenceSnapshot>();
  const accounts = new Map<string, string>();
  const pendingWrites = new Set<string>();
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach(listener => listener());
  const read = (accountId: string): PreferenceSnapshot => {
    const key = preferenceKey(accountId);
    accounts.set(key, accountId);
    const cached = snapshots.get(key);
    if (cached) return cached;
    let snapshot: PreferenceSnapshot = { preferences: defaultPreferences(), notice: null };
    try {
      const raw = storage().getItem(key);
      if (raw !== null) {
        const preferences = parsePreferences(raw);
        snapshot = preferences ? { preferences, notice: null } : { ...snapshot, notice: RECOVERY_NOTICE };
      }
    } catch { snapshot.notice = MEMORY_NOTICE; }
    snapshots.set(key, snapshot);
    return snapshot;
  };
  const save = (accountId: string, changes: Partial<Omit<WorkspacePreferences, 'version'>>) => {
    const preferences = { ...read(accountId).preferences, ...changes, version: 1 as const };
    preferences.nickname = normalizeNickname(preferences.nickname);
    if (!parsePreferences(JSON.stringify(preferences))) throw new Error('Choose a supported workspace preference.');
    let notice: string | null = null;
    const key = preferenceKey(accountId);
    try { storage().setItem(key, JSON.stringify(preferences)); pendingWrites.delete(key); }
    catch { notice = MEMORY_NOTICE; pendingWrites.add(key); }
    const snapshot = { preferences, notice };
    snapshots.set(preferenceKey(accountId), snapshot);
    emit();
    return snapshot;
  };
  const reconcile = (storageKey: string | null = null) => {
    let changed = false;
    for (const [key, accountId] of accounts) {
      // A failed write belongs to this visit; another tab must not discard it.
      if ((storageKey !== null && key !== storageKey) || pendingWrites.has(key)) continue;
      const previous = snapshots.get(key);
      snapshots.delete(key);
      const next = read(accountId);
      if (next.notice === MEMORY_NOTICE && previous) next.preferences = previous.preferences;
      if (previous && JSON.stringify(previous) === JSON.stringify(next)) snapshots.set(key, previous);
      else changed = true;
    }
    if (changed) emit();
  };
  return {
    read, save, reconcile,
    retry(accountId: string) {
      const key = preferenceKey(accountId);
      if (pendingWrites.has(key)) return save(accountId, {});
      // An untouched failed read is recovered by reading, never by saving defaults.
      reconcile(key);
      return read(accountId);
    },
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    invalidate: reconcile,
  };
}
