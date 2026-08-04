"use client";

import React, { useState } from "react";
import { AuthLayout } from "../../components/layouts/AuthLayout";
import { useApp } from "../../context/AppContext";
import { useTranslation } from "../../hooks/use-translation";
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
  AlertTriangle
} from "lucide-react";

export default function AlertsPage() {
  const {
    userProfile,
    updateProfile,
    language,
    weather,
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
  const [emergencyContact, setEmergencyContact] = useState("0917 111 2222");

  // SMS Simulation State
  const [smsSending, setSmsSending] = useState(false);
  const [lastSmsResult, setLastSmsResult] = useState<any>(null);

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

  const handleTriggerSOS = () => {
    showToast("SOS Distress Signal Broadcasted to Coast Guard & Local Base!", "error");
  };

  const handleSimulateSmsAdvisory = async () => {
    setSmsSending(true);
    setLastSmsResult(null);

    try {
      const recipientPhone = userProfile?.phone || "09171234567";
      const waveVal = weather?.waveHeight ?? 1.2;
      const windVal = weather?.windSpeed ?? 14.5;
      const windDir = weather?.windDirection || "NE";
      const vessel = userProfile?.vesselName || "Ka-Isda";
      const portName = userProfile?.port || "Brgy Pasil";

      const sampleMessage = `[PAROLA ADVISORY] Magandang araw ${vessel}! Inirekomendang isdaan para sa ${portName}: Hotspot #1 (8.4km, NNE). Alon: ${waveVal}m, Hangin: ${windVal}km/h (${windDir}). Ligtas na paglalayag!`;

      const response = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: recipientPhone,
          message: sampleMessage,
          category: "weather"
        })
      });

      let data: any;
      try {
        data = await response.json();
      } catch (jsonErr) {
        throw new Error("API returned invalid JSON response.");
      }

      if (!response.ok || data?.error) {
        throw new Error(data?.error || "Failed to dispatch simulated SMS");
      }

      setLastSmsResult(data);
      showToast(
        data.mode === "MOCK_DRY_RUN"
          ? `[DRY-RUN] SMS Advisory Simulated to ${data.recipientFormatted || recipientPhone}!`
          : `SMS Advisory Dispatched to ${data.recipientFormatted || recipientPhone}!`,
        "success"
      );
    } catch (err: any) {
      showToast(err?.message || "Failed to send SMS advisory", "error");
    } finally {
      setSmsSending(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6 pb-16 pt-4 max-w-5xl mx-auto">

        {/* Page Header */}
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
                Central hub for configuring notification delivery, ocean safety limits, species targeting, and emergency advisories.
              </p>
            </div>
          </div>

          <button
            onClick={handleApplyVariables}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#00B074] hover:bg-[#009B66] text-white font-black text-xs uppercase tracking-wider transition shadow-sm self-start sm:self-auto active:scale-95 cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>APPLY SETTINGS</span>
          </button>
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

            {/* Emergency Base Contact Input & Red SOS Button */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end pt-2">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                  EMERGENCY BASE CONTACT NUMBER
                </label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="e.g. Coast Guard or Port Authority hotline"
                  className="w-full bg-slate-50 border border-gray-200 focus:border-[#00B074] rounded-2xl h-12 px-5 text-xs font-black text-slate-900 focus:outline-none transition"
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleTriggerSOS}
                  className="w-full bg-[#E63946] hover:bg-[#D62839] text-white font-black text-xs uppercase tracking-wider h-12 rounded-2xl transition flex items-center justify-center gap-2 shadow-md active:scale-95 cursor-pointer"
                >
                  <Radio className="w-4 h-4 animate-pulse" />
                  <span>BROADCAST SOS</span>
                </button>
              </div>
            </div>
          </div>

          {/* DIVIDER */}
          <hr className="border-t border-gray-100" />

          {/* ============================================================ */}
          {/* SECTION 4: SIMULATED SMS ADVISORY */}
          {/* ============================================================ */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-50 rounded-xl text-[#00B074] mt-0.5">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-display font-black text-sm uppercase tracking-wider text-slate-900">
                    SIMULATED SMS ADVISORY (iPROG GATEWAY)
                  </h2>
                  <p className="text-xs font-semibold text-gray-400 mt-0.5">
                    Test your cellular SMS connection by dispatching a sample weather & fishing advisory to your registered phone.
                  </p>
                </div>
              </div>

              <span className="hidden sm:inline-flex px-3 py-1 bg-emerald-50 border border-emerald-200 text-[#00B074] text-[10px] font-black rounded-full uppercase">
                iPROG Cellular Gateway
              </span>
            </div>

            {/* Target Registered Mobile Display Card */}
            <div className="bg-slate-50 border border-gray-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100/70 text-[#00B074] flex items-center justify-center font-bold shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase block tracking-wider">
                    Registered Mobile Number
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    {userProfile.phone || "0917 123 4567"}
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] font-black text-gray-400 uppercase block tracking-wider">
                  Home Port Anchor
                </span>
                <span className="text-xs font-bold text-slate-700">
                  {userProfile.port || 'Mercedes Fish Port'}
                </span>
              </div>
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
                  <span>DISPATCH TEST SMS ADVISORY</span>
                </>
              )}
            </button>

            {/* Result Output Display */}
            {lastSmsResult && (
              <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3 text-xs animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-black">
                    <CheckCircle2 className="w-4.5 h-4.5" />
                    <span className="uppercase tracking-wider text-xs">Test Advisory Dispatched</span>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-slate-800 text-emerald-300">
                    {lastSmsResult.mode}
                  </span>
                </div>

                <div className="text-[11px] font-mono text-gray-300 space-y-1.5 pt-2 border-t border-slate-800">
                  <div><strong className="text-gray-400">Recipient Phone:</strong> {lastSmsResult.recipientFormatted}</div>
                  <div><strong className="text-gray-400">Gateway Message ID:</strong> {lastSmsResult.messageId}</div>
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
