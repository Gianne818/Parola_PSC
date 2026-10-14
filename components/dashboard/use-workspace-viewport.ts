'use client';

import { useSyncExternalStore } from 'react';

function subscribe(listener: () => void) {
  const queries = [window.matchMedia('(min-width: 768px)'), window.matchMedia('(min-width: 960px)')];
  queries.forEach(query => query.addEventListener('change', listener));
  return () => queries.forEach(query => query.removeEventListener('change', listener));
}

function snapshot(): 'mobile' | 'tablet' | 'desktop' {
  if (window.matchMedia('(min-width: 960px)').matches) return 'desktop';
  return window.matchMedia('(min-width: 768px)').matches ? 'tablet' : 'mobile';
}

export function useWorkspaceViewport() {
  return useSyncExternalStore(subscribe, snapshot, () => 'desktop' as const);
}
