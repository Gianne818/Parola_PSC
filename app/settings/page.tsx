"use client";

import React, { useState } from "react";
import { AuthLayout } from "../../components/layouts/AuthLayout";
import { useApp } from "../../context/AppContext";
import { useTranslation } from "../../hooks/use-translation";
import { fontScales } from "../../utils/fontScale";
import {
  Sun,
  Moon,
  ShieldAlert,
  Bell,
  Target,
  Check,
  Radio,
  Send,
  Smartphone,
  MessageSquare,
  RefreshCw,
  CheckCircle2
} from "lucide-react";

export default function SettingsPage() {
  const {
    userProfile,
    updateProfile,
    language,
    fontScale,
    changeFontScale,
    weather,
    showToast
  } = useApp();

  const { t } = useTranslation(language);

  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Threshold States (Sliders)
  const [waveThreshold, setWaveThreshold] = useState<number>(2.0);
  const [windThreshold, setWindThreshold] = useState<number>(20);

  // Emergency contact state
  const [emergencyContact, setEmergencyContact] = useState("0917 111 2222");

  // SMS Alert Toggles
  const [hazardousWeatherAlerts, setHazardousWeatherAlerts] = useState(true);
  const [fuelPoolMilestones, setFuelPoolMilestones] = useState(true);

  // Target Biological Families Selection
  const [pelagicSelected, setPelagicSelected] = useState(true);
  const [demersalSelected, setDemersalSelected] = useState(false);

  // SMS Simulation State
  const [smsSending, setSmsSending] = useState(false);
  const [lastSmsResult, setLastSmsResult] = useState<any>(null);

  const handleApplyVariables = () => {
    // Determine species target string
    let species: "both" | "pelagic" | "demersal" = "both";
    if (pelagicSelected && !demersalSelected) species = "pelagic";
    if (!pelagicSelected && demersalSelected) species = "demersal";

    updateProfile({
      ...userProfile,
      speciesPreference: species
    });

    showToast("Variables successfully applied!", "success");
  };

  const handleTriggerSOS = () => {
    showToast("SOS Distress Signal Broadcasted to Coast Guard!", "error");
  };

  const handleSimulateSmsAdvisory = async () => {
    setSmsSending(true);
    setLastSmsResult(null);

    const recipientPhone = userProfile.phone || "09171234567";
    const sampleMessage = `[PAROLA ADVISORY] Magandang araw ${userProfile.vesselName || 'Ka-Isda'}! Inirekomendang isdaan para sa ${userProfile.port || 'Brgy Pasil'}: Hotspot #1 (8.4km, NNE). Alon: ${weather.waveHeight}m, Hangin: ${weather.windSpeed}km/h (${weather.windDirection}). Ligtas na paglalayag!`;

    try {
      const response = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: recipientPhone,
          message: sampleMessage,
          category: "weather"
        })
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to dispatch simulated SMS");
      }

      setLastSmsResult(data);
      showToast(
        data.mode === "MOCK_DRY_RUN"
          ? `[DRY-RUN] SMS Advisory Simulated to ${data.recipientFormatted || recipientPhone}!`
          : `SMS Advisory Dispatched to ${data.recipientFormatted || recipientPhone}!`,
        "success"
      );
    } catch (err: any) {
      showToast(err.message || "Failed to send SMS advisory", "error");
    } finally {
      setSmsSending(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6 pb-16 pt-2">

          {/* Header Title & CTA */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div>
              <h1 className="font-display font-[900] text-2xl sm:text-3xl tracking-tight text-slate-900">
                SETTINGS & SAFETY CONTROLS
              </h1>
              <p className="text-xs font-semibold text-gray-400 mt-1">
                Configure warning limit thresholds, appearance settings, and SOS beacon transmitters.
              </p>
            </div>

            <button
              onClick={handleApplyVariables}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#00B074] hover:bg-[#009B66] text-white font-black text-xs uppercase tracking-wider transition shadow-sm self-start sm:self-auto active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>APPLY VARIABLES</span>
            </button>
          </div>

          {/* Grid Layout: 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

            {/* LEFT COLUMN */}
            <div className="space-y-6">

              {/* Theme & UI Scaling Card */}
              <div className="bg-white border border-gray-200/80 rounded-[2rem] p-6 sm:p-7 shadow-md space-y-6">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-[#00B074]" />
                  <h2 className="font-display font-black text-xs uppercase tracking-wider text-slate-900">
                    THEME & UI SCALING
                  </h2>
                </div>

                {/* Appearance Skin Switcher */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                    APPEARANCE SKIN
                  </label>
                  <div className="bg-slate-100 p-1.5 rounded-2xl grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => setTheme("light")}
                      className={`py-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition ${theme === "light"
                        ? "bg-white text-[#00B074] shadow-sm"
                        : "text-gray-500 hover:text-slate-800"
                        }`}
                    >
                      <Sun className="w-4 h-4" />
                      <span>LIGHT THEME</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTheme("dark")}
                      className={`py-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition ${theme === "dark"
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-gray-500 hover:text-slate-800"
                        }`}
                    >
                      <Moon className="w-4 h-4" />
                      <span>DARK THEME</span>
                    </button>
                  </div>
                </div>

                {/* Accessibility Font Scale Slider */}
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                      ACCESSIBILITY FONT SCALE
                    </label>
                    <span className="text-xs font-black text-[#00B074]">
                      {fontScales[fontScale]}% Size
                    </span>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={4}
                    value={fontScale}
                    onChange={(e) => changeFontScale(parseInt(e.target.value))}
                    style={{
                      background: `linear-gradient(to right, #00B074 0%, #00B074 ${fontScale * 25}%, #E2E8F0 ${fontScale * 25}%, #E2E8F0 100%)`
                    }}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#00B074]"
                  />

                  <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 pt-1">
                    <span>80% Compact</span>
                    <span>100% Default</span>
                    <span>130% Large Type</span>
                  </div>
                </div>
              </div>

              {/* SMS Alert Channels Card */}
              <div className="bg-white border border-gray-200/80 rounded-[2rem] p-6 sm:p-7 shadow-md space-y-5">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#00B074]" />
                  <h2 className="font-display font-black text-xs uppercase tracking-wider text-slate-900">
                    SMS ALERT CHANNELS
                  </h2>
                </div>

                {/* Switch 1: Hazardous Weather Alerts */}
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-gray-200/80 rounded-2xl">
                  <div className="space-y-0.5">
                    <h3 className="font-display font-black text-xs text-slate-900 uppercase">
                      HAZARDOUS WEATHER ALERTS
                    </h3>
                    <p className="text-[11px] font-semibold text-gray-400">
                      Immediate broadcast warning alerts.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setHazardousWeatherAlerts(!hazardousWeatherAlerts)}
                    className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer shrink-0 ${hazardousWeatherAlerts ? "bg-[#00B074]" : "bg-gray-300"
                      }`}
                  >
                    <span
                      className={`w-5.5 h-5.5 rounded-full bg-white absolute top-0.75 transition-transform shadow ${hazardousWeatherAlerts ? "translate-x-5.5" : "translate-x-1"
                        }`}
                    />
                  </button>
                </div>

                {/* Switch 2: Fuel Pool Milestones */}
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-gray-200/80 rounded-2xl">
                  <div className="space-y-0.5">
                    <h3 className="font-display font-black text-xs text-slate-900 uppercase">
                      FUEL POOL MILESTONES
                    </h3>
                    <p className="text-[11px] font-semibold text-gray-400">
                      Notice when bulk diesel targets are close.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFuelPoolMilestones(!fuelPoolMilestones)}
                    className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer shrink-0 ${fuelPoolMilestones ? "bg-[#00B074]" : "bg-gray-300"
                      }`}
                  >
                    <span
                      className={`w-5.5 h-5.5 rounded-full bg-white absolute top-0.75 transition-transform shadow ${fuelPoolMilestones ? "translate-x-5.5" : "translate-x-1"
                        }`}
                    />
                  </button>
                </div>
              </div>

              {/* SIMULATE SMS ADVISORY CARD */}
              <div className="bg-white border border-gray-200/80 rounded-[2rem] p-6 sm:p-7 shadow-md space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#00B074]" />
                    <h2 className="font-display font-black text-xs uppercase tracking-wider text-slate-900">
                      SIMULATE SMS ADVISORY
                    </h2>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-[#00B074] text-[10px] font-black rounded-full uppercase">
                    iPROG Gateway
                  </span>
                </div>

                <p className="text-xs font-semibold text-gray-500 leading-relaxed">
                  Trigger an immediate test fishing advisory SMS to your registered mobile number to verify gateway connectivity.
                </p>

                {/* Target Registered Mobile Display */}
                <div className="bg-slate-50 border border-gray-200/80 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100/70 text-[#00B074] flex items-center justify-center font-bold">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase block tracking-wider">
                        Registered Number
                      </span>
                      <span className="text-xs font-black text-slate-900">
                        {userProfile.phone || "0917 123 4567"}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">
                    Port: {userProfile.port || 'Brgy Pasil'}
                  </span>
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
                      <span>DISPATCHING TEST ADVISORY...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>SIMULATE SMS DISPATCH</span>
                    </>
                  )}
                </button>

                {/* Result Output Card */}
                {lastSmsResult && (
                  <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-black">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Dispatched Successfully</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-emerald-300">
                        {lastSmsResult.mode}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-gray-300 space-y-1 pt-1 border-t border-slate-800">
                      <div><strong className="text-gray-400">Recipient:</strong> {lastSmsResult.recipientFormatted}</div>
                      <div><strong className="text-gray-400">Message ID:</strong> {lastSmsResult.messageId}</div>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">

              {/* Marine Safety Thresholds Card */}
              <div className="bg-white border border-gray-200/80 rounded-[2rem] p-6 sm:p-7 shadow-md space-y-6">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#00B074]" />
                  <h2 className="font-display font-black text-xs uppercase tracking-wider text-slate-900">
                    MARINE SAFETY THRESHOLDS
                  </h2>
                </div>

                {/* Wave Height Limit Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-slate-800">
                      Wave Height Limit Threshold
                    </label>
                    <span className="text-xs font-black text-[#00B074]">
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
                    Waves above this will flag the Dashboard Map coordinates as unsafe (Caution/Hold).
                  </p>
                </div>

                {/* Wind Speed Limit Slider */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-slate-800">
                      Wind Speed Limit Threshold
                    </label>
                    <span className="text-xs font-black text-[#00B074]">
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
                </div>

                {/* Emergency Base Contact Input */}
                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                    EMERGENCY BASE CONTACT
                  </label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="w-full bg-slate-100/80 border border-transparent focus:border-[#00B074] rounded-2xl h-12 px-5 text-xs font-black text-slate-900 focus:outline-none transition"
                  />
                </div>

                {/* Red SOS Button */}
                <button
                  type="button"
                  onClick={handleTriggerSOS}
                  className="w-full bg-[#E63946] hover:bg-[#D62839] text-white font-black text-xs uppercase tracking-wider py-4 rounded-2xl transition flex items-center justify-center gap-2 shadow-md active:scale-95"
                >
                  <Radio className="w-4 h-4 animate-pulse" />
                  <span>TRIGGER SOS DISTRESS BROADCAST</span>
                </button>
              </div>

              {/* Target Biological Families Card */}
              <div className="bg-white border border-gray-200/80 rounded-[2rem] p-6 sm:p-7 shadow-md space-y-4">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#00B074]" />
                  <h2 className="font-display font-black text-xs uppercase tracking-wider text-slate-900">
                    TARGET BIOLOGICAL FAMILIES
                  </h2>
                </div>

                <p className="text-[11px] font-semibold text-gray-400">
                  Check target biological groups to focus radar satellite upwellings on relevant families.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* Pelagic Checkbox Card */}
                  <label
                    onClick={() => setPelagicSelected(!pelagicSelected)}
                    className="flex items-center justify-between p-3.5 border border-gray-200/80 rounded-2xl bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition"
                  >
                    <div>
                      <span className="font-display font-black text-xs text-slate-800 block">
                        Surface & Open Water
                      </span>
                      <span className="text-[9px] font-bold text-gray-400 block mt-0.5">
                        Pelagic Species
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={pelagicSelected}
                      onChange={() => { }}
                      className="w-4 h-4 rounded border-gray-300 text-[#00B074] focus:ring-[#00B074] cursor-pointer"
                    />
                  </label>

                  {/* Demersal Checkbox Card */}
                  <label
                    onClick={() => setDemersalSelected(!demersalSelected)}
                    className="flex items-center justify-between p-3.5 border border-gray-200/80 rounded-2xl bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition"
                  >
                    <div>
                      <span className="font-display font-black text-xs text-slate-800 block">
                        Bottom & Reef Fish
                      </span>
                      <span className="text-[9px] font-bold text-gray-400 block mt-0.5">
                        Demersal Species
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={demersalSelected}
                      onChange={() => { }}
                      className="w-4 h-4 rounded border-gray-300 text-[#00B074] focus:ring-[#00B074] cursor-pointer"
                    />
                  </label>
                </div>
              </div>

            </div>

          </div>
        </div>
    </AuthLayout>
  );
}