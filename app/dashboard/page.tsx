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
  Anchor,
  Compass,
  DollarSign,
  Fuel,
  Info,
  Navigation,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Ship,
  Sparkles,
  Volume2,
  VolumeX,
  Waves,
  Wind,
  List,
  Map as MapIcon,
  Globe,
  Sliders,
  Filter,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle,
  TrendingUp,
  Loader2,
  ShieldAlert
} from "lucide-react";

const SPECIES_FAMILIES = [
  { id: "pelagic", label: "Pelagic", local: "Surface & Open Ocean" },
  { id: "demersal", label: "Demersal", local: "Bottom & Reef Species" }
];

export default function DashboardPage() {
  const {
    userProfile,
    weather,
    manualOverrideHold,
    setManualOverrideHold,
    notifications,
    fuelPools,
    hotspots,
    addFuelCommit,
    createFuelPool,
    simulateNotification,
    refreshWeather,
    language,
    changeLanguage,
    showToast
  } = useApp();

  const { t } = useTranslation(language);

  // States
  const [isAdvisorExpanded, setIsAdvisorExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"pelagic" | "demersal" | "both">("both");
  const [mapView, setMapView] = useState(true);
  const [submittedFeedback, setSubmittedFeedback] = useState<string | null>(null);

  // General Zone Toggles
  const [showGeneralPelagic, setShowGeneralPelagic] = useState(true);
  const [showGeneralDemersal, setShowGeneralDemersal] = useState(true);

  // Selected Family Filters
  const [checkedFamilies, setCheckedFamilies] = useState<string[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  const [selectedHotspot, setSelectedHotspot] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // SOS States
  const [isSosActive, setIsSosActive] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(5);
  const [sosTransponding, setSosTransponding] = useState(false);

  // Fuel modal state
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [fuelCommitLiters, setFuelCommitLiters] = useState(100);

  // Voice Assist TTS states
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Real-time calculated safety rating threshold
  const windKnots = weather.windSpeed / 1.852;
  const isCalculatedUnsafe =
    weather.stormSignal > 0 ||
    windKnots >= 20 ||
    weather.waveHeight >= 2.0;

  // Combine calculated safety status with manual override caution hold
  const isSafetyHoldActive = isCalculatedUnsafe || manualOverrideHold;

  // SOS Countdown logic
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

  // Text To Speech Synthesis
  const handleVoiceAssist = () => {
    if (isSpeaking) {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    const voiceText = {
      en: `Attention Captain of Vessel ${userProfile.vesselName}. Current weather telemetry for ${userProfile.port} anchorage: Sea surface temperature is ${weather.temp} degrees. Wind is blowing at ${weather.windSpeed} kilometers per hour from direction ${weather.windDirection}. Wave height is ${weather.waveHeight} meters. Tide level is ${weather.tide}. PAGASA storm signal status is ${weather.stormSignal}. Sailing conditions are evaluated as ${isSafetyHoldActive ? "dangerous, please hold sailing" : "safe and favorable to sail"}. Target fishing hotspots are plotted on your ECDIS screen. Safe passages!`,
      tl: `Atensyon Kapitan ng Bangkang ${userProfile.vesselName}. Kasalukuyang lagay ng panahon sa Himpilang ${userProfile.port}: Temperatura ng dagat ay ${weather.temp} degrees. Hangin ay may bilis na ${weather.windSpeed} kilometro bawat oras mula sa direksyong ${weather.windDirection}. Taas ng alon ay ${weather.waveHeight} metro. Lebel ng joar ay ${weather.tide}. PAGASA storm signal status ay ${weather.stormSignal}. Kundisyon sa pagpalaot ay tinatasa bilang ${isSafetyHoldActive ? "mapanganib, iwasang pumalaot" : "ligtas at pumalaot"}. Ang mga hotspots ay nakalagay sa inyong iskrin. Mag-ingat sa paglalakbay!`,
      ceb: `Atensyon Kapitan sa Bangka nga ${userProfile.vesselName}. Kasamtangang kahimtang sa panahon sa Dunggoanang ${userProfile.port}: Temperatura sa dagat ${weather.temp} degrees. Hangin adunay kusog nga ${weather.windSpeed} kilometro matag oras gikan sa direksyon nga ${weather.windDirection}. Gitas-on sa alon ${weather.waveHeight} metro. Lebel sa taub ${weather.tide}. PAGASA storm signal status ${weather.stormSignal}. Kundisyon sa paglawig ${isSafetyHoldActive ? "delikado, likayi ang paglawig" : "luwas ug molawig"}. Ang mga hotspots nakalatag sa inyong iskrin. Pag-amping sa inyong paglawig!`,
      hil: `Atensyon Kapitan sang Bangka nga ${userProfile.vesselName}. Kasamtangang kahimtang sang panahon sa Himpilan sang ${userProfile.port}: Temperatura sang dagat ${weather.temp} degrees. Hangin may kusog nga ${weather.windSpeed} kilometro kada oras halin sa direksyon nga ${weather.windDirection}. Taas sang balod ${weather.waveHeight} metro. Lebel sang taub ${weather.tide}. PAGASA storm signal status ${weather.stormSignal}. Kundisyon sa pagpalaot ${isSafetyHoldActive ? "mapanganib, likawi ang pagpalaot" : "ligtas kag magpalaot"}. Ang mga hotspots nakalatag sa inyong iskrin. Mag-andam sa inyong pagpalaot!`,
    }[language] || `Maritime telemetry ready.`;

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(voiceText);
      
      const voices = window.speechSynthesis.getVoices();
      const phVoice = voices.find((v) => v.lang.includes("PH") || v.lang.includes("fil"));
      if (phVoice) {
        utterance.voice = phVoice;
      }
      
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeaking(true);
      setTimeout(() => setIsSpeaking(false), 5000);
      showToast("Speech synthesis is simulated (unsupported inside iframe bounds).", "info");
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
      prev.includes(familyId) ? prev.filter((id) => id !== familyId) : [...prev, familyId]
    );
  };

  // Extract all unique species tags across pre-configured hotspots
  const allSpeciesList = Array.from(new Set(hotspots.flatMap((h) => h.species)));

  const handleSpeciesToggle = (species: string) => {
    if (selectedSpecies.includes(species)) {
      setSelectedSpecies(selectedSpecies.filter((s) => s !== species));
    } else {
      setSelectedSpecies([...selectedSpecies, species]);
    }
  };

  // Filter based on active controls and search queries
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

  // Sort by nearest first
  const sortedHotspots = [...processedHotspots].sort((a, b) => a.distValue - b.distValue);

  // Apply species filters and search queries
  const filteredHotspots = sortedHotspots.filter((spot) => {
    // Search query term matching
    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      const nameMatch = spot.name.toLowerCase().includes(term);
      const speciesMatch = spot.species.some((s) => s.toLowerCase().includes(term));
      if (!nameMatch && !speciesMatch) return false;
    }

    // Category switch tabs switcher
    const spotType = spot.type || "pelagic";
    if (activeTab !== "both" && spotType !== activeTab) {
      return false;
    }

    // General zone visibility toggles
    if (spotType === "pelagic" && !showGeneralPelagic) return false;
    if (spotType === "demersal" && !showGeneralDemersal) return false;

    // Biological groups family checklist filter
    if (checkedFamilies.length > 0 && !checkedFamilies.includes(spotType)) {
      return false;
    }

    // Dynamic species tag filtering
    if (selectedSpecies.length > 0) {
      const matchesSpecies = spot.species.some((s) => selectedSpecies.includes(s));
      if (!matchesSpecies) return false;
    }

    return true;
  });

  // Pass dynamic hold state to visual markers
  const mapHotspots = filteredHotspots.map((spot) => ({
    ...spot,
    isUnsafe: isSafetyHoldActive
  }));

  const labelSailing = isSafetyHoldActive ? t("holdSail") : t("favorableSail");
  const activePool = fuelPools.find((p) => p.id === selectedPoolId);

  return (
    <AuthLayout>
      <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto">
        
        {/* Dynamic Alert Banner: Favorable vs Hold Sail banner */}
        <div
          className={`relative border rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden transition-all duration-300 ${
            isSafetyHoldActive
              ? "bg-rose-50/50 dark:bg-rose-950/15 border-rose-100 dark:border-rose-950/50"
              : "bg-emerald-50/50 dark:bg-emerald-950/15 border-emerald-100 dark:border-emerald-950/50"
          }`}
          id="alert-banner-container"
        >
          {/* Decorative radiating color backdrop indicator */}
          <div
            className={`absolute top-0 right-0 w-80 h-full rounded-full blur-[60px] opacity-15 pointer-events-none ${
              isSafetyHoldActive ? "bg-rose-500" : "bg-emerald-500"
            }`}
          />

          <div className="flex items-start gap-4 z-10 max-w-2xl" id="banner-meta">
            <div
              className={`p-3.5 rounded-2xl shrink-0 ${
                isSafetyHoldActive
                  ? "bg-rose-500 text-white animate-bounce"
                  : "bg-emerald-500 text-white"
              }`}
            >
              {isSafetyHoldActive ? (
                <AlertTriangle className="w-7 h-7" />
              ) : (
                <ShieldCheck className="w-7 h-7" />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Sailing Status
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                <span className="text-[10px] font-black text-gray-400">PAGASA Real-time API</span>
              </div>
              <h2
                className={`font-display font-black text-2xl tracking-tight ${
                  isSafetyHoldActive ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {labelSailing}
              </h2>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-300 leading-relaxed pt-1">
                {isSafetyHoldActive
                  ? "Caution: Local marine telemetry reports wave swell limits exceeding safe margins (>2.0m) or wind gusts exceeding 20 knots. Small motor bancas are highly advised to remain anchored in ports."
                  : "Favorable wind directions (<15 km/h habagat/amihan) and ocean swell levels are optimal. Happy fishing, secure the catch, and sail safe, Captain!"}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 z-10 w-full md:w-auto" id="banner-actions">
            {/* Immediate SOS Distress Trigger button */}
            <button
              onClick={handleTriggerSos}
              className="px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition shadow-md active:scale-95 text-center flex items-center justify-center gap-2 cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4 animate-pulse" />
              <span>{t("sosButton")}</span>
            </button>

            {/* Manual caution override toggle for demo play */}
            <button
              onClick={() => {
                setManualOverrideHold(!manualOverrideHold);
                showToast(
                  `Cooperative safety limits toggled to ${!manualOverrideHold ? "HOLD" : "SAFE"}.`,
                  "info"
                );
              }}
              className="px-4 py-3.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-teal-950 text-xs font-black uppercase tracking-wider rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition text-center text-gray-600 dark:text-gray-300 cursor-pointer"
            >
              Demo: Simulate Caution
            </button>
          </div>
        </div>

        {/* SPLIT SCREEN DASHBOARD GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
          
          {/* LEFT COLUMN: MAP VIEW OR LIST VIEW (Takes 8 columns if collapsed, 5 columns if right panel expanded) */}
          <div className={`space-y-6 ${isAdvisorExpanded ? "lg:col-span-5" : "lg:col-span-8"} transition-all duration-300`}>
            
            {/* Floating switcher controls overlay */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#12211E] p-3 rounded-3xl border border-gray-150/60 dark:border-teal-950/40 shadow-sm">
              <div className="bg-gray-100 dark:bg-zinc-800 p-1 rounded-2xl flex gap-1 shadow-inner">
                <button
                  onClick={() => setMapView(true)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    mapView
                      ? "bg-[#10B981] text-white shadow"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <MapIcon className="w-4 h-4" />
                  <span>Map View</span>
                </button>
                <button
                  onClick={() => setMapView(false)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    !mapView
                      ? "bg-[#10B981] text-white shadow"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <List className="w-4 h-4" />
                  <span>List View</span>
                </button>
              </div>

              {/* Quick Dynamic Safety Pill */}
              <div
                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border transition ${
                  isSafetyHoldActive
                    ? "bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400"
                    : "bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isSafetyHoldActive ? "bg-rose-500 animate-ping" : "bg-emerald-500"}`} />
                <span>{isSafetyHoldActive ? "Caution Advisories" : "Sailing Active"}</span>
              </div>
            </div>

            {/* Main Interactive Screen Segment */}
            <div className="w-full relative min-h-[480px]">
              {mapView ? (
                <div className="h-[520px] rounded-[2rem] overflow-hidden border border-slate-200 dark:border-teal-950 shadow-sm relative">
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
                <div className="bg-white dark:bg-[#12211E] border border-gray-150/80 dark:border-teal-950/60 p-6 rounded-[2rem] shadow-sm space-y-4 max-h-[520px] overflow-y-auto">
                  <div className="flex justify-between items-center border-b border-gray-100 dark:border-teal-950 pb-3">
                    <div>
                      <h3 className="text-sm font-display font-black text-slate-900 dark:text-[#F7FAF9] uppercase tracking-wide">
                        Active Hotspot Coordinates
                      </h3>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                        Showing {filteredHotspots.length} highly localized municipal marine grids.
                      </p>
                    </div>
                    <span className="text-[10px] font-black text-[#10B981] bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1 rounded-full border border-emerald-100/30">
                      {filteredHotspots.length} active spots
                    </span>
                  </div>

                  {filteredHotspots.length === 0 ? (
                    <div className="text-center py-16 space-y-2">
                      <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                      <h4 className="font-display font-black uppercase text-xs text-slate-800 dark:text-gray-200">No Hotspots Match Filters</h4>
                      <p className="text-[10px] text-gray-400 max-w-sm mx-auto font-medium">
                        Try enabling General categories, or clearing active species filters to display coordinates.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredHotspots.map((spot) => (
                        <div
                          key={spot.id}
                          className={`bg-slate-50 dark:bg-teal-950/10 p-4 rounded-2xl border transition-all flex flex-col justify-between shadow-sm relative ${
                            isSafetyHoldActive
                              ? "hover:border-rose-300 border-gray-200/50 dark:border-rose-950/20"
                              : "hover:border-emerald-300 border-gray-200/50 dark:border-emerald-950/20"
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-lg leading-none">{(spot as any).icon || "🐟"}</span>
                              <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">{spot.name}</span>
                            </div>
                            <span className="inline-block text-[9px] font-black text-brand-green bg-brand-green/5 dark:bg-teal-950/30 px-2 py-0.5 rounded uppercase border border-brand-green/10 dark:border-teal-900/40 tracking-wider">
                              Depth: {spot.depth}m
                            </span>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed pt-1">
                              {(spot as any).desc || `Target species group: ${spot.species.join(", ")}`}
                            </p>
                          </div>

                          <div className="flex items-center justify-between border-t border-gray-150/50 dark:border-teal-950/40 pt-2.5 mt-3 text-[10px] font-bold">
                            <span className="text-gray-400">Bearing: {spot.bearing}</span>
                            <span className={`font-black ${isSafetyHoldActive ? "text-rose-500" : "text-emerald-500"}`}>
                              {spot.distance}
                            </span>
                          </div>

                          {/* Top-right safety indicator */}
                          <div className="absolute top-4 right-4">
                            <span className={`w-2 h-2 rounded-full block ${isSafetyHoldActive ? "bg-rose-500" : "bg-emerald-500"}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Secondary: Fuel Discounts Co-op Pools display */}
            <div className="bg-white dark:bg-[#12211E] border border-gray-100 dark:border-teal-950 rounded-[2rem] p-6 md:p-8 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block">
                    Active Co-op Bulk Pools
                  </span>
                  <h4 className="font-display font-black text-lg text-slate-900 dark:text-[#F7FAF9] mt-0.5 flex items-center gap-1.5">
                    <Fuel className="w-5.5 h-5.5 text-brand-green" />
                    Co-op Fuel Savings
                  </h4>
                </div>
                <button
                  onClick={() => {
                    createFuelPool({
                      name: `Fleet Aggregation ${Date.now().toString().slice(-4)}`,
                      targetVolume: 4000,
                      currentVolume: 150,
                      discountPerLiter: 1.5,
                      port: userProfile.port
                    });
                  }}
                  className="px-4 py-2 bg-brand-green hover:bg-brand-green/90 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition cursor-pointer"
                >
                  + Create Co-op Pool
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fuelPools.filter((p) => p.port === userProfile.port).map((pool) => {
                  const personalCommit = pool.commits[userProfile.phone] || 0;
                  return (
                    <div
                      key={pool.id}
                      className="bg-slate-50 dark:bg-teal-950/20 border border-slate-150 dark:border-teal-900/40 p-4 rounded-2xl space-y-2.5 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-gray-800 dark:text-gray-200 truncate max-w-[140px]">
                          {pool.name}
                        </span>
                        <span className="text-[10px] font-extrabold text-brand-green bg-brand-green/10 dark:bg-brand-green/20 px-2.5 py-0.5 rounded-full border border-brand-green/20">
                          -₱{pool.discountPerLiter.toFixed(2)}/L
                        </span>
                      </div>

                      {/* Tier progression bar */}
                      <div className="w-full h-1.5 bg-[#E2E8F0] dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-green"
                          style={{ width: `${(pool.currentVolume / pool.targetVolume) * 100}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[9px] font-bold text-gray-400">
                        <span>{pool.currentVolume.toLocaleString()}L / {pool.targetVolume.toLocaleString()}L</span>
                        <span className="text-gray-600 dark:text-white">{pool.participants} Fishermen</span>
                      </div>

                      <div className="flex items-center justify-between border-t border-gray-150/50 dark:border-teal-950/40 pt-2 text-[10px] font-bold">
                        <span className="text-brand-green">
                          {personalCommit > 0 ? `My order: ${personalCommit}L` : "No order joined"}
                        </span>
                        
                        <button
                          onClick={() => {
                            setSelectedPoolId(pool.id);
                            setFuelCommitLiters(personalCommit > 0 ? personalCommit : 100);
                          }}
                          className="text-brand-green hover:underline font-black uppercase tracking-wider text-[10px]"
                        >
                          {personalCommit > 0 ? "Edit" : "+ Join Co-op"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: COMMAND ADVISORY CONTROL PANEL (Takes 4 columns if collapsed, 7 columns if expanded) */}
          <div className={`space-y-6 ${isAdvisorExpanded ? "lg:col-span-7" : "lg:col-span-4"} transition-all duration-300`}>
            
            <div className="bg-white dark:bg-[#12211E] border border-gray-150/80 dark:border-teal-950/60 rounded-[2rem] p-6 md:p-8 shadow-sm space-y-6">
              
              {/* TOP ADVISORY PANEL HEADER */}
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-teal-950 pb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAdvisorExpanded(!isAdvisorExpanded)}
                    className="hidden lg:flex items-center justify-center p-1.5 rounded-xl border border-gray-200 dark:border-teal-900 hover:border-brand-green bg-white dark:bg-zinc-800 text-brand-black dark:text-white transition shadow-sm cursor-pointer"
                    title={isAdvisorExpanded ? "Collapse panel" : "Expand panel"}
                  >
                    {isAdvisorExpanded ? (
                      <ChevronRight className="w-4 h-4 text-brand-green stroke-[2.5]" />
                    ) : (
                      <ChevronLeft className="w-4 h-4 text-brand-green stroke-[2.5]" />
                    )}
                  </button>
                  <Compass className="w-5 h-5 text-brand-green animate-spin-slow" />
                  <h2 className="font-display font-black text-sm uppercase tracking-wider text-slate-900 dark:text-[#F7FAF9]">
                    Municipal Advisor
                  </h2>
                </div>

                {/* Localized Language Switcher */}
                <button
                  onClick={() => changeLanguage(language === "en" ? "tl" : "en")}
                  className="flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-800 border border-gray-200 dark:border-teal-950 px-3 py-1.5 rounded-full text-[10px] font-black text-slate-800 dark:text-white transition shadow-sm cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5 text-brand-green" />
                  <span>{language === "en" ? "ENGLISH" : "FILIPINO"}</span>
                </button>
              </div>

              {/* 1. MARINE SAFETY STATUS PILL */}
              <button
                onClick={() => setManualOverrideHold(!manualOverrideHold)}
                className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all text-left shadow-sm cursor-pointer ${
                  isSafetyHoldActive
                    ? "bg-rose-50/50 border-rose-200 text-rose-900 dark:bg-rose-950/20 dark:border-rose-900"
                    : "bg-emerald-50/50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl text-white ${isSafetyHoldActive ? "bg-brand-red animate-pulse" : "bg-brand-green"}`}>
                    {isSafetyHoldActive ? <ShieldAlert className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest block opacity-60">Marine Safety Condition</span>
                    <span className="font-display font-black text-xs uppercase tracking-wider block mt-0.5 text-slate-800 dark:text-white">
                      {labelSailing}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block text-[9px] font-black bg-black/5 dark:bg-zinc-800 hover:bg-black/10 px-2.5 py-1 rounded-md uppercase text-brand-black/70 dark:text-white tracking-widest border border-black/10">
                    Hold Toggle
                  </span>
                </div>
              </button>

              {/* STATS COUNT OVERVIEW */}
              <div className="bg-slate-50 dark:bg-teal-950/10 p-3.5 rounded-2xl border border-gray-200/50 dark:border-teal-900/30 flex items-center justify-between text-[11px] font-bold">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-gray-300">
                  <TrendingUp className="w-4 h-4 text-brand-green" />
                  <span>Target Species Match: <strong className="text-slate-900 dark:text-white font-extrabold">{filteredHotspots.length}</strong></span>
                </div>
                <span className="text-gray-400 uppercase tracking-wider text-[9px]">
                  Safe Limit: Swell 2.0m / Wind 20kt
                </span>
              </div>

              {/* 2. BASE STATION DETAILS CARD */}
              <div className="bg-[#EEF5F3]/50 dark:bg-teal-950/10 border border-emerald-100/40 dark:border-teal-950/50 rounded-2xl p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Base Reference Station</span>
                  <h3 className="text-xs font-display font-black uppercase text-slate-800 dark:text-[#F7FAF9] leading-tight">{userProfile.port}</h3>
                  <p className="text-[10px] font-semibold text-gray-400">
                    Lat: {(userProfile.lat ?? 14.0122).toFixed(4)}° N | Lng: {(userProfile.lng ?? 123.0114).toFixed(4)}° E
                  </p>
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-brand-green/10 border border-brand-green/20 text-brand-green shrink-0">
                  ONLINE
                </span>
              </div>

              {/* 3. SPECIES FILTER CONTROLS */}
              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-teal-950 pb-2">
                  <h3 className="font-display font-black text-xs uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-brand-green" />
                    <span>Species Filters</span>
                  </h3>
                  <button
                    onClick={() => {
                      setCheckedFamilies([]);
                      setActiveTab("both");
                      setShowGeneralPelagic(true);
                      setShowGeneralDemersal(true);
                      setSelectedSpecies([]);
                    }}
                    className="text-[10px] font-black uppercase text-brand-green hover:underline cursor-pointer"
                  >
                    Reset All
                  </button>
                </div>

                {/* Category Switch Tabs */}
                <div className="bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl flex gap-1 shadow-inner">
                  {(["pelagic", "demersal", "both"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                        activeTab === tab
                          ? "bg-white dark:bg-zinc-900 text-slate-800 dark:text-white shadow-sm"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      {tab === "both" ? "Both" : tab}
                    </button>
                  ))}
                </div>

                {/* General category visibility eye switches */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowGeneralPelagic(!showGeneralPelagic)}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                      showGeneralPelagic
                        ? "bg-brand-green/5 border-brand-green text-brand-green font-extrabold"
                        : "bg-white border-gray-200 text-gray-400 dark:bg-zinc-900 dark:border-teal-950"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <span className="text-[9px] block opacity-75">PELAGIC GRIDS</span>
                      <span className="text-[11px] block text-slate-800 dark:text-white">Pelagic Spots</span>
                    </div>
                    {showGeneralPelagic ? <Eye className="w-4 h-4 text-brand-green" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => setShowGeneralDemersal(!showGeneralDemersal)}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                      showGeneralDemersal
                        ? "bg-brand-green/5 border-brand-green text-brand-green font-extrabold"
                        : "bg-white border-gray-200 text-gray-400 dark:bg-zinc-900 dark:border-teal-950"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <span className="text-[9px] block opacity-75">DEMERSAL GRIDS</span>
                      <span className="text-[11px] block text-slate-800 dark:text-white">Demersal Spots</span>
                    </div>
                    {showGeneralDemersal ? <Eye className="w-4 h-4 text-brand-green" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>

                {/* Species Groups and checkboxes */}
                <div className="space-y-2 border border-gray-150/80 dark:border-teal-950/50 p-3.5 rounded-2xl bg-slate-50/50 dark:bg-teal-950/10">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                    Biological Species Categories
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SPECIES_FAMILIES.map((family) => {
                      const isChecked = checkedFamilies.includes(family.id);
                      return (
                        <button
                          key={family.id}
                          onClick={() => toggleFamilyCheckbox(family.id)}
                          className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                            isChecked
                              ? "bg-white dark:bg-zinc-900 border-brand-green text-brand-green font-bold"
                              : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 dark:bg-zinc-800 dark:border-teal-950"
                          }`}
                        >
                          <div className="truncate pr-1">
                            <div className="text-[11px] leading-tight truncate">{family.label}</div>
                            <div className="text-[9px] opacity-60 leading-none truncate mt-0.5">{family.local}</div>
                          </div>
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              isChecked ? "border-brand-green bg-brand-green text-white" : "border-gray-300"
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[2.5]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Specific Species Tags list */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">
                    Tag Filtering (Species Target List)
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {allSpeciesList.map((sp) => {
                      const isSelected = selectedSpecies.includes(sp);
                      return (
                        <button
                          key={sp}
                          onClick={() => handleSpeciesToggle(sp)}
                          className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wide border transition cursor-pointer ${
                            isSelected
                              ? "bg-brand-green/10 text-brand-green border-brand-green/20"
                              : "bg-gray-50 border-gray-200 text-gray-400 dark:bg-zinc-800 dark:border-teal-950 hover:bg-gray-100 dark:hover:bg-zinc-700"
                          }`}
                        >
                          {sp}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 4. SEA & WEATHER METRICS GRID */}
              <div className="space-y-3.5 border-t border-gray-100 dark:border-teal-950 pt-5">
                <div className="flex justify-between items-center">
                  <h3 className="font-display font-black text-xs uppercase tracking-widest text-slate-900 dark:text-white">
                    Live Telemetry Sensors
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleVoiceAssist}
                      className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                        isSpeaking
                          ? "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900"
                          : "bg-brand-green/10 border-brand-green/20 text-brand-green dark:bg-brand-green/20"
                      }`}
                    >
                      {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      <span>{isSpeaking ? "Stop Voice" : t("voiceAssist")}</span>
                    </button>
                    <button
                      onClick={refreshWeather}
                      className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-teal-950 rounded-full transition cursor-pointer"
                      title="Refresh sensors"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* Wind speed metric */}
                  <div className="bg-slate-50 dark:bg-teal-950/10 p-3.5 rounded-2xl border border-gray-200/50 dark:border-teal-900/30">
                    <Wind className="w-4 h-4 text-brand-green mb-1.5" />
                    <span className="text-[9px] font-black text-gray-400 uppercase block leading-tight">Wind Speed</span>
                    <span className="text-xs font-black text-slate-800 dark:text-white block mt-0.5">{weather.windSpeed} km/h</span>
                  </div>

                  {/* Wave height metric (highlight red if unsafe) */}
                  <div
                    className={`p-3.5 rounded-2xl border transition-colors ${
                      weather.waveHeight >= 2.0
                        ? "bg-rose-50 border-rose-200 text-rose-950 dark:bg-rose-950/20 dark:border-rose-900"
                        : "bg-slate-50 border-gray-200/50 text-slate-800 dark:bg-teal-950/10 dark:border-teal-900/30 dark:text-white"
                    }`}
                  >
                    <Waves className={`w-4 h-4 mb-1.5 ${weather.waveHeight >= 2.0 ? "text-brand-red animate-bounce" : "text-brand-green"}`} />
                    <span className="text-[9px] font-black uppercase block leading-tight opacity-75">Wave Height</span>
                    <span className={`text-xs font-black block mt-0.5 ${weather.waveHeight >= 2.0 ? "text-rose-500" : ""}`}>
                      {weather.waveHeight.toFixed(1)}m
                    </span>
                  </div>

                  {/* Storm signal */}
                  <div className="bg-slate-50 dark:bg-teal-950/10 p-3.5 rounded-2xl border border-gray-200/50 dark:border-teal-900/30">
                    <ShieldAlert className="w-4 h-4 text-brand-green mb-1.5" />
                    <span className="text-[9px] font-black text-gray-400 uppercase block leading-tight">Storm Signal</span>
                    <span className="text-xs font-black text-slate-800 dark:text-white block mt-0.5">Signal #{weather.stormSignal}</span>
                  </div>

                  {/* Sea Temp */}
                  <div className="bg-slate-50 dark:bg-teal-950/10 p-3.5 rounded-2xl border border-gray-200/50 dark:border-teal-900/30">
                    <Compass className="w-4 h-4 text-brand-green mb-1.5" />
                    <span className="text-[9px] font-black text-gray-400 uppercase block leading-tight">Sea Temp</span>
                    <span className="text-xs font-black text-slate-800 dark:text-white block mt-0.5">{weather.temp}°C</span>
                  </div>

                  {/* Tide level */}
                  <div className="bg-slate-50 dark:bg-teal-950/10 p-3.5 rounded-2xl border border-gray-200/50 dark:border-teal-900/30 col-span-2 sm:col-span-1">
                    <Compass className="w-4 h-4 text-brand-green mb-1.5" />
                    <span className="text-[9px] font-black text-gray-400 uppercase block leading-tight">Tide Level</span>
                    <span className="text-xs font-black text-slate-800 dark:text-white block mt-0.5">{weather.tide}</span>
                  </div>
                </div>
              </div>

              {/* 5. CATCH FEEDBACK WIDGET */}
              <div className="border-t border-gray-100 dark:border-teal-950 pt-5 space-y-3.5">
                <h3 className="font-display font-black text-xs uppercase tracking-widest text-slate-900 dark:text-white">
                  Cooperative Model Calibration
                </h3>
                <div className="bg-slate-50 dark:bg-teal-950/10 p-4 rounded-2xl border border-gray-200/50 dark:border-teal-900/30 space-y-1">
                  <span className="text-[9px] font-black text-brand-green bg-brand-green/10 dark:bg-teal-950/20 px-2 py-0.5 rounded border border-brand-green/20 uppercase tracking-widest">
                    AUTOMATED CALIBRATION SURVEY
                  </span>
                  <p className="text-xs text-slate-700 dark:text-gray-300 leading-relaxed font-semibold pt-1">
                    Help calibrate the Parola deep-learning hotspot maps. How was your catch volume at your selected port today?
                  </p>
                </div>

                {submittedFeedback ? (
                  <div className="bg-emerald-500 text-white border border-emerald-600 p-4 rounded-2xl text-center font-black text-xs uppercase tracking-widest animate-fade-in">
                    Feedback Sent: &quot;{submittedFeedback}&quot; Volume
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      onClick={() => handleFeedback("1")}
                      className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-teal-950 hover:border-brand-green hover:bg-brand-green/5 py-3 rounded-xl font-bold text-xs text-slate-800 dark:text-white transition-all text-center cursor-pointer active:scale-95 shadow-sm"
                    >
                      [1] High
                    </button>
                    <button
                      onClick={() => handleFeedback("2")}
                      className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-teal-950 hover:border-brand-green hover:bg-brand-green/5 py-3 rounded-xl font-bold text-xs text-slate-800 dark:text-white transition-all text-center cursor-pointer active:scale-95 shadow-sm"
                    >
                      [2] Medium
                    </button>
                    <button
                      onClick={() => handleFeedback("3")}
                      className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-teal-950 hover:border-brand-green hover:bg-brand-green/5 py-3 rounded-xl font-bold text-xs text-slate-800 dark:text-white transition-all text-center cursor-pointer active:scale-95 shadow-sm"
                    >
                      [3] Low
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Emergency SOS Distress Safety Lock Overlay */}
      {isSosActive && (
        <div className="fixed inset-0 bg-[#D32F2F]/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-white dark:bg-[#12211E] rounded-[2.5rem] p-8 md:p-12 text-center space-y-6 shadow-2xl border-4 border-[#D32F2F]">
            
            <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 mx-auto animate-bounce">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="font-display font-black text-3xl text-rose-600 dark:text-rose-400 tracking-tight">
                {sosTransponding ? "SOS ACTIVE — BROADCASTING" : "TRANSPONDING SOS DISTRESS"}
              </h1>
              <p className="text-xs text-gray-400 font-bold max-w-sm mx-auto leading-relaxed">
                {sosTransponding
                  ? "Transponder beacons are actively broadcasting distress signal coordinates over all coastal networks."
                  : "Your GPS transponder is establishing satellite coordinates. Coastal guard base will receive the cellular distress payload in:"}
              </p>
            </div>

            {!sosTransponding ? (
              <div className="text-6xl font-black text-rose-600 select-none animate-pulse">
                {sosCountdown}
              </div>
            ) : (
              <div className="bg-rose-50/50 dark:bg-rose-950/15 border border-rose-100 dark:border-rose-950/40 p-4 rounded-2xl text-left space-y-2 max-w-md mx-auto">
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider block">
                  Simulated distress SMS payload
                </span>
                <p className="text-xs font-bold text-rose-800 dark:text-rose-300 font-mono leading-relaxed bg-white dark:bg-zinc-900 p-3 rounded-xl border border-rose-100/30">
                  {`[PAROLA DISTRESS SOS] Vessel ${userProfile.vesselName} (License ${userProfile.licenseNo}) is in distress at ${userProfile.lat.toFixed(4)} N, ${userProfile.lng.toFixed(4)} E. Current telemetry: Wind speed ${weather.windSpeed} k/h, wave heights ${weather.waveHeight}m.`}
                </p>
              </div>
            )}

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCancelSos}
                className="flex-1 bg-[#12211E] hover:bg-black text-white font-black text-xs uppercase tracking-widest py-4 rounded-2xl transition cursor-pointer"
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
          <div className="space-y-6">
            <div className="bg-brand-green/10 dark:bg-brand-green/20 border border-brand-green/20 p-4 rounded-2xl">
              <div className="flex justify-between text-xs font-bold text-gray-500">
                <span>Co-op Target:</span>
                <span className="text-brand-green font-black">{activePool.targetVolume.toLocaleString()} Liters</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-gray-500 mt-1">
                <span>Current Volume:</span>
                <span className="text-brand-green font-black">{activePool.currentVolume.toLocaleString()} Liters</span>
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
                  className="w-full bg-slate-50 dark:bg-teal-950/20 border-2 border-slate-200 dark:border-teal-900 rounded-2xl h-12 px-4 text-sm font-semibold focus:outline-none focus:border-brand-green"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-brand-green">
                  Liters
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-bold">
                * Commitments can be adjusted before the closing date. Estimated discount is based on volume tier achieve metrics.
              </p>
            </div>

            {/* Interactive Progressive bar preview */}
            <div className="border-t border-gray-50 dark:border-teal-950 pt-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2">
                Simulated tier progression
              </span>
              <TierProgressBar
                currentVolume={activePool.currentVolume + (fuelCommitLiters - (activePool.commits[userProfile.phone] || 0))}
                targetVolume={activePool.targetVolume}
              />
            </div>

            <div className="pt-4 flex gap-3">
              <button
                onClick={() => setSelectedPoolId(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-white font-black text-xs uppercase tracking-widest py-3 rounded-2xl transition cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  addFuelCommit(activePool.id, fuelCommitLiters);
                  setSelectedPoolId(null);
                }}
                className="flex-1 bg-brand-green hover:bg-brand-green/90 text-white font-black text-xs uppercase tracking-widest py-3 rounded-2xl transition cursor-pointer"
              >
                Confirm Order
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AuthLayout>
  );
}
