'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { ArrowLeft, ChevronDown, List, SlidersHorizontal } from 'lucide-react';
import type { Hotspot, PhilippineRegion, Language } from '@/types';
import { manilaDate, type AdvisoryState, type DashboardWeather, type FishingArea, type FishingAreaMetadata } from '@/lib/dashboard';
import type { MapViewMode } from '@/components/features/hotspots/MapComponent';
import { CATEGORIZED_SPECIES } from '@/utils/speciesColors';
import { WeatherDetails } from './Advisory';
import FishingAreas, { AreaDetails } from './FishingAreas';
import SmsAccess from './SmsAccess';
import SideDrawer from './SideDrawer';
import { useWorkspaceViewport } from './use-workspace-viewport';
import type { DashboardCopy } from './dashboard-copy';
import styles from './dashboard.module.css';
import AreaWeather from './AreaWeather';
import { GUIDANCE_COPY } from './guidance-copy';
import { predictionDay } from '@/lib/frontend/timestamps';
import { AreaLoadError, areasOnDay, availablePredictionDays, type PredictionCoverage as Coverage } from '@/lib/frontend/prediction-presentation';
import PredictionCoverage from './PredictionCoverage';

const DashboardMap = dynamic(() => import('./DashboardMap'), { ssr: false, loading: () => <div className={styles.mapLoading} aria-busy="true" /> });

interface WorkspaceProps {
  areas: FishingArea[]; loading: boolean; failed: boolean; retry: () => void; region: PhilippineRegion; lat: number; lng: number;
  areaMetadata: FishingAreaMetadata | null;
  coverage?: Coverage; loadError?: Error | null;
  habitat: Hotspot['type']; species: string; setFilters: (habitat: Hotspot['type'], species: string) => void;
  state: AdvisoryState; weather: DashboardWeather | null; weatherStale: boolean; phone: string; port: string;
  copy: DashboardCopy; language: Language; showWeather: boolean; closeWeather: () => void;
}

