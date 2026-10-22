'use client';

import { useSyncExternalStore } from 'react';
import { useApp } from '@/context/AppContext';
import { createPreferenceStore, type WorkspacePreferences } from '@/lib/frontend/workspace-preferences';

const store = createPreferenceStore(() => window.localStorage);
function subscribe(listener: () => void) {
  const unsubscribe = store.subscribe(listener);
  store.reconcile();
  const changed = (event: StorageEvent) => {
    if (event.key === null || event.key.startsWith('parola:workspace:v1:')) store.invalidate(event.key);
  };
  window.addEventListener('storage', changed);
  return () => { unsubscribe(); window.removeEventListener('storage', changed); };
}
const serverSnapshot = () => null;

export function useWorkspacePreferences() {
  const { isInitialized, isAuthenticated, userProfile } = useApp();
  const accountId = isInitialized && isAuthenticated ? userProfile.id : undefined;
  const snapshot = useSyncExternalStore(subscribe, () => accountId ? store.read(accountId) : null, serverSnapshot);
  return {
    snapshot,
    save(changes: Partial<Omit<WorkspacePreferences, 'version'>>) {
      if (!accountId) throw new Error('Sign in with your registered account to save preferences.');
      return store.save(accountId, changes);
    },
    retry() { if (accountId) store.retry(accountId); },
  };
}
