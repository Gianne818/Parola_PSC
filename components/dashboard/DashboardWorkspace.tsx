'use client';

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import dynamic from 'next/dynamic';
import { ArrowLeft, ChevronDown, List, RefreshCw, SlidersHorizontal } from 'lucide-react';
import type { Hotspot, PhilippineRegion, Language } from '@/types';
import {
  DEFAULT_THRESHOLD_PERCENT,
  MAX_THRESHOLD_PERCENT,
  MIN_THRESHOLD_PERCENT,
  manilaDate,
  meetsThreshold,
  type AdvisoryState,
  type DashboardWeather,
  type FishingArea,
  type FishingAreaMetadata,
} from '@/lib/dashboard';
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
import HotspotLegend from './HotspotLegend';
import SelectedEstimate from './SelectedEstimate';
import ResizableWorkspace from './ResizableWorkspace';

const DashboardMap = dynamic(() => import('./DashboardMap'), { ssr: false, loading: () => <div className={styles.mapLoading} aria-busy="true" /> });

interface WorkspaceProps {
  areas: FishingArea[]; loading: boolean; failed: boolean; retry: () => void; region: PhilippineRegion; lat: number; lng: number;
  areaMetadata: FishingAreaMetadata | null;
  coverage?: Coverage; loadError?: Error | null;
  habitat: Hotspot['type']; species: string; setFilters: (habitat: Hotspot['type'], species: string) => void;
  accountId?: string;
  minThreshold?: number; setMinThreshold?: (value: number) => void;
  state: AdvisoryState; weather: DashboardWeather | null; weatherStale: boolean; phone: string; port: string;
  copy: DashboardCopy; language: Language; showWeather: boolean; closeWeather: () => void;
}

