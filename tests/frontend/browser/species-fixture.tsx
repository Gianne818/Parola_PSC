// Actual workspace, loader hook and client adapter. Only transport/context/framework are mocked.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import DashboardWorkspace from '@/components/dashboard/DashboardWorkspace';
import { useDashboardData } from '@/components/dashboard/use-dashboard-data';
import { DASHBOARD_COPY } from '@/components/dashboard/dashboard-copy';
import { nearbyAreas } from '@/lib/dashboard';
import type { Hotspot } from '@/types';
import { PHILIPPINE_REGIONS } from '@/data/philippineRegions';
import { prediction, resolvedResponse } from '../fixtures/species-contract';
import { FixtureContext } from './state';
import styles from '@/components/dashboard/dashboard.module.css';
import '@/app/globals.css';

let scenario = 'resolved';
function setScenario(next: string) { scenario = next; }
const requests: string[] = [];
const deniedFetch = window.fetch;
window.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (!url.startsWith('/api/advisories/nearest?') && !url.startsWith('/api/dashboard/weather?')) return deniedFetch(input, init);
  requests.push(url);
  if (url.startsWith('/api/dashboard/weather?')) {
    const absent = { value: null, source: 'unavailable', observedAt: null };
    return Response.json({ wind: absent, waves: absent, temperature: absent, stormSignal: absent,
      hold: { available: false, active: false, checkedAt: null, reason: null }, receivedAt: '2026-10-13T00:00:00Z' });
  }
  const species = new URL(url, location.origin).searchParams.get('species');
  if (species && ['unsupported', 'ambiguous', 'unavailable'].includes(scenario)) return Response.json({
    error: 'Fixture failure', code: scenario === 'unavailable' ? 'species_catalog_unavailable' : 'species_unsupported', hotspots: [],
  }, { status: scenario === 'unavailable' ? 503 : 422 });
  const hotspots = scenario === 'empty' ? [] : ['pelagic', 'demersal', 'both'].map((model_type, index) => ({
    ...prediction, grid_id: 23 + index, target_lat: 10.4 + index / 100, model_type,
    ...(scenario === 'missing' ? { sst: null, chl_a: null } : {}),
  }));
  return Response.json({ ...resolvedResponse, hotspots, species_status: species ? 'resolved' : 'not_requested',
    species_profile: species ? resolvedResponse.species_profile : undefined, species_hsi_status: species ? 'unavailable' : 'not_requested',
    // Item status agrees with the envelope, as in the published contract.
    ...(species ? {} : { hotspots: hotspots.map(item => ({ ...item, species_hsi_status: 'not_requested' })) }),
  });
};

function Fixture() {
  const [filters, setFilters] = useState<{ habitat: Hotspot['type']; species: string }>({ habitat: 'both', species: '' });
  const { areas } = useDashboardData(10.3, 123.8, 'reg-7', filters.species);
  const region = PHILIPPINE_REGIONS.find(item => item.id === 'reg-7')!;
  Object.assign(window, { fixture: { requests, setScenario: (next: string) => { setScenario(next); areas.refresh(); } } });
  return <FixtureContext.Provider value={{ userProfile: { lat: 10.3, lng: 123.8, port: 'Sample port' }, showToast() {}, route() {} }}>
    <main className={styles.dashboard}>
      <DashboardWorkspace areas={nearbyAreas(areas.data?.areas || [], region, 10.3, 123.8, filters.habitat)}
        areaMetadata={areas.data?.metadata || null} speciesFailure={areas.speciesFailure} loading={areas.loading} failed={areas.failed} retry={areas.refresh}
        region={region} lat={10.3} lng={123.8} habitat={filters.habitat} species={filters.species} setFilters={(habitat, species) => setFilters({ habitat, species })}
        state="incomplete" weather={null} weatherStale={false} phone="" port="Sample port" copy={DASHBOARD_COPY.en} language="en"
        showWeather={false} closeWeather={() => {}} />
    </main>
  </FixtureContext.Provider>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
