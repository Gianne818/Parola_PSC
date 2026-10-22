import { describe, expect, it } from 'vitest';
import { createPreferenceStore, defaultPreferences, normalizeNickname, parsePreferences, PLAN_IDS, PLANS, preferenceKey, workspacePath } from '@/lib/frontend/workspace-preferences';

function fixture() {
  const values = new Map<string, string>();
  let unavailable = false;
  const storage = () => {
    if (unavailable) throw new Error('Storage blocked');
    return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
  };
  return { values, storage, fail: () => { unavailable = true; }, recover: () => { unavailable = false; } };
}

describe('browser-only workspace preferences', () => {
  it('retries a failed initial read without overwriting existing saved preferences', () => {
    const f = fixture();
    const saved = { ...defaultPreferences(), preferredPlan: 'large' as const, nickname: 'Saved captain', onboardingCompleted: true };
    f.values.set(preferenceKey('a'), JSON.stringify(saved));
    f.fail();
    const store = createPreferenceStore(f.storage);
    expect(store.read('a').notice).toContain('memory');
    f.recover();
    expect(store.retry('a').preferences).toEqual(saved);
    expect(JSON.parse(f.values.get(preferenceKey('a'))!)).toEqual(saved);
  });
  it('reconciles changes missed while a tab had no mounted preference consumer', () => {
    const f = fixture(); const store = createPreferenceStore(f.storage);
    store.read('a');
    const updated = { ...defaultPreferences(), preferredPlan: 'medium' as const, nickname: 'Another tab' };
    f.values.set(preferenceKey('a'), JSON.stringify(updated));
    store.reconcile();
    expect(store.read('a').preferences).toEqual(updated);
    const snapshot = store.read('a');
    store.reconcile();
    expect(store.read('a')).toBe(snapshot);
  });
  it('keeps edited in-memory preferences during reconciliation and retries their save', () => {
    const f = fixture(); const store = createPreferenceStore(f.storage);
    store.read('a'); f.fail();
    const memory = store.save('a', { preferredPlan: 'small', nickname: 'Memory edit' }).preferences;
    f.recover();
    f.values.set(preferenceKey('a'), JSON.stringify({ ...defaultPreferences(), preferredPlan: 'large' }));
    store.reconcile();
    expect(store.read('a').preferences).toEqual(memory);
    expect(store.retry('a').notice).toBeNull();
    expect(JSON.parse(f.values.get(preferenceKey('a'))!)).toEqual(memory);
  });
  it('scopes reload and completion to the persisted account ID', () => {
    const f = fixture();
    const store = createPreferenceStore(f.storage);
    store.save('account-a', { preferredPlan: 'medium', nickname: '  Nene  ', onboardingCompleted: true, browserNoticeSeen: true });
    expect(createPreferenceStore(f.storage).read('account-a').preferences).toEqual({ ...defaultPreferences(), preferredPlan: 'medium', nickname: 'Nene', onboardingCompleted: true, browserNoticeSeen: true });
    expect(store.read('account-b').preferences).toEqual(defaultPreferences());
    expect(store.read('account-a').preferences.nickname).toBe('Nene');
    expect(preferenceKey('a/b')).not.toBe(preferenceKey('a%2Fb'));
    expect(() => store.save('', { nickname: 'x' })).toThrow('persisted account');
    expect([...f.values.keys()]).toEqual([preferenceKey('account-a')]);
  });
  it('continues in memory after read/write failures and can retry', () => {
    const f = fixture(); f.fail();
    const store = createPreferenceStore(f.storage);
    expect(store.read('a').notice).toContain('memory');
    const saved = store.save('a', { preferredPlan: 'large', nickname: 'Ana', onboardingCompleted: true });
    expect(saved.notice).toContain('may be lost after reload');
    expect(store.read('a').preferences.preferredPlan).toBe('large');
    expect(store.read('b').preferences.nickname).toBe('');
    f.recover();
    expect(store.save('a', {}).notice).toBeNull();
    expect(createPreferenceStore(f.storage).read('a').preferences).toEqual(saved.preferences);
  });
  it('handles quota failures on writes without losing in-memory work', () => {
    const store = createPreferenceStore(() => ({ getItem: () => null, setItem: () => { throw new Error('Quota exceeded'); } }));
    expect(store.read('a').notice).toBeNull();
    expect(store.save('a', { nickname: 'Mia' }).notice).toContain('memory');
    expect(store.read('a').preferences.nickname).toBe('Mia');
  });
  it.each(['null', '[]', '{', JSON.stringify({ ...defaultPreferences(), version: 2 }), JSON.stringify({ ...defaultPreferences(), preferredPlan: 'enterprise' }), JSON.stringify({ ...defaultPreferences(), nickname: 'x\n' }), JSON.stringify({ ...defaultPreferences(), nickname: 'x'.repeat(51) }), JSON.stringify({ ...defaultPreferences(), onboardingCompleted: 'true' })])('recovers malformed data: %s', raw => {
    expect(parsePreferences(raw)).toBeNull();
    const f = fixture(); f.values.set(preferenceKey('a'), raw);
    expect(createPreferenceStore(f.storage).read('a')).toMatchObject({ preferences: defaultPreferences(), notice: expect.stringContaining('could not be read') });
  });
  it('accepts trimmed Unicode and rejects controls before trimming', () => {
    expect(normalizeNickname('  María 🚢  ')).toBe('María 🚢');
    expect(normalizeNickname('🚢'.repeat(50))).toHaveLength(100);
    expect(normalizeNickname('   ')).toBe('');
    for (const value of ['\nAna', 'A\tB', 'A\u0000B', 'A\u007f', '\u202eAna', 'x'.repeat(51)]) expect(() => normalizeNickname(value)).toThrow();
  });
  it('treats all direct workspace routes as read-only presentation', () => {
    const store = createPreferenceStore(fixture().storage);
    store.save('a', { preferredPlan: 'small' });
    for (const plan of PLAN_IDS) expect(workspacePath(plan)).toBe(`/workspace/${plan}`);
    expect(store.read('a').preferences.preferredPlan).toBe('small');
    expect(PLANS.small.price).toBe('₱799'); expect(PLANS.medium.price).toBe('₱2,499'); expect(PLANS.large.price).toBe('₱6,199');
  });
  it('updates listeners and invalidates external account storage changes', () => {
    const f = fixture(); const store = createPreferenceStore(f.storage);
    let events = 0; const unsubscribe = store.subscribe(() => events++);
    store.read('a');
    f.values.set(preferenceKey('a'), JSON.stringify({ ...defaultPreferences(), nickname: 'New' }));
    store.invalidate(preferenceKey('a'));
    expect(store.read('a').preferences.nickname).toBe('New');
    store.save('b', { preferredPlan: 'small' });
    expect(events).toBe(2); unsubscribe(); store.invalidate(null); expect(events).toBe(2);
  });
});
