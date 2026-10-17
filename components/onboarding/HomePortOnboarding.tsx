'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Info, LoaderCircle, MapPin, Navigation, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ParolaLogo } from '@/components/ui/ParolaLogo';
import { AUTH_COPY } from '@/components/auth/auth-copy';
import { reverseGeocode, searchLocations, type GeocodingResult } from '@/services/geocodingService';
import type { MapViewMode } from '@/components/features/hotspots/MapComponent';
import { createPortSelection, homePortProfilePatch, isInCoverage, PORT_PRESETS, provinceFromAddress, type PortSelection } from './home-port';
import styles from './onboarding.module.css';

const MapComponent = dynamic(
  () => import('@/components/features/hotspots/MapComponent').then((module) => module.MapComponent),
  { ssr: false, loading: () => <div className={styles.mapLoading} role="status">Loading your port map…</div> },
);
const RECOMMENDED_PORTS = [PORT_PRESETS[2], PORT_PRESETS[0], PORT_PRESETS[3]];
const OTHER_PORTS = PORT_PRESETS.filter((port) => !RECOMMENDED_PORTS.includes(port));
const NO_HOTSPOTS: [] = [];
const NO_SPECIES: string[] = [];
const ignoreHotspot = () => {};

export default function HomePortOnboarding() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isInitialized, isAuthenticated } = useApp();
  const fromProfile = searchParams.get('from') === 'profile';

  useEffect(() => {
    if (isInitialized && !isAuthenticated) router.replace('/login');
  }, [isInitialized, isAuthenticated, router]);

  if (!isInitialized || !isAuthenticated) return <OnboardingLoading />;
  // Mount after profile hydration so editing never starts with the default port.
  return <PortSelectionContent key={fromProfile ? 'edit' : 'setup'} fromProfile={fromProfile} />;
}

export function OnboardingLoading() {
  return <div className={`${styles.page} ${styles.loadingPage}`} role="status" lang="en">Loading home-port setup…</div>;
}

