"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Hotspot, PhilippineRegion } from "../../../types";
import { calculateDistance, calculateBearing } from "../../../utils/spatial";
import { useApp } from "../../../context/AppContext";
import { Anchor, Compass, Info, Navigation, ShieldCheck, MapPin } from "lucide-react";
import { ALL_SPECIES_CONFIGS, GENERAL_PELAGIC_COLOR, GENERAL_DEMERSAL_COLOR, GENERAL_PELAGIC_SHADES, GENERAL_DEMERSAL_SHADES, getSpeciesConfig } from "../../../utils/speciesColors";
import { isClientCoordinate, isClientTargetCoordinate } from '@/lib/frontend/coordinates';

/** Prediction radius the ML model was trained on: 9 km */
export const PREDICTION_RADIUS_KM = 9;
export const PREDICTION_RADIUS_METERS = PREDICTION_RADIUS_KM * 1000;
export type MapViewMode = 'auto' | 'port' | 'region';

// Dynamically import the real Leaflet map component with SSR disabled
const MapInner = dynamic(() => import("./MapInner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-50 dark:bg-[#0B1513] flex flex-col items-center justify-center space-y-4">
      <Compass className="w-12 h-12 text-brand-green animate-spin [animation-duration:3s]" />
      <span className="text-xs font-black uppercase tracking-widest text-gray-400">
        Loading reference map…
      </span>
    </div>
  )
});

const BriefingMapInner = dynamic(() => import('./MapInner'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#EAF1EC]" aria-busy="true" />,
});

interface MapComponentProps {
  presentation?: 'default' | 'dashboard';
  onTileError?: () => void;
  labels?: { loading: string; homePort: string; advisoryArea: string };
  hotspots: Hotspot[];
  selectedHotspot: Hotspot | null;
  onSelectHotspot: (hotspot: Hotspot | null) => void;
  filterType: "pelagic" | "demersal" | "both";
  selectedSpecies: string[];
  hideSidebar?: boolean;
  hideLegend?: boolean;
  
  // Custom Vite props compatibility
  center?: [number, number];
  onMapClick?: (lat: number, lng: number) => void;

