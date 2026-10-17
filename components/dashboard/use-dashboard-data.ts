'use client';

import { useCallback, useEffect, useState } from 'react';
import type { DashboardWeather, FishingAreaResult } from '@/lib/dashboard';
import { retainWeather, reusableAreaWeather } from '@/lib/dashboard';
import { loadDashboardWeather, loadFishingAreaResult } from '@/services/dashboardService';

export function useDashboardClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(interval);
  }, []);
  return now;
}

interface LoadState<T> { key: string; data: T | null; loading: boolean; failed: boolean; error: Error | null }

function useLoad<T>(key: string, loader: (signal: AbortSignal) => Promise<T>, merge?: (previous: T | null, next: T) => T, initialData: T | null = null) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<LoadState<T>>({ key: initialData ? key : '', data: initialData, loading: true, failed: false, error: null });
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const load = async () => {
      await Promise.resolve();
      if (!active) return;
      setState(previous => ({ key, data: previous.key === key ? previous.data : null, loading: true, failed: false, error: null }));
      try {
        const data = await loader(AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]));
        if (active) setState(previous => ({ key, data: merge ? merge(previous.key === key ? previous.data : null, data) : data, loading: false, failed: false, error: null }));
      } catch (error) {
        if (active) setState(previous => ({ ...previous, loading: false, failed: true, error: error instanceof Error ? error : null }));
      }
    };
    void load();
    return () => { active = false; controller.abort(); };
  }, [key, loader, merge, revision]);
  const refresh = useCallback(() => {
    setState(previous => ({ ...previous, loading: true }));
    setRevision(previous => previous + 1);
  }, []);
  return { ...(state.key === key ? state : { key, data: null, loading: true, failed: false, error: null }), refresh };
}

export function useDashboardData(lat: number, lng: number, regionId: string, species: string) {
  const key = `${lat},${lng},${regionId}`;
  const areasLoader = useCallback((signal: AbortSignal) => loadFishingAreaResult(lat, lng, species, signal, regionId), [lat, lng, species, regionId]);
  const weather = useAdvisoryWeather(lat, lng, regionId);
  const areas = useLoad<FishingAreaResult>(`${key},${species}`, areasLoader);
  return { weather, areas };
}

/** Cache belongs to this workspace visit, and is keyed by coordinates and hold region. */
export function useAreaWeather(lat: number, lng: number, regionId: string, cache: Map<string, DashboardWeather>) {
  const key = `${lat},${lng},${regionId}`;
  const [revision, setRevision] = useState(0);
  const loader = useCallback(async (signal: AbortSignal) => {
    const previous = cache.get(key) || null;
    if (revision === 0 && previous && reusableAreaWeather(previous)) return previous;
    const incoming = await loadDashboardWeather(lat, lng, regionId, signal);
    signal.throwIfAborted();
    const data = retainWeather(previous, incoming);
    if (cache.size >= 50 && !cache.has(key)) cache.delete(cache.keys().next().value!);
    cache.set(key, data);
    return data;
  }, [lat, lng, regionId, key, cache, revision]);
  const weather = useLoad<DashboardWeather>(key, loader, retainWeather, cache.get(key) || null);
  return { ...weather, refresh: () => setRevision(previous => previous + 1) };
}

export function useAdvisoryWeather(lat: number, lng: number, regionId: string) {
  const loader = useCallback((signal: AbortSignal) => loadDashboardWeather(lat, lng, regionId, signal), [lat, lng, regionId]);
  return useLoad<DashboardWeather>(`${lat},${lng},${regionId}`, loader, retainWeather);
}
