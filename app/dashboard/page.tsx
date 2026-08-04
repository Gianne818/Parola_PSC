"use client";

import React, { useState, useEffect } from "react";
import { AuthLayout } from "../../components/layouts/AuthLayout";
import { useApp } from "../../context/AppContext";
import { useTranslation } from "../../hooks/use-translation";
import { MapComponent } from "../../components/features/hotspots/MapComponent";
import { Modal } from "../../components/ui/Modal";
import { TierProgressBar } from "../../components/ui/TierProgressBar";
import { calculateDistance, calculateBearing } from "../../utils/spatial";
import { calculateHotspotMetrics, calculateEfficiencyRatio } from "../../utils/hotspotCalculator";
import { fetchHotspots } from "../../services/supabaseHotspotService";
import { CATEGORIZED_SPECIES, getSpeciesConfig, getSpeciesColor, getHotspotDisplayColor, GENERAL_PELAGIC_COLOR, GENERAL_DEMERSAL_COLOR } from "../../utils/speciesColors";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Compass,
  List,
  Map as MapIcon,
  Globe,
  Sliders,
  Eye,
  EyeOff,
  Check,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  Thermometer,
  Wind,
  Waves,
  RefreshCw,
  Volume2,
  VolumeX,
  Siren,
  ThumbsUp,
  ThumbsDown,
  Meh,
  GripVertical,
  Fish,
  Anchor,
  HelpCircle,
  Info,
  Lightbulb,
  X
} from "lucide-react";

const SPECIES_FAMILIES = [
  { id: "pelagic", label: "Surface & Open Water", local: "Pelagic Species" },
  { id: "demersal", label: "Bottom & Reef Fish", local: "Demersal Species" }
];