  /** Active Region for boundary line and inverted mask */
  activeRegion?: PhilippineRegion | null;
  /** Whether to show regional boundary line and outside masking (default: true) */
  showRegionBoundary?: boolean;
  /** Whether to isolate this region: completely hides other parts of the Philippines with opaque mask and locks camera */
  isolateRegion?: boolean;
  /** Whether to show vessel, home port, and storm hazard markers (default: true) */
  showVesselMarkers?: boolean;
  /** Controlled framing for home-port selection; auto preserves dashboard behavior. */
  viewMode?: MapViewMode;
  boundaryMaskOpacity?: number;
  minHeight?: number;
  /** Limit navigation to a viewport-sized Philippine overview. */
  constrainToPhilippines?: boolean;
  /** Minimum catch probability percentage threshold (25 to 95, default 50). */
  minThreshold?: number;
  onMinThresholdChange?: (value: number) => void;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  hotspots,
  selectedHotspot: candidate,
  onSelectHotspot,
  filterType,
  selectedSpecies,
  hideSidebar = false,
  hideLegend = hideSidebar,
  center,
  onMapClick,
  activeRegion,
  showRegionBoundary = true,
  isolateRegion = false,
  showVesselMarkers = true,
  viewMode = 'auto',
  boundaryMaskOpacity = 0.4,
  minHeight = 450,
  constrainToPhilippines = false,
  presentation = 'default',
  onTileError,
  labels,
  minThreshold: controlledThreshold,
  onMinThresholdChange,
}) => {
  const { userProfile, updateProfile, showToast, manualOverrideHold } = useApp();
  const [customWaypoint, setCustomWaypoint] = useState<{ lat: number; lng: number } | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(10);
  const [internalThreshold, setInternalThreshold] = useState<number>(50);
  const activeThreshold = controlledThreshold ?? internalThreshold;
  const handleThresholdChange = (val: number) => {
    const clamped = Math.min(Math.max(val, 25), 95);
    if (onMinThresholdChange) onMinThresholdChange(clamped);
    else setInternalThreshold(clamped);
  };
  const filteredHotspots = presentation === 'dashboard' && controlledThreshold === undefined
    ? hotspots
    : hotspots.filter((h) => {
        if (h.catchProbability === undefined || !Number.isFinite(h.catchProbability)) return true;
        const pct = h.catchProbability <= 1 ? h.catchProbability * 100 : h.catchProbability;
        return pct + 1e-6 >= activeThreshold;
      });
  const selectedHotspot = candidate && isClientTargetCoordinate(candidate.lat, candidate.lng)
    && filteredHotspots.some((h) => h.id === candidate.id)
    ? candidate
    : null;
  const validHome = isClientCoordinate(userProfile.lat, userProfile.lng);

  if (presentation === 'dashboard') return (
    <BriefingMapInner hotspots={filteredHotspots} selectedHotspot={selectedHotspot} onSelectHotspot={onSelectHotspot}
      filterType="both" selectedSpecies={[]} userProfile={userProfile} customWaypoint={null}
      setCustomWaypoint={setCustomWaypoint} showToast={showToast} manualOverrideHold={manualOverrideHold}
      center={center} activeRegion={activeRegion} showRegionBoundary={showRegionBoundary} showVesselMarkers={false}
      viewMode={viewMode} boundaryMaskOpacity={boundaryMaskOpacity} minHeight={minHeight}
      showPredictionRadius={false} presentation="dashboard" onTileError={onTileError} labels={labels} />
  );

  return (
    <div className={`relative w-full h-full bg-blue-50/30 flex flex-col md:flex-row select-none ${hideSidebar ? 'border-none rounded-none' : 'border border-slate-200 dark:border-teal-950 rounded-[2rem] overflow-hidden shadow-inner'}`}>
      
      {/* ECDIS Nautical Chart Container */}
      <div className="relative flex-1 bg-blue-50/50 w-full h-full" style={{ minHeight }}>
        <MapInner
          hotspots={filteredHotspots}
          selectedHotspot={selectedHotspot}
          onSelectHotspot={onSelectHotspot}
          filterType={filterType}
          selectedSpecies={selectedSpecies}
          userProfile={userProfile}
          customWaypoint={customWaypoint}
          setCustomWaypoint={setCustomWaypoint}
          showToast={showToast}
          manualOverrideHold={manualOverrideHold}
          center={center}
          onMapClick={onMapClick}
          onZoomChange={setCurrentZoom}
          showPredictionRadius={true}
          activeRegion={activeRegion}
          showRegionBoundary={showRegionBoundary}
          isolateRegion={isolateRegion}
          showVesselMarkers={showVesselMarkers}
          viewMode={viewMode}
          boundaryMaskOpacity={boundaryMaskOpacity}
          minHeight={minHeight}
          constrainToPhilippines={constrainToPhilippines}
        />

        {/* Map Model & Species Prediction Color Legend Overlay */}
        {!hideLegend && (
          <div className="absolute top-4 right-4 bg-white/95 dark:bg-[#12211E]/95 backdrop-blur border border-slate-200 dark:border-teal-950 p-3 rounded-2xl shadow-md z-10 text-[10px] space-y-2 max-w-[240px]">
          <div className="flex items-center justify-between">
            <span className="font-black text-gray-400 uppercase tracking-widest block text-[9px]">
              Prediction Map Legend
            </span>
            <span className="text-[8px] font-black text-brand-green bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 uppercase">
              Model score colors
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-teal-950/50 p-2 rounded-xl border border-slate-200/80 dark:border-teal-900/60 space-y-1">
            <label htmlFor="map-legend-threshold-slider" className="flex items-center justify-between font-black text-[9px] text-slate-900 dark:text-white cursor-pointer">
              <span>Min Threshold</span>
              <span className="text-emerald-700 dark:text-emerald-400">≥ {activeThreshold}%</span>
            </label>
            <input
              id="map-legend-threshold-slider"
              type="range"
              min={25}
              max={95}
              step={5}
              value={activeThreshold}
              aria-valuetext={`≥ ${activeThreshold}% minimum model estimate`}
              onChange={(e) => handleThresholdChange(Number(e.target.value))}
              className="w-full accent-emerald-700 cursor-pointer"
            />
            <div className="flex justify-between text-[7.5px] font-bold text-gray-400" aria-hidden="true">
              <span>25%</span>
              <span>50%</span>
              <span>95%</span>
            </div>
          </div>

          <div className="space-y-1.5 font-bold text-gray-700 dark:text-gray-200">
            {(!selectedSpecies || selectedSpecies.length === 0) && (
              <div className="space-y-2 pt-1">
                <div className="space-y-1 bg-slate-50 dark:bg-teal-950/50 p-2 rounded-xl border border-slate-200/80 dark:border-teal-900/60">
                  <div className="flex items-center gap-1.5 font-black text-[9.5px] text-slate-900 dark:text-white">
                    <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-xs" style={{ backgroundColor: GENERAL_PELAGIC_SHADES.medium }} />
                    <span className="truncate">General Pelagic Model</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-[7.5px] font-black text-center pt-0.5">
                    <div className="flex flex-col items-center" title="25-69%">
                      <span className="w-full h-1.5 rounded-xs mb-0.5 shadow-2xs" style={{ backgroundColor: GENERAL_PELAGIC_SHADES.light }} />
                      <span className="text-gray-400">25-69%</span>
                    </div>
                    <div className="flex flex-col items-center" title="70-79%">
                      <span className="w-full h-1.5 rounded-xs mb-0.5 shadow-2xs" style={{ backgroundColor: GENERAL_PELAGIC_SHADES.medium }} />
                      <span className="text-gray-400">70-79%</span>
                    </div>
                    <div className="flex flex-col items-center" title="80-89%">
                      <span className="w-full h-1.5 rounded-xs mb-0.5 shadow-2xs" style={{ backgroundColor: GENERAL_PELAGIC_SHADES.dark }} />
                      <span className="text-gray-400">80-89%</span>
                    </div>
                    <div className="flex flex-col items-center" title="90-100%">
                      <span className="w-full h-1.5 rounded-xs mb-0.5 shadow-2xs" style={{ backgroundColor: GENERAL_PELAGIC_SHADES.deepest }} />
                      <span className="text-gray-400">90-100%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 bg-slate-50 dark:bg-teal-950/50 p-2 rounded-xl border border-slate-200/80 dark:border-teal-900/60">
                  <div className="flex items-center gap-1.5 font-black text-[9.5px] text-slate-900 dark:text-white">
                    <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-xs" style={{ backgroundColor: GENERAL_DEMERSAL_SHADES.medium }} />
                    <span className="truncate">General Demersal Model</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-[7.5px] font-black text-center pt-0.5">
                    <div className="flex flex-col items-center" title="25-69%">
                      <span className="w-full h-1.5 rounded-xs mb-0.5 shadow-2xs" style={{ backgroundColor: GENERAL_DEMERSAL_SHADES.light }} />
                      <span className="text-gray-400">25-69%</span>
                    </div>
                    <div className="flex flex-col items-center" title="70-79%">
                      <span className="w-full h-1.5 rounded-xs mb-0.5 shadow-2xs" style={{ backgroundColor: GENERAL_DEMERSAL_SHADES.medium }} />
                      <span className="text-gray-400">70-79%</span>
                    </div>
                    <div className="flex flex-col items-center" title="80-89%">
                      <span className="w-full h-1.5 rounded-xs mb-0.5 shadow-2xs" style={{ backgroundColor: GENERAL_DEMERSAL_SHADES.dark }} />
                      <span className="text-gray-400">80-89%</span>
                    </div>
                    <div className="flex flex-col items-center" title="90-100%">
                      <span className="w-full h-1.5 rounded-xs mb-0.5 shadow-2xs" style={{ backgroundColor: GENERAL_DEMERSAL_SHADES.deepest }} />
                      <span className="text-gray-400">90-100%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedSpecies && selectedSpecies.length > 0 && (
              <div className="pt-1 space-y-2">
                <span className="text-[8.5px] font-black text-slate-800 dark:text-slate-200 uppercase block tracking-wider">
                  Selected-fish colors (not sightings):
                </span>
                {selectedSpecies.map((spName) => {
                  const cfg = getSpeciesConfig(spName);
                  if (!cfg) return null;
                  return (
                    <div key={spName} className="space-y-1.5 bg-slate-50 dark:bg-teal-950/50 p-2 rounded-xl border border-slate-200/80 dark:border-teal-900/60">
                      <div className="flex items-center gap-1.5 font-black text-[10px] text-slate-900 dark:text-white">
                        <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-xs" style={{ backgroundColor: cfg.color }} />
                        <span className="truncate">{cfg.name}</span>
                      </div>
                      
                      {/* 4-tier probability gradient swatches */}
                      <div className="grid grid-cols-4 gap-1 text-[7.5px] font-black text-center pt-0.5">
                        <div className="flex flex-col items-center" title="25-69% Catch Probability">
                          <span className="w-full h-2 rounded-xs mb-0.5 shadow-2xs" style={{ backgroundColor: cfg.shades.light }} />
                          <span className="text-gray-400">25-69%</span>
                        </div>
                        <div className="flex flex-col items-center" title="70-79% Catch Probability">
                          <span className="w-full h-2 rounded-xs mb-0.5 shadow-2xs" style={{ backgroundColor: cfg.shades.medium }} />
                          <span className="text-gray-400">70-79%</span>
                        </div>
                        <div className="flex flex-col items-center" title="80-89% Catch Probability">
                          <span className="w-full h-2 rounded-xs mb-0.5 shadow-2xs" style={{ backgroundColor: cfg.shades.dark }} />
                          <span className="text-gray-400">80-89%</span>
                        </div>
                        <div className="flex flex-col items-center" title="90-100% Catch Probability">
                          <span className="w-full h-2 rounded-xs mb-0.5 shadow-2xs" style={{ backgroundColor: cfg.shades.deepest }} />
                          <span className="text-gray-400">90-100%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        )}

        {/* Home anchorage status overlay */}
        {userProfile && (
          <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-[#12211E]/90 backdrop-blur border border-slate-200 dark:border-teal-950 px-3.5 py-2.5 rounded-2xl shadow-md max-w-[180px] z-10">
            <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">
              Home Anchorage
            </span>
            <span className="text-xs font-black text-gray-800 dark:text-[#F7FAF9] flex items-center gap-1">
              <Anchor className="w-3.5 h-3.5 text-brand-green shrink-0" />
              {userProfile.port || "None Set"}
            </span>
            <span className="text-[10px] text-gray-500 font-bold block mt-0.5">
              {validHome ? `${userProfile.lat.toFixed(4)}°N, ${userProfile.lng.toFixed(4)}°E` : 'Coordinates unavailable'}
            </span>
          </div>
        )}
      </div>

      {/* Proximity Telemetry & Details sidebar */}
      {!hideSidebar && (
        <div className="w-full md:w-80 bg-white dark:bg-[#12211E] border-t md:border-t-0 md:border-l border-slate-100 dark:border-teal-950 p-6 flex flex-col justify-between z-10">
          <div>
            <h4 className="font-display font-black text-lg text-slate-900 dark:text-[#F7FAF9] border-b border-gray-100 dark:border-teal-950 pb-3 mb-4 flex items-center gap-2">
              <Compass className="w-5.5 h-5.5 text-brand-green" />
              Map reference
            </h4>

            {/* Selected Hotspot Details */}
            {selectedHotspot ? (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                      selectedHotspot.type === "pelagic"
                        ? "bg-brand-green/10 text-brand-green border-brand-green/20 dark:bg-brand-green/20 dark:text-brand-green/80 dark:border-brand-green/30"
                        : "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/40"
                    }`}>
                      {selectedHotspot.type === "pelagic" ? "Surface Water (Pelagic)" : selectedHotspot.type === "demersal" ? "Bottom & Reef (Demersal)" : selectedHotspot.type}
                    </span>
                    <h5 className="font-display font-black text-xl text-slate-900 dark:text-[#F7FAF9] mt-2">
                      {selectedHotspot.name}
                    </h5>
                  </div>
                </div>

                {/* Proximity calculations */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#EEF5F3] dark:bg-teal-950/25 p-3 rounded-2xl border border-teal-50 dark:border-teal-950/40">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">
                      Home-port distance
                    </span>
                    <span className="text-xl font-black text-[#12211E] dark:text-white">
                      {validHome ? `${calculateDistance(userProfile.lat, userProfile.lng, selectedHotspot.lat, selectedHotspot.lng)} km` : 'Unavailable'}
                    </span>
                  </div>
                  <div className="bg-[#EEF5F3] dark:bg-teal-950/25 p-3 rounded-2xl border border-teal-50 dark:border-teal-950/40">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">
                      Compass Bearing
                    </span>
                    <span className="text-xl font-black text-[#12211E] dark:text-white flex items-center gap-1">
                      <Navigation className="w-4 h-4 text-brand-green rotate-45" />
                      {validHome ? calculateBearing(userProfile.lat, userProfile.lng, selectedHotspot.lat, selectedHotspot.lng) : 'Unavailable'}
                    </span>
                  </div>
                </div>

                {/* Coordinates & specs info */}
                <div className="space-y-2 border-t border-gray-100 dark:border-teal-950 pt-3">
                  <div className="flex justify-between text-xs font-bold text-gray-500">
                    <span>GPS Anchor:</span>
                    <span className="text-gray-800 dark:text-white">
                      {selectedHotspot.lat}°N, {selectedHotspot.lng}°E
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-gray-500">
                    <span>Sea Depth:</span>
                    <span className="text-gray-800 dark:text-white">{Number.isFinite(selectedHotspot.depth) ? `${selectedHotspot.depth} meters` : 'Unavailable'}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-gray-500">
                    <span>Target Species:</span>
                    <span className="text-brand-green font-extrabold">{selectedHotspot.species.join(", ") || "Unavailable; no species evidence supplied"}</span>
                  </div>
                </div>
              </div>
            ) : customWaypoint ? (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400">
                    Custom Waypoint
                  </span>
                  <h5 className="font-display font-black text-xl text-slate-900 dark:text-[#F7FAF9] mt-2">
                    Plotted Coordinates
                  </h5>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-amber-50/40 dark:bg-amber-950/10 p-3 rounded-2xl border border-amber-100/30">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">
                      Range
                    </span>
                    <span className="text-xl font-black text-[#12211E] dark:text-white">
                      {validHome ? `${calculateDistance(userProfile.lat, userProfile.lng, customWaypoint.lat, customWaypoint.lng)} km` : 'Unavailable'}
                    </span>
                  </div>
                  <div className="bg-amber-50/40 dark:bg-amber-950/10 p-3 rounded-2xl border border-amber-100/30">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">
                      Bearing
                    </span>
                    <span className="text-xl font-black text-[#12211E] dark:text-white flex items-center gap-1">
                      <Navigation className="w-4 h-4 text-amber-500 rotate-45" />
                      {validHome ? calculateBearing(userProfile.lat, userProfile.lng, customWaypoint.lat, customWaypoint.lng) : 'Unavailable'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 border-t border-gray-100 dark:border-teal-950 pt-3">
                  <div className="flex justify-between text-xs font-bold text-gray-500">
                    <span>Latitude:</span>
                    <span className="text-gray-850 dark:text-white font-extrabold">{customWaypoint.lat}° N</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-gray-500">
                    <span>Longitude:</span>
                    <span className="text-gray-850 dark:text-white font-extrabold">{customWaypoint.lng}° E</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-gray-500">
                    <span>Geofence Status:</span>
                    <span className="text-brand-green font-extrabold flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-brand-green" />
                      Inside display extent; permission unverified
                    </span>
                  </div>
                </div>

                {/* Set as Home Port CTA button */}
                <button
                  onClick={() => {
                    updateProfile({
                      lat: customWaypoint.lat,
                      lng: customWaypoint.lng,
                      port: `Point (${customWaypoint.lat}, ${customWaypoint.lng})`
                    });
                    setCustomWaypoint(null);
                    showToast("Home Port Anchorage updated to waypoints!", "success");
                  }}
                  className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-black text-xs uppercase tracking-widest py-3 rounded-2xl transition shadow-md active:scale-95 cursor-pointer"
                >
                  Set as Home Anchorage
                </button>
              </div>
            ) : (
              <div className="text-center py-12 space-y-3">
                <Info className="w-12 h-12 text-gray-300 dark:text-teal-950 mx-auto animate-bounce" />
                <p className="text-xs text-gray-400 font-bold leading-relaxed max-w-[200px] mx-auto">
                  Tap anywhere inside the Philippine Waters geofence grid or select an active hotspot marker to plot nautical range, coordinates, and bearing telemetry.
                </p>
              </div>
            )}
          </div>

          {/* Map Legend card */}
          <div className="border-t border-gray-100 dark:border-teal-950 pt-4 mt-4 space-y-2.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
              Chart Legend
            </span>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300">
              <span className="w-3 h-3 rounded-full bg-[#00B074] border border-white shrink-0" />
              <span>Surface & Open Water (Pelagic Hotspot)</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300">
              <span className="w-3 h-3 rounded-full bg-[#3B82F6] border border-white shrink-0" />
              <span>Bottom & Reef Fish (Demersal Hotspot)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
