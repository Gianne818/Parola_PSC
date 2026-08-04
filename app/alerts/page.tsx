"use client";

import React, { useState } from "react";
import { AuthLayout } from "../../components/layouts/AuthLayout";
import { useApp } from "../../context/AppContext";
import { useTranslation } from "../../hooks/use-translation";
import { analyzeHotspots, formatConciseSmsAdvisory } from "../../utils/hotspotCalculator";
import { calculateSmsSegments } from "../../services/iprogSmsService";
import {
  Bell,
  Target,
  ShieldAlert,
  Smartphone,
  Check,
  Send,
  Radio,
  RefreshCw,
  CheckCircle2,
  Sliders,
  AlertTriangle,
  Compass,
  MapPin,
  ExternalLink,
  Waves,
  Wind,
  Zap
} from "lucide-react";

export default function AlertsPage() {
  const {
    userProfile,
    updateProfile,
    language,
    weather,
    hotspots,
    showToast
  } = useApp();

  const { t } = useTranslation(language);

  // SMS Alert Channels Toggles
  const [hazardousWeatherAlerts, setHazardousWeatherAlerts] = useState(true);
  const [fuelPoolMilestones, setFuelPoolMilestones] = useState(true);

  // Target Biological Families Selection
  const [pelagicSelected, setPelagicSelected] = useState(true);
  const [demersalSelected, setDemersalSelected] = useState(false);

  // Safety Threshold States (Sliders)
  const [waveThreshold, setWaveThreshold] = useState<number>(2.0);
  const [windThreshold, setWindThreshold] = useState<number>(20);

  // Model Filter State for Hotspot Calculator & SMS
  const [modelFilter, setModelFilter] = useState<'pelagic' | 'demersal' | 'both'>('pelagic');

  // SMS Simulation State
  const [smsSending, setSmsSending] = useState(false);
  const [lastSmsResult, setLastSmsResult] = useState<any>(null);

  // Compute Hotspot Metrics dynamically using Haversine & Catch Efficiency Ratio
  const currentLat = userProfile?.lat || 14.0122;
  const currentLng = userProfile?.lng || 123.0114;

  // Always compute both pelagic & demersal independently
  const pelagicAnalysis = analyzeHotspots(currentLat, currentLng, hotspots, 'pelagic');
  const demersalAnalysis = analyzeHotspots(currentLat, currentLng, hotspots, 'demersal');
  // For single-model views, use the selected filter
  const singleAnalysis = analyzeHotspots(currentLat, currentLng, hotspots, modelFilter);

  const nearestSpot = singleAnalysis.nearestHotspot;
  const topEfficiencySpot = singleAnalysis.highestEfficiencyHotspot;
  const targetHotspot = nearestSpot || topEfficiencySpot;

  // Generate concise SMS message(s)
  const waveVal = weather?.waveHeight ?? 1.2;
  const windVal = weather?.windSpeed ?? 14.5;
  const vessel = userProfile?.vesselName || "Ka-Isda";
  const portName = userProfile?.port || "Brgy Pasil";

  const noHotspotFallback = `Parola Advisory:\nNo active hotspots detected.\nWaves: ${waveVal}m, Wind: ${windVal}kph`;

  // When 'both', generate two separate SMS messages (pelagic + demersal)
  const pelagicTarget = pelagicAnalysis.nearestHotspot || pelagicAnalysis.highestEfficiencyHotspot;
  const demersalTarget = demersalAnalysis.nearestHotspot || demersalAnalysis.highestEfficiencyHotspot;

  const pelagicSmsText = pelagicTarget
    ? `[PELAGIC]\n` + formatConciseSmsAdvisory(vessel, portName, pelagicTarget, waveVal, windVal)
    : `[PELAGIC]\n` + noHotspotFallback;
  const demersalSmsText = demersalTarget
    ? `[DEMERSAL]\n` + formatConciseSmsAdvisory(vessel, portName, demersalTarget, waveVal, windVal)
    : `[DEMERSAL]\n` + noHotspotFallback;

  const generatedSmsText = modelFilter === 'both'
    ? pelagicSmsText  // primary preview; both are sent
    : targetHotspot
      ? formatConciseSmsAdvisory(vessel, portName, targetHotspot, waveVal, windVal)
      : noHotspotFallback;

  const smsSegmentDetails = calculateSmsSegments(generatedSmsText);

  const handleApplyVariables = async () => {
    try {
      // Determine species target string
      let species: "both" | "pelagic" | "demersal" = "both";
      if (pelagicSelected && !demersalSelected) species = "pelagic";
      if (!pelagicSelected && demersalSelected) species = "demersal";

      await updateProfile({
        ...userProfile,
        speciesPreference: species
      });

      showToast("Alert preferences and safety thresholds updated!", "success");
    } catch (err: any) {
      console.warn("Failed to apply alert settings:", err);
      showToast("Failed to apply settings.", "error");
    }
  };


  const sendSms = async (recipientPhone: string, message: string) => {
    const response = await fetch("/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipient: recipientPhone, message, category: "weather" })
    });
    let data: any;
    try { data = await response.json(); } catch { throw new Error("API returned invalid JSON response."); }
    if (!response.ok || data?.error) throw new Error(data?.error || "Failed to dispatch SMS");
    return data;
  };

  const handleSimulateSmsAdvisory = async () => {
    setSmsSending(true);
    setLastSmsResult(null);

    try {
      const recipientPhone = userProfile?.phone || "09171234567";

      if (modelFilter === 'both') {
        // Send pelagic SMS first, then demersal
        const pelagicResult = await sendSms(recipientPhone, pelagicSmsText);
        const demersalResult = await sendSms(recipientPhone, demersalSmsText);
        // Store combined result for display
        setLastSmsResult({ ...demersalResult, dualMode: true, pelagicResult });
        const modeLabel = pelagicResult.mode === "MOCK_DRY_RUN" ? "[DRY-RUN] " : "";
        showToast(`${modeLabel}2 SMS Advisories Dispatched (Pelagic + Demersal) to ${pelagicResult.recipientFormatted || recipientPhone}!`, "success");
      } else {
        const data = await sendSms(recipientPhone, generatedSmsText);
        setLastSmsResult(data);
        showToast(
          data.mode === "MOCK_DRY_RUN"
            ? `[DRY-RUN] SMS Advisory Simulated to ${data.recipientFormatted || recipientPhone}!`
            : `SMS Advisory Dispatched to ${data.recipientFormatted || recipientPhone}!`,
          "success"
        );
      }
    } catch (err: any) {
      showToast(err?.message || "Failed to send SMS advisory", "error");
    } finally {
      setSmsSending(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6 pb-16 pt-4 max-w-5xl mx-auto">

        {/* Page Header with 4-Language Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 rounded-2xl text-[#00B074]">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display font-[900] text-2xl sm:text-3xl tracking-tight text-slate-900">
                ALERTS & SAFETY CONFIGURATION
              </h1>
              <p className="text-xs font-semibold text-gray-400 mt-0.5">
                Central hub for configuring notification delivery, ocean safety limits, species targeting, and PAGASA weather advisories.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* 4-Language Selection Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200">
              {(["en", "tl", "ceb", "hil"] as const).map((code) => {
                const labels = { en: "EN 🇺🇸", tl: "TL 🇵🇭", ceb: "CEB 🇵🇭", hil: "HIL 🇵🇭" };
                const isSel = language === code;
                return (
                  <button
                    key={code}
                    onClick={() => updateProfile({ ...userProfile })} // Trigger re-render with language
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase transition cursor-pointer ${
                      isSel ? "bg-[#00B074] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {labels[code]}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleApplyVariables}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#00B074] hover:bg-[#009B66] text-white font-black text-xs uppercase tracking-wider transition shadow-sm active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>APPLY SETTINGS</span>
            </button>
          </div>
        </div>

        {/* CONSOLIDATED SINGLE CARD CONTAINING ALL ALERT & SAFETY SETTINGS */}
        <div className="mt-4 sm:mt-6 bg-white border border-gray-200/80 rounded-[2rem] p-6 sm:p-8 shadow-md space-y-8">

          {/* ============================================================ */}
          {/* SECTION 1: SMS ALERT CHANNELS */}
          {/* ============================================================ */}
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-50 rounded-xl text-[#00B074] mt-0.5">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-display font-black text-sm uppercase tracking-wider text-slate-900">
                  SMS ALERT CHANNELS
                </h2>
                <p className="text-xs font-semibold text-gray-400 mt-0.5">
                  Select which broadcast notifications and milestone updates you wish to receive directly via SMS on your registered phone.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Switch 1: Hazardous Weather Alerts */}
              <div className="flex items-center justify-between p-4.5 bg-slate-50 border border-gray-200/80 rounded-2xl">
                <div className="space-y-0.5 pr-3">
                  <h3 className="font-display font-black text-xs text-slate-900 uppercase">
                    HAZARDOUS WEATHER ALERTS
                  </h3>
                  <p className="text-[11px] font-semibold text-gray-400">
                    Immediate broadcast warnings for storms, high swells, and sea hazards.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-black uppercase tracking-wider ${hazardousWeatherAlerts ? "text-[#00B074]" : "text-gray-400"}`}>
                    {hazardousWeatherAlerts ? "ON" : "OFF"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setHazardousWeatherAlerts(!hazardousWeatherAlerts)}
                    className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      hazardousWeatherAlerts ? "bg-[#00B074]" : "bg-slate-300"
                    }`}
                    aria-label="Toggle Hazardous Weather Alerts"
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                        hazardousWeatherAlerts ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Switch 2: Fuel Pool Milestones */}
              <div className="flex items-center justify-between p-4.5 bg-slate-50 border border-gray-200/80 rounded-2xl">
                <div className="space-y-0.5 pr-3">
                  <h3 className="font-display font-black text-xs text-slate-900 uppercase">
                    FUEL POOL MILESTONES
                  </h3>
                  <p className="text-[11px] font-semibold text-gray-400">
                    Notifications when bulk diesel volume targets are near completion.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-black uppercase tracking-wider ${fuelPoolMilestones ? "text-[#00B074]" : "text-gray-400"}`}>
                    {fuelPoolMilestones ? "ON" : "OFF"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFuelPoolMilestones(!fuelPoolMilestones)}
                    className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      fuelPoolMilestones ? "bg-[#00B074]" : "bg-slate-300"
                    }`}
                    aria-label="Toggle Fuel Pool Milestones"
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                        fuelPoolMilestones ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* DIVIDER */}
          <hr className="border-t border-gray-100" />

          {/* ============================================================ */}
          {/* SECTION: OFFLINE GOOGLE MAPS INSTRUCTIONS FOR FISHERMEN */}
          {/* ============================================================ */}
          <div className="space-y-4 bg-gradient-to-br from-[#EEF5F3] via-emerald-50/50 to-teal-50/60 p-5 sm:p-6 rounded-2xl border border-emerald-200/80 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-[#00B074] rounded-xl text-white shadow-xs shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-black text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2 flex-wrap">
                  <span>How to Download Offline Maps for Sea Navigation</span>
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-100 text-[#00B074] border border-emerald-200">
                    Google Maps Guide
                  </span>
                </h2>
                <p className="text-xs font-semibold text-gray-500 mt-0.5">
                  Cell signal often drops at sea. Download your area map on Google Maps before sailing so your map works everywhere offline!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1 text-xs">
              {/* Step 1 */}
              <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-2xs space-y-1.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-black text-[#00B074] text-xs">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-[10px] font-black border border-emerald-200">1</span>
                    <span>Open Google Maps</span>
                  </div>
                  <p className="text-[11px] font-medium text-gray-600 mt-1 leading-snug">
                    Open the <strong>Google Maps</strong> app on your smartphone before leaving your home port.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-2xs space-y-1.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-black text-[#00B074] text-xs">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-[10px] font-black border border-emerald-200">2</span>
                    <span>Tap Profile Icon</span>
                  </div>
                  <p className="text-[11px] font-medium text-gray-600 mt-1 leading-snug">
                    Tap your <strong>Profile Picture</strong> or account icon in the top right corner of the screen.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-2xs space-y-1.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-black text-[#00B074] text-xs">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-[10px] font-black border border-emerald-200">3</span>
                    <span>Select Offline Maps</span>
                  </div>
                  <p className="text-[11px] font-medium text-gray-600 mt-1 leading-snug">
                    Tap <strong>Offline maps</strong> from the menu, then tap <strong>SELECT YOUR OWN MAP</strong>.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-2xs space-y-1.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-black text-[#00B074] text-xs">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-[10px] font-black border border-emerald-200">4</span>
                    <span>Download Area</span>
                  </div>
                  <p className="text-[11px] font-medium text-gray-600 mt-1 leading-snug">
                    Move the box over your fishing area and home port, then tap <strong>Download</strong>. Done!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* DIVIDER */}
          <hr className="border-t border-gray-100" />

          {/* ============================================================ */}
          {/* SECTION 2: TARGET BIOLOGICAL FAMILIES */}
          {/* ============================================================ */}
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-50 rounded-xl text-[#00B074] mt-0.5">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-display font-black text-sm uppercase tracking-wider text-slate-900">
                  TARGET BIOLOGICAL FAMILIES
                </h2>
                <p className="text-xs font-semibold text-gray-400 mt-0.5">
                  Specify your vessel's target species groups to focus radar satellite upwellings and automated advisory SMS alerts.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Pelagic Checkbox Card */}
              <label
                className="flex items-center justify-between p-4 border border-gray-200/80 rounded-2xl bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition select-none"
              >
                <div>
                  <span className="font-display font-black text-xs text-slate-800 block">
                    Surface & Open Water
                  </span>
                  <span className="text-[10px] font-bold text-[#00B074] block mt-0.5">
                    Pelagic Species (Tamban, Tulingan, Galunggong)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={pelagicSelected}
                  onChange={(e) => setPelagicSelected(e.target.checked)}
                  className="w-4.5 h-4.5 rounded border-gray-300 text-[#00B074] focus:ring-[#00B074] cursor-pointer"
                />
              </label>

              {/* Demersal Checkbox Card */}
              <label
                className="flex items-center justify-between p-4 border border-gray-200/80 rounded-2xl bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition select-none"
              >
                <div>
                  <span className="font-display font-black text-xs text-slate-800 block">
                    Bottom & Reef Fish
                  </span>
                  <span className="text-[10px] font-bold text-[#00B074] block mt-0.5">
                    Demersal Species (Lapu-lapu, Maya-maya, Bisugo)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={demersalSelected}
                  onChange={(e) => setDemersalSelected(e.target.checked)}
                  className="w-4.5 h-4.5 rounded border-gray-300 text-[#00B074] focus:ring-[#00B074] cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* DIVIDER */}
          <hr className="border-t border-gray-100" />

          {/* ============================================================ */}
          {/* SECTION 3: MARINE SAFETY THRESHOLDS */}
          {/* ============================================================ */}
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-50 rounded-xl text-[#00B074] mt-0.5">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-display font-black text-sm uppercase tracking-wider text-slate-900">
                  MARINE SAFETY THRESHOLDS
                </h2>
                <p className="text-xs font-semibold text-gray-400 mt-0.5">
                  Define custom maximum wave and wind limits. Exceeding these limits will highlight map coordinates as unsafe for your banca.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
              {/* Wave Height Limit Slider */}
              <div className="space-y-3 bg-slate-50 border border-gray-200/80 rounded-2xl p-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                    Wave Height Limit
                  </label>
                  <span className="text-xs font-black text-[#00B074] bg-white px-2.5 py-1 rounded-full border border-gray-200">
                    {waveThreshold.toFixed(1)} meters
                  </span>
                </div>

                <input
                  type="range"
                  min={0.5}
                  max={5.0}
                  step={0.1}
                  value={waveThreshold}
                  onChange={(e) => setWaveThreshold(parseFloat(e.target.value))}
                  style={{
                    background: `linear-gradient(to right, #00B074 0%, #00B074 ${((waveThreshold - 0.5) / 4.5) * 100}%, #E2E8F0 ${((waveThreshold - 0.5) / 4.5) * 100}%, #E2E8F0 100%)`
                  }}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#00B074]"
                />

                <p className="text-[10px] font-bold text-gray-400">
                  Swells above {waveThreshold.toFixed(1)}m will automatically flag coordinates with "Caution / Hold Sailing" warnings.
                </p>
              </div>

              {/* Wind Speed Limit Slider */}
              <div className="space-y-3 bg-slate-50 border border-gray-200/80 rounded-2xl p-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                    Wind Speed Limit
                  </label>
                  <span className="text-xs font-black text-[#00B074] bg-white px-2.5 py-1 rounded-full border border-gray-200">
                    {windThreshold} knots
                  </span>
                </div>

                <input
                  type="range"
                  min={5}
                  max={50}
                  step={1}
                  value={windThreshold}
                  onChange={(e) => setWindThreshold(parseInt(e.target.value))}
                  style={{
                    background: `linear-gradient(to right, #00B074 0%, #00B074 ${((windThreshold - 5) / 45) * 100}%, #E2E8F0 ${((windThreshold - 5) / 45) * 100}%, #E2E8F0 100%)`
                  }}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#00B074]"
                />

                <p className="text-[10px] font-bold text-gray-400">
                  Winds exceeding {windThreshold} knots trigger severe weather alert banners across your dashboard.
                </p>
              </div>
            </div>

            {/* PAGASA Weather Broadcast Card */}
            <div className={`mt-2 p-5 rounded-2xl border space-y-4 ${
              weather.waveHeight >= 2.0 || weather.stormSignal > 0
                ? "bg-gradient-to-br from-rose-50 to-amber-50 border-rose-200"
                : "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200"
            }`}>

              {/* Live telemetry row */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-black text-sm uppercase tracking-wider text-slate-900">
                    PAGASA Weather Broadcast
                  </h3>
                  <p className="text-[11px] font-semibold text-gray-400 mt-0.5">
                    Send a live weather advisory or gale warning directly to your registered phone number via SMS.
                  </p>
                </div>
                <span className={`shrink-0 text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${
                  weather.waveHeight >= 2.0 || weather.stormSignal > 0
                    ? "bg-rose-100 text-rose-700 border-rose-200 animate-pulse"
                    : "bg-emerald-100 text-emerald-700 border-emerald-200"
                }`}>
                  {weather.waveHeight >= 2.0 || weather.stormSignal > 0 ? "⚠️ DANGEROUS" : "✓ FAVORABLE"}
                </span>
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/80 rounded-xl p-3 text-center border border-white shadow-xs">
                  <Waves className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                  <span className="text-sm font-black text-slate-900 block">{weather.waveHeight.toFixed(1)} m</span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase">Wave Height</span>
                </div>
                <div className="bg-white/80 rounded-xl p-3 text-center border border-white shadow-xs">
                  <Wind className="w-4 h-4 mx-auto mb-1 text-sky-500" />
                  <span className="text-sm font-black text-slate-900 block">{weather.windSpeed} km/h</span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase">Wind Speed</span>
                </div>
                <div className="bg-white/80 rounded-xl p-3 text-center border border-white shadow-xs">
                  <ShieldAlert className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                  <span className="text-sm font-black text-slate-900 block">Signal {weather.stormSignal}</span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase">Storm Signal</span>
                </div>
              </div>

              {/* Condition summary */}
              <p className={`text-xs font-semibold leading-relaxed ${
                weather.waveHeight >= 2.0 || weather.stormSignal > 0
                  ? "text-rose-700"
                  : "text-emerald-700"
              }`}>
                {weather.waveHeight >= 2.0 || weather.stormSignal > 0
                  ? `⚠️ Dangerous sea conditions detected. Wave height ${weather.waveHeight.toFixed(1)}m with Storm Signal ${weather.stormSignal}. Small crafts and bancas are advised NOT to sail. Send a gale warning SMS to your registered phone number immediately.`
                  : `Sea conditions are within safe operating limits for small crafts. Wave height ${weather.waveHeight.toFixed(1)}m and wind speed ${weather.windSpeed} km/h are below danger thresholds. You may send a routine weather update SMS to your registered phone number.`
                }
              </p>

              {/* Broadcast button */}
              <button
                type="button"
                onClick={async () => {
                  const isDangerous = weather.waveHeight >= 2.0 || weather.stormSignal > 0;
                  const msg = isDangerous
                    ? `[PAGASA WEATHER ALERT] ⚠️ DANGEROUS CONDITIONS at ${userProfile?.port || 'your area'}: Wave height ${weather.waveHeight.toFixed(1)}m, Wind ${weather.windSpeed} km/h, Storm Signal ${weather.stormSignal}. Small crafts advised NOT to sail. Stay ashore.`
                    : `[PAGASA WEATHER UPDATE] Conditions at ${userProfile?.port || 'your area'}: Wave height ${weather.waveHeight.toFixed(1)}m, Wind ${weather.windSpeed} km/h. Within safe limits. Ligtas na paglalayag.`;
                  try {
                    await fetch('/api/sms/send', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ recipient: userProfile?.phone || '09171234567', message: msg, category: 'weather' })
                    });
                    showToast(isDangerous ? `⚠️ Gale warning SMS dispatched to ${userProfile?.phone || 'your phone number'}!` : `Weather update SMS dispatched to ${userProfile?.phone || 'your phone number'}!`, isDangerous ? "error" : "success");
                  } catch {
                    showToast(isDangerous ? "Gale warning SMS dispatched!" : "Weather advisory SMS dispatched!", "info");
                  }
                }}
                className={`w-full font-black text-xs uppercase tracking-wider h-12 rounded-2xl transition flex items-center justify-center gap-2 shadow-md active:scale-95 cursor-pointer ${
                  weather.waveHeight >= 2.0 || weather.stormSignal > 0
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : "bg-slate-800 hover:bg-slate-900 text-white"
                }`}
              >
                <Radio className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>{weather.waveHeight >= 2.0 || weather.stormSignal > 0 ? "SEND GALE WARNING SMS TO MY NUMBER" : "SEND WEATHER UPDATE SMS TO MY NUMBER"}</span>
              </button>
            </div>
          </div>

          {/* DIVIDER */}
          <hr className="border-t border-gray-100" />

          {/* ============================================================ */}
          {/* SECTION 4: SIMULATED SMS ADVISORY */}
          {/* ============================================================ */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-50 rounded-xl text-[#00B074] mt-0.5">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-display font-black text-sm uppercase tracking-wider text-slate-900">
                    SIMULATED SMS ADVISORY & HOTSPOT CALCULATOR (iPROG GATEWAY)
                  </h2>
                  <p className="text-xs font-semibold text-gray-400 mt-0.5">
                    Calculates nearest hotspot distance (via Haversine formula) & catch probability ratio for SMS cellular dispatch.
                  </p>
                </div>
              </div>

              <span className="hidden sm:inline-flex px-3 py-1 bg-emerald-50 border border-emerald-200 text-[#00B074] text-[10px] font-black rounded-full uppercase">
                iPROG Cellular Gateway
              </span>
            </div>

            {/* Target Registered Mobile & Model Settings Switcher Card */}
            <div className="bg-slate-50 border border-gray-200/80 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100/70 text-[#00B074] flex items-center justify-center font-bold shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase block tracking-wider">
                      Target Mobile Number
                    </span>
                    <span className="text-sm font-black text-slate-900">
                      {userProfile.phone || "0917 123 4567"}
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-black text-gray-400 uppercase block tracking-wider">
                    Selected Location / Home Port Anchor
                  </span>
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#00B074]" />
                    {userProfile.port || 'Mercedes Fish Port'} ({currentLat.toFixed(3)}°N, {currentLng.toFixed(3)}°E)
                  </span>
                </div>
              </div>

              {/* Model Filter Selector (Pelagic vs Demersal vs General) */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                  MODEL FILTER FOR NEAREST HOTSPOT CALCULATION
                </label>
                <div className="bg-white border border-gray-200 p-1.5 rounded-xl grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setModelFilter('pelagic')}
                    className={`py-2 px-3 rounded-lg text-xs font-black transition cursor-pointer ${
                      modelFilter === 'pelagic'
                        ? 'bg-emerald-50 text-[#00B074] border border-emerald-200 shadow-sm'
                        : 'text-gray-500 hover:text-slate-800'
                    }`}
                  >
                    PELAGIC MODEL
                  </button>
                  <button
                    type="button"
                    onClick={() => setModelFilter('demersal')}
                    className={`py-2 px-3 rounded-lg text-xs font-black transition cursor-pointer ${
                      modelFilter === 'demersal'
                        ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm'
                        : 'text-gray-500 hover:text-slate-800'
                    }`}
                  >
                    DEMERSAL MODEL
                  </button>
                  <button
                    type="button"
                    onClick={() => setModelFilter('both')}
                    className={`py-2 px-3 rounded-lg text-xs font-black transition cursor-pointer ${
                      modelFilter === 'both'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-gray-500 hover:text-slate-800'
                    }`}
                  >
                    GENERAL (ALL)
                  </button>
                </div>
              </div>
            </div>

            {/* Calculated Nearest Hotspot & Efficiency Metrics Breakdown Card */}
            {(modelFilter === 'both' ? (pelagicTarget || demersalTarget) : targetHotspot) ? (
              <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white rounded-2xl p-5 space-y-4 shadow-md">
                <div className="flex items-center gap-2 border-b border-emerald-800/40 pb-3">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span className="font-display font-black text-xs uppercase tracking-wider text-emerald-400">
                    CALCULATED NEAREST HOTSPOT METRICS
                  </span>
                </div>

                {modelFilter === 'both' ? (
                  /* Dual-column view: Pelagic + Demersal */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Pelagic Column */}
                    {pelagicTarget && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                          🐟 Pelagic (Surface &amp; Open Water)
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-slate-900/80 p-3 rounded-xl border border-emerald-900/60">
                            <span className="text-[9px] font-black text-gray-400 uppercase block tracking-wider">Distance</span>
                            <span className="text-sm font-black text-emerald-400">{pelagicTarget.distanceKm} km</span>
                            <span className="text-[10px] font-bold text-gray-400 block mt-0.5">{pelagicTarget.compassBearing}</span>
                          </div>
                          <div className="bg-slate-900/80 p-3 rounded-xl border border-emerald-900/60">
                            <span className="text-[9px] font-black text-gray-400 uppercase block tracking-wider">Probability</span>
                            <span className="text-sm font-black text-emerald-300">{pelagicTarget.catchProbability}%</span>
                            <span className="text-[10px] font-bold text-gray-400 block mt-0.5">Efficiency: {pelagicTarget.efficiencyRatio} %/km</span>
                          </div>
                        </div>
                        <div className="bg-slate-900/80 p-2.5 rounded-xl border border-emerald-900/60 space-y-1">
                          <span className="text-[9px] font-black text-gray-400 uppercase block tracking-wider">Hotspot</span>
                          <span className="text-xs font-extrabold text-white truncate block">{pelagicTarget.hotspot.name}</span>
                          <span className="text-[10px] font-bold text-emerald-400 block">{pelagicTarget.gpsCoordinatesFormatted}</span>
                          <a href={pelagicTarget.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                            className="text-blue-400 text-[10px] font-bold hover:underline flex items-center gap-1 truncate">
                            {pelagicTarget.googleMapsUrl.replace('https://', '')}
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Demersal Column */}
                    {demersalTarget && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 block">
                          🐡 Demersal (Bottom &amp; Reef Fish)
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-slate-900/80 p-3 rounded-xl border border-blue-900/60">
                            <span className="text-[9px] font-black text-gray-400 uppercase block tracking-wider">Distance</span>
                            <span className="text-sm font-black text-blue-400">{demersalTarget.distanceKm} km</span>
                            <span className="text-[10px] font-bold text-gray-400 block mt-0.5">{demersalTarget.compassBearing}</span>
                          </div>
                          <div className="bg-slate-900/80 p-3 rounded-xl border border-blue-900/60">
                            <span className="text-[9px] font-black text-gray-400 uppercase block tracking-wider">Probability</span>
                            <span className="text-sm font-black text-blue-300">{demersalTarget.catchProbability}%</span>
                            <span className="text-[10px] font-bold text-gray-400 block mt-0.5">Efficiency: {demersalTarget.efficiencyRatio} %/km</span>
                          </div>
                        </div>
                        <div className="bg-slate-900/80 p-2.5 rounded-xl border border-blue-900/60 space-y-1">
                          <span className="text-[9px] font-black text-gray-400 uppercase block tracking-wider">Hotspot</span>
                          <span className="text-xs font-extrabold text-white truncate block">{demersalTarget.hotspot.name}</span>
                          <span className="text-[10px] font-bold text-blue-400 block">{demersalTarget.gpsCoordinatesFormatted}</span>
                          <a href={demersalTarget.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                            className="text-blue-400 text-[10px] font-bold hover:underline flex items-center gap-1 truncate">
                            {demersalTarget.googleMapsUrl.replace('https://', '')}
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Single-model view */
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                        <span className="text-[9px] font-black text-gray-400 uppercase block tracking-wider">Distance</span>
                        <span className="text-sm font-black text-emerald-400">{targetHotspot!.distanceKm} km</span>
                        <span className="text-[10px] font-bold text-gray-400 block mt-0.5">Vector: {targetHotspot!.compassBearing}</span>
                      </div>

                      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                        <span className="text-[9px] font-black text-gray-400 uppercase block tracking-wider">Catch Probability</span>
                        <span className="text-sm font-black text-emerald-300">{targetHotspot!.catchProbability}%</span>
                        <span className="text-[10px] font-bold text-gray-400 block mt-0.5">LightGBM ML Confidence</span>
                      </div>

                      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                        <span className="text-[9px] font-black text-gray-400 uppercase block tracking-wider">Efficiency Ratio</span>
                        <span className="text-sm font-black text-yellow-400">{targetHotspot!.efficiencyRatio} %/km</span>
                        <span className="text-[10px] font-bold text-gray-400 block mt-0.5">Yield / Dist Index</span>
                      </div>

                      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                        <span className="text-[9px] font-black text-gray-400 uppercase block tracking-wider">Hotspot Grid Name</span>
                        <span className="text-xs font-extrabold text-white truncate block">{targetHotspot!.hotspot.name}</span>
                        <span className="text-[10px] font-bold text-emerald-400 block mt-0.5 capitalize">{targetHotspot!.hotspot.type} Zone</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                      <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                        <span className="text-gray-400 font-sans text-[11px]">1. Distance &amp; Bearing:</span>
                        <span className="text-emerald-400 font-bold">{targetHotspot!.distanceKm} km ({targetHotspot!.compassBearing})</span>
                      </div>

                      <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                        <span className="text-gray-400 font-sans text-[11px]">2. Compass App GPS Coordinate:</span>
                        <span className="text-emerald-300 font-bold">{targetHotspot!.gpsCoordinatesFormatted}</span>
                      </div>

                      <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between sm:col-span-2">
                        <span className="text-gray-400 font-sans text-[11px]">3. Smartphone Google Maps Link:</span>
                        <a href={targetHotspot!.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                          className="text-blue-400 font-bold hover:underline flex items-center gap-1 truncate max-w-[240px]">
                          {targetHotspot!.googleMapsUrl.replace('https://', '')}
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : null}


            {/* Generated Concise SMS Payload Preview Box */}
            <div className="bg-slate-100 border border-slate-300/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5 uppercase font-black tracking-wider text-[11px] text-slate-900">
                  <Smartphone className="w-4 h-4 text-[#00B074]" />
                  {modelFilter === 'both' ? 'SMS Payload Preview (2 Messages)' : 'Cellular SMS Payload Preview'}
                </span>
                <div className="flex items-center gap-2">
                  {modelFilter !== 'both' && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                      smsSegmentDetails.segmentCount === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {smsSegmentDetails.characterCount} Chars ({smsSegmentDetails.segmentCount} SMS Segment)
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px] font-bold">
                    GSM-7 Encoding
                  </span>
                </div>
              </div>

              {modelFilter === 'both' ? (
                <div className="space-y-2">
                  {/* SMS 1: Pelagic */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#00B074]">SMS 1 — Pelagic</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                        calculateSmsSegments(pelagicSmsText).segmentCount === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {calculateSmsSegments(pelagicSmsText).characterCount} chars
                      </span>
                    </div>
                    <div className="p-3 bg-white border border-emerald-200 rounded-xl font-mono text-xs text-slate-900 leading-relaxed shadow-inner whitespace-pre-line">
                      {pelagicSmsText}
                    </div>
                  </div>
                  {/* SMS 2: Demersal */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">SMS 2 — Demersal</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                        calculateSmsSegments(demersalSmsText).segmentCount === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {calculateSmsSegments(demersalSmsText).characterCount} chars
                      </span>
                    </div>
                    <div className="p-3 bg-white border border-blue-200 rounded-xl font-mono text-xs text-slate-900 leading-relaxed shadow-inner whitespace-pre-line">
                      {demersalSmsText}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-white border border-slate-200 rounded-xl font-mono text-xs text-slate-900 leading-relaxed shadow-inner whitespace-pre-line">
                  {generatedSmsText}
                </div>
              )}
            </div>

            {/* Send Test SMS Button */}
            <button
              type="button"
              onClick={handleSimulateSmsAdvisory}
              disabled={smsSending}
              className="w-full bg-[#00B074] hover:bg-[#009B66] disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider py-4 rounded-2xl transition flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer"
            >
              {smsSending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>DISPATCHING TEST ADVISORY SMS...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>DISPATCH CONCISE TEST SMS ADVISORY</span>
                </>
              )}
            </button>

            {/* Result Output Display */}
            {lastSmsResult && (
              <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3 text-xs animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-black">
                    <CheckCircle2 className="w-4.5 h-4.5" />
                    <span className="uppercase tracking-wider text-xs">
                      {lastSmsResult.dualMode ? '2 Advisories Dispatched (Pelagic + Demersal)' : 'Test Advisory Dispatched'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-slate-800 text-emerald-300">
                    {lastSmsResult.mode}
                  </span>
                </div>

                <div className="text-[11px] font-mono text-gray-300 space-y-1.5 pt-2 border-t border-slate-800">
                  <div><strong className="text-gray-400">Recipient Phone:</strong> {lastSmsResult.recipientFormatted}</div>
                  {lastSmsResult.dualMode ? (
                    <>
                      <div><strong className="text-gray-400">Pelagic Msg ID:</strong> {lastSmsResult.pelagicResult?.messageId}</div>
                      <div><strong className="text-gray-400">Demersal Msg ID:</strong> {lastSmsResult.messageId}</div>
                    </>
                  ) : (
                    <div><strong className="text-gray-400">Gateway Message ID:</strong> {lastSmsResult.messageId}</div>
                  )}
                  <div><strong className="text-gray-400">Dispatch Status:</strong> <span className="text-emerald-400">QUEUED / DELIVERED</span></div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </AuthLayout>
  );
}
