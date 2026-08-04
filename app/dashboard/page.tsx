"use client";

import React, { useState, useEffect } from "react";
import { AuthLayout } from "../../components/layouts/AuthLayout";
import { useApp } from "../../context/AppContext";
import { useTranslation } from "../../hooks/use-translation";
import { MapComponent } from "../../components/features/hotspots/MapComponent";
import { Modal } from "../../components/ui/Modal";
import { TierProgressBar } from "../../components/ui/TierProgressBar";
import { calculateDistance, calculateBearing } from "../../utils/spatial";
import {
  AlertTriangle,
  ChevronLeft,
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
  GripVertical
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

  // SOS States
  const [isSosActive, setIsSosActive] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(5);
  const [sosTransponding, setSosTransponding] = useState(false);

  // Fuel Modal State
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [fuelCommitLiters, setFuelCommitLiters] = useState(100);

  // Voice Assist State
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Municipal Advisor Card Resizing State
  const [advisorWidth, setAdvisorWidth] = useState<number>(440);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const minAdvisorWidth = 340;
  const maxAdvisorWidth = 850;

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

  // Text-To-Speech Synthesis Handler
  const handleVoiceAssist = () => {
    if (isSpeaking) {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    const voiceText =
      (
        {
          en: `Attention Captain of Vessel ${userProfile.vesselName}. Current weather telemetry for ${userProfile.port} anchorage: Sea surface temperature is ${weather.temp} degrees. Wind is blowing at ${weather.windSpeed} kilometers per hour. Wave height is ${weather.waveHeight} meters. Tide level is ${weather.tide}. Storm signal status is ${weather.stormSignal}. Conditions are evaluated as ${isSafetyHoldActive ? "dangerous, please hold sailing" : "favorable to sail"}. Safe passages!`,
          tl: `Atensyon Kapitan ng Bangkang ${userProfile.vesselName}. Kasalukuyang lagay ng panahon sa ${userProfile.port}: Temperatura ng dagat ay ${weather.temp} degrees. Bilis ng hangin ay ${weather.windSpeed} km/h. Taas ng alon ay ${weather.waveHeight} metro. Kundisyon sa pagpalaot ay ${isSafetyHoldActive ? "mapanganib, iwasang pumalaot" : "ligtas at magpalaot"}. Mag-ingat!`
        } as Record<string, string>
      )[language] || `Maritime telemetry ready.`;

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(voiceText);

      const voices = window.speechSynthesis.getVoices();
      const phVoice = voices.find(
        (v) => v.lang.includes("PH") || v.lang.includes("fil")
      );
      if (phVoice) utterance.voice = phVoice;

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeaking(true);
      setTimeout(() => setIsSpeaking(false), 5000);
      showToast("Speech synthesis is simulated in this browser environment.", "info");
    }
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

  const handleSpeciesToggle = (species: string) => {
    if (selectedSpecies.includes(species)) {
      setSelectedSpecies(selectedSpecies.filter((s) => s !== species));
    } else {
      setSelectedSpecies([...selectedSpecies, species]);
    }
  };

  // Process and sort hotspot distance data
  const processedHotspots = hotspots.map((spot) => {
    const lat = spot.lat ?? (spot as any).position?.[0] ?? 0;
    const lng = spot.lng ?? (spot as any).position?.[1] ?? 0;
    const dist = calculateDistance(userProfile.lat, userProfile.lng, lat, lng);
    const brng = calculateBearing(userProfile.lat, userProfile.lng, lat, lng);
    return {
      ...spot,
      distance: `${Math.round(dist)} km`,
      bearing: brng,
      distValue: dist
    };
  });

  const sortedHotspots = [...processedHotspots].sort(
    (a, b) => a.distValue - b.distValue
  );

  const filteredHotspots = sortedHotspots.filter((spot) => {
    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      const nameMatch = spot.name.toLowerCase().includes(term);
      const speciesMatch = spot.species.some((s) => s.toLowerCase().includes(term));
      if (!nameMatch && !speciesMatch) return false;
    }

    const spotType = spot.type || "pelagic";
    if (activeTab !== "both" && spotType !== activeTab) return false;

    if (spotType === "pelagic" && !showGeneralPelagic) return false;
    if (spotType === "demersal" && !showGeneralDemersal) return false;

    if (checkedFamilies.length > 0 && !checkedFamilies.includes(spotType)) return false;

    if (selectedSpecies.length > 0) {
      const matchesSpecies = spot.species.some((s) => selectedSpecies.includes(s));
      if (!matchesSpecies) return false;
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

            <div
              className={`px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 border shadow-md transition ${isSafetyHoldActive
                ? "bg-rose-600 border-rose-600 text-white"
                : "bg-[#00B074] border-[#00B074] text-white"
                }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full bg-white ${isSafetyHoldActive ? "animate-ping" : ""
                  }`}
              />
              <span>
                {isSafetyHoldActive ? "CAUTION HOLD" : "FAVORABLE TO SAIL"}
              </span>
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
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="text-sm font-display font-black text-slate-900 uppercase tracking-wide">
                        Active Hotspot Coordinates
                      </h3>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                        Showing {filteredHotspots.length} highly localized municipal marine grids.
                      </p>
                    </div>
                    <span className="text-[10px] font-black text-[#00B074] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                      {filteredHotspots.length} ACTIVE SPOTS
                    </span>
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
                      {filteredHotspots.map((spot) => (
                        <div
                          key={spot.id}
                          className={`bg-white p-4 rounded-2xl border transition-all flex flex-col justify-between shadow-sm relative ${isSafetyHoldActive
                            ? "hover:border-rose-300 border-gray-200"
                            : "hover:border-emerald-300 border-gray-200"
                            }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-lg leading-none">
                                {(spot as any).icon || "🐟"}
                              </span>
                              <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                                {spot.name}
                              </span>
                            </div>
                            <span className="inline-block text-[9px] font-black text-[#00B074] bg-emerald-50 px-2 py-0.5 rounded uppercase border border-emerald-100 tracking-wider">
                              DEPTH: {spot.depth}M
                            </span>
                            <p className="text-[11px] text-gray-500 font-medium leading-relaxed pt-1">
                              {(spot as any).desc || `Target species group: ${spot.species.join(", ")}`}
                            </p>
                          </div>

                          <div className="flex items-center justify-between border-t border-gray-100 pt-2.5 mt-3 text-[10px] font-bold">
                            <span className="text-gray-400">BEARING: {spot.bearing}</span>
                            <span
                              className={`font-black ${isSafetyHoldActive ? "text-rose-500" : "text-[#00B074]"
                                }`}
                            >
                              {spot.distance}
                            </span>
                          </div>

                          <div className="absolute top-4 right-4">
                            <span
                              className={`w-2.5 h-2.5 rounded-full block ${isSafetyHoldActive ? "bg-rose-500" : "bg-[#00B074]"
                                }`}
                            />
                          </div>
                        </div>
                      ))}
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
              title="Click and drag left edge to expand Municipal Advisor to the left"
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

            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition cursor-pointer shrink-0">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-[#00B074]" />
                    <h2 className="font-display font-black text-xs uppercase tracking-wider text-slate-900">
                      MUNICIPAL ADVISOR
                    </h2>
                  </div>
                </div>

                <button
                  onClick={() => changeLanguage(language === "en" ? "tl" : "en")}
                  className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-full text-[10px] font-black text-slate-800 transition shadow-sm cursor-pointer shrink-0"
                >
                  <Globe className="w-3.5 h-3.5 text-[#00B074]" />
                  <span>{language === "en" ? "ENGLISH" : "FILIPINO"}</span>
                </button>
              </div>

              {/* Marine Safety Condition Card */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${isSafetyHoldActive
                  ? isCalculatedUnsafe
                    ? "bg-rose-50 border-rose-200 text-rose-700"
                    : "bg-amber-50 border-amber-200 text-amber-800"
                  : "bg-emerald-50/60 border-emerald-100 text-emerald-900"
                  }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-xl text-white shrink-0 ${isSafetyHoldActive ? "bg-rose-500" : "bg-[#00B074]"
                      }`}
                  >
                    {isSafetyHoldActive ? (
                      <ShieldAlert className="w-5 h-5" />
                    ) : (
                      <ShieldCheck className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-black uppercase tracking-widest block opacity-60">
                      MARINE SAFETY CONDITION
                    </span>
                    <span className="font-display font-black text-xs uppercase tracking-wider block mt-0.5 text-slate-800 truncate">
                      {labelSailing}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setManualOverrideHold(!manualOverrideHold);
                    showToast(
                      `Cooperative safety limits toggled to ${!manualOverrideHold ? "HOLD" : "SAFE"}.`,
                      "info"
                    );
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border shrink-0 transition cursor-pointer ${manualOverrideHold
                    ? "bg-amber-500 border-amber-500 text-white"
                    : "bg-white border-gray-200 text-slate-700 hover:bg-slate-50"
                    }`}
                >
                  TRIGGER HOLD
                </button>
              </div>

              {/* Target Species Count & Safety Limits */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-wrap items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#00B074]" />
                  <span className="text-xs font-black text-slate-800">
                    Target Species Count:{" "}
                    <span className="text-[#00B074]">{filteredHotspots.length}</span>
                  </span>
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  LIMIT: WAVE 2.0M / WIND 20KT
                </span>
              </div>

              {/* Base Reference Station */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between shadow-md">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">
                    BASE REFERENCE STATION
                  </span>
                  <h3 className="text-xs font-display font-black uppercase text-slate-800 leading-tight truncate">
                    {userProfile.port}
                  </h3>
                  <p className="text-[10px] font-semibold text-gray-400">
                    Lat: {(userProfile.lat ?? 14.0122).toFixed(4)}° N | Lng: {(userProfile.lng ?? 123.0114).toFixed(4)}° E
                  </p>
                </div>
                <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[#00B074] shrink-0">
                  ONLINE
                </span>
              </div>

              {/* Species Filter System */}
              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h2 className="font-display font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#00B074]" />
                    SPECIES FILTER SYSTEM
                  </h2>
                  <button
                    onClick={() => {
                      setCheckedFamilies([]);
                      setActiveTab("both");
                      setShowGeneralPelagic(true);
                      setShowGeneralDemersal(true);
                      setSelectedSpecies([]);
                    }}
                    className="text-[10px] font-black uppercase text-[#00B074] hover:underline cursor-pointer"
                  >
                    RESET ALL
                  </button>
                </div>

                {/* Tabs: SURFACE WATER, BOTTOM & REEF, ALL FISH */}
                <div className="flex gap-1.5 w-full bg-gray-100 p-1 rounded-xl">
                  {(["pelagic", "demersal", "both"] as const).map((tab) => {
                    const tabLabels = {
                      pelagic: { main: "Surface Water", sub: "Pelagic" },
                      demersal: { main: "Bottom & Reef", sub: "Demersal" },
                      both: { main: "All Fish", sub: "Both Types" }
                    };
                    const info = tabLabels[tab];
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-1.5 px-1 rounded-lg text-center transition cursor-pointer flex flex-col items-center justify-center ${activeTab === tab
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-gray-500 hover:text-slate-800"
                          }`}
                      >
                        <span className="text-[11px] font-black uppercase tracking-wider block leading-tight truncate w-full">
                          {info.main}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 block truncate w-full mt-0.5">
                          ({info.sub})
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* General Grids Toggles */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowGeneralPelagic(!showGeneralPelagic)}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${showGeneralPelagic
                      ? "bg-emerald-50/50 border-[#00B074] text-[#00B074] font-extrabold"
                      : "bg-white border-gray-200 text-gray-400"
                      }`}
                  >
                    <div className="min-w-0">
                      <span className={`text-xs font-black block truncate ${showGeneralPelagic ? "text-[#00B074]" : "text-slate-800"}`}>
                        Surface & Open Water
                      </span>
                      <span className="text-[9px] font-bold block opacity-75 text-gray-400 mt-0.5">
                        Pelagic Fishing Grids
                      </span>
                    </div>
                    {showGeneralPelagic ? (
                      <Eye className="w-4 h-4 text-[#00B074] shrink-0" />
                    ) : (
                      <EyeOff className="w-4 h-4 shrink-0" />
                    )}
                  </button>

                  <button
                    onClick={() => setShowGeneralDemersal(!showGeneralDemersal)}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${showGeneralDemersal
                      ? "bg-emerald-50/50 border-[#00B074] text-[#00B074] font-extrabold"
                      : "bg-white border-gray-200 text-gray-400"
                      }`}
                  >
                    <div className="min-w-0">
                      <span className={`text-xs font-black block truncate ${showGeneralDemersal ? "text-[#00B074]" : "text-slate-800"}`}>
                        Bottom & Reef Fish
                      </span>
                      <span className="text-[9px] font-bold block opacity-75 text-gray-400 mt-0.5">
                        Demersal Fishing Grids
                      </span>
                    </div>
                    {showGeneralDemersal ? (
                      <Eye className="w-4 h-4 text-[#00B074] shrink-0" />
                    ) : (
                      <EyeOff className="w-4 h-4 shrink-0" />
                    )}
                  </button>
                </div>

                {/* Biological Species Groups */}
                <div className="space-y-2 border border-gray-200 p-4 rounded-2xl bg-white shadow-md">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                    FISH HABITAT CATEGORIES (SURFACE & BOTTOM REEF)
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    {SPECIES_FAMILIES.map((family) => {
                      const isChecked = checkedFamilies.includes(family.id);
                      return (
                        <button
                          key={family.id}
                          onClick={() => toggleFamilyCheckbox(family.id)}
                          className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${isChecked
                            ? "bg-white border-[#00B074] text-[#00B074] font-bold"
                            : "bg-white border-gray-200 text-gray-500"
                            }`}
                        >
                          <div className="truncate pr-1">
                            <div className={`text-xs font-black truncate ${isChecked ? "text-[#00B074]" : family.id === "demersal" ? "text-[#E07A5F]" : "text-slate-800"}`}>
                              {family.label}
                            </div>
                            <div className={`text-[9px] font-semibold leading-none truncate mt-0.5 ${isChecked ? "text-[#00B074]/80" : family.id === "demersal" ? "text-[#E07A5F]/80" : "text-gray-400"}`}>
                              {family.local}
                            </div>
                          </div>
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isChecked
                              ? "border-[#00B074] bg-[#00B074] text-white"
                              : "border-gray-300"
                              }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tag Filter List */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">
                    TAG FILTERING (SPECIES TARGET LIST)
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {allSpeciesList.map((sp) => {
                      const isSelected = selectedSpecies.includes(sp);
                      return (
                        <button
                          key={sp}
                          onClick={() => handleSpeciesToggle(sp)}
                          className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border transition cursor-pointer ${isSelected
                            ? "bg-[#00B074] text-white border-[#00B074] shadow-sm"
                            : "bg-white border-gray-200 text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                          {sp}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Weather Telemetry Grid */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <h2 className="font-display font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Waves className="w-4 h-4 text-[#00B074]" />
                    SEA & WEATHER METRICS GRID
                  </h2>
                  <button
                    onClick={handleVoiceAssist}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition cursor-pointer ${isSpeaking
                      ? "bg-rose-50 border-rose-200 text-rose-600"
                      : "bg-emerald-50 border-emerald-100 text-[#00B074]"
                      }`}
                  >
                    {isSpeaking ? (
                      <VolumeX className="w-3.5 h-3.5" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                    <span>{isSpeaking ? "STOP VOICE" : t("voiceAssist")}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white border border-gray-200 rounded-2xl flex items-center gap-3 shadow-xs">
                    <Wind className="w-4 h-4 text-[#00B074]" />
                    <div>
                      <span className="text-[9px] font-black text-gray-400 uppercase block leading-tight">
                        WIND SPEED
                      </span>
                      <span className="text-xs font-black text-slate-800 block mt-0.5">
                        {weather.windSpeed} km/h
                      </span>
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-2xl border transition-colors flex items-center gap-3 ${weather.waveHeight >= 2.0
                      ? "bg-rose-50 border-rose-200 text-rose-950"
                      : "bg-white border-gray-200 shadow-xs"
                      }`}
                  >
                    <Waves
                      className={`w-4 h-4 ${weather.waveHeight >= 2.0 ? "text-rose-500 animate-bounce" : "text-[#00B074]"
                        }`}
                    />
                    <div>
                      <span className="text-[9px] font-black text-gray-400 uppercase block leading-tight">
                        WAVE HEIGHT
                      </span>
                      <span
                        className={`text-xs font-black block mt-0.5 ${weather.waveHeight >= 2.0 ? "text-rose-600" : "text-slate-800"
                          }`}
                      >
                        {weather.waveHeight.toFixed(1)}m
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-white border border-gray-200 rounded-2xl flex items-center gap-3 shadow-xs">
                    <ShieldAlert className="w-4 h-4 text-[#00B074]" />
                    <div>
                      <span className="text-[9px] font-black text-gray-400 uppercase block leading-tight">
                        STORM SIGNAL
                      </span>
                      <span className="text-xs font-black text-slate-800 block mt-0.5">
                        Signal #{weather.stormSignal}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-white border border-gray-200 rounded-2xl flex items-center gap-3 shadow-xs">
                    <Thermometer className="w-4 h-4 text-[#00B074]" />
                    <div>
                      <span className="text-[9px] font-black text-gray-400 uppercase block leading-tight">
                        SEA TEMP
                      </span>
                      <span className="text-xs font-black text-slate-800 block mt-0.5">
                        {weather.temp}°C
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-white border border-gray-200 rounded-2xl col-span-2 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-3">
                      <Compass className="w-4 h-4 text-[#00B074]" />
                      <div>
                        <span className="text-[9px] font-black text-gray-400 uppercase block leading-tight">
                          TIDE LEVEL
                        </span>
                        <span className="text-xs font-black text-slate-800 block mt-0.5">
                          {weather.tide}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={refreshWeather}
                      className="p-1.5 bg-white border border-slate-200 rounded-full transition cursor-pointer hover:bg-slate-50"
                      title="Refresh sensors"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Model Calibration Feedback */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">
                  COOPERATIVE MODEL CALIBRATION
                </span>
                <p className="text-[11px] font-semibold text-gray-400">
                  Are predicted species locations accurate for your recent trip?
                </p>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleFeedback("1")}
                    className="p-2.5 bg-white hover:bg-emerald-50 border border-gray-200 hover:border-[#00B074] rounded-xl flex flex-col items-center gap-1 transition cursor-pointer shadow-xs"
                  >
                    <ThumbsUp className="w-4 h-4 text-[#00B074]" />
                    <span className="text-[9px] font-black uppercase text-slate-700">
                      HIGH
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
            <div className="pt-3 border-t border-gray-100">
              <button
                onClick={handleTriggerSos}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-black text-xs uppercase tracking-wider py-4 rounded-2xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
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