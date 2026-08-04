"use client";

import React, { useState } from "react";
import { AuthLayout } from "../../components/layouts/AuthLayout";
import { useApp } from "../../context/AppContext";
import { useTranslation } from "../../hooks/use-translation";
import { fontScales } from "../../utils/fontScale";
import {
  Sun,
  Moon,
  Globe,
  Check,
  Sliders
} from "lucide-react";

export default function SettingsPage() {
  const {
    language,
    changeLanguage,
    fontScale,
    changeFontScale,
    showToast
  } = useApp();

  const { t } = useTranslation(language);

  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "tl", name: "Tagalog", flag: "🇵🇭" },
    { code: "ceb", name: "Cebuano", flag: "🇵🇭" },
    { code: "hil", name: "Hiligaynon", flag: "🇵🇭" },
  ] as const;

  const handleSavePreferences = () => {
    showToast("General preferences saved successfully!", "success");
  };

  return (
    <AuthLayout>
      <div className="space-y-6 pb-16 pt-4 max-w-5xl mx-auto">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 rounded-2xl text-[#00B074]">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display font-[900] text-2xl sm:text-3xl tracking-tight text-slate-900">
                GENERAL SETTINGS
              </h1>
              <p className="text-xs font-semibold text-gray-400 mt-0.5">
                Customize appearance themes, accessibility text scaling, and application language preferences.
              </p>
            </div>
          </div>

          <button
            onClick={handleSavePreferences}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#00B074] hover:bg-[#009B66] text-white font-black text-xs uppercase tracking-wider transition shadow-sm self-start sm:self-auto active:scale-95 cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>SAVE PREFERENCES</span>
          </button>
        </div>

        {/* Single Card: Theme & UI Scaling + Application Language */}
        <div className="mt-4 sm:mt-6 bg-white border border-gray-200/80 rounded-[2.5rem] p-6 sm:p-8 shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

            {/* Left Section: Theme & UI Scaling */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Sun className="w-4.5 h-4.5 text-[#00B074]" />
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
                    className={`py-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer ${
                      theme === "light"
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
                    className={`py-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer ${
                      theme === "dark"
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
                  <span className="text-xs font-black text-[#00B074] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
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

            {/* Right Section: Application Language */}
            <div className="space-y-6 md:border-l md:border-gray-200/80 md:pl-8 pt-6 md:pt-0 border-t md:border-t-0 border-gray-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Globe className="w-4.5 h-4.5 text-[#00B074]" />
                  <h2 className="font-display font-black text-xs uppercase tracking-wider text-slate-900">
                    APPLICATION LANGUAGE
                  </h2>
                </div>
                <p className="text-xs font-semibold text-gray-400">
                  Select your preferred dialect for navigation labels, weather metrics, and vessel advisories.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {languages.map((lang) => {
                  const isSelected = language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => changeLanguage(lang.code)}
                      className={`flex items-center justify-between px-4 py-3.5 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                        isSelected
                          ? "border-[#00B074] bg-emerald-50/60 text-[#00B074]"
                          : "border-gray-200/80 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{lang.flag}</span>
                        <span>{lang.name}</span>
                      </div>
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#00B074]" />}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </div>
    </AuthLayout>
  );
}