export default function DashboardWorkspace(props: WorkspaceProps) {
  const { areas, loading, failed, retry, region, lat, lng, habitat, species, setFilters, state, weather, weatherStale, phone, port, copy, language, showWeather, closeWeather } = props;
  const viewport = useWorkspaceViewport();
  const [forecastCache] = useState(() => new Map<string, DashboardWeather>());
  const text = GUIDANCE_COPY[language];
  const dates = [...new Set((props.areaMetadata?.predictionDates || areas.map(area => area.predictionDate))
    .map(predictionDay).filter((date): date is string => date !== null))].sort().reverse();
  const latestDate = dates[0];
  const earlierPredictions = dates.some(date => date < (manilaDate(new Date()) || ''));
  const formattedPredictionDate = latestDate ? new Intl.DateTimeFormat(language === 'tl' ? 'fil' : language, { timeZone: 'Asia/Manila', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(`${latestDate.slice(0, 10)}T00:00:00+08:00`)) : null;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [limit, setLimit] = useState(3);
  const [mobileView, setMobileView] = useState<'map' | 'areas'>('map');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<MapViewMode>('port');
  const [mapRevision, setMapRevision] = useState(0);
  const [tilesFailed, setTilesFailed] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');
  const returnedDates = availablePredictionDays(areas);
  const hasUnknownDates = areas.some(area => !area.predictionDate);
  const dateAvailable = dateFilter === 'all' || returnedDates.includes(dateFilter) || (dateFilter === 'unknown' && hasUnknownDates);
  const selectedDate = dateAvailable ? dateFilter : 'all';
  const displayedAreas = areasOnDay(areas, selectedDate);
  const filtersRef = useRef<HTMLDetailsElement>(null);
  const selected = displayedAreas.find(area => area.id === selectedId) || null;
  const filtered = habitat !== 'both' || Boolean(species) || selectedDate !== 'all';
  const panelVisible = viewport === 'desktop' || (viewport === 'mobile' && mobileView === 'areas') || (viewport === 'tablet' && drawerOpen) || showWeather;
  const panelTitle = showWeather ? copy.weatherDetails : selected?.name || copy.areas;
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) filtersRef.current.open = false;
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, []);
  useEffect(() => {
    if (!showWeather) return;
    const frame = requestAnimationFrame(() => document.getElementById('inspector-title')?.focus());
    return () => cancelAnimationFrame(frame);
  }, [showWeather]);
  const focusPanel = () => requestAnimationFrame(() => document.getElementById('inspector-title')?.focus());
  const select = (area: Hotspot | null) => {
    setSelectedId(area?.id || null); closeWeather(); setDrawerOpen(true); setMobileView('areas'); focusPanel();
  };
  const updateFilters = (nextHabitat: Hotspot['type'], nextSpecies: string) => {
    setLimit(3); setSelectedId(null); setDateFilter('all'); setFilters(nextHabitat, nextSpecies);
  };
  const returnAreas = () => { closeWeather(); setSelectedId(null); setMobileView('areas'); setDrawerOpen(true); focusPanel(); };
  const closePanel = () => { closeWeather(); setDrawerOpen(false); setMobileView('map'); };
  const retryMap = () => { setTilesFailed(false); setMapRevision(previous => previous + 1); };
  const predictionControls = <div className={styles.predictionControls} lang="en">
    <label>Prediction date (returned records only)<select value={selectedDate} onChange={event => { setDateFilter(event.target.value); setSelectedId(null); setLimit(3); }}>
      <option value="all">All returned dates</option>{returnedDates.map(date => <option key={date} value={date}>{date}</option>)}
      {hasUnknownDates && <option value="unknown">Date unavailable</option>}
    </select></label>
    <button type="button" className={styles.textButton} disabled={loading} onClick={retry}>{loading ? 'Refreshing areas…' : 'Refresh areas'}</button>
  </div>;
  const informationPanel = <aside className={styles.infoPanel} aria-labelledby="inspector-title">
    <div className={styles.panelScroll}>
      <div className={styles.panelContent}>
        {(showWeather || selected) && <button type="button" className={styles.backButton} onClick={returnAreas}><ArrowLeft size={16} aria-hidden="true" />{copy.backAreas}</button>}
        <div className={styles.panelHeading}><h2 id="inspector-title" tabIndex={-1}>{panelTitle}</h2>
          {!showWeather && !selected && <span className={styles.resultCount}>{displayedAreas.length}</span>}
        </div>
        {!showWeather && <>
          {viewport !== 'desktop' && predictionControls}
          {props.loadError instanceof AreaLoadError && <p className={styles.notice} role="status" lang="en">{props.loadError.message}
            {species && <button type="button" className={styles.textButton} onClick={() => updateFilters(habitat, '')}>Clear fish filter</button>}</p>}
          {selected && (loading || failed) && <p className={styles.notice} role="status">{loading ? copy.loadingAreas : `${copy.areasFailed} ${copy.lastAvailable}`}</p>}
          <PredictionCoverage metadata={props.areaMetadata} coverage={props.coverage} displayed={displayedAreas.length}
            received={props.coverage ? props.coverage.receivedCount - props.coverage.rejectedCount - props.coverage.duplicateCount : areas.length || null} species={species} />
        </>}
        {showWeather ? <WeatherDetails data={weather} state={state} copy={copy} language={language} />
          : selected ? <>{state === 'hold' && <p className={styles.notice}>{copy.reference}</p>}
            <AreaDetails area={selected} copy={copy} weather={<AreaWeather key={`${selected.lat},${selected.lng}`} area={selected} regionId={region.id} cache={forecastCache} language={language} />} /></>
            : <>
              {areas.length > 0 && <p className={styles.panelDescription} lang="en">Prediction source and validity are unverified. Refreshing this list does not make predictions current.</p>}
              {earlierPredictions && <p className={styles.predictionNotice}>{latestDate < (manilaDate(new Date()) || '') ? `${text.lastPredictions} · ${formattedPredictionDate}` : text.earlierDates}</p>}
              {props.areaMetadata?.capped && <p className={styles.panelDescription}>{text.capped.replace('{returned}', String(props.areaMetadata.returnedCount)).replace('{total}', String(props.areaMetadata.eligibleCount))}</p>}
              <FishingAreas areas={displayedAreas} loading={loading} failed={failed} retry={retry} limit={limit} showMore={() => setLimit(previous => previous === 3 ? 10 : previous + 10)}
                select={select} filtered={filtered} clearFilters={() => updateFilters('both', '')} hold={state === 'hold'} speciesUnavailable={Boolean(species && areas.length && !areas.some(area => area.speciesAdjusted))} copy={copy} />
            </>}
      </div>
    </div>
    <div className={styles.panelFooter}>
      <SmsAccess phone={phone} port={port} weather={weather} state={state} stale={weatherStale} copy={copy} language={language} />
    </div>
  </aside>;
  return <>
    {viewport === 'mobile' && <div className={styles.mobileViews} role="group" aria-label={copy.dashboard}>
      <button type="button" aria-pressed={mobileView === 'map' && !showWeather} onClick={closePanel}>{copy.map}</button>
      <button type="button" aria-pressed={mobileView === 'areas' || showWeather} onClick={() => { setMobileView('areas'); closeWeather(); }}>{copy.areasView}</button>
    </div>}
    <div className={styles.workspace} data-size={viewport} data-view={viewport === 'mobile' && showWeather ? 'areas' : mobileView}>
      <section className={styles.mapCard} aria-label={copy.map}>
        <div className={styles.mapToolbar}>
          <div className={styles.framing} role="group" aria-label={copy.map}>
            <button type="button" aria-pressed={viewMode === 'port'} onClick={() => setViewMode('port')}>{copy.homePort}</button>
            <button type="button" aria-pressed={viewMode === 'region'} onClick={() => setViewMode('region')}>{copy.advisoryArea}</button>
          </div>
          <div className={styles.toolbarActions}>
            {viewport === 'tablet' && <button type="button" className={styles.textButton} onClick={() => { setDrawerOpen(true); closeWeather(); }}><List size={16} aria-hidden="true" />{copy.areasView}</button>}
            <details ref={filtersRef} className={styles.filters} onKeyDown={event => {
              if (event.key === 'Escape' && filtersRef.current) { filtersRef.current.open = false; filtersRef.current.querySelector('summary')?.focus(); }
            }}>
              <summary><SlidersHorizontal size={16} aria-hidden="true" />{copy.filterFish}<ChevronDown size={14} aria-hidden="true" /></summary>
              <div className={styles.filterPopover}>
                <label>{copy.habitat}<select value={habitat} onChange={event => updateFilters(event.target.value as Hotspot['type'], species)}><option value="both">{copy.all}</option><option value="pelagic">{copy.surface}</option><option value="demersal">{copy.bottom}</option></select></label>
                <label>{copy.targetFish}<select value={species} aria-describedby="species-support-note" onChange={event => updateFilters(habitat, event.target.value)}><option value="">{copy.anyFish}</option>{[...CATEGORIZED_SPECIES.pelagic, ...CATEGORIZED_SPECIES.demersal].map(fish => <option key={fish.name} value={fish.name}>{fish.name}</option>)}</select></label>
                <p id="species-support-note" className={styles.panelDescription} lang="en">These existing fish-name choices are requests, not a verified species catalog. The server may reject an unsupported or ambiguous name. Habitat selection is separate; adjustment never confirms fish presence.</p>
                {filtered && <button type="button" className={styles.textButton} onClick={() => updateFilters('both', '')}>{copy.clearFilters}</button>}
              </div>
            </details>
          </div>
        </div>
        {predictionControls}
        {filtered && <div className={styles.activeFilters}><span>{[habitat === 'pelagic' ? copy.surface : habitat === 'demersal' ? copy.bottom : '', species].filter(Boolean).join(' · ')}
          {selectedDate !== 'all' && <span lang="en"> · {selectedDate === 'unknown' ? 'Prediction date unavailable' : selectedDate}</span>}</span><button type="button" className={styles.textButton} onClick={() => updateFilters('both', '')}>{copy.clearFilters}</button></div>}
        {tilesFailed && <div className={styles.mapError} role="status"><span>{copy.mapFailed}</span><button type="button" className={styles.textButton} onClick={retryMap}>{copy.retry}</button></div>}
        <div className={styles.mapCanvas}>
          <DashboardMap key={mapRevision} areas={displayedAreas} selected={selected} select={select} region={region} lat={lat} lng={lng} viewMode={viewMode} tileError={() => setTilesFailed(true)} retry={retryMap} copy={copy} />
        </div>
        <div className={styles.mapNote}><span className={styles.homeDot} aria-hidden="true" /><span>{copy.mapNote}</span></div>
      </section>
      {viewport === 'desktop' || (viewport === 'mobile' && panelVisible) ? informationPanel : null}
    </div>
    {viewport === 'tablet' && <SideDrawer open={panelVisible} close={closePanel} title={copy.advisoryArea} closeLabel={copy.close}>{informationPanel}</SideDrawer>}
  </>;
}
