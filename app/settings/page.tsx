"use client";

import React, { useState } from "react";
import { AuthLayout } from "../../components/layouts/AuthLayout";
import { useApp, MUNICIPAL_PORTS } from "../../context/AppContext";
import { useTranslation } from "../../hooks/use-translation";
import { fontScales } from "../../utils/fontScale";
import {
  Anchor,
  Compass,
  FileText,
  Globe,
  HelpCircle,
  HelpCircle as QuestionIcon,
  Info,
  RefreshCw,
  Sliders,
  Sparkles,
  User,
  Volume2
} from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function SettingsPage() {
  const {
    userProfile,
    updateProfile,
    language,
    changeLanguage,
    fontScale,
    changeFontScale,
    weather,
    showToast
  } = useApp();

  const { t } = useTranslation(language);

  // Profile Edit fields
  const [vesselName, setVesselName] = useState(userProfile.vesselName);
  const [licenseNo, setLicenseNo] = useState(userProfile.licenseNo);
  const [homePort, setHomePort] = useState(userProfile.port);
  const [boatType, setBoatType] = useState(userProfile.boatType);
  const [speciesPreference, setSpeciesPreference] = useState(userProfile.speciesPreference);

  // AI Advisor State
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const chosenPortObj = MUNICIPAL_PORTS.find((p) => p.name === homePort) || MUNICIPAL_PORTS[0];

    updateProfile({
      vesselName,
      licenseNo,
      boatType,
      speciesPreference,
      port: homePort,
      lat: chosenPortObj.lat,
      lng: chosenPortObj.lng,
    });
  };

  const handleGenerateAdvisorReport = async () => {
    setAiLoading(true);
    setAiReport(null);

    try {
      const response = await fetch("/api/gemini/advisor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language,
          port: userProfile.port,
          weather,
          species: userProfile.speciesPreference === "both" ? "Tuna and Tamban" : userProfile.speciesPreference,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reach server-side Gemini gateway");
      }

      const data = await response.json();
      setAiReport(data.advice);
      showToast("AI Lighthouse advice generated!", "success");
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Failed to generate advice", "error");
    } finally {
      setAiLoading(false);
    }
  };

  const languages = [
    { code: "en", label: "English 🇺🇸" },
    { code: "tl", label: "Tagalog 🇵🇭" },
    { code: "ceb", label: "Cebuano 🇵🇭" },
    { code: "hil", label: "Hiligaynon 🇵🇭" },
  ] as const;

  return (
    <AuthLayout>
      <div className="space-y-8 max-w-4xl mx-auto pb-12">
        {/* Title */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
            Customize Beacon
          </span>
          <h2 className="font-display font-[900] text-3xl text-slate-900 dark:text-[#F7FAF9] mt-0.5 flex items-center gap-2">
            <Sliders className="w-7 h-7 text-brand-green" />
            Settings & AI Advisor
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left / Span 2: Profile Form & Accessibility Options */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. Profile settings Card */}
            <div className="bg-white dark:bg-[#12211E] border border-gray-100 dark:border-teal-950 rounded-[2rem] p-6 md:p-8 shadow-sm">
              <h3 className="font-display font-black text-xl text-slate-950 dark:text-[#F7FAF9] border-b border-gray-150 dark:border-teal-950 pb-3 mb-6 flex items-center gap-2">
                <User className="w-5.5 h-5.5 text-brand-green" />
                Vessel Profile Config
              </h3>

              <form onSubmit={handleSaveProfile} className="space-y-5 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                      Vessel Name
                    </label>
                    <input
                      type="text"
                      required
                      value={vesselName}
                      onChange={(e) => setVesselName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-teal-950/20 border border-slate-200 dark:border-teal-900 focus:border-brand-green rounded-2xl h-11 px-4 text-xs font-semibold focus:outline-none transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                      License Registration No.
                    </label>
                    <input
                      type="text"
                      required
                      value={licenseNo}
                      onChange={(e) => setLicenseNo(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-teal-950/20 border border-slate-200 dark:border-teal-900 focus:border-brand-green rounded-2xl h-11 px-4 text-xs font-semibold focus:outline-none transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                    Anchorage Home Port
                  </label>
                  <select
                    value={homePort}
                    onChange={(e) => setHomePort(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#12211E] border border-slate-200 dark:border-teal-900 rounded-2xl h-11 px-4 text-xs font-semibold focus:outline-none text-gray-800 dark:text-gray-200"
                  >
                    {MUNICIPAL_PORTS.map((port) => (
                      <option key={port.name} value={port.name}>
                        {port.name} ({port.province})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                      Boat Type
                    </label>
                    <select
                      value={boatType}
                      onChange={(e) => setBoatType(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-[#12211E] border border-slate-200 dark:border-teal-900 rounded-2xl h-11 px-4 text-xs font-semibold focus:outline-none text-gray-800 dark:text-gray-200"
                    >
                      <option value="motorized">Motorized Banca</option>
                      <option value="non-motorized">Non-motorized Banca</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                      Species Target Focus
                    </label>
                    <select
                      value={speciesPreference}
                      onChange={(e) => setSpeciesPreference(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-[#12211E] border border-slate-200 dark:border-teal-900 rounded-2xl h-11 px-4 text-xs font-semibold focus:outline-none text-gray-800 dark:text-gray-200"
                    >
                      <option value="both">Both Families (Tamban + Tuna)</option>
                      <option value="pelagic">Surface Pelagic</option>
                      <option value="demersal">Deep Coral Reefs</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-2xl transition shadow-md active:scale-95 pt-2"
                >
                  Save Profile Configuration
                </button>
              </form>
            </div>

            {/* 2. Accessibility Options card */}
            <div className="bg-white dark:bg-[#12211E] border border-gray-100 dark:border-teal-950 rounded-[2rem] p-6 md:p-8 shadow-sm">
              <h3 className="font-display font-black text-xl text-slate-950 dark:text-[#F7FAF9] border-b border-gray-150 dark:border-teal-950 pb-3 mb-6 flex items-center gap-2">
                <Globe className="w-5.5 h-5.5 text-brand-green" />
                Display & Language Localization
              </h3>

              <div className="space-y-6">
                {/* Language switcher list */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                    Choose Local Language
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={`h-11 rounded-2xl text-xs font-black transition flex items-center justify-center gap-1.5 border ${
                          language === lang.code
                            ? "bg-brand-green/15 text-brand-green border-brand-green/20 dark:border-brand-green/35"
                            : "bg-slate-50 border-gray-200 dark:bg-teal-950/20 dark:border-teal-900 text-gray-600 dark:text-white hover:bg-gray-100"
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Scaling accessibility slider */}
                <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-teal-950">
                  <div className="flex justify-between items-center text-xs font-bold text-gray-400">
                    <label className="text-[10px] font-black uppercase tracking-wider">
                      On-Deck Text Font Scaling
                    </label>
                    <span className="text-brand-green font-black bg-brand-green/5 dark:bg-brand-green/10 px-2 py-0.5 rounded-full border border-brand-green/20">
                      {fontScales[fontScale]}%
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-gray-400">Smaller</span>
                    <input
                      type="range"
                      min={0}
                      max={4}
                      value={fontScale}
                      onChange={(e) => changeFontScale(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 dark:bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-brand-green"
                    />
                    <span className="text-sm font-black text-gray-500">Larger</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold leading-normal">
                    * Slide to scale up size text across all views. Improves screen legibility under direct glare on offshore vessels.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Card / Span 1: AI Advisor Console */}
          <div className="space-y-6">
            <div className="bg-[#12211E] text-white rounded-[2rem] p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden transition-colors">
              <div className="absolute top-0 right-0 w-44 h-44 bg-brand-green rounded-full blur-[60px] opacity-25 pointer-events-none" />

              <div className="space-y-4">
                <div className="w-11 h-11 bg-brand-green/25 border border-brand-green/40 rounded-2xl flex items-center justify-center text-brand-green animate-pulse">
                  <Sparkles className="w-5.5 h-5.5" />
                </div>
                <h3 className="font-display font-[900] text-xl tracking-tight leading-tight text-white">
                  Parola AI Advisor
                </h3>
                <p className="text-[11px] text-gray-300 font-bold leading-relaxed">
                  Synthesize live Open-Meteo metrics through server-side Gemini 3.6 Flash. Receive instant localized, on-deck advice.
                </p>
              </div>

              <div className="border-t border-teal-900 pt-4 space-y-3.5">
                <div className="text-left space-y-1.5 text-xs text-gray-400">
                  <div className="flex justify-between font-bold">
                    <span>Base Port:</span>
                    <span className="text-brand-green font-black">{userProfile.port}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Weather Alert:</span>
                    <span className="text-white font-black">Signal #{weather.stormSignal}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Target Target:</span>
                    <span className="text-white font-black truncate max-w-[120px]">{speciesPreference === "both" ? "Tuna, Tamban" : speciesPreference}</span>
                  </div>
                </div>

                <button
                  onClick={handleGenerateAdvisorReport}
                  disabled={aiLoading}
                  className="w-full bg-brand-green hover:bg-brand-green/90 disabled:bg-teal-950 text-white font-black text-xs uppercase tracking-widest py-3 rounded-2xl transition flex items-center justify-center gap-2"
                >
                  {aiLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sieving Matrices...</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" />
                      <span>Generate Advisor Advice</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* AI Advisor Response Render */}
            {aiReport && (
              <div className="bg-white dark:bg-[#12211E] border border-brand-green/20 dark:border-brand-green/10 rounded-[2rem] p-6 md:p-8 text-left space-y-4 shadow-sm animate-fade-in max-h-[380px] overflow-y-auto">
                <h4 className="font-display font-black text-sm uppercase tracking-wider text-brand-green border-b border-brand-green/20 pb-2 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-brand-green" />
                  Advisory Report
                </h4>
                <div className="prose prose-sm dark:prose-invert prose-emerald font-bold leading-relaxed max-w-none text-xs text-gray-600 dark:text-gray-200">
                  <ReactMarkdown>{aiReport}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
