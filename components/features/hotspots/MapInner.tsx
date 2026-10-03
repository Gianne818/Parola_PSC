"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Circle, Rectangle, ZoomControl, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Hotspot, UserProfile, PhilippineRegion } from "../../../types";
import { isWithinPhilippineGeofence } from "../../../utils/spatial";
import { getSpeciesColor, getSpeciesConfig, getHotspotDisplayColor, GENERAL_PELAGIC_COLOR, GENERAL_DEMERSAL_COLOR } from "../../../utils/speciesColors";
import { PHILIPPINE_REGIONS, detectPhilippineRegion, isCoordinateInRegion } from "../../../data/philippineRegions";

import { PREDICTION_RADIUS_KM, PREDICTION_RADIUS_METERS } from "./MapComponent";

// Custom marker icon definitions
const safeHotspotIcon = typeof window !== "undefined" ? L.divIcon({
  className: "custom-hotspot-marker-safe",
  html: `<div style="width: 24px; height: 24px; background-color: rgba(0, 179, 126, 0.35); border-radius: 50%; display: flex; justify-content: center; align-items: center; border: 1px solid rgba(0, 179, 126, 0.5);"><div style="width: 10px; height: 10px; background-color: #00B37E; border-radius: 50%; border: 1.5px solid white;"></div></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
}) : null;

const unsafeHotspotIcon = typeof window !== "undefined" ? L.divIcon({
  className: "custom-hotspot-marker-unsafe",
  html: `<div style="width: 24px; height: 24px; background-color: rgba(239, 68, 68, 0.35); border-radius: 50%; display: flex; justify-content: center; align-items: center; border: 1px solid rgba(239, 68, 68, 0.5);"><div style="width: 10px; height: 10px; background-color: #EF4444; border-radius: 50%; border: 1.5px solid white;"></div></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
}) : null;

const demersalHotspotIcon = typeof window !== "undefined" ? L.divIcon({
  className: "custom-hotspot-marker-demersal",
  html: `<div style="width: 24px; height: 24px; background-color: rgba(59, 130, 246, 0.35); border-radius: 50%; display: flex; justify-content: center; align-items: center; border: 1px solid rgba(59, 130, 246, 0.5);"><div style="width: 10px; height: 10px; background-color: #3B82F6; border-radius: 50%; border: 1.5px solid white;"></div></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
}) : null;

const homePortIcon = typeof window !== "undefined" ? L.divIcon({
  className: "custom-home-port-marker",
  html: `<div style="width: 32px; height: 32px; background-color: rgba(0, 179, 126, 0.15); border-radius: 50%; display: flex; justify-content: center; align-items: center; border: 2px dashed #00B37E;" class="animate-pulse"><div style="width: 14px; height: 14px; background-color: #00B37E; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
}) : null;

const vesselIcon = typeof window !== "undefined" ? L.divIcon({
  className: "custom-vessel-marker",
  html: `
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;">
      <div class="animate-radar-ping" style="position: absolute; width: 40px; height: 40px; border-radius: 50%; border: 2px solid #00B37E; box-sizing: border-box; left: 0; top: 0; pointer-events: none;"></div>
      <div class="animate-pulse" style="position: absolute; width: 24px; height: 24px; border-radius: 50%; border: 1.5px solid #00B37E; background-color: rgba(0, 179, 126, 0.1); left: 8px; top: 8px; pointer-events: none;"></div>
      <div style="position: relative; width: 16px; height: 16px; background-color: #00B37E; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.3); z-index: 10;">
        <svg viewBox="0 0 24 24" width="8" height="8" fill="white" stroke="white"><path d="M12 2L2 22h20L12 2z"/></svg>
      </div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
}) : null;

const customWaypointIcon = typeof window !== "undefined" ? L.divIcon({
  className: "custom-waypoint-marker",
  html: `<div style="width: 28px; height: 28px; background-color: rgba(245, 158, 11, 0.2); border-radius: 50%; display: flex; justify-content: center; align-items: center; border: 2px solid #F59E0B;" class="animate-bounce"><div style="width: 10px; height: 10px; background-color: #F59E0B; border-radius: 50%; border: 1.5px solid white;"></div></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
}) : null;

