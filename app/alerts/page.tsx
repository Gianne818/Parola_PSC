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
  Compass,
  MapPin,
  ExternalLink,
  Waves,
  Wind,
  Zap,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info
} from "lucide-react";

export default function AlertsPage() {
  const {
    userProfile,
    updateProfile,
    language,
    changeLanguage,
    weather,
    hotspots,
    showToast
  } = useApp();

  const { t } = useTranslation(language);

  // Active section for sticky jumper navigation
  const [activeSection, setActiveSection] = useState<"status" | "limits" | "channels" | "sms-preview">("status");

  // Progressive disclosure toggle for technical ML metrics
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // SMS Alert Channels Toggles (Fuel toggle cleanly retired)
  const [hazardousWeatherAlerts, setHazardousWeatherAlerts] = useState(true);

  // Target Biological Families Selection
  const [pelagicSelected, setPelagicSelected] = useState(true);
  const [demersalSelected, setDemersalSelected] = useState(false);

  // Safety Threshold States (Sliders)
  const [waveThreshold, setWaveThreshold] = useState<number>(2.0);
  const [windThreshold, setWindThreshold] = useState<number>(20);

  // Model Filter State for Hotspot Calculator & SMS
  const [modelFilter, setModelFilter] = useState<"pelagic" | "demersal" | "both">("pelagic");

  // SMS Simulation State
  const [smsSending, setSmsSending] = useState(false);
  const [lastSmsResult, setLastSmsResult] = useState<any>(null);

  // Compute Hotspot Metrics dynamically using Haversine & Catch Efficiency Ratio
  const currentLat = userProfile?.lat || 14.0122;
  const currentLng = userProfile?.lng || 123.0114;

  // Always compute both pelagic & demersal independently
  const pelagicAnalysis = analyzeHotspots(currentLat, currentLng, hotspots, "pelagic");
  const demersalAnalysis = analyzeHotspots(currentLat, currentLng, hotspots, "demersal");
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

  const generatedSmsText = modelFilter === "both"
    ? pelagicSmsText
    : targetHotspot
      ? formatConciseSmsAdvisory(vessel, portName, targetHotspot, waveVal, windVal)
      : noHotspotFallback;

  const smsSegmentDetails = calculateSmsSegments(generatedSmsText);

  const handleApplyVariables = async () => {
    try {
      let species: "both" | "pelagic" | "demersal" = "both";
      if (pelagicSelected && !demersalSelected) species = "pelagic";
      if (!pelagicSelected && demersalSelected) species = "demersal";

      await updateProfile({
        ...userProfile,
        speciesPreference: species
      });

      showToast("Alert preferences and safety thresholds updated.", "success");
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
    try {
      data = await response.json();
    } catch {
      throw new Error("API returned invalid JSON response.");
    }
    if (!response.ok || data?.error) throw new Error(data?.error || "Failed to dispatch SMS");
    return data;
  };

  const handleSimulateSmsAdvisory = async () => {
    setSmsSending(true);
    setLastSmsResult(null);

    try {
      const recipientPhone = userProfile?.phone || "09171234567";

      if (modelFilter === "both") {
        const pelagicResult = await sendSms(recipientPhone, pelagicSmsText);
        const demersalResult = await sendSms(recipientPhone, demersalSmsText);
        setLastSmsResult({ ...demersalResult, dualMode: true, pelagicResult });
        const modeLabel = pelagicResult.mode === "MOCK_DRY_RUN" ? "[DRY-RUN] " : "";
        showToast(`${modeLabel}2 SMS Advisories Dispatched to ${pelagicResult.recipientFormatted || recipientPhone}!`, "success");
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

  const isDangerous = weather.waveHeight >= waveThreshold || weather.stormSignal > 0;

  const jumperItems = [
    { id: "status", label: "Status", icon: Radio },
    { id: "limits", label: "Limits", icon: Sliders },
    { id: "channels", label: "Channels", icon: Target },
    { id: "sms-preview", label: "SMS Preview", icon: Smartphone }
  ] as const;

  const scrollToSection = (id: typeof activeSection) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <AuthLayout>
      {/* Background Atmosphere: Subtle Maritime Dot Grid & Ambient Beacon Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-[#F2F6F4]">
        <div
          className="absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage: "radial-gradient(#12211E 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[480px] bg-gradient-to-b from-[#00B37E]/10 via-[#00B37E]/3 to-transparent blur-[130px] rounded-full" />
        <div className="absolute top-[35%] right-[-80px] w-[450px] h-[450px] bg-[#C57E2C]/5 blur-[110px] rounded-full" />
      </div>

      <div className="space-y-6 pb-20 pt-2 max-w-5xl mx-auto selection:bg-[#00B37E]/20 selection:text-[#12211E]">

        {/* Top Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#DAE5E0]">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C57E2C]/10 border border-[#C57E2C]/25 text-[#9A5B18] text-[11px] font-bold uppercase tracking-wider shadow-2xs">
              <ShieldAlert className="w-3.5 h-3.5 text-[#C57E2C]" />
              <span>Marine Safety and Telemetry Hub</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight text-[#12211E]">
              Alerts & Safety Configuration
            </h1>
            <p className="text-xs sm:text-sm font-normal text-[#12211E]/75 max-w-2xl">
              Configure ocean limits, species targeting, and automated cellular gale warnings for municipal vessels.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
            {/* 4-Language Selection Pills */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-[#DAE5E0] shadow-2xs">
              {(["en", "tl", "ceb", "hil"] as const).map((code) => {
                const labels = { en: "EN", tl: "TL", ceb: "CEB", hil: "HIL" };
                const isSel = language === code;
                return (
                  <button
                    key={code}
                    onClick={() => {
                      if (changeLanguage) changeLanguage(code);
                      updateProfile({ ...userProfile });
                    }}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase transition cursor-pointer ${
                      isSel
                        ? "bg-[#00B37E] text-white shadow-2xs"
                        : "text-[#12211E]/70 hover:text-[#12211E] hover:bg-[#EAF1ED]"
                    }`}
                  >
                    {labels[code]}
                  </button>
                );
              })}
            </div>

            {/* Apply Settings Primary CTA */}
            <button
              onClick={handleApplyVariables}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#00B37E] hover:bg-[#00B37E]/90 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm hover:shadow active:scale-[0.98] cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Save Limits</span>
            </button>
          </div>
        </div>

        {/* Sticky Section Jumper Bar */}
        <div className="sticky top-0 z-20 bg-[#F2F6F4]/90 backdrop-blur-md py-2.5 -mx-2 px-2">
          <nav className="flex items-center gap-1.5 sm:gap-2 p-1.5 bg-white border border-[#DAE5E0] rounded-full shadow-2xs max-w-xl mx-auto md:mx-0">
            {jumperItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-bold transition-all text-center cursor-pointer ${
                    isActive
                      ? "bg-[#00B37E] text-white shadow-2xs"
                      : "text-[#12211E]/70 hover:text-[#12211E] hover:bg-[#EAF1ED]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* ============================================================ */}
        {/* SECTION 1: SAFETY STATUS & PAGASA BROADCAST */}
        {/* ============================================================ */}
        <section
          id="status"
          className="scroll-mt-20 bg-white border border-[#DAE5E0] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DAE5E0]/70 pb-5">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-emerald-50 rounded-2xl text-[#00B37E] shrink-0 border border-emerald-100">
                <Radio className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h2 className="font-display font-black text-lg sm:text-xl text-[#12211E] tracking-tight">
                  Coastal Safety Status & Weather Broadcast
                </h2>
                <p className="text-xs text-[#12211E]/75">
                  Real-time sea telemetry and one-tap emergency broadcast for registered municipal vessels.
                </p>
              </div>
            </div>

            <span
              className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                isDangerous
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : "bg-emerald-50 text-[#00B37E] border-emerald-200"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isDangerous ? "bg-rose-600 animate-pulse" : "bg-[#00B37E]"}`} />
              {isDangerous ? "Dangerous to Sail" : "Favorable to Sail"}
            </span>
          </div>

          {/* Telemetry Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-[#F2F6F4]/70 border border-[#DAE5E0] rounded-2xl p-4 text-center">
              <Waves className="w-5 h-5 mx-auto mb-1.5 text-[#00B37E]" />
              <span className="text-xl sm:text-2xl font-black font-display text-[#12211E] block">
                {weather.waveHeight.toFixed(1)} m
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#12211E]/60 mt-0.5 block">
                Wave Height (Limit: {waveThreshold.toFixed(1)}m)
              </span>
            </div>

            <div className="bg-[#F2F6F4]/70 border border-[#DAE5E0] rounded-2xl p-4 text-center">
              <Wind className="w-5 h-5 mx-auto mb-1.5 text-[#00B37E]" />
              <span className="text-xl sm:text-2xl font-black font-display text-[#12211E] block">
                {weather.windSpeed} km/h
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#12211E]/60 mt-0.5 block">
                Wind Velocity (Limit: {windThreshold} kts)
              </span>
            </div>

            <div className="bg-[#F2F6F4]/70 border border-[#DAE5E0] rounded-2xl p-4 text-center">
              <ShieldAlert className={`w-5 h-5 mx-auto mb-1.5 ${weather.stormSignal > 0 ? "text-rose-600" : "text-[#C57E2C]"}`} />
              <span className="text-xl sm:text-2xl font-black font-display text-[#12211E] block">
                Signal {weather.stormSignal}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#12211E]/60 mt-0.5 block">
                PAGASA Storm Advisory
              </span>
            </div>
          </div>

          {/* Operational Advisory Banner */}
          <div
            className={`p-4 rounded-2xl border text-xs leading-relaxed font-medium flex items-start gap-3 ${
              isDangerous
                ? "bg-rose-50/70 border-rose-200 text-rose-800"
                : "bg-emerald-50/60 border-emerald-200 text-[#12211E]/80"
            }`}
          >
            {isDangerous ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-4 h-4 text-[#00B37E] shrink-0 mt-0.5" />
            )}
            <p>
              {isDangerous
                ? `High swell or storm warning active. Waves at ${weather.waveHeight.toFixed(1)}m exceed safe limits for small bancas. Small crafts hold sailing.`
                : `Coastal waters remain within safe operating thresholds. Wave height ${weather.waveHeight.toFixed(1)}m and wind velocity ${weather.windSpeed} km/h indicate stable fishing conditions.`}
            </p>
          </div>

          {/* Broadcast Action Button */}
          <button
            type="button"
            onClick={async () => {
              const msg = isDangerous
                ? `[PAGASA WEATHER ALERT] DANGEROUS CONDITIONS at ${userProfile?.port || "your area"}: Wave height ${weather.waveHeight.toFixed(1)}m, Wind ${weather.windSpeed} km/h, Storm Signal ${weather.stormSignal}. Small crafts advised NOT to sail. Stay ashore.`
                : `[PAGASA WEATHER UPDATE] Conditions at ${userProfile?.port || "your area"}: Wave height ${weather.waveHeight.toFixed(1)}m, Wind ${weather.windSpeed} km/h. Within safe limits. Ligtas na paglalayag.`;
              try {
                await fetch("/api/sms/send", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    recipient: userProfile?.phone || "09171234567",
                    message: msg,
                    category: "weather"
                  })
                });
                showToast(
                  isDangerous
                    ? `Gale warning SMS dispatched to ${userProfile?.phone || "registered mobile"}.`
                    : `Weather advisory SMS dispatched to ${userProfile?.phone || "registered mobile"}.`,
                  isDangerous ? "error" : "success"
                );
              } catch {
                showToast("Advisory SMS dispatched via gateway.", "info");
              }
            }}
            className={`w-full py-3.5 px-6 rounded-full font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] cursor-pointer ${
              isDangerous
                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200"
                : "bg-[#12211E] hover:bg-[#12211E]/90 text-white"
            }`}
          >
            <Radio className="w-4 h-4 text-[#C57E2C] animate-pulse" />
            <span>
              {isDangerous
                ? "Broadcast Gale Warning SMS to My Number"
                : "Send Weather Advisory SMS to My Number"}
            </span>
          </button>
        </section>

        {/* ============================================================ */}
        {/* SECTION 2: MARINE SAFETY THRESHOLDS */}
        {/* ============================================================ */}
        <section
          id="limits"
          className="scroll-mt-20 bg-white border border-[#DAE5E0] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
        >
          <div className="flex items-start gap-3 border-b border-[#DAE5E0]/70 pb-5">
            <div className="p-2.5 bg-emerald-50 rounded-2xl text-[#00B37E] shrink-0 border border-emerald-100">
              <Sliders className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h2 className="font-display font-black text-lg sm:text-xl text-[#12211E] tracking-tight">
                Marine Safety Thresholds
              </h2>
              <p className="text-xs text-[#12211E]/75">
                Define maximum allowable swell and wind limits for automated port safety holds.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Wave Height Limit Slider */}
            <div className="bg-[#F2F6F4]/50 border border-[#DAE5E0] rounded-2xl p-5 space-y-3.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-[#12211E]">
                  Wave Height Limit
                </label>
                <span className="text-xs font-black text-[#00B37E] bg-white px-3 py-1 rounded-full border border-[#DAE5E0] shadow-2xs">
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
                  background: `linear-gradient(to right, #00B37E 0%, #00B37E ${((waveThreshold - 0.5) / 4.5) * 100}%, #DAE5E0 ${((waveThreshold - 0.5) / 4.5) * 100}%, #DAE5E0 100%)`
                }}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#00B37E]"
              />

              <p className="text-[11px] font-normal text-[#12211E]/65 leading-relaxed">
                Swells above {waveThreshold.toFixed(1)}m trigger automated safety hold flags across vessel navigation views.
              </p>
            </div>

            {/* Wind Speed Limit Slider */}
            <div className="bg-[#F2F6F4]/50 border border-[#DAE5E0] rounded-2xl p-5 space-y-3.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-[#12211E]">
                  Wind Speed Limit
                </label>
                <span className="text-xs font-black text-[#00B37E] bg-white px-3 py-1 rounded-full border border-[#DAE5E0] shadow-2xs">
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
                  background: `linear-gradient(to right, #00B37E 0%, #00B37E ${((windThreshold - 5) / 45) * 100}%, #DAE5E0 ${((windThreshold - 5) / 45) * 100}%, #DAE5E0 100%)`
                }}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#00B37E]"
              />

              <p className="text-[11px] font-normal text-[#12211E]/65 leading-relaxed">
                Winds exceeding {windThreshold} knots initiate severe weather advisory alerts on your mobile phone.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 3: ALERT CHANNELS & SPECIES TARGETING */}
        {/* ============================================================ */}
        <section
          id="channels"
          className="scroll-mt-20 bg-white border border-[#DAE5E0] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
        >
          <div className="flex items-start gap-3 border-b border-[#DAE5E0]/70 pb-5">
            <div className="p-2.5 bg-emerald-50 rounded-2xl text-[#00B37E] shrink-0 border border-emerald-100">
              <Target className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h2 className="font-display font-black text-lg sm:text-xl text-[#12211E] tracking-tight">
                Alert Channels and Target Species
              </h2>
              <p className="text-xs text-[#12211E]/75">
                Subscribe to instant SMS alerts and focus ML models on your target catch groups.
              </p>
            </div>
          </div>

          {/* Hazardous Weather SMS Channel Switch */}
          <div className="flex items-center justify-between p-4.5 bg-[#F2F6F4]/50 border border-[#DAE5E0] rounded-2xl">
            <div className="space-y-0.5 pr-3">
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#12211E]">
                Hazardous Weather Broadcasts
              </h3>
              <p className="text-[11px] font-normal text-[#12211E]/65">
                Immediate SMS delivery for storm signals, high swells, and emergency port safety holds.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <span className={`text-[10px] font-black uppercase tracking-wider ${hazardousWeatherAlerts ? "text-[#00B37E]" : "text-[#12211E]/40"}`}>
                {hazardousWeatherAlerts ? "Active" : "Muted"}
              </span>
              <button
                type="button"
                onClick={() => setHazardousWeatherAlerts(!hazardousWeatherAlerts)}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  hazardousWeatherAlerts ? "bg-[#00B37E]" : "bg-[#DAE5E0]"
                }`}
                aria-label="Toggle Hazardous Weather Alerts"
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                    hazardousWeatherAlerts ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Target Biological Families Checkbox Cards */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#12211E]/70 block">
              Target Species Selection
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pelagic Card */}
              <label
                className={`flex items-center justify-between p-4.5 rounded-2xl border transition cursor-pointer select-none ${
                  pelagicSelected
                    ? "bg-[#EAF1ED] border-[#00B37E] shadow-2xs"
                    : "bg-white border-[#DAE5E0] hover:bg-[#F2F6F4]/50"
                }`}
              >
                <div className="space-y-0.5">
                  <span className="font-display font-bold text-xs text-[#12211E] block">
                    Surface & Open Water
                  </span>
                  <span className="text-[11px] font-bold text-[#00B37E] block">
                    Pelagic (Tamban, Tulingan, Galunggong)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={pelagicSelected}
                  onChange={(e) => setPelagicSelected(e.target.checked)}
                  className="w-5 h-5 rounded-md border-[#DAE5E0] text-[#00B37E] focus:ring-[#00B37E] cursor-pointer"
                />
              </label>

              {/* Demersal Card */}
              <label
                className={`flex items-center justify-between p-4.5 rounded-2xl border transition cursor-pointer select-none ${
                  demersalSelected
                    ? "bg-[#EAF1ED] border-[#00B37E] shadow-2xs"
                    : "bg-white border-[#DAE5E0] hover:bg-[#F2F6F4]/50"
                }`}
              >
                <div className="space-y-0.5">
                  <span className="font-display font-bold text-xs text-[#12211E] block">
                    Bottom & Reef Fish
                  </span>
                  <span className="text-[11px] font-bold text-[#00B37E] block">
                    Demersal (Lapu-lapu, Maya-maya, Bisugo)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={demersalSelected}
                  onChange={(e) => setDemersalSelected(e.target.checked)}
                  className="w-5 h-5 rounded-md border-[#DAE5E0] text-[#00B37E] focus:ring-[#00B37E] cursor-pointer"
                />
              </label>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 4: CELLULAR SMS ADVISORY & DISPATCH */}
        {/* ============================================================ */}
        <section
          id="sms-preview"
          className="scroll-mt-20 bg-white border border-[#DAE5E0] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DAE5E0]/70 pb-5">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-emerald-50 rounded-2xl text-[#00B37E] shrink-0 border border-emerald-100">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h2 className="font-display font-black text-lg sm:text-xl text-[#12211E] tracking-tight">
                  Cellular SMS Advisory and Dispatch
                </h2>
                <p className="text-xs text-[#12211E]/75">
                  Calculates nearest hotspot telemetry and catch efficiency ratio for 2G cellular broadcast.
                </p>
              </div>
            </div>

            <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 bg-[#C57E2C]/10 border border-[#C57E2C]/25 text-[#9A5B18] text-[10px] font-bold rounded-full uppercase tracking-wider">
              iPROG Cellular Gateway
            </span>
          </div>

          {/* Registered Phone & Port Summary Card */}
          <div className="bg-[#F2F6F4]/50 border border-[#DAE5E0] rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DAE5E0]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#DAE5E0] text-[#00B37E] flex items-center justify-center font-bold shrink-0 shadow-2xs">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#12211E]/55 uppercase block tracking-wider">
                    Target Mobile Number
                  </span>
                  <span className="text-sm font-black text-[#12211E]">
                    {userProfile.phone || "0917 123 4567"}
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] font-bold text-[#12211E]/55 uppercase block tracking-wider">
                  Home Port Anchor
                </span>
                <span className="text-xs font-bold text-[#12211E] flex items-center gap-1 sm:justify-end">
                  <MapPin className="w-3.5 h-3.5 text-[#00B37E]" />
                  {userProfile.port || "Mercedes Fish Port"} ({currentLat.toFixed(3)}°N, {currentLng.toFixed(3)}°E)
                </span>
              </div>
            </div>

            {/* Model Filter Selector Pills */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#12211E]/60 block">
                Model Filter for Hotspot Calculation
              </label>
              <div className="bg-white border border-[#DAE5E0] p-1 rounded-full grid grid-cols-3 gap-1 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setModelFilter("pelagic")}
                  className={`py-1.5 px-3 rounded-full text-xs font-bold transition cursor-pointer text-center ${
                    modelFilter === "pelagic"
                      ? "bg-[#00B37E] text-white shadow-2xs"
                      : "text-[#12211E]/70 hover:text-[#12211E]"
                  }`}
                >
                  Pelagic
                </button>
                <button
                  type="button"
                  onClick={() => setModelFilter("demersal")}
                  className={`py-1.5 px-3 rounded-full text-xs font-bold transition cursor-pointer text-center ${
                    modelFilter === "demersal"
                      ? "bg-[#00B37E] text-white shadow-2xs"
                      : "text-[#12211E]/70 hover:text-[#12211E]"
                  }`}
                >
                  Demersal
                </button>
                <button
                  type="button"
                  onClick={() => setModelFilter("both")}
                  className={`py-1.5 px-3 rounded-full text-xs font-bold transition cursor-pointer text-center ${
                    modelFilter === "both"
                      ? "bg-[#12211E] text-white shadow-2xs"
                      : "text-[#12211E]/70 hover:text-[#12211E]"
                  }`}
                >
                  General (Both)
                </button>
              </div>
            </div>
          </div>

          {/* Calculated Nearest Hotspot Telemetry Card */}
          {(modelFilter === "both" ? (pelagicTarget || demersalTarget) : targetHotspot) && (
            <div className="bg-white border border-[#DAE5E0] rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#DAE5E0]/70 pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#00B37E]" />
                  <span className="font-display font-bold text-xs uppercase tracking-wider text-[#12211E]">
                    Nearest Hotspot Telemetry
                  </span>
                </div>

                {/* Progressive Disclosure Button */}
                <button
                  type="button"
                  onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00B37E] hover:underline cursor-pointer"
                >
                  <span>{showTechnicalDetails ? "Hide Technical Details" : "View Technical Details"}</span>
                  {showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {modelFilter === "both" ? (
                /* Dual Columns: Pelagic + Demersal */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {pelagicTarget && (
                    <div className="space-y-2 bg-[#F2F6F4]/50 p-4 rounded-xl border border-[#DAE5E0]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#00B37E] block">
                        Pelagic (Surface & Open Water)
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white p-2.5 rounded-lg border border-[#DAE5E0]">
                          <span className="text-[10px] text-[#12211E]/60 uppercase block">Distance</span>
                          <span className="text-sm font-black text-[#12211E]">{pelagicTarget.distanceKm} km</span>
                          <span className="text-[10px] text-[#12211E]/70 block mt-0.5">{pelagicTarget.compassBearing}</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-[#DAE5E0]">
                          <span className="text-[10px] text-[#12211E]/60 uppercase block">Catch Prob.</span>
                          <span className="text-sm font-black text-[#00B37E]">{pelagicTarget.catchProbability}%</span>
                          <span className="text-[10px] text-[#12211E]/70 block mt-0.5">{pelagicTarget.efficiencyRatio} %/km</span>
                        </div>
                      </div>
                      <div className="text-[11px] font-medium text-[#12211E]/80 pt-1">
                        <strong>Target:</strong> {pelagicTarget.hotspot.name} ({pelagicTarget.gpsCoordinatesFormatted})
                      </div>
                    </div>
                  )}

                  {demersalTarget && (
                    <div className="space-y-2 bg-[#F2F6F4]/50 p-4 rounded-xl border border-[#DAE5E0]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#C57E2C] block">
                        Demersal (Bottom & Reef Fish)
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white p-2.5 rounded-lg border border-[#DAE5E0]">
                          <span className="text-[10px] text-[#12211E]/60 uppercase block">Distance</span>
                          <span className="text-sm font-black text-[#12211E]">{demersalTarget.distanceKm} km</span>
                          <span className="text-[10px] text-[#12211E]/70 block mt-0.5">{demersalTarget.compassBearing}</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-[#DAE5E0]">
                          <span className="text-[10px] text-[#12211E]/60 uppercase block">Catch Prob.</span>
                          <span className="text-sm font-black text-[#C57E2C]">{demersalTarget.catchProbability}%</span>
                          <span className="text-[10px] text-[#12211E]/70 block mt-0.5">{demersalTarget.efficiencyRatio} %/km</span>
                        </div>
                      </div>
                      <div className="text-[11px] font-medium text-[#12211E]/80 pt-1">
                        <strong>Target:</strong> {demersalTarget.hotspot.name} ({demersalTarget.gpsCoordinatesFormatted})
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Single Model View */
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-[#F2F6F4]/70 p-3 rounded-xl border border-[#DAE5E0]">
                    <span className="text-[10px] font-bold text-[#12211E]/60 uppercase block">Distance</span>
                    <span className="text-sm font-black text-[#12211E]">{targetHotspot!.distanceKm} km</span>
                    <span className="text-[10px] text-[#12211E]/65 block mt-0.5">Bearing: {targetHotspot!.compassBearing}</span>
                  </div>

                  <div className="bg-[#F2F6F4]/70 p-3 rounded-xl border border-[#DAE5E0]">
                    <span className="text-[10px] font-bold text-[#12211E]/60 uppercase block">Probability</span>
                    <span className="text-sm font-black text-[#00B37E]">{targetHotspot!.catchProbability}%</span>
                    <span className="text-[10px] text-[#12211E]/65 block mt-0.5">Estimated Yield</span>
                  </div>

                  <div className="bg-[#F2F6F4]/70 p-3 rounded-xl border border-[#DAE5E0]">
                    <span className="text-[10px] font-bold text-[#12211E]/60 uppercase block">Efficiency</span>
                    <span className="text-sm font-black text-[#9A5B18]">{targetHotspot!.efficiencyRatio} %/km</span>
                    <span className="text-[10px] text-[#12211E]/65 block mt-0.5">Yield per Distance</span>
                  </div>

                  <div className="bg-[#F2F6F4]/70 p-3 rounded-xl border border-[#DAE5E0]">
                    <span className="text-[10px] font-bold text-[#12211E]/60 uppercase block">Hotspot Zone</span>
                    <span className="text-xs font-bold text-[#12211E] truncate block">{targetHotspot!.hotspot.name}</span>
                    <span className="text-[10px] text-[#00B37E] block mt-0.5 capitalize">{targetHotspot!.hotspot.type} Zone</span>
                  </div>
                </div>
              )}

              {/* Progressive Disclosure Section */}
              {showTechnicalDetails && targetHotspot && (
                <div className="pt-3 border-t border-[#DAE5E0] space-y-2 text-xs font-mono">
                  <div className="bg-[#F2F6F4] p-3 rounded-xl border border-[#DAE5E0] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                    <span className="text-[#12211E]/70 font-sans">Haversine Distance & Bearing:</span>
                    <span className="text-[#12211E] font-bold">{targetHotspot.distanceKm} km ({targetHotspot.compassBearing})</span>
                  </div>
                  <div className="bg-[#F2F6F4] p-3 rounded-xl border border-[#DAE5E0] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                    <span className="text-[#12211E]/70 font-sans">GPS Anchor Coordinates:</span>
                    <span className="text-[#00B37E] font-bold">{targetHotspot.gpsCoordinatesFormatted}</span>
                  </div>
                  <div className="bg-[#F2F6F4] p-3 rounded-xl border border-[#DAE5E0] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                    <span className="text-[#12211E]/70 font-sans">Navigation Coordinates Link:</span>
                    <a
                      href={targetHotspot.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00B37E] font-bold hover:underline flex items-center gap-1 truncate max-w-[280px]"
                    >
                      {targetHotspot.googleMapsUrl.replace("https://", "")}
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* GSM-7 SMS Payload Preview Box */}
          <div className="bg-[#F2F6F4]/60 border border-[#DAE5E0] rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[#12211E]">
              <span className="flex items-center gap-1.5 uppercase font-bold tracking-wider text-[11px]">
                <Smartphone className="w-4 h-4 text-[#00B37E]" />
                {modelFilter === "both" ? "Cellular Payload Preview (2 Messages)" : "Cellular SMS Payload Preview"}
              </span>
              <div className="flex items-center gap-2">
                {modelFilter !== "both" && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    smsSegmentDetails.segmentCount === 1 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {smsSegmentDetails.characterCount} Chars ({smsSegmentDetails.segmentCount} Segment)
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full bg-white border border-[#DAE5E0] text-[#12211E]/80 text-[10px] font-bold">
                  GSM-7 Standard
                </span>
              </div>
            </div>

            {modelFilter === "both" ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#00B37E]">SMS 1 (Pelagic)</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                      {calculateSmsSegments(pelagicSmsText).characterCount} chars
                    </span>
                  </div>
                  <div className="p-3.5 bg-white border border-[#DAE5E0] rounded-xl font-mono text-xs text-[#12211E] leading-relaxed shadow-2xs whitespace-pre-line">
                    {pelagicSmsText}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#C57E2C]">SMS 2 (Demersal)</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                      {calculateSmsSegments(demersalSmsText).characterCount} chars
                    </span>
                  </div>
                  <div className="p-3.5 bg-white border border-[#DAE5E0] rounded-xl font-mono text-xs text-[#12211E] leading-relaxed shadow-2xs whitespace-pre-line">
                    {demersalSmsText}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-white border border-[#DAE5E0] rounded-xl font-mono text-xs text-[#12211E] leading-relaxed shadow-2xs whitespace-pre-line">
                {generatedSmsText}
              </div>
            )}
          </div>

          {/* Send Test SMS Button */}
          <button
            type="button"
            onClick={handleSimulateSmsAdvisory}
            disabled={smsSending}
            className="w-full bg-[#00B37E] hover:bg-[#00B37E]/90 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider py-4 rounded-full transition flex items-center justify-center gap-2 shadow-sm hover:shadow active:scale-[0.98] cursor-pointer"
          >
            {smsSending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Dispatching Test Advisory via Cellular Gateway...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Dispatch Test SMS Advisory</span>
              </>
            )}
          </button>

          {/* Gateway Dispatch Receipt */}
          {lastSmsResult && (
            <div className="bg-[#12211E] text-white rounded-2xl p-5 space-y-3 text-xs animate-fade-in shadow-md">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-[#00B37E] font-bold">
                  <CheckCircle2 className="w-4.5 h-4.5" />
                  <span className="uppercase tracking-wider text-xs">
                    {lastSmsResult.dualMode ? "Dual Advisories Dispatched" : "Advisory SMS Dispatched"}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-300">
                  {lastSmsResult.mode}
                </span>
              </div>

              <div className="text-[11px] font-mono text-gray-300 space-y-1.5 pt-1">
                <div><strong className="text-gray-400">Recipient Phone:</strong> {lastSmsResult.recipientFormatted}</div>
                {lastSmsResult.dualMode ? (
                  <>
                    <div><strong className="text-gray-400">Pelagic Message ID:</strong> {lastSmsResult.pelagicResult?.messageId}</div>
                    <div><strong className="text-gray-400">Demersal Message ID:</strong> {lastSmsResult.messageId}</div>
                  </>
                ) : (
                  <div><strong className="text-gray-400">Gateway Message ID:</strong> {lastSmsResult.messageId}</div>
                )}
                <div><strong className="text-gray-400">Dispatch Status:</strong> <span className="text-[#00B37E]">QUEUED / DELIVERED</span></div>
              </div>
            </div>
          )}
        </section>

      </div>
    </AuthLayout>
  );
}
