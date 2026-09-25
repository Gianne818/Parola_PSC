"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "../../components/layouts/AuthLayout";
import { useApp } from "../../context/AppContext";
import { useTranslation } from "../../hooks/use-translation";
import { fontScales } from "../../utils/fontScale";
import { storageService } from "../../services/storageService";
import {
  User,
  Ship,
  MapPin,
  Clock,
  Sun,
  Moon,
  Eye,
  Sliders,
  Globe,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Radio,
  ShieldCheck,
  Edit3,
  Smartphone,
  Anchor,
  Zap,
  Info
} from "lucide-react";

interface SmsPreferences {
  preferredTime: string;
  smsDialect: string;
  secondaryPhone: string;
  secondaryEnabled: boolean;
}

interface SeaReadabilityPreferences {
  highContrast: boolean;
  largeTouchTargets: boolean;
}

type SettingsSection = "vessel" | "advisories" | "readability" | "preferences";

export default function SettingsPage() {
  const router = useRouter();
  const {
    userProfile,
    updateProfile,
    language,
    changeLanguage,
    fontScale,
    changeFontScale,
    theme,
    toggleTheme,
    showToast
  } = useApp();

  const { t } = useTranslation(language);

  // Active tab — single card visible at a time (no vertical scroll stack).
  // Initial tab derived lazily from URL hash (supports legacy #profile / #port).
  const [activeSection, setActiveSection] = useState<SettingsSection>(() => {
    if (typeof window !== "undefined") {
      const raw = window.location.hash.replace("#", "");
      const legacyMap: Record<string, SettingsSection> = {
        profile: "vessel",
        port: "vessel",
        vessel: "vessel",
        advisories: "advisories",
        readability: "readability",
        preferences: "preferences"
      };
      return legacyMap[raw] ?? "vessel";
    }
    return "vessel";
  });

  // Progressive disclosure for GPS coordinates
  const [showCoordinateDetails, setShowCoordinateDetails] = useState(false);

  // New Sea Setting A: Daily SMS Dispatch Preferences (persisted in storageService)
  const [smsPrefs, setSmsPrefs] = useState<SmsPreferences>(() => {
    return storageService.getItem<SmsPreferences>("parola-sms-preferences", {
      preferredTime: "04:30",
      smsDialect: "tl",
      secondaryPhone: "",
      secondaryEnabled: false
    });
  });

  // New Sea Setting B: At-Sea Sunlight Readability (persisted in storageService)
  const [readabilityPrefs, setReadabilityPrefs] = useState<SeaReadabilityPreferences>(() => {
    return storageService.getItem<SeaReadabilityPreferences>("parola-sea-readability", {
      highContrast: false,
      largeTouchTargets: false
    });
  });

  // Local theme state synced with context
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">(theme || "light");

  // Handle URL hash navigation on mount (supports legacy #profile / #port hashes)

  const languages = [
    { code: "en", name: "English", sub: "International", flag: "US" },
    { code: "tl", name: "Tagalog", sub: "Pambansang Wika", flag: "PH" },
    { code: "ceb", name: "Cebuano", sub: "Bisaya", flag: "PH" },
    { code: "hil", name: "Hiligaynon", sub: "Ilonggo", flag: "PH" },
  ] as const;

  const dispatchTimes = [
    { value: "04:00", label: "04:00 PHT (Early Run)" },
    { value: "04:30", label: "04:30 PHT (Standard)" },
    { value: "05:00", label: "05:00 PHT" },
    { value: "05:30", label: "05:30 PHT" }
  ];

  const handleUpdateSmsPrefs = (updates: Partial<SmsPreferences>) => {
    const updated = { ...smsPrefs, ...updates };
    setSmsPrefs(updated);
    storageService.setItem("parola-sms-preferences", updated);
  };

  const handleUpdateReadability = (updates: Partial<SeaReadabilityPreferences>) => {
    const updated = { ...readabilityPrefs, ...updates };
    setReadabilityPrefs(updated);
    storageService.setItem("parola-sea-readability", updated);
  };

  const handleSaveAll = () => {
    storageService.setItem("parola-sms-preferences", smsPrefs);
    storageService.setItem("parola-sea-readability", readabilityPrefs);
    showToast("Vessel preferences and settings saved successfully.", "success");
  };

  const jumperItems = [
    { id: "vessel", label: "Vessel & Port", subtitle: "Operator, boat & anchorage", icon: Ship },
    { id: "advisories", label: "SMS Dispatch", subtitle: "Daily schedule & dialect", icon: Clock },
    { id: "readability", label: "At-Sea Display", subtitle: "Glare contrast & touch sizing", icon: Eye },
    { id: "preferences", label: "Preferences", subtitle: "Theme & interface language", icon: Sliders }
  ] as const;

  // Single-card tab switch — no scroll sync needed
  const scrollToSection = (id: SettingsSection) => {
    setActiveSection(id);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `/settings#${id}`);
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

      <div className="space-y-6 pb-20 pt-2 max-w-7xl mx-auto px-4 sm:px-6 selection:bg-[#00B37E]/20 selection:text-[#12211E]">

        {/* Top Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#DAE5E0]">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C57E2C]/10 border border-[#C57E2C]/25 text-[#9A5B18] text-[11px] font-bold uppercase tracking-wider shadow-2xs">
              <Sliders className="w-3.5 h-3.5 text-[#C57E2C]" />
              <span>Vessel Credentials & Preferences</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight text-[#12211E]">
              Settings & Vessel Profile
            </h1>
            <p className="text-xs sm:text-sm font-normal text-[#12211E]/75 max-w-2xl">
              Manage vessel credentials, home port anchorage, automated SMS schedules, and at-sea readability.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              type="button"
              onClick={handleSaveAll}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#00B37E] hover:bg-[#00B37E]/90 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm hover:shadow active:scale-[0.98] cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Save Settings</span>
            </button>
          </div>
        </div>

        {/* Sticky Mobile Section Jumper Bar (Visible < lg only) */}
        <div className="sticky top-0 z-20 bg-[#F2F6F4]/90 backdrop-blur-md py-2.5 -mx-4 px-4 lg:hidden">
          <nav className="flex items-center gap-1.5 sm:gap-2 p-1.5 bg-white border border-[#DAE5E0] rounded-full shadow-2xs max-w-2xl mx-auto overflow-x-auto scrollbar-none">
            {jumperItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-bold transition-all text-center cursor-pointer whitespace-nowrap ${
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

        {/* Desktop Two-Column Master-Detail Grid */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">

          {/* Left Column: Sticky Sub-Nav & Vessel Summary Widget */}
          <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-6 space-y-4">
            {/* Master Sub-Nav Card */}
            <div className="bg-white border border-[#DAE5E0] rounded-3xl p-4 shadow-sm space-y-1">
              <div className="px-3 pt-2 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#12211E]/50">
                  Settings Hub
                </span>
              </div>
              {jumperItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToSection(item.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition cursor-pointer ${
                      isActive
                        ? "bg-[#00B37E] text-white shadow-2xs font-bold"
                        : "text-[#12211E] hover:bg-[#EAF1ED]"
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 transition-colors ${
                      isActive ? "bg-white/20 text-white" : "bg-[#F2F6F4] text-[#00B37E]"
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold tracking-tight truncate">
                        {item.label}
                      </div>
                      <div className={`text-[10px] truncate ${isActive ? "text-white/80" : "text-[#12211E]/60"}`}>
                        {item.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Vessel Credential Quick Context Widget */}
            <div className="bg-white border border-[#DAE5E0] rounded-3xl p-5 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between border-b border-[#DAE5E0]/70 pb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#12211E]/60">
                  Vessel Status
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#00B37E] text-[10px] font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-black text-[#12211E] truncate">
                  {userProfile.vesselName || "F/B Sto. Niño"}
                </div>
                <div className="text-[11px] text-[#00B37E] font-medium flex items-center gap-1">
                  <Ship className="w-3 h-3" />
                  <span>PH-CN-2026-081</span>
                </div>
              </div>

              <div className="p-3 bg-[#F2F6F4]/70 rounded-2xl border border-[#DAE5E0] space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#12211E]/55">Home Port</span>
                  <span className="font-bold text-[#12211E] truncate max-w-[140px]">{userProfile.port || "Mercedes Port"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#12211E]/55">Morning SMS</span>
                  <span className="font-bold text-[#00B37E]">{smsPrefs.preferredTime} PHT ({smsPrefs.smsDialect.toUpperCase()})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#12211E]/55">Font Scale</span>
                  <span className="font-bold text-[#12211E]">{fontScales[fontScale]}%</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveAll}
                className="w-full py-2.5 px-4 rounded-full bg-[#00B37E] hover:bg-[#00B37E]/90 text-white font-bold text-xs uppercase tracking-wider transition shadow-2xs hover:shadow active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Save All Settings</span>
              </button>
            </div>
          </aside>

          {/* Right Column: Single Active Card (no vertical scroll stack) */}
          <main className="lg:col-span-8">

        {/* ============================================================ */}
        {/* CARD 1: VESSEL PROFILE + HOME PORT (merged) */}
        {/* ============================================================ */}
        {activeSection === "vessel" && (
        <section
          id="vessel"
          className="bg-white border border-[#DAE5E0] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DAE5E0]/70 pb-5">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-[#00B37E] flex items-center justify-center shrink-0">
                <Ship className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display font-black text-lg sm:text-xl text-[#12211E] tracking-tight">
                    {userProfile.vesselName || "F/B Sto. Niño"}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#00B37E] text-[10px] font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-3 h-3" />
                    SMS Verified
                  </span>
                </div>
                <p className="text-xs font-medium text-[#00B37E]">
                  Active Municipal Operator • Registration PH-CN-2026-081
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push("/onboarding?from=profile")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#DAE5E0] bg-white hover:bg-[#EAF1ED] text-[#12211E] text-xs font-bold transition shadow-2xs self-start sm:self-auto cursor-pointer active:scale-[0.98]"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#00B37E]" />
              <span>Edit Vessel Info</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-[#F2F6F4]/60 border border-[#DAE5E0] rounded-2xl p-4">
              <span className="text-[10px] font-bold text-[#12211E]/55 uppercase block tracking-wider">
                Registered Contact
              </span>
              <span className="text-sm font-black text-[#12211E] mt-1 block">
                {userProfile.phone || "+63 917 123 4567"}
              </span>
              <span className="text-[10px] text-[#00B37E] font-medium block mt-0.5">
                Cellular 2G Link Active
              </span>
            </div>

            <div className="bg-[#F2F6F4]/60 border border-[#DAE5E0] rounded-2xl p-4">
              <span className="text-[10px] font-bold text-[#12211E]/55 uppercase block tracking-wider">
                Vessel Category
              </span>
              <span className="text-sm font-black text-[#12211E] mt-1 block">
                Motorized Banca (&lt; 3 GT)
              </span>
              <span className="text-[10px] text-[#12211E]/65 block mt-0.5">
                Municipal Water Permitted
              </span>
            </div>

            <div className="bg-[#F2F6F4]/60 border border-[#DAE5E0] rounded-2xl p-4">
              <span className="text-[10px] font-bold text-[#12211E]/55 uppercase block tracking-wider">
                Target Fishery
              </span>
              <span className="text-sm font-black text-[#12211E] mt-1 block capitalize">
                {userProfile.speciesPreference === "pelagic"
                  ? "Pelagic (Surface)"
                  : userProfile.speciesPreference === "demersal"
                    ? "Demersal (Reef)"
                    : "General (Both Groups)"}
              </span>
              <span className="text-[10px] text-[#12211E]/65 block mt-0.5">
                ML Advisory Tuned
              </span>
            </div>
          </div>

          {/* Merged divider: Home Port & Anchorage (same card — no separate scroll section) */}
          <div className="pt-6 mt-2 border-t border-[#DAE5E0]/70 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DAE5E0]/70 pb-5">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-emerald-50 rounded-2xl text-[#00B37E] shrink-0 border border-emerald-100">
                <Anchor className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h2 className="font-display font-black text-lg sm:text-xl text-[#12211E] tracking-tight">
                  Home Port & Anchorage Geocenter
                </h2>
                <p className="text-xs text-[#12211E]/75">
                  Designated departure harbor establishing municipal boundaries and automated port safety hold radiuses.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push("/onboarding?from=profile")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#DAE5E0] bg-white hover:bg-[#EAF1ED] text-[#12211E] text-xs font-bold transition shadow-2xs self-start sm:self-auto cursor-pointer active:scale-[0.98]"
            >
              <MapPin className="w-3.5 h-3.5 text-[#00B37E]" />
              <span>Change Port</span>
            </button>
          </div>

          <div className="bg-[#F2F6F4]/50 border border-[#DAE5E0] rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-[#12211E]/55 uppercase block tracking-wider">
                  Active Marine Zone
                </span>
                <span className="text-base font-black text-[#12211E] block mt-0.5">
                  {userProfile.port || "Mercedes Fish Port (Camarines Norte)"}
                </span>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#00B37E] text-[10px] font-bold uppercase self-start sm:self-auto">
                Municipal Water Zone 3
              </span>
            </div>

            {/* Coordinates Summary with Progressive Disclosure */}
            <div className="pt-3 border-t border-[#DAE5E0] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="text-[#12211E]/70 font-medium">
                Anchor Coordinates: {userProfile.lat ? userProfile.lat.toFixed(4) : "14.0122"}° N, {userProfile.lng ? userProfile.lng.toFixed(4) : "123.0114"}° E
              </span>

              <button
                type="button"
                onClick={() => setShowCoordinateDetails(!showCoordinateDetails)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00B37E] hover:underline cursor-pointer self-start sm:self-auto"
              >
                <span>{showCoordinateDetails ? "Hide Boundary Details" : "View Boundary Details"}</span>
                {showCoordinateDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {showCoordinateDetails && (
              <div className="p-4 bg-white rounded-xl border border-[#DAE5E0] text-xs space-y-2 font-mono">
                <div className="flex justify-between items-center text-[#12211E]/80">
                  <span className="font-sans font-medium text-[#12211E]/60">GPS Latitude:</span>
                  <span className="font-bold">{userProfile.lat ? userProfile.lat.toFixed(6) : "14.012200"}° N</span>
                </div>
                <div className="flex justify-between items-center text-[#12211E]/80">
                  <span className="font-sans font-medium text-[#12211E]/60">GPS Longitude:</span>
                  <span className="font-bold">{userProfile.lng ? userProfile.lng.toFixed(6) : "123.011400"}° E</span>
                </div>
                <div className="flex justify-between items-center text-[#12211E]/80">
                  <span className="font-sans font-medium text-[#12211E]/60">Safety Hold Boundary:</span>
                  <span className="font-bold text-[#00B37E]">15.0 km Coastal Radius</span>
                </div>
                <p className="font-sans text-[11px] text-[#12211E]/65 pt-1 border-t border-[#DAE5E0]/60 leading-relaxed">
                  Vessel telemetry exceeding this boundary during gale warnings prompts automated Coast Guard port holds.
                </p>
              </div>
            )}
          </div>
          </div>
        </section>
        )}

        {/* ============================================================ */}
        {/* CARD 2: DAILY SMS ADVISORY DISPATCH */}
        {/* ============================================================ */}
        {activeSection === "advisories" && (
        <section
          id="advisories"
          className="bg-white border border-[#DAE5E0] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in"
        >
          <div className="flex items-start gap-3 border-b border-[#DAE5E0]/70 pb-5">
            <div className="p-2.5 bg-emerald-50 rounded-2xl text-[#00B37E] shrink-0 border border-emerald-100">
              <Clock className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h2 className="font-display font-black text-lg sm:text-xl text-[#12211E] tracking-tight">
                Daily SMS Advisory Schedule
              </h2>
              <p className="text-xs text-[#12211E]/75">
                Automated morning oceanographic broadcast delivered directly to 2G keypad phones before departure.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Preferred Morning Broadcast Time */}
            <div className="bg-[#F2F6F4]/50 border border-[#DAE5E0] rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-[#12211E]">
                  Morning Broadcast Time
                </label>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-[#00B37E]">
                  Pre-Dawn Departure
                </span>
              </div>

              <select
                value={smsPrefs.preferredTime}
                onChange={(e) => handleUpdateSmsPrefs({ preferredTime: e.target.value })}
                className="w-full py-2.5 px-3.5 rounded-xl border border-[#DAE5E0] bg-white text-xs font-bold text-[#12211E] focus:outline-none focus:ring-2 focus:ring-[#00B37E] cursor-pointer"
              >
                {dispatchTimes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>

              <p className="text-[11px] font-normal text-[#12211E]/65 leading-relaxed">
                Dispatched prior to pre-dawn sailing while banca remains within coastal cellular reception.
              </p>
            </div>

            {/* Preferred SMS Broadcast Dialect */}
            <div className="bg-[#F2F6F4]/50 border border-[#DAE5E0] rounded-2xl p-5 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-[#12211E] block">
                SMS Advisory Dialect
              </label>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { code: "tl", label: "Tagalog" },
                  { code: "ceb", label: "Cebuano" },
                  { code: "hil", label: "Hiligaynon" },
                  { code: "en", label: "English" }
                ].map((d) => (
                  <button
                    key={d.code}
                    type="button"
                    onClick={() => handleUpdateSmsPrefs({ smsDialect: d.code })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                      smsPrefs.smsDialect === d.code
                        ? "bg-[#00B37E] text-white border-[#00B37E] shadow-2xs"
                        : "bg-white border-[#DAE5E0] text-[#12211E]/75 hover:bg-[#EAF1ED]"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              <p className="text-[11px] font-normal text-[#12211E]/65 leading-relaxed">
                Advisory messages are formatted in standard GSM-7 text using this chosen dialect.
              </p>
            </div>
          </div>

          {/* Optional Second Crew / Shore Mobile Number */}
          <div className="p-4.5 bg-[#F2F6F4]/50 border border-[#DAE5E0] rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#12211E] block">
                  Secondary Shore or Crew Contact
                </span>
                <span className="text-[11px] text-[#12211E]/65">
                  Sends simultaneous SMS advisory to family shore watch or chief crew mate.
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleUpdateSmsPrefs({ secondaryEnabled: !smsPrefs.secondaryEnabled })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  smsPrefs.secondaryEnabled ? "bg-[#00B37E]" : "bg-[#DAE5E0]"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                    smsPrefs.secondaryEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {smsPrefs.secondaryEnabled && (
              <div className="pt-2 border-t border-[#DAE5E0]">
                <input
                  type="text"
                  placeholder="+63 9XX XXX XXXX (Shore / Family Contact)"
                  value={smsPrefs.secondaryPhone}
                  onChange={(e) => handleUpdateSmsPrefs({ secondaryPhone: e.target.value })}
                  className="w-full py-2.5 px-3.5 rounded-xl border border-[#DAE5E0] bg-white text-xs font-semibold text-[#12211E] placeholder-[#12211E]/40 focus:outline-none focus:ring-2 focus:ring-[#00B37E]"
                />
              </div>
            )}
          </div>
        </section>
        )}

        {/* ============================================================ */}
        {/* CARD 3: AT-SEA SUNLIGHT READABILITY */}
        {/* ============================================================ */}
        {activeSection === "readability" && (
        <section
          id="readability"
          className="bg-white border border-[#DAE5E0] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in"
        >
          <div className="flex items-start gap-3 border-b border-[#DAE5E0]/70 pb-5">
            <div className="p-2.5 bg-emerald-50 rounded-2xl text-[#00B37E] shrink-0 border border-emerald-100">
              <Eye className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h2 className="font-display font-black text-lg sm:text-xl text-[#12211E] tracking-tight">
                At-Sea Sunlight Readability & Accessibility
              </h2>
              <p className="text-xs text-[#12211E]/75">
                Optimize display contrast and touch surface hit areas for glare and moving vessel decks.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Sunlight High Contrast Toggle */}
            <div className="p-4.5 bg-[#F2F6F4]/50 border border-[#DAE5E0] rounded-2xl flex items-center justify-between">
              <div className="space-y-0.5 pr-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#12211E] block">
                  Sunlight High Contrast
                </span>
                <span className="text-[11px] text-[#12211E]/65 block">
                  Maximizes text sharpness and border contrast under direct tropical glare.
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleUpdateReadability({ highContrast: !readabilityPrefs.highContrast })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  readabilityPrefs.highContrast ? "bg-[#00B37E]" : "bg-[#DAE5E0]"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                    readabilityPrefs.highContrast ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Large Touch Targets Toggle */}
            <div className="p-4.5 bg-[#F2F6F4]/50 border border-[#DAE5E0] rounded-2xl flex items-center justify-between">
              <div className="space-y-0.5 pr-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#12211E] block">
                  Large Touch Targets
                </span>
                <span className="text-[11px] text-[#12211E]/65 block">
                  Expands button spacing and tap zones for wet hands and rolling decks.
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleUpdateReadability({ largeTouchTargets: !readabilityPrefs.largeTouchTargets })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  readabilityPrefs.largeTouchTargets ? "bg-[#00B37E]" : "bg-[#DAE5E0]"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                    readabilityPrefs.largeTouchTargets ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Accessibility Font Scale Slider */}
          <div className="bg-[#F2F6F4]/50 border border-[#DAE5E0] rounded-2xl p-5 space-y-3.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-[#12211E]">
                Accessibility Font Scale
              </label>
              <span className="text-xs font-black text-[#00B37E] bg-white px-3 py-1 rounded-full border border-[#DAE5E0] shadow-2xs">
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
                background: `linear-gradient(to right, #00B37E 0%, #00B37E ${fontScale * 25}%, #DAE5E0 ${fontScale * 25}%, #DAE5E0 100%)`
              }}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#00B37E]"
            />

            <div className="flex justify-between items-center text-[10px] font-bold text-[#12211E]/60 pt-1">
              <span>80% Compact</span>
              <span>100% Default</span>
              <span>115% Large</span>
              <span>130% Extra Large</span>
            </div>
          </div>
        </section>
        )}

        {/* ============================================================ */}
        {/* CARD 4: APPEARANCE & APPLICATION LANGUAGE */}
        {/* ============================================================ */}
        {activeSection === "preferences" && (
        <section
          id="preferences"
          className="bg-white border border-[#DAE5E0] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in"
        >
          <div className="flex items-start gap-3 border-b border-[#DAE5E0]/70 pb-5">
            <div className="p-2.5 bg-emerald-50 rounded-2xl text-[#00B37E] shrink-0 border border-emerald-100">
              <Sliders className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h2 className="font-display font-black text-lg sm:text-xl text-[#12211E] tracking-tight">
                Appearance & Language Preferences
              </h2>
              <p className="text-xs text-[#12211E]/75">
                Customize visual interface theme and select application dialect for telemetry labels.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Appearance Theme Switcher */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-[#12211E] block">
                Visual Theme
              </label>
              <div className="bg-[#F2F6F4] p-1 rounded-full border border-[#DAE5E0] grid grid-cols-2 gap-1 shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentTheme("light");
                    if (theme !== "light" && toggleTheme) toggleTheme();
                  }}
                  className={`py-2 px-3 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    currentTheme === "light"
                      ? "bg-white text-[#00B37E] shadow-2xs"
                      : "text-[#12211E]/70 hover:text-[#12211E]"
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  <span>Light Theme</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentTheme("dark");
                    if (theme !== "dark" && toggleTheme) toggleTheme();
                  }}
                  className={`py-2 px-3 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    currentTheme === "dark"
                      ? "bg-[#12211E] text-white shadow-2xs"
                      : "text-[#12211E]/70 hover:text-[#12211E]"
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  <span>Dark Theme</span>
                </button>
              </div>
            </div>

            {/* Application Language Selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-[#12211E] block">
                Application Language
              </label>

              <div className="grid grid-cols-2 gap-2">
                {languages.map((lang) => {
                  const isSelected = language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        changeLanguage(lang.code as any);
                        showToast(`Language switched to ${lang.name}.`, "info");
                      }}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-[#EAF1ED] border-[#00B37E] shadow-2xs"
                          : "bg-[#F2F6F4]/50 border-[#DAE5E0] hover:bg-[#F2F6F4]"
                      }`}
                    >
                      <div>
                        <span className={`text-xs font-bold block ${isSelected ? "text-[#00B37E]" : "text-[#12211E]"}`}>
                          {lang.name}
                        </span>
                        <span className="text-[10px] text-[#12211E]/55 block">
                          {lang.sub}
                        </span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#00B37E] stroke-[2.5]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
        )}

          </main>
        </div>

      </div>
    </AuthLayout>
  );
}