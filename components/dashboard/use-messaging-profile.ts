'use client';

import { useEffect, useState } from 'react';
import { authHeaders } from '@/utils/auth-fetch';
import { readMessagingProfile, type MessagingProfile } from '@/lib/frontend/messaging-status';

type State = { key: string; status: 'loading' | 'ready' | 'denied' | 'unavailable'; data: MessagingProfile | null };

export function useMessagingProfile(accountId: string | undefined, phone: string) {
  const key = JSON.stringify([accountId, phone]);
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<State>({ key: '', status: 'loading', data: null });
  useEffect(() => {
    if (!accountId || !phone) return;
    const controller = new AbortController();
    let active = true;
    void (async () => {
      await Promise.resolve();
      if (!active) return;
      setState({ key, status: 'loading', data: null });
      try {
        const response = await fetch('/api/users/profile', { credentials: 'same-origin', cache: 'no-store',
          headers: await authHeaders(), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]) });
        if (response.status === 401 || response.status === 403) {
          if (active) setState({ key, status: 'denied', data: null });
          return;
        }
        if (!response.ok) throw new Error('Messaging status unavailable');
        const data = readMessagingProfile(await response.json(), accountId, phone);
        if (active) setState({ key, status: 'ready', data });
      } catch {
        if (active) setState({ key, status: 'unavailable', data: null });
      }
    })();
    return () => { active = false; controller.abort(); };
  }, [accountId, phone, key, revision]);
  const current: State = !accountId || !phone ? { key, status: 'unavailable', data: null }
    : state.key === key ? state : { key, status: 'loading', data: null };
  return { ...current, refresh: () => { setState({ key, status: 'loading', data: null }); setRevision(value => value + 1); } };
}
