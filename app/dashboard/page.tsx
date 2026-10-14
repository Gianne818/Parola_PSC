'use client';

import { useMemo, useState } from 'react';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { useApp } from '@/context/AppContext';
import { PHILIPPINE_REGIONS, detectPhilippineRegion } from '@/data/philippineRegions';
import { advisoryState, nearbyAreas } from '@/lib/dashboard';
import type { Hotspot } from '@/types';
import Advisory from '@/components/dashboard/Advisory';
import DashboardWorkspace from '@/components/dashboard/DashboardWorkspace';
import { DASHBOARD_COPY } from '@/components/dashboard/dashboard-copy';
import { useDashboardClock, useDashboardData } from '@/components/dashboard/use-dashboard-data';
import styles from '@/components/dashboard/dashboard.module.css';

export default function DashboardPage() {
  const { userProfile, manualOverrideHold, language } = useApp();
  const copy = DASHBOARD_COPY[language];
  const now = useDashboardClock();
  const [showWeather, setShowWeather] = useState(false);
  const [filters, setFilters] = useState<{ habitat: Hotspot['type']; species: string }>({ habitat: 'both', species: '' });
  const region = useMemo(() => PHILIPPINE_REGIONS.find(item => item.id === userProfile.regionId)
    || detectPhilippineRegion(userProfile.lat, userProfile.lng, userProfile.port), [userProfile.regionId, userProfile.lat, userProfile.lng, userProfile.port]);
  const { weather, areas } = useDashboardData(userProfile.lat, userProfile.lng, region.id, filters.species);
  const localAreas = useMemo(() => nearbyAreas(areas.data?.areas || [], region, userProfile.lat, userProfile.lng, filters.habitat),
    [areas.data, region, userProfile.lat, userProfile.lng, filters.habitat]);
  const state = advisoryState(weather.data, manualOverrideHold, weather.failed, now);
  return <AuthLayout variant="dashboard">
    <div className={styles.dashboard}>
      <Advisory data={weather.data} state={state} loading={weather.loading} failed={weather.failed} refresh={weather.refresh} openDetails={() => setShowWeather(true)} copy={copy} language={language} />
      <DashboardWorkspace key={`${userProfile.lat},${userProfile.lng},${region.id}`} areas={localAreas} loading={areas.loading} failed={areas.failed} retry={areas.refresh}
        areaMetadata={areas.data?.metadata || null}
        region={region} lat={userProfile.lat} lng={userProfile.lng} habitat={filters.habitat} species={filters.species} setFilters={(habitat, species) => setFilters({ habitat, species })}
        state={state} weather={weather.data} weatherStale={weather.failed || weather.loading} phone={userProfile.phone} port={userProfile.port}
        copy={copy} language={language} showWeather={showWeather} closeWeather={() => setShowWeather(false)} />
    </div>
  </AuthLayout>;
}
