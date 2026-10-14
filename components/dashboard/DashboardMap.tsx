'use client';

import { Component, type ReactNode } from 'react';
import type { Hotspot, PhilippineRegion } from '@/types';
import type { FishingArea } from '@/lib/dashboard';
import { MapComponent, type MapViewMode } from '@/components/features/hotspots/MapComponent';
import type { DashboardCopy } from './dashboard-copy';
import styles from './dashboard.module.css';

class MapBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export default function DashboardMap({ areas, selected, select, region, lat, lng, viewMode, tileError, retry, copy }: {
  areas: FishingArea[]; selected: FishingArea | null; select: (area: Hotspot | null) => void;
  region: PhilippineRegion; lat: number; lng: number; viewMode: MapViewMode; tileError: () => void; retry: () => void; copy: DashboardCopy;
}) {
  return <MapBoundary fallback={<div className={styles.mapFailure} role="status"><p>{copy.mapFailed}</p><button type="button" className={styles.secondary} onClick={retry}>{copy.retry}</button></div>}>
    <MapComponent hotspots={areas} selectedHotspot={selected} onSelectHotspot={select} filterType="both" selectedSpecies={[]}
      hideSidebar hideLegend center={[lat, lng]} activeRegion={region} showRegionBoundary showVesselMarkers={false}
      presentation="dashboard" viewMode={viewMode} boundaryMaskOpacity={0.06} minHeight={0} onTileError={tileError}
      labels={{ loading: copy.loadingMap, homePort: copy.homePort, advisoryArea: copy.advisoryArea }} />
  </MapBoundary>;
}