function PortSelectionContent({ fromProfile }: { fromProfile: boolean }) {
  const router = useRouter();
  const { userProfile, updateProfile, language, showToast } = useApp();
  const copy = AUTH_COPY[language] ?? AUTH_COPY.en;
  const [selection, setSelection] = useState<PortSelection | null>(() => {
    if (!fromProfile || !isInCoverage(userProfile.lat, userProfile.lng)) return null;
    const preset = PORT_PRESETS.find((port) => port.name === userProfile.port);
    return createPortSelection({
      name: userProfile.port || 'Pinned home port', lat: userProfile.lat, lng: userProfile.lng,
      province: preset?.province || provinceFromAddress(userProfile.port) || userProfile.province,
    });
  });
  const [pendingCoordinates, setPendingCoordinates] = useState<[number, number] | null>(null);
  const [viewMode, setViewMode] = useState<MapViewMode>(selection ? 'region' : 'port');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const selectionRequest = useRef(0);
  const savePending = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    sessionStorage.removeItem('just-registered');
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 3) return;
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const matches = await searchLocations(query);
        if (active) setResults(matches);
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setSearching(false);
      }
    }, 400);
    return () => { active = false; window.clearTimeout(timer); };
  }, [searchQuery]);

  const resetSearch = () => {
    setSearchQuery('');
    setResults([]);
    setSearching(false);
  };

  const selectLocation = (location: GeocodingResult) => {
    if (savePending.current) return;
    try {
      const next = createPortSelection(location);
      selectionRequest.current++;
      setSelection(next);
      setPendingCoordinates(null);
      setResolving(false);
      setLocating(false);
      resetSearch();
      setViewMode('region');
      setNotice(null);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Choose a home port inside Parola’s coverage.');
    }
  };

  const resolvePin = async (lat: number, lng: number) => {
    if (savePending.current) return;
    const request = ++selectionRequest.current;
    if (!isInCoverage(lat, lng)) {
      setPendingCoordinates(null);
      setResolving(false);
      setLocating(false);
      setError('This point is outside Parola’s Philippine advisory coverage. Choose a listed port or move your pin inside the coverage area.');
      return;
    }
    setSelection(null);
    setPendingCoordinates([lat, lng]);
    setResolving(true);
    setLocating(false);
    resetSearch();
    setViewMode('port');
    setNotice(null);
    setError(null);
    let name: string;
    try {
      name = await reverseGeocode(lat, lng);
    } catch {
      name = `Coastal Spot (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    }
    if (request !== selectionRequest.current || !mounted.current) return;
    const fallback = !name || name.startsWith('Coastal Spot (');
    setSelection(createPortSelection({ name: name || 'Pinned home port', lat, lng }));
    setPendingCoordinates(null);
    setResolving(false);
    setViewMode('region');
    if (fallback) setNotice('An address could not be found. Your coordinates are retained; you can also choose a listed port.');
  };

  const locate = () => {
    if (savePending.current || locating) return;
    if (!navigator.geolocation) {
      setError('Location is unavailable in this browser. Search for your port or choose a point on the map.');
      return;
    }
    const request = ++selectionRequest.current;
    setSelection(null);
    setPendingCoordinates(null);
    setLocating(true);
    setResolving(true);
    setError(null);
    setNotice(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (request === selectionRequest.current && mounted.current) void resolvePin(coords.latitude, coords.longitude);
      },
      () => {
        if (request !== selectionRequest.current || !mounted.current) return;
        setLocating(false);
        setResolving(false);
        setError('Unable to use your location. Search for your port or choose a point on the map instead.');
      },
      { timeout: 10000, maximumAge: 60000 },
    );
  };

  const clearSelection = () => {
    if (savePending.current) return;
    selectionRequest.current++;
    setSelection(null);
    setPendingCoordinates(null);
    setResolving(false);
    setLocating(false);
    setError(null);
    setNotice(null);
    setViewMode('port');
    searchRef.current?.focus();
  };

  const savePort = async () => {
    if (!selection || resolving || savePending.current) return;
    savePending.current = true;
    setSaving(true);
    setError(null);
    const patch = homePortProfilePatch(selection);
    let saved = false;
    try {
      await updateProfile(patch);
      // Keep legacy home-port readers compatible without replacing vessel or emergency data.
      const values: Record<string, string> = {
        port: selection.name, lat: String(patch.lat), lng: String(patch.lng),
        province: selection.province || '', regionId: selection.region.id,
        regionName: selection.region.name, fmaZone: selection.region.fmaZone,
        regionalBounds: JSON.stringify(selection.region.bounds),
      };
      try {
        for (const [key, value] of Object.entries(values)) localStorage.setItem(`profile-${key}`, value);
      } catch {
        // The server-confirmed profile remains authoritative if the device cache is full.
        showToast('Home port saved. This device could not cache the location.', 'info');
      }
      router.push(fromProfile ? '/profile' : '/dashboard');
      saved = true;
    } catch {
      if (mounted.current) setError('Your home port could not be saved. Please try again.');
    } finally {
      if (!saved) {
        savePending.current = false;
        if (mounted.current) setSaving(false);
      }
    }
  };

  const resultButtons = () => Array.from(resultsRef.current?.querySelectorAll<HTMLButtonElement>('[data-port-result]') || [])
    .filter((button) => !button.disabled && button.getClientRects().length > 0);

  const browseResults = (event: KeyboardEvent<HTMLDivElement>) => {
    const buttons = resultButtons();
    const index = buttons.indexOf(event.target as HTMLButtonElement);
    if (index < 0 || !['ArrowDown', 'ArrowUp', 'Home', 'End', 'Escape'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Escape' || (event.key === 'ArrowUp' && index === 0)) searchRef.current?.focus();
    else buttons[event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : Math.max(0, Math.min(buttons.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)))]?.focus();
  };

  const query = searchQuery.trim();
  const presetMatches = query.length >= 3 ? PORT_PRESETS.filter((port) => `${port.name} ${port.province}`.toLowerCase().includes(query.toLowerCase())) : [];
  const searchMatches = results.filter((result) => !presetMatches.some((preset) => preset.lat === result.lat && preset.lng === result.lng));
  const coordinates = pendingCoordinates || selection?.coordinates;

  const portButton = (location: GeocodingResult) => (
    <button key={`${location.name}-${location.lat}-${location.lng}`} type="button" data-port-result className={styles.result} disabled={saving} onClick={() => selectLocation(location)}>
      <MapPin size={15} aria-hidden="true" />
      <span><span className={styles.resultName}>{location.name}</span>{location.province && <span className={styles.resultProvince}>{location.province}</span>}</span>
    </button>
  );

  return (
    <div className={styles.page} lang="en">
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Parola"><ParolaLogo iconOnly className="h-8 w-8" /><span>Parola</span></Link>
        <Link className={styles.back} href={fromProfile ? '/profile' : '/login'}><ArrowLeft size={15} aria-hidden="true" />{fromProfile ? 'Back to profile' : 'Back to account'}</Link>
      </header>
      <main className={styles.layout}>
        <section className={styles.panel} aria-labelledby="port-title">
          {!fromProfile && <ol className={styles.steps} aria-label={copy.stepsLabel} lang={language === 'tl' ? 'fil' : language}>
            <li><Check size={13} aria-hidden="true" />{copy.accountStep}</li>
            <li><Check size={13} aria-hidden="true" />{copy.verifyStep}</li>
            <li aria-current="step"><span className={styles.stepDot}>3</span>{copy.portStep}</li>
          </ol>}
          <div className={styles.intro}><h1 id="port-title">{fromProfile ? 'Change your home port' : 'Choose your home port'}</h1><p>We’ll use it to set your local advisory area.</p></div>
          <div>
            <label className={styles.label} htmlFor="port-search">Search for a home port</label>
            <div className={styles.searchWrap}>
              <input ref={searchRef} id="port-search" type="search" className={styles.search} placeholder="Port, town, or province" autoComplete="off" value={searchQuery} disabled={saving} aria-describedby="port-search-hint" aria-controls="port-search-results" onChange={(event) => { setSearchQuery(event.target.value); setResults([]); setSearching(event.target.value.trim().length >= 3); setError(null); }} onKeyDown={(event) => { if (event.key === 'ArrowDown' && resultButtons().length) { event.preventDefault(); resultButtons()[0].focus(); } }} />
              {searchQuery && <button className={styles.clearSearch} type="button" aria-label="Clear search" disabled={saving} onClick={() => { resetSearch(); searchRef.current?.focus(); }}><X size={16} aria-hidden="true" /></button>}
            </div>
            <p id="port-search-hint" className={styles.hint}>Search by name, choose a listed port, or place a pin on the map.</p>
            <button className={styles.gps} type="button" disabled={saving || locating} onClick={locate}>{locating ? <LoaderCircle size={16} className={styles.spinner} aria-hidden="true" /> : <Navigation size={16} aria-hidden="true" />}{locating ? 'Finding your location…' : 'Use my location'}</button>
            <div id="port-search-results" ref={resultsRef} onKeyDown={browseResults}>
              {query.length >= 3 ? <div className={styles.results} aria-label="Port search results">
                {searching && <p className={styles.status} role="status">Searching for ports…</p>}
                {(presetMatches.length > 0 || searchMatches.length > 0) && <div className={styles.resultList}>{[...presetMatches, ...searchMatches].map(portButton)}</div>}
                {!searching && !presetMatches.length && !searchMatches.length && <p className={styles.status} role="status">No matching ports found. Try a different name or place a pin on the map.</p>}
              </div> : <details key={selection ? 'selected' : 'empty'} className={styles.recommended} open={!selection}>
                <summary>{selection ? 'Choose another listed port' : 'Recommended ports'}</summary>
                <div className={styles.portList}>{RECOMMENDED_PORTS.map(portButton)}</div>
                <details className={styles.morePorts}><summary>More ports</summary><div className={styles.portList}>{OTHER_PORTS.map(portButton)}</div></details>
              </details>}
            </div>
          </div>
          {error && <p className={styles.error} role="alert">{error}</p>}
          {notice && <p className={styles.notice} role="status">{notice}</p>}
          {resolving ? <div className={styles.emptySelection} role="status"><LoaderCircle size={18} className={styles.spinner} aria-hidden="true" /><p>{locating ? 'Finding your location…' : 'Finding the address and advisory area for your pin…'}</p></div> : selection ? <div className={styles.selection} aria-label="Selected home port" aria-live="polite">
            <dl><dt>Home port</dt><dd>{selection.name}</dd>{selection.province && <><dt>Province</dt><dd>{selection.province}</dd></>}<dt>Detected region</dt><dd className={styles.regionName}>{selection.region.name}</dd></dl>
            <h2>Your advisory area</h2><p>Your home port sets the region used for local fishing guidance. The dashed outline shows this area on the map.</p>
            <details className={styles.details}><summary>Location details</summary><p>{selection.coordinates[0].toFixed(4)}° N, {selection.coordinates[1].toFixed(4)}° E</p><p>{selection.region.fmaZone}</p></details>
          </div> : <div className={styles.emptySelection}><Info size={18} aria-hidden="true" /><p>Select your home port to preview its advisory area before you confirm.</p></div>}
          <div className={styles.actions}>
            <button className={styles.confirm} type="button" disabled={!selection || resolving || saving} onClick={() => void savePort()}>{saving ? <LoaderCircle className={styles.spinner} size={17} aria-hidden="true" /> : <ArrowRight size={17} aria-hidden="true" />}<span aria-live="polite">{saving ? 'Saving home port…' : fromProfile ? 'Save home port' : 'Confirm home port'}</span></button>
            {(selection || resolving) && <button className={styles.clearPin} type="button" disabled={saving} onClick={clearSelection}>Clear selection</button>}
          </div>
          <p className={styles.hint} lang="en">Your home port is saved only after server confirmation. A failed save keeps your selection here so you can retry. Saving a port does not verify your phone, enable automatic messaging or grant fishing permission.</p>
        </section>
        <section className={styles.mapArea} aria-label="Home-port selection map">
          <MapComponent hotspots={NO_HOTSPOTS} selectedHotspot={null} onSelectHotspot={ignoreHotspot} filterType="both" selectedSpecies={NO_SPECIES} hideSidebar hideLegend center={coordinates || undefined} onMapClick={(lat, lng) => { void resolvePin(lat, lng); }} activeRegion={selection?.region || null} showRegionBoundary={!!selection} showVesselMarkers={false} isolateRegion={false} viewMode={viewMode} boundaryMaskOpacity={0.18} minHeight={300} constrainToPhilippines />
          <div className={styles.mapControls} role="group" aria-label="Map view"><button type="button" disabled={!coordinates} aria-pressed={viewMode === 'port'} onClick={() => setViewMode('port')}>Home port</button><button type="button" disabled={!selection || resolving} aria-pressed={viewMode === 'region'} onClick={() => setViewMode('region')}>Advisory area</button></div>
          <div className={styles.legend} aria-label="Map legend"><span><i className={styles.legendPin} aria-hidden="true" />Home port</span>{selection && <span><i className={styles.legendLine} aria-hidden="true" />Advisory area</span>}</div>
        </section>
      </main>
    </div>
  );
}