const selectedLocationPinIcon = typeof window !== "undefined" ? L.divIcon({
  className: "custom-selected-location-pin",
  html: `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 36px; height: 36px;">
      <div class="animate-ping" style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background-color: rgba(16, 185, 129, 0.4); pointer-events: none;"></div>
      <div style="width: 32px; height: 32px; background-color: #10B981; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; items-center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.35); z-index: 10;">
        <div style="width: 10px; height: 10px; background-color: white; border-radius: 50%; margin: auto;"></div>
      </div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
}) : null;

interface MapInnerProps {
  hotspots: Hotspot[];
  selectedHotspot: Hotspot | null;
  onSelectHotspot: (hotspot: Hotspot | null) => void;
  filterType: "pelagic" | "demersal" | "both";
  selectedSpecies: string[];
  userProfile: UserProfile;
  customWaypoint: { lat: number; lng: number } | null;
  setCustomWaypoint: (waypoint: { lat: number; lng: number } | null) => void;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
  manualOverrideHold: boolean;
  
  // Custom props from onboarding / search map
  center?: [number, number];
  onMapClick?: (lat: number, lng: number) => void;

  /** Called whenever the Leaflet map zoom level changes */
  onZoomChange?: (zoom: number) => void;
  /** Whether to show 9 km prediction radius circles on hotspots */
  showPredictionRadius?: boolean;

  /** Active Region for boundary drawing and outside masking */
  activeRegion?: PhilippineRegion | null;
  /** Whether to show regional boundary line and outside masking (default: true) */
  showRegionBoundary?: boolean;
  /** Whether to isolate this region: completely hides other parts of the Philippines with opaque mask and locks camera */
  isolateRegion?: boolean;
  /** Whether to show vessel, home port, and storm hazard markers (default: true, set false on onboarding) */
  showVesselMarkers?: boolean;
}

const isValidLatLng = (lat: number, lng: number): boolean => {
  return typeof lat === "number" && typeof lng === "number" && !isNaN(lat) && !isNaN(lng);
};

// RegionBoundsController component to dynamically fit bounds to active region and lock viewport
function RegionBoundsController({ 
  activeRegion
}: { 
  activeRegion?: PhilippineRegion | null;
  isolateRegion?: boolean;
}) {
  const map = useMap();
  const prevRegionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (activeRegion && activeRegion.bounds) {
      if (prevRegionIdRef.current !== activeRegion.id) {
        prevRegionIdRef.current = activeRegion.id;
        try {
          map.fitBounds(activeRegion.bounds, { padding: [35, 35], maxZoom: 11 });
          map.setMaxBounds([[4.5, 115.5], [21.5, 127.5]]);
          map.setMinZoom(6);
        } catch (e) {
          console.warn("RegionBoundsController fitBounds warning:", e);
        }
      }
    } else if (!activeRegion) {
      map.setMaxBounds([[4.5, 115.5], [21.5, 127.5]]);
      map.setMinZoom(6);
      prevRegionIdRef.current = null;
    }
  }, [activeRegion, map]);

  return null;
}

// MapController component to dynamically pan/zoom map on center coordinate changes
function MapController({ center }: { center?: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center && isValidLatLng(center[0], center[1])) {
      try {
        map.setView(center, Math.max(map.getZoom(), 9));
      } catch (e) {
        console.warn("MapController view update warning:", e);
      }
    }
  }, [center, map]);
  return null;
}

// MapEventsHandler component to handle map click events
function MapEventsHandler({ 
  onMapClick, 
  setCustomWaypoint, 
  onSelectHotspot, 
  showToast 
}: { 
  onMapClick?: (lat: number, lng: number) => void;
  setCustomWaypoint: (waypoint: { lat: number; lng: number } | null) => void;
  onSelectHotspot: (hotspot: Hotspot | null) => void;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}) {
  useMapEvents({
    click(e) {
      if (e.latlng && !isNaN(e.latlng.lat) && !isNaN(e.latlng.lng)) {
        const clickedLat = parseFloat(e.latlng.lat.toFixed(4));
        const clickedLng = parseFloat(e.latlng.lng.toFixed(4));

        if (onMapClick) {
          onMapClick(clickedLat, clickedLng);
          return;
        }

        if (isWithinPhilippineGeofence(clickedLat, clickedLng)) {
          setCustomWaypoint({ lat: clickedLat, lng: clickedLng });
          onSelectHotspot(null); // Clear active hotspot selection to focus on custom waypoint
          showToast(`Plotted Waypoint: ${clickedLat}°N, ${clickedLng}°E`, "info");
        } else {
          showToast("Point is out of Philippine Territorial Waters!", "error");
        }
      }
    },
  });
  return null;
}

// MapResizeHandler component to handle responsive container sizing
function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        try {
          if (map) {
            map.invalidateSize();
          }
        } catch (e) {
          // Ignore unmount warnings
        }
      });
    });

    resizeObserver.observe(container);
    return () => {
      resizeObserver.disconnect();
    };
  }, [map]);
  return null;
}

// ZoomTracker fires the onZoomChange callback whenever the map zoom changes
function ZoomTracker({ onZoomChange }: { onZoomChange?: (zoom: number) => void }) {
  useMapEvents({
    zoomend(e) {
      onZoomChange?.(e.target.getZoom());
    },
  });
  return null;
}

export default function MapInner({
  hotspots,
  selectedHotspot,
  onSelectHotspot,
  filterType,
  selectedSpecies,
  userProfile,
  customWaypoint,
  setCustomWaypoint,
  showToast,
  manualOverrideHold,
  center,
  onMapClick,
  onZoomChange,
  showPredictionRadius = true,
  activeRegion,
  showRegionBoundary = true,
  isolateRegion = false,
  showVesselMarkers = true,
}: MapInnerProps) {
  // Validate and fall back on home port coordinates
  const homeLat = userProfile?.lat ?? 14.0122;
  const homeLng = userProfile?.lng ?? 123.0114;
  
  const centerLat = center?.[0];
  const centerLng = center?.[1];

  // Resolve active region (prop takes precedence, then user profile region, then auto-detected from center / home coordinates)
  const resolvedRegion = useMemo(() => {
    if (activeRegion !== undefined) return activeRegion;
    if (userProfile?.regionId) {
      const found = PHILIPPINE_REGIONS.find((r) => r.id === userProfile.regionId);
      if (found) return found;
    }
    const targetLat = typeof centerLat === "number" && isValidLatLng(centerLat, centerLng as number) ? centerLat : (showVesselMarkers ? homeLat : undefined);
    const targetLng = typeof centerLng === "number" && isValidLatLng(centerLat as number, centerLng) ? centerLng : (showVesselMarkers ? homeLng : undefined);
    if (typeof targetLat === "number" && typeof targetLng === "number" && isValidLatLng(targetLat, targetLng)) {
      return detectPhilippineRegion(targetLat, targetLng, userProfile?.port);
    }
    return null;
  }, [activeRegion, userProfile?.regionId, userProfile?.port, centerLat, centerLng, homeLat, homeLng, showVesselMarkers]);

  // Dynamic initial center and zoom
  const mapCenter: [number, number] = useMemo(() => {
    if (center && isValidLatLng(center[0], center[1])) {
      return center;
    }
    if (isolateRegion && resolvedRegion) {
      return resolvedRegion.center;
    }
    if (showVesselMarkers && isValidLatLng(homeLat, homeLng)) {
      return [homeLat, homeLng];
    }
    // Default: Philippines archipelago center overview
    return [12.8797, 121.7740];
  }, [center, isolateRegion, resolvedRegion, showVesselMarkers, homeLat, homeLng]);

  const initialZoom = useMemo(() => {
    if (center && isValidLatLng(center[0], center[1])) {
      return 10;
    }
    if (isolateRegion && resolvedRegion) {
      return 9;
    }
    if (showVesselMarkers && isValidLatLng(homeLat, homeLng)) {
      return 10;
    }
    return 6;
  }, [center, isolateRegion, resolvedRegion, showVesselMarkers, homeLat, homeLng]);

  // Strict bounds: constrain view to the Philippine archipelago
  const maxBounds: L.LatLngBoundsLiteral = useMemo(() => {
    return [[4.5, 115.5], [21.5, 127.5]];
  }, []);

  const minZoom = 6;

  // Sanitize and filter hotspots (memoized: was re-filtered on every parent render)
  const filteredHotspots = useMemo(() => (hotspots || []).filter((spot) => {
    const lat = spot.lat ?? spot.position?.[0];
    const lng = spot.lng ?? spot.position?.[1];
    
    if (!isValidLatLng(lat, lng)) return false;

    // Region Filter: Restrict to active region if showRegionBoundary is true
    if (resolvedRegion && showRegionBoundary) {
      if (!isCoordinateInRegion(lat, lng, resolvedRegion.id)) {
        return false;
      }
    }

    // Type Filter
    const type = spot.type || (spot.group === "pelagic" ? "pelagic" : "demersal");
    if (filterType && filterType !== "both" && type !== filterType) {
      return false;
    }

    // Species Filter
    const species = spot.species || [spot.family || ""];
    if (selectedSpecies && selectedSpecies.length > 0) {
      const matchesSpecies = species.some((s: string) => {
        return selectedSpecies.some((sel: string) => {
          if (s === sel) return true;
          const selConf = getSpeciesConfig(sel);
          const sConf = getSpeciesConfig(s);
          if (selConf && sConf && selConf.family === sConf.family) return true;
          if (selConf && (s.toLowerCase().includes(selConf.family.toLowerCase()) || selConf.family.toLowerCase().includes(s.toLowerCase()))) return true;
          if (s.toLowerCase().includes(sel.toLowerCase()) || sel.toLowerCase().includes(s.toLowerCase())) return true;
          const selTokens = sel.toLowerCase().split(/[\s\/()]+/);
          const spotText = s.toLowerCase();
          return selTokens.some(token => token.length > 2 && spotText.includes(token));
        });
      });
      if (!matchesSpecies) return false;
    }

    return true;
  }), [hotspots, filterType, selectedSpecies, resolvedRegion, showRegionBoundary]);

  return (
    <div className="w-full h-full min-h-[400px] absolute inset-0 z-0">
      <MapContainer
        center={mapCenter}
        zoom={initialZoom}
        zoomControl={false}
        scrollWheelZoom={true}
        className="w-full h-full"
        maxBounds={maxBounds}
        maxBoundsViscosity={1.0}
        minZoom={minZoom}
        id="leaflet-map-element"
      >
        <ZoomControl position="bottomright" />
        <MapController center={center} />
        <RegionBoundsController 
          activeRegion={showRegionBoundary ? resolvedRegion : null} 
          isolateRegion={isolateRegion}
        />
        <MapEventsHandler 
          onMapClick={onMapClick} 
          setCustomWaypoint={setCustomWaypoint} 
          onSelectHotspot={onSelectHotspot}
          showToast={showToast}
        />
        <MapResizeHandler />
        <ZoomTracker onZoomChange={onZoomChange} />
        
        {/* OpenStreetMap Standard Basemap (Clean, Free, Zero Watermark) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* REGIONAL SCOPE: INVERTED MASK (When isolateRegion is true, opacity is 1.0 to make other regions NOT visible) */}
        {resolvedRegion && showRegionBoundary && (
          <Polygon
            positions={[
              // Outer world ring
              [
                [85, -180],
                [85, 180],
                [-85, 180],
                [-85, -180]
              ],
              // Cutout hole for active region
              resolvedRegion.coordinates
            ]}
            pathOptions={{
              color: "#051310",
              fillColor: "#051310",
              fillOpacity: 0.40,
              weight: 0,
              interactive: false
            }}
          />
        )}

        {/* REGIONAL BOUNDARY LINE (Emerald high-tech dashed border outlining licensed territory) */}
        {resolvedRegion && showRegionBoundary && (
          <Polygon
            positions={resolvedRegion.coordinates}
            pathOptions={{
              color: "#00B37E",
              fillColor: "#00B37E",
              fillOpacity: 0.04,
              weight: 2.5,
              dashArray: "6, 6",
              interactive: false
            }}
          />
        )}

        {/* Geofence Dashed Borders (border-emerald-600/20) - visible when exploring archipelago */}
        {!isolateRegion && (
          <Rectangle
            bounds={[[4.5, 116.0], [21.5, 127.0]]}
            pathOptions={{
              color: "#059669",
              fill: false,
              weight: 1.5,
              opacity: 0.15,
              dashArray: "4, 4"
            }}
          />
        )}

        {/* Home Port Anchorage Marker */}
        {showVesselMarkers && homePortIcon && isValidLatLng(homeLat, homeLng) && (
          <Marker position={[homeLat, homeLng]} icon={homePortIcon}>
            <Popup>
              <div className="font-sans text-brand-black p-1">
                <div className="font-black text-xs uppercase tracking-wide">
                  🏠 {userProfile?.port || "Home Port Anchorage"}
                </div>
                <div className="text-[10px] text-gray-500 font-bold mt-1">
                  Coordinates: {homeLat.toFixed(4)}°N, {homeLng.toFixed(4)}°E
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Green Vessel Marker with animated radar pulses */}
        {showVesselMarkers && vesselIcon && isValidLatLng(homeLat, homeLng) && (
          <Marker position={[homeLat + 0.008, homeLng + 0.006]} icon={vesselIcon}>
            <Popup>
              <div className="font-sans text-brand-black p-1">
                <div className="font-black text-xs uppercase tracking-wide text-brand-green">
                  ⛵ {userProfile?.vesselName || "My Vessel"}
                </div>
                <div className="text-[10px] text-gray-500 font-bold mt-1">
                  Status: Active Fishing Voyage
                </div>
                <div className="text-[9px] text-gray-400 mt-0.5">
                  Coordinates: {(homeLat + 0.008).toFixed(4)}°N, {(homeLng + 0.006).toFixed(4)}°E
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* PAGASA Gale Warning / Extreme Weather Hazard Zone */}
        {showVesselMarkers && manualOverrideHold && isValidLatLng(homeLat, homeLng) && (
          <Circle
            center={[homeLat + 0.02, homeLng - 0.03]}
            radius={4000}
            pathOptions={{
              color: "#D32F2F",
              fillColor: "#D32F2F",
              fillOpacity: 0.15,
              weight: 2.5,
              dashArray: "6, 6"
            }}
          >
            <Popup>
              <div className="font-sans text-brand-red p-1 max-w-[180px]">
                <div className="font-black text-xs uppercase tracking-wide">
                  ⚠️ PAGASA GALE WARNING
                </div>
                <div className="text-[10px] text-gray-600 font-bold mt-1 leading-relaxed">
                  Severe wind gusts and unsafe swells {"(>2.0m)"} detected in this coordinates quadrant.
                </div>
              </div>
            </Popup>
          </Circle>
        )}

        {/* Active Selected Location Pin Marker */}
        {selectedLocationPinIcon && center && isValidLatLng(center[0], center[1]) && (
          <Marker position={[center[0], center[1]]} icon={selectedLocationPinIcon}>
            <Popup>
              <div className="font-sans text-brand-black p-1">
                <div className="font-black text-xs uppercase tracking-wider text-[#10B981]">
                  📍 Selected Location Point
                </div>
                <div className="text-[10px] text-gray-600 font-bold mt-1">
                  {center[0].toFixed(4)}° N, {center[1].toFixed(4)}° E
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Custom Clicked Waypoint Marker */}
        {customWaypointIcon && customWaypoint && isValidLatLng(customWaypoint.lat, customWaypoint.lng) && (
          <Marker position={[customWaypoint.lat, customWaypoint.lng]} icon={customWaypointIcon}>
            <Popup>
              <div className="font-sans text-brand-black p-1">
                <div className="font-black text-xs uppercase tracking-wider text-amber-500">
                  📍 Custom Plotted Waypoint
                </div>
                <div className="text-[10px] text-gray-500 font-bold mt-1">
                  {customWaypoint.lat.toFixed(4)}°N, {customWaypoint.lng.toFixed(4)}°E
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Active Hotspot Pin Markers (single 9 km prediction circle per hotspot) */}
        {filteredHotspots.map((spot) => {
          const lat = spot.lat ?? spot.position?.[0];
          const lng = spot.lng ?? spot.position?.[1];
          const type = spot.type || (spot.group === "pelagic" ? "pelagic" : "demersal");
          const name = spot.name || spot.label || "Unknown Spot";
          const species = spot.species || [spot.family || ""];
          const depth = spot.depth || 50;

          const isUnsafe = manualOverrideHold || spot.isUnsafe;
          const isSelected = selectedHotspot?.id === spot.id;

          // Resolve display color using catch probability gradient shade
          const speciesColor = getHotspotDisplayColor(type, selectedSpecies, species, spot.catchProbability);

          const markerIcon = isUnsafe
            ? unsafeHotspotIcon
            : typeof window !== "undefined"
              ? L.divIcon({
                  className: `custom-hotspot-marker-${isSelected ? "active" : "normal"}`,
                  html: `<div style="width: ${isSelected ? 28 : 24}px; height: ${isSelected ? 28 : 24}px; background-color: ${speciesColor}33; border-radius: 50%; display: flex; justify-content: center; align-items: center; border: ${isSelected ? 2.5 : 1.5}px solid ${speciesColor}; ${isSelected ? `box-shadow: 0 0 14px ${speciesColor};` : ''}"><div style="width: ${isSelected ? 12 : 10}px; height: ${isSelected ? 12 : 10}px; background-color: ${speciesColor}; border-radius: 50%; border: 1.5px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.35);"></div></div>`,
                  iconSize: [isSelected ? 28 : 24, isSelected ? 28 : 24],
                  iconAnchor: [isSelected ? 14 : 12, isSelected ? 14 : 12],
                })
              : null;

          if (!markerIcon) return null;

          return (
            <React.Fragment key={`${spot.id}-${speciesColor}-${isSelected ? "sel" : "nor"}`}>
              {/* Single 9 km prediction radius circle (was double-drawn). Leaflet Circle uses real-world meters so it auto-scales with zoom. */}
              {showPredictionRadius && (
              <Circle
                center={[lat, lng]}
                radius={PREDICTION_RADIUS_METERS}
                pathOptions={{
                  color: speciesColor,
                  fillColor: speciesColor,
                  fillOpacity: isSelected ? 0.22 : 0.07,
                  weight: isSelected ? 2 : 1,
                  dashArray: isSelected ? "4, 4" : "2, 4",
                }}
              />
              )}
              <Marker
                position={[lat, lng]}
                icon={markerIcon}
                eventHandlers={{
                  click: () => {
                    onSelectHotspot(spot);
                    setCustomWaypoint(null); // Clear custom waypoint to prioritize active hotspot
                  },
                }}
              >
                <Popup>
                  <div className="font-sans text-brand-black p-1 space-y-1.5 max-w-[210px]">
                    <div className="flex items-center gap-1.5 font-black text-sm">
                      <span className="text-base">{spot.icon || "🐟"}</span>
                      <span>{name}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      <div className={`text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full border inline-block ${
                        isUnsafe 
                          ? "bg-rose-50 text-rose-600 border-rose-100"
                          : type === "pelagic"
                            ? "bg-brand-green/10 text-brand-green border-brand-green/20"
                            : "bg-blue-50 text-blue-600 border-blue-100"
                      }`}>
                        {isUnsafe ? "UNSAFE BEACON" : type}
                      </div>
                      <span className="text-[9px] font-bold text-gray-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        📍 9 km Prediction Radius
                      </span>
                    </div>
                  <div className="text-[10px] font-bold text-gray-500 space-y-1">
                    {spot.catchProbability !== undefined && (
                      <div 
                        className="font-extrabold text-xs px-2 py-1 rounded-lg border flex items-center justify-between shadow-xs"
                        style={{
                          backgroundColor: `${speciesColor}18`,
                          borderColor: `${speciesColor}60`,
                          color: speciesColor
                        }}
                      >
                        <span>⚡ {(spot.catchProbability <= 1 ? spot.catchProbability * 100 : spot.catchProbability).toFixed(0)}% LightGBM Catch Probability</span>
                      </div>
                    )}
                    {spot.distanceKm !== undefined && (
                      <div>Haversine Distance: <span className="text-slate-900 font-extrabold">{spot.distanceKm.toFixed(1)} km ({spot.compassBearing})</span></div>
                    )}
                    {spot.distanceKm !== undefined && spot.catchProbability !== undefined && spot.distanceKm > 0 && (
                      <div>Yield Efficiency Ratio: <span className="text-amber-700 font-extrabold">{((spot.catchProbability <= 1 ? spot.catchProbability * 100 : spot.catchProbability) / spot.distanceKm).toFixed(2)} %/km</span></div>
                    )}
                    {spot.sst !== undefined && (
                      <div>Sea Temp (SST): <span className="text-amber-600 font-extrabold">{spot.sst}°C</span></div>
                    )}
                    <div>Depth: <span className="text-brand-black font-extrabold">{depth}m</span></div>
                    <div>Species: <span className="text-brand-green font-extrabold">{species.join(", ")}</span></div>
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium leading-normal pt-1 border-t border-gray-100">
                    {spot.lastUpdated || "Optimal oceanographic conditions observed."}
                  </p>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
}