export default function DashboardWorkspace(props: WorkspaceProps) {
  const { areas: rawAreas, loading, failed, retry, region, lat, lng, habitat, species, setFilters, state, weather, weatherStale, phone, port, copy, language, showWeather, closeWeather } = props;
  const viewport = useWorkspaceViewport();
  const [forecastCache] = useState(() => new Map<string, DashboardWeather>());
  const [internalThreshold, setInternalThreshold] = useState(DEFAULT_THRESHOLD_PERCENT);
  const minThreshold = props.minThreshold ?? internalThreshold;
  const areas = rawAreas.filter(area => meetsThreshold(area.catchProbability, minThreshold));
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
  const panelScrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const selected = displayedAreas.find(area => area.id === selectedId) || null;
  const guidanceAvailable = state === 'clear' && !weatherStale;
  const filtered = habitat !== 'both' || Boolean(species) || selectedDate !== 'all' || minThreshold !== DEFAULT_THRESHOLD_PERCENT;
  const panelVisible = viewport === 'desktop' || (viewport === 'mobile' && mobileView === 'areas') || (viewport === 'tablet' && drawerOpen) || showWeather;
  const panelTitle = showWeather ? copy.weatherDetails : selected?.name || copy.areas;
  useLayoutEffect(() => {
    if (panelScrollRef.current) panelScrollRef.current.scrollTop = 0;
  }, [selected?.id, showWeather, viewport]);
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
  const focusPanel = () => requestAnimationFrame(() => {
    document.getElementById('inspector-title')?.focus({ preventScroll: true });
    if (panelScrollRef.current) panelScrollRef.current.scrollTop = 0;
    panelRef.current?.scrollIntoView({ block: 'nearest' });
  });
  const select = (area: Hotspot | null) => {
    setSelectedId(area?.id || null); closeWeather(); setDrawerOpen(true); setMobileView('areas'); focusPanel();
  };
  const updateMinThreshold = (nextValue: number) => {
    const clamped = Math.min(Math.max(nextValue, MIN_THRESHOLD_PERCENT), MAX_THRESHOLD_PERCENT);
    setLimit(3);
    setSelectedId(null);
    if (props.setMinThreshold) props.setMinThreshold(clamped);
    else setInternalThreshold(clamped);
  };
  const updateFilters = (nextHabitat: Hotspot['type'], nextSpecies: string) => {
    setLimit(3); setSelectedId(null); setDateFilter('all'); setFilters(nextHabitat, nextSpecies);
  };
  const clearAllFilters = () => {
    updateFilters('both', '');
    updateMinThreshold(DEFAULT_THRESHOLD_PERCENT);
  };
  const sliderStyle = {
    '--control-value': minThreshold,
    '--attr-min': MIN_THRESHOLD_PERCENT,
    '--attr-max': MAX_THRESHOLD_PERCENT,
  } as CSSProperties;
  const returnAreas = () => { closeWeather(); setSelectedId(null); setMobileView('areas'); setDrawerOpen(true); focusPanel(); };
  const closePanel = () => { closeWeather(); setDrawerOpen(false); setMobileView('map'); };
  const retryMap = () => { setTilesFailed(false); setMapRevision(previous => previous + 1); };
  const filterControls = <details ref={filtersRef} className={styles.filters} onKeyDown={event => {
    if (event.key === 'Escape' && filtersRef.current) { filtersRef.current.open = false; filtersRef.current.querySelector('summary')?.focus(); }
  }}>
    <summary aria-label={copy.filterFish}><SlidersHorizontal size={16} aria-hidden="true" />{copy.filterFish}<span className={styles.filterValue}>≥ {minThreshold}%</span><ChevronDown size={14} aria-hidden="true" /></summary>
    <div className={styles.filterPopover}>
      <label>{copy.habitat}<select value={habitat} onChange={event => updateFilters(event.target.value as Hotspot['type'], species)}><option value="both">{copy.all}</option><option value="pelagic">{copy.surface}</option><option value="demersal">{copy.bottom}</option></select></label>
      <label>{copy.targetFish}<select value={species} aria-describedby="species-support-note" onChange={event => updateFilters(habitat, event.target.value)}><option value="">{copy.anyFish}</option>{[...CATEGORIZED_SPECIES.pelagic, ...CATEGORIZED_SPECIES.demersal].map(fish => <option key={fish.name} value={fish.name}>{fish.name}</option>)}</select></label>
      <p id="species-support-note" className={styles.panelDescription} lang="en">Fish choices are unverified requests; unsupported names may be rejected. Adjustments do not confirm fish presence.</p>
      <label htmlFor="popover-threshold-slider" className={styles.popoverThresholdField}>
        <span className={styles.popoverThresholdHeader}>
          <span>{copy.minThreshold}</span>
          <strong className={styles.thresholdValue}>≥ {minThreshold}%</strong>
        </span>
        <input
          id="popover-threshold-slider"
          type="range"
          className={styles.thresholdSlider}
          min={MIN_THRESHOLD_PERCENT}
          max={MAX_THRESHOLD_PERCENT}
          step={5}
          value={minThreshold}
          aria-valuetext={`≥ ${minThreshold}% ${copy.modelEstimate.toLowerCase()}`}
          onChange={event => updateMinThreshold(Number(event.target.value))}
          style={sliderStyle}
        />
        <span className={styles.thresholdScale} aria-hidden="true">
          <span>{MIN_THRESHOLD_PERCENT}%</span>
          <span>50%</span>
          <span>{MAX_THRESHOLD_PERCENT}%</span>
        </span>
      </label>
      <label lang="en">Prediction date<select value={selectedDate} onChange={event => { setDateFilter(event.target.value); setSelectedId(null); setLimit(3); }}>
        <option value="all">All returned dates</option>{returnedDates.map(date => <option key={date} value={date}>{date}</option>)}
        {hasUnknownDates && <option value="unknown">Date unavailable</option>}
      </select></label>
      {filtered && <button type="button" className={styles.textButton} onClick={clearAllFilters}>{copy.clearFilters}</button>}
    </div>
  </details>;
  const activeFilters = filtered && <div className={styles.activeFilters}>
    <span>{[habitat === 'pelagic' ? copy.surface : habitat === 'demersal' ? copy.bottom : '', species,
      minThreshold !== DEFAULT_THRESHOLD_PERCENT ? `${copy.minThreshold}: ≥ ${minThreshold}%` : '',
      selectedDate === 'all' ? '' : selectedDate === 'unknown' ? 'Prediction date unavailable' : selectedDate,
    ].filter(Boolean).join(' · ')}</span>
    <button type="button" className={styles.textButton} onClick={clearAllFilters}>{copy.clearFilters}</button>
  </div>;
  const informationPanel = <aside id="dashboard-inspector" ref={panelRef} className={styles.infoPanel} aria-labelledby="inspector-title">
    <div ref={panelScrollRef} className={styles.panelScroll}>
      <div className={styles.panelContent}>
        {(showWeather || selected) && <button type="button" className={styles.backButton} onClick={returnAreas}><ArrowLeft size={16} aria-hidden="true" />{copy.backAreas}</button>}
        <div className={styles.panelHeading}><h2 id="inspector-title" tabIndex={-1}>{panelTitle}</h2>
          {!showWeather && !selected && <span className={styles.resultCount}>{displayedAreas.length}</span>}
        </div>
        {!showWeather && !guidanceAvailable && <p className={styles.notice} role="status" lang="en">Fishing guidance withheld: {state === 'hold' ? 'a Parola hold is active' : 'essential safety checks are incomplete'}. Follow current official warnings and port instructions.</p>}
        {!showWeather && selected && <SelectedEstimate area={selected} guidanceAvailable={guidanceAvailable} copy={copy} />}
        {!showWeather && viewport !== 'desktop' && <div className={styles.inspectorControls}>
          {filterControls}<button type="button" className={styles.iconButton} disabled={loading} onClick={retry} aria-label={loading ? 'Refreshing areas…' : 'Refresh areas'} title="Refresh areas"><RefreshCw size={17} aria-hidden="true" /></button>
        </div>}
        {!showWeather && viewport !== 'desktop' && activeFilters}
        {!showWeather && <>
          {props.loadError instanceof AreaLoadError && <p className={styles.notice} role="status" lang="en">{props.loadError.message}
            {species && <button type="button" className={styles.textButton} onClick={() => updateFilters(habitat, '')}>Clear fish filter</button>}</p>}
          {selected && (loading || failed) && <p className={styles.notice} role="status">{loading ? copy.loadingAreas : `${copy.areasFailed} ${copy.lastAvailable}`}</p>}
        </>}
        {showWeather ? <WeatherDetails data={weather} state={state} copy={copy} language={language} />
          : selected ? <>
            <AreaDetails key={selected.id} area={selected} copy={copy} guidanceAvailable={guidanceAvailable} weather={<AreaWeather key={`${selected.lat},${selected.lng}`} area={selected} regionId={region.id} cache={forecastCache} language={language} />} /></>
            : <>
              {areas.length > 0 && <p className={styles.panelDescription} lang="en">Unverified model areas · nearest to your home port.</p>}
              {earlierPredictions && <p className={styles.predictionNotice}>{latestDate < (manilaDate(new Date()) || '') ? `${text.lastPredictions} · ${formattedPredictionDate}` : text.earlierDates}</p>}
              <FishingAreas areas={displayedAreas} loading={loading} failed={failed} retry={retry} limit={limit} showMore={() => setLimit(previous => previous === 3 ? 10 : previous + 10)}
                select={select} filtered={filtered} clearFilters={clearAllFilters} speciesUnavailable={Boolean(species && areas.length && !areas.some(area => area.speciesAdjusted))} copy={copy} />
            </>}
        {!showWeather && <PredictionCoverage metadata={props.areaMetadata} coverage={props.coverage} displayed={displayedAreas.length}
          received={props.coverage ? props.coverage.receivedCount - props.coverage.rejectedCount - props.coverage.duplicateCount : areas.length || null} species={species} />}
        <details className={styles.smsDisclosure}>
          <summary>{copy.smsTitle}<ChevronDown size={16} aria-hidden="true" /></summary>
          <SmsAccess accountId={props.accountId} phone={phone} port={port} weather={weather} state={state} stale={weatherStale} copy={copy} language={language} />
        </details>
      </div>
    </div>
  </aside>;
  return <>
    {viewport === 'mobile' && <div className={styles.mobileViews} role="group" aria-label={copy.dashboard}>
      <button type="button" aria-pressed={mobileView === 'map' && !showWeather} onClick={closePanel}>{copy.map}</button>
      <button type="button" aria-pressed={mobileView === 'areas' || showWeather} onClick={() => { setMobileView('areas'); closeWeather(); }}>{copy.areasView}</button>
    </div>}
    <ResizableWorkspace viewport={viewport} view={viewport === 'mobile' && showWeather ? 'areas' : mobileView}
      inspector={viewport === 'desktop' || (viewport === 'mobile' && panelVisible) ? informationPanel : null}>
      <section className={styles.mapCard} aria-label={copy.map}>
        <div className={styles.mapToolbar}>
          <div className={styles.framing} role="group" aria-label={copy.map}>
            <button type="button" aria-pressed={viewMode === 'port'} onClick={() => setViewMode('port')}>{copy.homePort}</button>
            <button type="button" aria-pressed={viewMode === 'region'} onClick={() => setViewMode('region')}>{copy.advisoryArea}</button>
          </div>
          <div className={styles.toolbarActions}>
            {viewport === 'tablet' && <button type="button" className={styles.textButton} onClick={() => { setDrawerOpen(true); closeWeather(); }}><List size={16} aria-hidden="true" />{copy.areasView}</button>}
            {!(viewport !== 'desktop' && panelVisible) && filterControls}
            <button type="button" className={styles.iconButton} disabled={loading} onClick={retry} aria-label={loading ? 'Refreshing areas…' : 'Refresh areas'} title="Refresh areas"><RefreshCw size={17} aria-hidden="true" /></button>
          </div>
        </div>
        {!guidanceAvailable && <p className={styles.mapSafetyNotice} role="status" lang="en">Fishing guidance withheld. Map markers are reference records, not departure or fishing recommendations.</p>}
        {activeFilters}
        {tilesFailed && <div className={styles.mapError} role="status"><span>{copy.mapFailed}</span><button type="button" className={styles.textButton} onClick={retryMap}>{copy.retry}</button></div>}
        <div className={styles.mapCanvas}>
          <DashboardMap key={mapRevision} areas={displayedAreas} selected={selected} select={select} region={region} lat={lat} lng={lng} viewMode={viewMode} tileError={() => setTilesFailed(true)} retry={retryMap} copy={copy} guidanceAvailable={guidanceAvailable} />
        </div>
        <HotspotLegend guidanceAvailable={guidanceAvailable} />
      </section>
    </ResizableWorkspace>
    {viewport === 'tablet' && <SideDrawer open={panelVisible} close={closePanel} title={copy.advisoryArea} closeLabel={copy.close}>{informationPanel}</SideDrawer>}
  </>;
}