export default function DashboardPage() {
  const {
    userProfile,
    weather,
    manualOverrideHold,
    setManualOverrideHold,
    fuelPools,
    hotspots,
    addFuelCommit,
    refreshWeather,
    language,
    changeLanguage,
    showToast
  } = useApp();

  const { t } = useTranslation(language);

  // View States
  const [activeTab, setActiveTab] = useState<"pelagic" | "demersal" | "both">("both");
  const [mapView, setMapView] = useState(true);
  const [submittedFeedback, setSubmittedFeedback] = useState<string | null>(null);

  // General Zone Toggles
  const [showGeneralPelagic, setShowGeneralPelagic] = useState(true);
  const [showGeneralDemersal, setShowGeneralDemersal] = useState(true);

  // Selected Family & Species Filters
  const [checkedFamilies, setCheckedFamilies] = useState<string[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  const [selectedHotspot, setSelectedHotspot] = useState<any>(null);
  const [searchQuery] = useState("");
  const [sortBy, setSortBy] = useState<'distance' | 'probability' | 'ratio'>('distance');

  // Collapsible Fish Category States (defaulted to collapsed for compact card layout)
  const [isPelagicExpanded, setIsPelagicExpanded] = useState<boolean>(false);
  const [isDemersalExpanded, setIsDemersalExpanded] = useState<boolean>(false);

  // SOS States
  const [isSosActive, setIsSosActive] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(5);
  const [sosTransponding, setSosTransponding] = useState(false);

  // Fuel Modal State
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [fuelCommitLiters, setFuelCommitLiters] = useState(100);

  // Contextual Guidance & Tooltip States
  const [showOnboardingHint, setShowOnboardingHint] = useState<boolean>(true);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Municipal Advisor Card Resizing State (Enlarged default width for clarity)
  const [advisorWidth, setAdvisorWidth] = useState<number>(600);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const minAdvisorWidth = 450;
  const maxAdvisorWidth = 880;

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startWidth = advisorWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = startX - moveEvent.clientX;
      const newWidth = Math.min(
        maxAdvisorWidth,
        Math.max(minAdvisorWidth, startWidth + deltaX)
      );
      setAdvisorWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStartResize = (e: React.TouchEvent) => {
    setIsResizing(true);
    const startX = e.touches[0].clientX;
    const startWidth = advisorWidth;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (moveEvent.touches.length > 0) {
        const deltaX = startX - moveEvent.touches[0].clientX;
        const newWidth = Math.min(
          maxAdvisorWidth,
          Math.max(minAdvisorWidth, startWidth + deltaX)
        );
        setAdvisorWidth(newWidth);
      }
    };

    const handleTouchEnd = () => {
      setIsResizing(false);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };

    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);
  };

  // Real-time calculated safety threshold
  const windKnots = weather.windSpeed / 1.852;
  const isCalculatedUnsafe =
    weather.stormSignal > 0 || windKnots >= 20 || weather.waveHeight >= 2.0;

  // Combine calculated safety status with manual override caution hold
  const isSafetyHoldActive = isCalculatedUnsafe || manualOverrideHold;

  // SOS Countdown Timer Logic
  useEffect(() => {
    let timer: any;
    if (isSosActive && sosCountdown > 0) {
      timer = setTimeout(() => {
        setSosCountdown(sosCountdown - 1);
      }, 1000);
    } else if (isSosActive && sosCountdown === 0) {
      setTimeout(() => {
        setSosTransponding(true);
        showToast("Emergency SOS broadcast transmitted successfully!", "success");
      }, 0);
    }
    return () => clearTimeout(timer);
  }, [isSosActive, sosCountdown, showToast]);

  const handleTriggerSos = () => {
    setIsSosActive(true);
    setSosCountdown(5);
    setSosTransponding(false);
    showToast("SOS countdown activated! Keep phone stable.", "info");
  };

  const handleCancelSos = () => {
    setIsSosActive(false);
    setSosCountdown(5);
    setSosTransponding(false);
    showToast("SOS distress broadcast cancelled.", "info");
  };

  const handleFeedback = (level: string) => {
    setSubmittedFeedback(level === "1" ? "High" : level === "2" ? "Medium" : "Low");
    setTimeout(() => {
      setSubmittedFeedback(null);
    }, 3500);
  };

  const toggleFamilyCheckbox = (familyId: string) => {
    setCheckedFamilies((prev) =>
      prev.includes(familyId)
        ? prev.filter((id) => id !== familyId)
        : [...prev, familyId]
    );
  };

  const allSpeciesList = Array.from(new Set(hotspots.flatMap((h) => h.species)));

  const [speciesHotspots, setSpeciesHotspots] = useState<any[] | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadSpeciesData() {
      if (selectedSpecies.length > 0) {
        try {
          const res = await fetchHotspots(userProfile.lat, userProfile.lng, selectedSpecies);
          if (isMounted && res && res.length > 0) {
            setSpeciesHotspots(res);
            return;
          }
        } catch (err) {
          console.warn("Error loading species hotspots:", err);
        }
      }
      if (isMounted) setSpeciesHotspots(null);
    }
    loadSpeciesData();
    return () => { isMounted = false; };
  }, [selectedSpecies, userProfile.lat, userProfile.lng]);

  const handleSpeciesToggle = (species: string) => {
    if (selectedSpecies.includes(species)) {
      setSelectedSpecies(selectedSpecies.filter((s) => s !== species));
    } else {
      if (selectedSpecies.length >= 3) {
        showToast("Maximum of 3 target species can be selected at once.", "info");
        return;
      }
      setSelectedSpecies([...selectedSpecies, species]);
    }
  };

  // Process and sort hotspot distance & catch efficiency data
  const rawHotspotData = speciesHotspots || hotspots;
  const processedHotspots = rawHotspotData.map((spot) => {
    const lat = spot.lat ?? (spot as any).position?.[0] ?? 0;
    const lng = spot.lng ?? (spot as any).position?.[1] ?? 0;
    const dist = calculateDistance(userProfile.lat, userProfile.lng, lat, lng);
    const brng = calculateBearing(userProfile.lat, userProfile.lng, lat, lng);
    
    // Catch probability normalized to 0 - 100 percentage
    let catchProbPercent = 75;
    if (spot.catchProbability !== undefined && spot.catchProbability !== null) {
      catchProbPercent = spot.catchProbability <= 1.0 
        ? Math.round(spot.catchProbability * 100) 
        : Math.min(100, Math.round(spot.catchProbability));
    } else {
      const pseudoScore = Math.abs(Math.sin(lat * 10 + lng * 5));
      catchProbPercent = Math.round(65 + pseudoScore * 30);
    }

    const efficiencyRatio = calculateEfficiencyRatio(catchProbPercent, dist);

    return {
      ...spot,
      lat,
      lng,
      distance: `${dist} km`,
      bearing: brng,
      distValue: dist,
      catchProbPercent,
      efficiencyRatio
    };
  });

  const sortedHotspots = [...processedHotspots].sort((a, b) => {
    if (sortBy === 'probability') return b.catchProbPercent - a.catchProbPercent;
    if (sortBy === 'ratio') return b.efficiencyRatio - a.efficiencyRatio;
    return a.distValue - b.distValue; // default 'distance' ascending
  });

  const filteredHotspots = sortedHotspots.filter((spot) => {
    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      const nameMatch = spot.name.toLowerCase().includes(term);
      const speciesMatch = (spot.species || []).some((s: string) => s.toLowerCase().includes(term));
      if (!nameMatch && !speciesMatch) return false;
    }

    const spotType = spot.type || "pelagic";

    // 1. Top Navigation Tab Filter: Must match active tab (unless activeTab === "both")
    if (activeTab !== "both" && spotType !== activeTab) return false;

    // Determine if species filters exist for this spot's category
    const categorySpeciesList = spotType === "pelagic"
      ? CATEGORIZED_SPECIES.pelagic.map((s) => s.name)
      : CATEGORIZED_SPECIES.demersal.map((s) => s.name);

    const selectedCategorySpecies = selectedSpecies.filter((sel) =>
      categorySpeciesList.some((catSp) => catSp.toLowerCase() === sel.toLowerCase())
    );

    if (selectedCategorySpecies.length > 0) {
      const matchesSpecies = (spot.species || []).some((s: string) =>
        selectedCategorySpecies.some((sel) => {
          const config = getSpeciesConfig(sel);
          const selLower = sel.toLowerCase();
          const sLower = s.toLowerCase();
          if (config) {
            return (
              sLower.includes(config.name.toLowerCase()) ||
              sLower.includes(config.family.toLowerCase()) ||
              config.name.toLowerCase().includes(sLower) ||
              config.family.toLowerCase().includes(sLower)
            );
          }
          return sLower.includes(selLower) || selLower.includes(sLower);
        })
      );
      if (!matchesSpecies) return false;
    } else {
      // No species selected for this category -> Display General EOG Satellite Boat Detection predictions ONLY if General Model Run is ON
      if (spotType === "pelagic" && !showGeneralPelagic) return false;
      if (spotType === "demersal" && !showGeneralDemersal) return false;
    }

    return true;
  });

  const mapHotspots = filteredHotspots.map((spot) => ({
    ...spot,
    isUnsafe: isSafetyHoldActive
  }));

  const labelSailing = isSafetyHoldActive ? t("holdSail") : t("favorableSail");
  const activePool = fuelPools.find((p) => p.id === selectedPoolId);

  return (
    <AuthLayout fluid={true}>
      <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-5 items-stretch h-full w-full p-4 lg:p-5 min-h-0 bg-white">

        {/* ================= LEFT COLUMN: MAP / LIST VIEW AREA ================= */}
        <div className="flex-1 w-full min-w-0 flex flex-col gap-4 h-full relative">

          {/* Floating View Toolbar (overlay on top of the left column) */}
          <div className="absolute top-4 left-4 z-[1000] flex items-center gap-3">
            <div className="bg-white p-1 rounded-2xl border border-gray-200/80 shadow-md flex gap-1">
              <button
                onClick={() => setMapView(true)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${mapView
                  ? "bg-[#00B074] text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                <MapIcon className="w-4 h-4" />
                <span>MAP VIEW</span>
              </button>
              <button
                onClick={() => setMapView(false)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${!mapView
                  ? "bg-[#00B074] text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                <List className="w-4 h-4" />
                <span>LIST VIEW</span>
              </button>
            </div>
          </div>

            {/* Map Canvas / Grid List - Strictly match height */}
            <div className="w-full flex-1 h-full min-h-0 relative">
              {mapView ? (
                <div className="h-full w-full rounded-3xl overflow-hidden border border-gray-200 shadow-md bg-white relative">
                  <MapComponent
                    hotspots={mapHotspots}
                    selectedHotspot={selectedHotspot}
                    onSelectHotspot={setSelectedHotspot}
                    filterType={activeTab}
                    selectedSpecies={selectedSpecies}
                    hideSidebar={true}
                  />
                </div>
              ) : (
                <div className="h-full bg-white border border-gray-200 p-6 pt-20 rounded-3xl shadow-md space-y-4 overflow-y-auto">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-2">
                    <div>
                      <h3 className="text-sm font-display font-black text-slate-900 uppercase tracking-wide">
                        Active Hotspot Coordinates
                      </h3>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                        Showing {filteredHotspots.length} highly localized municipal marine grids.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider mr-1">SORT:</span>
                      <button
                        type="button"
                        onClick={() => setSortBy('distance')}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase transition cursor-pointer ${
                          sortBy === 'distance'
                            ? 'bg-[#00B074] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        NEAREST (HAVERSINE)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSortBy('probability')}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase transition cursor-pointer ${
                          sortBy === 'probability'
                            ? 'bg-[#00B074] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        CATCH PROB %
                      </button>
                      <button
                        type="button"
                        onClick={() => setSortBy('ratio')}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase transition cursor-pointer ${
                          sortBy === 'ratio'
                            ? 'bg-[#00B074] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        EFFICIENCY (%/KM)
                      </button>
                    </div>
                  </div>

                  {filteredHotspots.length === 0 ? (
                    <div className="text-center py-16 space-y-2">
                      <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                      <h4 className="font-display font-black uppercase text-xs text-slate-800">
                        No Hotspots Match Filters
                      </h4>
                      <p className="text-[10px] text-gray-400 max-w-sm mx-auto font-medium">
                        Try enabling General categories or clearing active species filters.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredHotspots.map((spot: any) => {
                        const itemColor = getHotspotDisplayColor(spot.type || "pelagic", selectedSpecies, spot.species || [], spot.catchProbability);
                        return (
                          <div
                            key={spot.id}
                            className={`bg-white p-4 rounded-2xl border transition-all flex flex-col justify-between shadow-sm relative ${isSafetyHoldActive
                              ? "hover:border-rose-300 border-gray-200"
                              : "hover:border-slate-300 border-gray-200"
                              }`}
                            style={{ borderLeftWidth: "4px", borderLeftColor: itemColor }}
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5 justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-lg leading-none">
                                    {(spot as any).icon || "🐟"}
                                  </span>
                                  <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                                    {spot.name}
                                  </span>
                                </div>
                                {spot.catchProbPercent !== undefined && (
                                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                    {spot.catchProbPercent}% PROB
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                <span className="inline-block text-[9px] font-black text-[#00B074] bg-emerald-50 px-2 py-0.5 rounded uppercase border border-emerald-100 tracking-wider">
                                  DEPTH: {spot.depth}M
                                </span>
                                {spot.efficiencyRatio !== undefined && (
                                  <span className="inline-block text-[9px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded uppercase border border-amber-200 tracking-wider">
                                    RATIO: {spot.efficiencyRatio} %/km
                                  </span>
                                )}
                                {spot.catchProbability !== undefined && (
                                  <span
                                    className="inline-block text-[9px] font-black px-2 py-0.5 rounded uppercase border tracking-wider"
                                    style={{
                                      backgroundColor: `${itemColor}15`,
                                      borderColor: `${itemColor}50`,
                                      color: itemColor
                                    }}
                                  >
                                    ⚡ {(spot.catchProbability * (spot.catchProbability <= 1 ? 100 : 1)).toFixed(0)}% Catch Prob
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-500 font-medium leading-relaxed pt-1">
                                {(spot as any).desc || `Target species group: ${(spot.species || []).join(", ")}`}
                              </p>
                            </div>

                            <div className="flex items-center justify-between border-t border-gray-100 pt-2.5 mt-3 text-[10px] font-bold">
                              <span className="text-gray-400">BEARING: {spot.bearing}</span>
                              <span
                                className={`font-black ${isSafetyHoldActive ? "text-rose-500" : "text-[#00B074]"}`}
                              >
                                {spot.distance}
                              </span>
                            </div>

                            <div className="absolute top-4 right-4">
                              <span
                                className="w-3 h-3 rounded-full block shadow-xs ring-2 ring-white"
                                style={{ backgroundColor: isSafetyHoldActive ? "#F43F5E" : itemColor }}
                                title={`Catch Probability Color: ${itemColor}`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ================= RIGHT COLUMN: MUNICIPAL ADVISOR PANEL ================= */}
          <div
            style={{ width: `${advisorWidth}px` }}
            className={`w-full max-w-full lg:max-w-none shrink-0 bg-white border border-gray-200 rounded-3xl shadow-md p-5 sm:p-6 flex flex-col justify-between space-y-5 overflow-y-auto h-full relative transition-shadow ${
              isResizing ? "shadow-2xl border-[#00B074]/60 ring-2 ring-[#00B074]/20 select-none" : ""
            }`}
          >
            {/* Left Edge Drag Handle to Resize Card Width to the Left */}
            <div
              onMouseDown={handleMouseDownResize}
              onTouchStart={handleTouchStartResize}
              title="Click and drag left edge to expand Municipal Advisor"
              className="hidden lg:flex absolute left-0 top-0 bottom-0 w-4 -ml-2 cursor-col-resize z-50 items-center justify-center group select-none"
            >
              <div
                className={`w-1.5 h-20 rounded-full transition-all flex flex-col items-center justify-center gap-1 ${
                  isResizing
                    ? "bg-[#00B074] scale-y-110 shadow-md"
                    : "bg-gray-300 group-hover:bg-[#00B074] group-hover:scale-y-105"
                }`}
              >
                <div className="w-0.5 h-0.5 rounded-full bg-white" />
                <div className="w-0.5 h-0.5 rounded-full bg-white" />
                <div className="w-0.5 h-0.5 rounded-full bg-white" />
              </div>
            </div>

            <div className="space-y-6">
              {/* Header with Quick Guide & Language Toggle */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition cursor-pointer shrink-0">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
                      <Compass className="w-4 h-4 text-[#00B074]" />
                    </div>
                    <div>
                      <h2 className="font-display font-black text-sm uppercase tracking-wider text-slate-900 leading-none">
                        MUNICIPAL ADVISOR
                      </h2>
                      <span className="text-[10px] text-gray-400 font-bold block mt-0.5">
                        Local Maritime Telemetry & Hotspot Guidance
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowOnboardingHint(!showOnboardingHint)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition shadow-xs cursor-pointer ${
                      showOnboardingHint
                        ? "bg-emerald-50 border-emerald-200 text-[#00B074]"
                        : "bg-white border-gray-200 text-gray-500 hover:text-slate-800"
                    }`}
                    title="Toggle Dashboard Quick Guide"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">GUIDE</span>
                  </button>

                  <button
                    onClick={() => changeLanguage(language === "en" ? "tl" : "en")}
                    className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-full text-[10px] font-black text-slate-800 transition shadow-xs cursor-pointer shrink-0 hover:bg-slate-50"
                  >
                    <Globe className="w-3.5 h-3.5 text-[#00B074]" />
                    <span>{language === "en" ? "ENGLISH" : "FILIPINO"}</span>
                  </button>
                </div>
              </div>

              {/* Quick Onboarding Banner for Fishermen / First-Time Users */}
              {showOnboardingHint && (
                <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-emerald-50/90 border border-emerald-200/80 rounded-2xl p-4 relative space-y-2.5 shadow-xs">
                  <button
                    onClick={() => setShowOnboardingHint(false)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-slate-700 transition cursor-pointer"
                    title="Dismiss guide"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="p-1 bg-[#00B074] text-white rounded-lg">
                      <Lightbulb className="w-3.5 h-3.5" />
                    </span>
                    <h4 className="font-display font-black text-xs uppercase tracking-wider text-slate-900">
                      Quick Guide for Fisherfolk / Gabay sa Pagpalaot
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] font-medium text-slate-700">
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100/60 space-y-1">
                      <span className="font-bold text-[#00B074] block">1. Station Status</span>
                      <p className="text-[10px] text-gray-500 leading-tight">
                        Check your localized home anchorage coordinates and active weather telemetry.
                      </p>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100/60 space-y-1">
                      <span className="font-bold text-[#00B074] block">2. Find Fish</span>
                      <p className="text-[10px] text-gray-500 leading-tight">
                        Filter by Surface Fish (Pelagic) or Bottom Fish (Demersal) to locate active spots.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= SECTION 1: STATION & MARINE SAFETY STATUS ================= */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-display font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Anchor className="w-3.5 h-3.5 text-[#00B074]" />
                    STATION & SEA SAFETY STATUS
                  </h3>
                  <button
                    onClick={() =>
                      setActiveTooltip(
                        activeTooltip === "station" ? null : "station"
                      )
                    }
                    className="text-gray-400 hover:text-slate-700 transition"
                    title="Learn about station status"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>

                {activeTooltip === "station" && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-600 font-medium">
                    💡 **Station Info**: Shows your home port anchorage coordinates and real-time telemetry updates.
                  </div>
                )}

                {/* Base Reference Station Card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between shadow-xs hover:border-emerald-200 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        HOME ANCHORAGE
                      </span>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[#00B074]">
                        STATION ONLINE
                      </span>
                    </div>
                    <h4 className="text-sm font-display font-black uppercase text-slate-900 leading-tight">
                      {userProfile.port}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-black text-gray-400 uppercase block tracking-wider">
                      Coordinates
                    </span>
                    <span className="text-xs font-black text-slate-700">
                      {userProfile.lat?.toFixed(4)}°N, {userProfile.lng?.toFixed(4)}°E
                    </span>
                  </div>
                </div>

                {/* Target Species Count & Threshold Safety Bar */}
                <div className="bg-slate-50/80 p-3 rounded-2xl border border-gray-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#00B074]" />
                    <span className="font-black text-slate-800 text-[11px]">
                      Active Fishing Hotspots:{" "}
                      <span className="text-[#00B074] font-black">{filteredHotspots.length} spots</span>
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    SAFETY LIMIT: WAVES &lt; 2.0M | WIND &lt; 20KT
                  </span>
                </div>
              </div>

              {/* ================= SECTION 2: SPECIES FILTER SYSTEM ================= */}
              <div className="space-y-4 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#00B074]" />
                    <h3 className="font-display font-black text-xs uppercase tracking-wider text-slate-900">
                      FISH & SPECIES FINDER
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        setActiveTooltip(
                          activeTooltip === "species" ? null : "species"
                        )
                      }
                      className="text-gray-400 hover:text-slate-700 transition"
                      title="Learn about species categories"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                    <button
                      onClick={() => {
                        setCheckedFamilies([]);
                        setActiveTab("both");
                        setShowGeneralPelagic(true);
                        setShowGeneralDemersal(true);
                        setSelectedSpecies([]);
                        setIsPelagicExpanded(false);
                        setIsDemersalExpanded(false);
                      }}
                      className="text-[10px] font-black uppercase text-[#00B074] hover:underline cursor-pointer"
                    >
                      RESET ALL
                    </button>
                  </div>
                </div>

                {activeTooltip === "species" && (
                  <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-xl text-[10px] text-slate-700 space-y-1.5 shadow-xs">
                    <p className="font-bold text-[#00B074] text-xs">💡 EOG Vessel Activity vs Species Habitat Database:</p>
                    <p>• <strong className="text-emerald-800">General PELAGIC Model (EOG Boat Detection)</strong>: Processes Earth Observation Group satellite vessel detection & surface ocean data. Displays general fishing activity hotspots in <span className="font-extrabold text-emerald-600">Emerald Green</span> (NOT species specific).</p>
                    <p>• <strong className="text-blue-800">General DEMERSAL Model (EOG Vessel & Seabed)</strong>: Processes EOG satellite vessel detection, depth & bathymetry data. Displays general demersal fishing activity hotspots in <span className="font-extrabold text-blue-600">Ocean Blue</span> (NOT species specific).</p>
                    <p>• <strong className="text-amber-900">Species Preference Database</strong>: Uses a separate environmental habitat database for individual species. (Pending backend data integration - selecting a species hides General EOG boat spots).</p>
                  </div>
                )}

                {/* Integrated Habitat Filter & Navigation Switcher */}
                <div className="grid grid-cols-3 gap-2 w-full bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60">
                  {(["pelagic", "demersal", "both"] as const).map((tab) => {
                    const tabConfig = {
                      pelagic: { main: "Surface Water", sub: "Pelagic Interface" },
                      demersal: { main: "Bottom & Reef", sub: "Demersal Interface" },
                      both: { main: "All Predictions", sub: "Both Interfaces" },
                    };

                    const info = tabConfig[tab];
                    const isActive = activeTab === tab;

                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`py-2 px-2 rounded-xl transition cursor-pointer flex flex-col justify-center items-center text-center select-none ${
                          isActive
                            ? "bg-white text-slate-900 shadow-sm border border-gray-200/80 font-black"
                            : "bg-transparent text-gray-500 hover:text-slate-800 font-bold"
                        }`}
                      >
                        <span className="text-[11px] font-black uppercase tracking-wider truncate w-full">
                          {info.main}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 truncate w-full mt-0.5">
                          ({info.sub})
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Categorized Species Selection Grid */}
                <div className="space-y-4 pt-1">
                  {/* Surface Water Species Section */}
                  {(activeTab === "pelagic" || activeTab === "both") && (
                    <div className="bg-emerald-50/40 border border-emerald-200/70 rounded-2xl overflow-hidden transition-all duration-300">
                      {/* Collapsible Header Bar */}
                      <div
                        onClick={() => setIsPelagicExpanded(!isPelagicExpanded)}
                        className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-emerald-100/50 transition select-none"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Fish className="w-4 h-4 text-[#00B074] shrink-0" />
                          <span className="font-display font-black text-xs uppercase tracking-wider text-slate-900 truncate">
                            Pelagic Zone & Surface Species
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {(() => {
                            const pelagicSel = CATEGORIZED_SPECIES.pelagic.filter((sp) =>
                              selectedSpecies.includes(sp.name)
                            ).length;
                            return (
                              <span
                                className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                  pelagicSel > 0
                                    ? "bg-[#00B074] text-white"
                                    : showGeneralPelagic
                                      ? "bg-emerald-100 text-[#00B074]"
                                      : "bg-gray-100 text-gray-400"
                                }`}
                              >
                                {pelagicSel > 0
                                  ? `${pelagicSel} SPECIES FILTERED`
                                  : showGeneralPelagic
                                    ? "EOG MODEL ACTIVE"
                                    : "MODEL OFF"}
                              </span>
                            );
                          })()}
                          <button
                            type="button"
                            aria-label={isPelagicExpanded ? "Collapse Pelagic section" : "Expand Pelagic section"}
                            className="p-1 rounded-lg text-gray-400 hover:text-slate-700 hover:bg-white/60 transition"
                          >
                            <ChevronDown
                              className={`w-4 h-4 transition-transform duration-300 ${
                                isPelagicExpanded ? "rotate-180 text-[#00B074]" : ""
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Collapsible Body */}
                      <div
                        className={`grid transition-all duration-300 ease-in-out ${
                          isPelagicExpanded
                            ? "grid-rows-[1fr] opacity-100 p-4 pt-2 border-t border-emerald-100/80"
                            : "grid-rows-[0fr] opacity-0 p-0 pointer-events-none"
                        }`}
                      >
                        <div className="overflow-hidden space-y-3.5">
                          {/* Interactive General Pelagic Model Run Toggle Card */}
                          <button
                            type="button"
                            onClick={() => setShowGeneralPelagic(!showGeneralPelagic)}
                            className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer select-none ${
                              showGeneralPelagic
                                ? "bg-emerald-50/90 border-[#10B981] ring-2 ring-[#10B981]/20 shadow-sm"
                                : "bg-white/90 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30"
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-3 h-3 rounded-full inline-block shrink-0 transition-all ${
                                    showGeneralPelagic
                                      ? "bg-[#10B981] ring-2 ring-emerald-200 shadow-sm animate-pulse"
                                      : "bg-gray-300 border border-gray-400"
                                  }`}
                                />
                                <span
                                  className={`text-xs font-black uppercase ${
                                    showGeneralPelagic ? "text-emerald-950" : "text-slate-800"
                                  }`}
                                >
                                  General PELAGIC Model Run (EOG Vessel Detection)
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-500 font-medium leading-snug mt-1">
                                Processes Earth Observation Group (EOG) satellite boat detection and surface ocean data (SST, Chlorophyll). Predicts general fishing activity, NOT specific fish species.
                              </p>
                            </div>
                            <div className="shrink-0 flex items-center gap-1.5 ml-2">
                              <span
                                className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border transition-all ${
                                  showGeneralPelagic
                                    ? "bg-[#10B981] text-white border-[#10B981] shadow-xs"
                                    : "bg-gray-100 text-gray-500 border-gray-200"
                                }`}
                              >
                                {showGeneralPelagic ? "EOG MODEL ACTIVE" : "CLICK TO RUN MODEL"}
                              </span>
                            </div>
                          </button>

                          {/* Species Specific Preferences Section */}
                          <div className="pt-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                                Filter By Specific Species (Probability Gradient Active)
                              </span>
                              <span className="text-[9px] text-[#00B074] font-bold">AWS ML Model Live</span>
                            </div>

                            {/* Informative Banner when pelagic species selected */}
                            {CATEGORIZED_SPECIES.pelagic.some((sp) => selectedSpecies.includes(sp.name)) && (
                              <div className="bg-emerald-50/90 border border-emerald-200/90 p-3 rounded-xl space-y-1 text-[10px] text-emerald-950 shadow-xs">
                                <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                                  <Check className="w-3.5 h-3.5 text-[#00B074] shrink-0" />
                                  <span>Species-Specific Catch Probability Gradient Active</span>
                                </div>
                                <p className="text-[9.5px] text-emerald-800 leading-snug">
                                  Map hotspot colors dynamically reflect the selected species and its catch probability (Light: 60-69%, Medium: 70-79%, Dark: 80-89%, Deepest: 90-100%).
                                </p>
                              </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {CATEGORIZED_SPECIES.pelagic.map((sp) => {
                                const isSelected = selectedSpecies.includes(sp.name);
                                return (
                                  <button
                                    key={sp.name}
                                    onClick={() => handleSpeciesToggle(sp.name)}
                                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer select-none ${
                                      isSelected
                                        ? "bg-slate-50/90 text-slate-900 font-black shadow-sm"
                                        : "bg-white border-gray-200 text-slate-800 hover:border-slate-300 hover:shadow-xs"
                                    }`}
                                    style={isSelected ? { borderColor: sp.color, boxShadow: `0 2px 10px ${sp.color}30` } : {}}
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <div className="min-w-0 pr-2">
                                        <span className={`text-xs font-black block truncate ${isSelected ? "text-slate-950" : "text-slate-900"}`}>
                                          {sp.name}
                                        </span>
                                        <span className="text-[9px] font-bold block truncate mt-0.5 text-gray-400">
                                          {sp.localName}
                                        </span>
                                      </div>

                                      {/* Right-side Base Color Circle */}
                                      <div className="shrink-0 flex items-center justify-center ml-1">
                                        <span
                                          className={`w-4 h-4 rounded-full inline-block shadow-sm transition-transform ${isSelected ? "scale-110 ring-2 ring-white" : ""}`}
                                          style={{ backgroundColor: sp.color }}
                                          title={`${sp.name} base color palette (${sp.color})`}
                                        />
                                      </div>
                                    </div>

                                    {/* Catch Probability Gradient Swatch Bar */}
                                    <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between gap-1 w-full">
                                      <span className="text-[8px] font-black uppercase text-gray-400">Probability:</span>
                                      <div className="flex-1 flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-gray-100 max-w-[130px]" title="Gradient Scale: 60-69% (Light) → 70-79% (Medium) → 80-89% (Dark) → 90-100% (Deepest)">
                                        <span className="flex-1 h-full" style={{ backgroundColor: sp.shades.light }} />
                                        <span className="flex-1 h-full" style={{ backgroundColor: sp.shades.medium }} />
                                        <span className="flex-1 h-full" style={{ backgroundColor: sp.shades.dark }} />
                                        <span className="flex-1 h-full" style={{ backgroundColor: sp.shades.deepest }} />
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bottom & Reef Species Section */}
                  {(activeTab === "demersal" || activeTab === "both") && (
                    <div className="bg-amber-50/40 border border-amber-200/70 rounded-2xl overflow-hidden transition-all duration-300">
                      {/* Collapsible Header Bar */}
                      <div
                        onClick={() => setIsDemersalExpanded(!isDemersalExpanded)}
                        className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-amber-100/50 transition select-none"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Anchor className="w-4 h-4 text-[#D97706] shrink-0" />
                          <span className="font-display font-black text-xs uppercase tracking-wider text-slate-900 truncate">
                            Demersal Zone & Bottom Species
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {(() => {
                            const demersalSel = CATEGORIZED_SPECIES.demersal.filter((sp) =>
                              selectedSpecies.includes(sp.name)
                            ).length;
                            return (
                              <span
                                className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                  demersalSel > 0
                                    ? "bg-[#D97706] text-white"
                                    : showGeneralDemersal
                                      ? "bg-amber-100 text-[#D97706]"
                                      : "bg-gray-100 text-gray-400"
                                }`}
                              >
                                {demersalSel > 0
                                  ? `${demersalSel} SPECIES FILTERED`
                                  : showGeneralDemersal
                                    ? "EOG MODEL ACTIVE"
                                    : "MODEL OFF"}
                              </span>
                            );
                          })()}
                          <button
                            type="button"
                            aria-label={isDemersalExpanded ? "Collapse Demersal section" : "Expand Demersal section"}
                            className="p-1 rounded-lg text-gray-400 hover:text-slate-700 hover:bg-white/60 transition"
                          >
                            <ChevronDown
                              className={`w-4 h-4 transition-transform duration-300 ${
                                isDemersalExpanded ? "rotate-180 text-[#D97706]" : ""
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Collapsible Body */}
                      <div
                        className={`grid transition-all duration-300 ease-in-out ${
                          isDemersalExpanded
                            ? "grid-rows-[1fr] opacity-100 p-4 pt-2 border-t border-amber-100/80"
                            : "grid-rows-[0fr] opacity-0 p-0 pointer-events-none"
                        }`}
                      >
                        <div className="overflow-hidden space-y-3.5">
                          {/* Interactive General Demersal Model Run Toggle Card */}
                          <button
                            type="button"
                            onClick={() => setShowGeneralDemersal(!showGeneralDemersal)}
                            className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer select-none ${
                              showGeneralDemersal
                                ? "bg-blue-50/90 border-[#3B82F6] ring-2 ring-[#3B82F6]/20 shadow-sm"
                                : "bg-white/90 border-gray-200 hover:border-blue-300 hover:bg-blue-50/30"
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-3 h-3 rounded-full inline-block shrink-0 transition-all ${
                                    showGeneralDemersal
                                      ? "bg-[#3B82F6] ring-2 ring-blue-200 shadow-sm animate-pulse"
                                      : "bg-gray-300 border border-gray-400"
                                  }`}
                                />
                                <span
                                  className={`text-xs font-black uppercase ${
                                    showGeneralDemersal ? "text-blue-950" : "text-slate-800"
                                  }`}
                                >
                                  General DEMERSAL Model Run (EOG Vessel & Seabed)
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-500 font-medium leading-snug mt-1">
                                Processes Earth Observation Group (EOG) satellite boat detection, depth, and bathymetry data. Predicts general demersal vessel activity, NOT specific fish species.
                              </p>
                            </div>
                            <div className="shrink-0 flex items-center gap-1.5 ml-2">
                              <span
                                className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border transition-all ${
                                  showGeneralDemersal
                                    ? "bg-[#3B82F6] text-white border-[#3B82F6] shadow-xs"
                                    : "bg-gray-100 text-gray-400 border-gray-200"
                                }`}
                              >
                                {showGeneralDemersal ? "EOG MODEL ACTIVE" : "CLICK TO RUN MODEL"}
                              </span>
                            </div>
                          </button>

                          {/* Species Specific Preferences Section */}
                          <div className="pt-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                                Filter By Specific Species (Probability Gradient Active)
                              </span>
                              <span className="text-[9px] text-[#D97706] font-bold">AWS ML Model Live</span>
                            </div>

                            {/* Informative Banner when demersal species selected */}
                            {CATEGORIZED_SPECIES.demersal.some((sp) => selectedSpecies.includes(sp.name)) && (
                              <div className="bg-amber-50/90 border border-amber-200/90 p-3 rounded-xl space-y-1 text-[10px] text-amber-950 shadow-xs">
                                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                                  <Check className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                                  <span>Species-Specific Catch Probability Gradient Active</span>
                                </div>
                                <p className="text-[9.5px] text-amber-900 leading-snug">
                                  Map hotspot colors dynamically reflect the selected species and its catch probability (Light: 60-69%, Medium: 70-79%, Dark: 80-89%, Deepest: 90-100%).
                                </p>
                              </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {CATEGORIZED_SPECIES.demersal.map((sp) => {
                                const isSelected = selectedSpecies.includes(sp.name);
                                return (
                                  <button
                                    key={sp.name}
                                    onClick={() => handleSpeciesToggle(sp.name)}
                                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer select-none ${
                                      isSelected
                                        ? "bg-slate-50/90 text-slate-900 font-black shadow-sm"
                                        : "bg-white border-gray-200 text-slate-800 hover:border-slate-300 hover:shadow-xs"
                                    }`}
                                    style={isSelected ? { borderColor: sp.color, boxShadow: `0 2px 10px ${sp.color}30` } : {}}
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <div className="min-w-0 pr-2">
                                        <span className={`text-xs font-black block truncate ${isSelected ? "text-slate-950" : "text-slate-900"}`}>
                                          {sp.name}
                                        </span>
                                        <span className="text-[9px] font-bold block truncate mt-0.5 text-gray-400">
                                          {sp.localName}
                                        </span>
                                      </div>

                                      {/* Right-side Base Color Circle */}
                                      <div className="shrink-0 flex items-center justify-center ml-1">
                                        <span
                                          className={`w-4 h-4 rounded-full inline-block shadow-sm transition-transform ${isSelected ? "scale-110 ring-2 ring-white" : ""}`}
                                          style={{ backgroundColor: sp.color }}
                                          title={`${sp.name} base color palette (${sp.color})`}
                                        />
                                      </div>
                                    </div>

                                    {/* Catch Probability Gradient Swatch Bar */}
                                    <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between gap-1 w-full">
                                      <span className="text-[8px] font-black uppercase text-gray-400">Probability:</span>
                                      <div className="flex-1 flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-gray-100 max-w-[130px]" title="Gradient Scale: 60-69% (Light) → 70-79% (Medium) → 80-89% (Dark) → 90-100% (Deepest)">
                                        <span className="flex-1 h-full" style={{ backgroundColor: sp.shades.light }} />
                                        <span className="flex-1 h-full" style={{ backgroundColor: sp.shades.medium }} />
                                        <span className="flex-1 h-full" style={{ backgroundColor: sp.shades.dark }} />
                                        <span className="flex-1 h-full" style={{ backgroundColor: sp.shades.deepest }} />
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ================= SECTION 3: LIVE SEA & WEATHER METRICS ================= */}
              <div className="space-y-4 pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <Waves className="w-3.5 h-3.5 text-[#00B074]" />
                    <h3 className="font-display font-black text-xs uppercase tracking-wider text-slate-900">
                      SEA & WEATHER METRICS GRID
                    </h3>
                  </div>

                  {selectedHotspot ? (
                    <div className="flex items-center gap-1.5">
                      <span className="bg-emerald-50 text-[#00B074] border border-emerald-200 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00B074] animate-ping" />
                        ZONE: {selectedHotspot.name || `${selectedHotspot.lat?.toFixed(2)}°N, ${selectedHotspot.lng?.toFixed(2)}°E`}
                      </span>
                      <button
                        onClick={() => setSelectedHotspot(null)}
                        className="text-[9px] font-black uppercase text-gray-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-0.5 rounded-full transition cursor-pointer"
                        title="Reset selection to Port Weather"
                      >
                        RESET
                      </button>
                    </div>
                  ) : (
                    <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-2.5 py-0.5 rounded-full">
                      PORT WEATHER TELEMETRY
                    </span>
                  )}
                </div>

                {/* Selected Hotspot Detailed Telemetry Highlight (if hotspot pressed) */}
                {selectedHotspot && (
                  <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 border border-[#00B074]/30 p-3.5 rounded-2xl space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1 bg-[#00B074] text-white rounded-lg">
                          <Compass className="w-3.5 h-3.5" />
                        </span>
                        <div>
                          <span className="text-xs font-black text-slate-900 block leading-tight">
                            {selectedHotspot.name || "Target Hotspot Grid"}
                          </span>
                          <span className="text-[10px] font-bold text-gray-500 block mt-0.5">
                            {selectedHotspot.lat?.toFixed(4)}°N, {selectedHotspot.lng?.toFixed(4)}°E • Depth: {selectedHotspot.depth || (selectedHotspot.type === "demersal" ? 45 : 450)}m
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-black text-[#00B074] uppercase block">
                          AI CATCH SUITABILITY
                        </span>
                        <span className="text-sm font-black text-slate-900 block">
                          {selectedHotspot.catchProbability != null
                            ? `${(selectedHotspot.catchProbability * 100).toFixed(0)}%`
                            : "92%"}
                        </span>
                      </div>
                    </div>

                    {selectedHotspot.species && selectedHotspot.species.length > 0 && (
                      <div className="pt-1 border-t border-[#00B074]/20 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-black text-gray-400 uppercase">TARGET SPECIES:</span>
                        {selectedHotspot.species.map((sp: string) => (
                          <span key={sp} className="text-[9px] font-bold bg-white text-slate-800 border border-gray-200 px-2 py-0.5 rounded-md shadow-xs">
                            {sp}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Weather Metrics Grid (3 columns on wide cards) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-white border border-gray-200 rounded-2xl flex items-center gap-2.5 shadow-xs">
                    <Wind className="w-4 h-4 text-[#00B074] shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[9px] font-black text-gray-400 uppercase block leading-tight">
                        WIND SPEED
                      </span>
                      <span className="text-xs font-black text-slate-800 block mt-0.5">
                        {selectedHotspot?.windSpeed || weather.windSpeed} km/h
                      </span>
                      <span className="text-[9px] font-bold text-emerald-600 block mt-0.5">
                        {selectedHotspot ? "Zone Wind" : (windKnots < 15 ? "Calm Breeze" : "Moderate Wind")}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-2xl border transition-colors flex items-center gap-2.5 shadow-xs ${
                      (selectedHotspot?.waveHeight || weather.waveHeight) >= 2.0
                        ? "bg-rose-50 border-rose-200 text-rose-950"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <Waves
                      className={`w-4 h-4 shrink-0 ${
                        (selectedHotspot?.waveHeight || weather.waveHeight) >= 2.0
                          ? "text-rose-500 animate-bounce"
                          : "text-[#00B074]"
                      }`}
                    />
                    <div className="min-w-0">
                      <span className="text-[9px] font-black text-gray-400 uppercase block leading-tight">
                        WAVE HEIGHT
                      </span>
                      <span
                        className={`text-xs font-black block mt-0.5 ${
                          (selectedHotspot?.waveHeight || weather.waveHeight) >= 2.0
                            ? "text-rose-600"
                            : "text-slate-800"
                        }`}
                      >
                        {(selectedHotspot?.waveHeight || weather.waveHeight).toFixed(1)}m
                      </span>
                      <span
                        className={`text-[9px] font-bold block mt-0.5 ${
                          (selectedHotspot?.waveHeight || weather.waveHeight) >= 2.0
                            ? "text-rose-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {selectedHotspot
                          ? "Zone Sea Swell"
                          : weather.waveHeight >= 2.0
                            ? "Rough Sea - Caution"
                            : "Gentle Sea"}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-white border border-gray-200 rounded-2xl flex items-center gap-2.5 shadow-xs">
                    <ShieldAlert className="w-4 h-4 text-[#00B074] shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[9px] font-black text-gray-400 uppercase block leading-tight">
                        STORM SIGNAL
                      </span>
                      <span className="text-xs font-black text-slate-800 block mt-0.5">
                        Signal #{selectedHotspot?.stormSignal ?? weather.stormSignal}
                      </span>
                      <span className="text-[9px] font-bold text-emerald-600 block mt-0.5">
                        {(selectedHotspot?.stormSignal ?? weather.stormSignal) === 0
                          ? "No Active Warning"
                          : "Storm Warning"}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-white border border-gray-200 rounded-2xl flex items-center gap-2.5 shadow-xs">
                    <Thermometer className="w-4 h-4 text-[#00B074] shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[9px] font-black text-gray-400 uppercase block leading-tight">
                        SEA TEMP
                      </span>
                      <span className="text-xs font-black text-slate-800 block mt-0.5">
                        {selectedHotspot?.sst
                          ? typeof selectedHotspot.sst === "number"
                            ? `${selectedHotspot.sst.toFixed(1)}°C`
                            : `${selectedHotspot.sst}°C`
                          : `${weather.temp}°C`}
                      </span>
                      <span className="text-[9px] font-bold text-emerald-600 block mt-0.5">
                        {selectedHotspot ? "Target Zone SST" : "Normal range"}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-white border border-gray-200 rounded-2xl col-span-2 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <Compass className="w-4 h-4 text-[#00B074] shrink-0" />
                      <div>
                        <span className="text-[9px] font-black text-gray-400 uppercase block leading-tight">
                          TIDE LEVEL & TELEMETRY
                        </span>
                        <span className="text-xs font-black text-slate-800 block mt-0.5">
                          {selectedHotspot
                            ? `${selectedHotspot.lat?.toFixed(4)}°N, ${selectedHotspot.lng?.toFixed(4)}°E`
                            : weather.tide}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={refreshWeather}
                      className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer text-slate-600 flex items-center gap-1 text-[10px] font-bold"
                      title="Refresh sensors"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-[#00B074]" />
                      <span>Sync</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ================= SECTION 4: FEEDBACK & EMERGENCY SOS ================= */}
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">
                  COOPERATIVE MODEL CALIBRATION
                </span>
                <p className="text-[11px] font-semibold text-gray-500">
                  Help train AI catch accuracy: Were predicted species locations accurate for your trip?
                </p>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleFeedback("1")}
                    className="p-2.5 bg-white hover:bg-emerald-50 border border-gray-200 hover:border-[#00B074] rounded-xl flex flex-col items-center gap-1 transition cursor-pointer shadow-xs"
                  >
                    <ThumbsUp className="w-4 h-4 text-[#00B074]" />
                    <span className="text-[9px] font-black uppercase text-slate-700">
                      HIGH ACCURACY
                    </span>
                  </button>
                  <button
                    onClick={() => handleFeedback("2")}
                    className="p-2.5 bg-white hover:bg-amber-50 border border-gray-200 hover:border-amber-400 rounded-xl flex flex-col items-center gap-1 transition cursor-pointer shadow-xs"
                  >
                    <Meh className="w-4 h-4 text-amber-500" />
                    <span className="text-[9px] font-black uppercase text-slate-700">
                      MEDIUM
                    </span>
                  </button>
                  <button
                    onClick={() => handleFeedback("3")}
                    className="p-2.5 bg-white hover:bg-rose-50 border border-gray-200 hover:border-rose-400 rounded-xl flex flex-col items-center gap-1 transition cursor-pointer shadow-xs"
                  >
                    <ThumbsDown className="w-4 h-4 text-rose-500" />
                    <span className="text-[9px] font-black uppercase text-slate-700">
                      LOW
                    </span>
                  </button>
                </div>

                {submittedFeedback && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-[10px] font-black text-[#00B074]">
                    FEEDBACK LOGGED: {submittedFeedback.toUpperCase()} ACCURACY
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Emergency Trigger */}
            <div className="pt-3 border-t border-gray-100 mt-4">
              <button
                onClick={handleTriggerSos}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-black text-xs uppercase tracking-wider py-4 rounded-2xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <Siren className="w-5 h-5 animate-bounce" />
                <span>EMERGENCY SOS DISTRESS BROADCAST</span>
              </button>
            </div>
          </div>
        </div>

      {/* SOS Overlay */}
      {isSosActive && (
        <div className="fixed inset-0 bg-rose-900/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-white rounded-[2.5rem] p-8 md:p-10 text-center space-y-6 shadow-2xl border-4 border-rose-600">
            <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mx-auto animate-bounce">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="font-display font-black text-2xl text-rose-600 tracking-tight">
                {sosTransponding ? "SOS ACTIVE — BROADCASTING" : "TRANSPONDING SOS DISTRESS"}
              </h1>
              <p className="text-xs text-gray-400 font-bold max-w-sm mx-auto leading-relaxed">
                {sosTransponding
                  ? "Transponder beacons are actively broadcasting distress signal coordinates over all coastal networks."
                  : "Your GPS transponder is establishing satellite coordinates. Coastal guard base will receive distress payload in:"}
              </p>
            </div>

            {!sosTransponding ? (
              <div className="text-6xl font-black text-rose-600 select-none animate-pulse">
                {sosCountdown}
              </div>
            ) : (
              <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-2xl text-left space-y-2 max-w-md mx-auto">
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider block">
                  Simulated distress SMS payload
                </span>
                <p className="text-xs font-bold text-rose-800 font-mono leading-relaxed bg-white p-3 rounded-xl border border-rose-100/30">
                  {`[PAROLA DISTRESS SOS] Vessel ${userProfile.vesselName} (License ${userProfile.licenseNo}) is in distress at ${userProfile.lat.toFixed(4)} N, ${userProfile.lng.toFixed(4)} E. Current telemetry: Wind speed ${weather.windSpeed} k/h, wave heights ${weather.waveHeight}m.`}
                </p>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCancelSos}
                className="flex-1 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-widest py-4 rounded-2xl transition cursor-pointer"
              >
                {sosTransponding ? "Clear SOS Distress" : "Cancel SOS Countdown"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fuel Commit Modal */}
      <Modal
        isOpen={selectedPoolId !== null}
        onClose={() => setSelectedPoolId(null)}
        title={activePool ? `Commit order to: ${activePool.name}` : "Join Co-op"}
        size="sm"
      >
        {activePool && (
          <div className="space-y-6 bg-white p-2">
            <div className="bg-[#00B074]/10 border border-[#00B074]/20 p-4 rounded-2xl">
              <div className="flex justify-between text-xs font-bold text-gray-500">
                <span>Co-op Target:</span>
                <span className="text-[#00B074] font-black">
                  {activePool.targetVolume.toLocaleString()} Liters
                </span>
              </div>
              <div className="flex justify-between text-xs font-bold text-gray-500 mt-1">
                <span>Current Volume:</span>
                <span className="text-[#00B074] font-black">
                  {activePool.currentVolume.toLocaleString()} Liters
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                Enter Liters to Commit
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={50}
                  max={2000}
                  value={fuelCommitLiters}
                  onChange={(e) => setFuelCommitLiters(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border-2 border-slate-200 rounded-2xl h-12 px-4 text-sm font-semibold focus:outline-none focus:border-[#00B074]"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-[#00B074]">
                  Liters
                </span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2">
                Simulated Tier Progression
              </span>
              <TierProgressBar
                currentVolume={
                  activePool.currentVolume +
                  (fuelCommitLiters - (activePool.commits[userProfile.phone] || 0))
                }
                targetVolume={activePool.targetVolume}
              />
            </div>

            <div className="pt-4 flex gap-3">
              <button
                onClick={() => setSelectedPoolId(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black text-xs uppercase tracking-widest py-3 rounded-2xl transition cursor-pointer"
              >
                Close
              </button>
              <button
                disabled={activePool.currentVolume >= activePool.targetVolume}
                onClick={() => {
                  if (activePool.currentVolume >= activePool.targetVolume) {
                    showToast("This fuel pool is already full!", "error");
                    return;
                  }
                  addFuelCommit(activePool.id, fuelCommitLiters);
                  setSelectedPoolId(null);
                }}
                className={`flex-1 font-black text-xs uppercase tracking-widest py-3 rounded-2xl transition ${
                  activePool.currentVolume >= activePool.targetVolume
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-[#00B074] hover:bg-[#00B074]/90 text-white cursor-pointer"
                }`}
              >
                {activePool.currentVolume >= activePool.targetVolume ? "Pool Full" : "Confirm Order"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AuthLayout>
  );
}