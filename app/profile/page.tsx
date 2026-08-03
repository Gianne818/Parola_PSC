"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "../../components/layouts/AuthLayout";
import { useApp } from "../../context/AppContext";
import { useTranslation } from "../../hooks/use-translation";
import {
  User,
  Check,
  Globe,
  MapPin,
  ShieldCheck,
  LogOut,
  Edit3
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { userProfile, language, changeLanguage, logout, showToast } = useApp();
  const { t } = useTranslation(language);

  const languagesList = [
    { code: "en", label: "ENGLISH", sub: "English", flag: "US" },
    { code: "tl", label: "TAGALOG", sub: "Tagalog", flag: "PH" },
    { code: "ceb", label: "CEBUANO", sub: "Cebuano", flag: "PH" },
    { code: "hil", label: "HILIGAYNON", sub: "Hiligaynon", flag: "PH" }
  ];

  const handleLanguageSelect = (code: string) => {
    changeLanguage(code as any);
    showToast(`Language changed to ${code.toUpperCase()}`, "success");
  };

  return (
    <AuthLayout>
      <div className="space-y-6 pb-16 pt-2">

          {/* Top Captain Header Card */}
          <div className="bg-white border border-gray-200/80 rounded-[2.5rem] p-6 sm:p-8 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Avatar Icon */}
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <User className="w-8 h-8 text-[#00B074]" />
              </div>

              {/* Vessel Details */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display font-[900] text-xl sm:text-2xl text-slate-900 tracking-tight">
                    {userProfile.vesselName || "F/V PAROLA I"}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#00B074] text-white text-[10px] font-black uppercase tracking-wider">
                    <Check className="w-3 h-3 stroke-[3]" /> SMS VERIFIED
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#00B074]">
                    ⚓ ACTIVE CAPTAIN / MUNICIPAL OPERATOR
                  </span>
                </div>

                <p className="text-xs font-bold text-gray-400">
                  Registered Contact: <span className="text-slate-800">{userProfile.phone || "+63 234234"}</span>
                </p>
              </div>
            </div>

            {/* Edit Profile Button */}
            <button
              onClick={() => router.push("/onboarding?from=profile")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-black uppercase tracking-wider transition shadow-sm self-start md:self-auto cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-gray-500" />
              <span>EDIT PROFILE</span>
            </button>
          </div>

          {/* Main Grid Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* LEFT COLUMN: Language Translation System */}
            <div className="lg:col-span-6 bg-white border border-gray-200/80 rounded-[2.5rem] p-6 sm:p-7 shadow-md space-y-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#00B074]" />
                  <h2 className="font-display font-black text-xs uppercase tracking-wider text-slate-900">
                    LANGUAGE TRANSLATION SYSTEM
                  </h2>
                </div>
                <p className="text-[11px] font-bold text-gray-400">
                  Select your preferred language interface for all navigation and advisory maps.
                </p>
              </div>

              {/* Language Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {languagesList.map((item) => {
                  const isSelected = language === item.code;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => handleLanguageSelect(item.code)}
                      className={`flex items-center justify-between p-4 rounded-2xl border text-left transition cursor-pointer ${isSelected
                          ? "border-[#00B074] bg-emerald-50/20"
                          : "border-gray-200/80 bg-slate-50/40 hover:bg-slate-50"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-slate-400 w-5">
                          {item.flag}
                        </span>
                        <div>
                          <span
                            className={`font-display font-black text-xs block ${isSelected ? "text-[#00B074]" : "text-slate-800"
                              }`}
                          >
                            {item.label}
                          </span>
                          <span className="text-[10px] font-semibold text-gray-400 block">
                            {item.sub}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#00B074] flex items-center justify-center text-white shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT COLUMN: Geoproximity & Session */}
            <div className="lg:col-span-6 space-y-6">

              {/* Geoproximity Geocenter Card */}
              <div className="bg-white border border-gray-200/80 rounded-[2.5rem] p-6 sm:p-7 shadow-md space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#00B074]">
                    GEOPROXIMITY GEOCENTER
                  </span>

                  <button
                    onClick={() => router.push("/onboarding?from=profile")}
                    className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-[#00B074] hover:bg-emerald-100 text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                  >
                    EDIT LOCATION
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#00B074]" />
                  <h3 className="font-display font-black text-xs uppercase tracking-wider text-slate-900">
                    HOME PORT ANCHORAGE
                  </h3>
                </div>

                {/* Anchorage Details Box */}
                <div className="p-4 bg-slate-50 border border-gray-200/80 rounded-2xl space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-display font-black text-xs uppercase text-slate-900">
                        {userProfile.port || "COASTAL SPOT NEAR MERCEDES FISH PORT (CAMARINES NORTE)"}
                      </h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">
                        ACTIVE MARINE ZONE • <span className="text-[#00B074] cursor-pointer" onClick={() => router.push("/onboarding?from=profile")}>CLICK TO CHANGE</span>
                      </p>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full bg-[#00B074] text-white text-[9px] font-black uppercase">
                      ACTIVE
                    </span>
                  </div>

                  <div className="pt-2 border-t border-gray-200/60 flex justify-between items-center text-xs font-mono font-bold text-slate-800">
                    <span>Lat: {userProfile.lat ? userProfile.lat.toFixed(4) : "14.3065"}° N</span>
                    <span>Lng: {userProfile.lng ? userProfile.lng.toFixed(4) : "122.6324"}° E</span>
                  </div>
                </div>

                {/* Boundary Alert Banner */}
                <div className="flex items-start gap-3 p-3.5 bg-emerald-50/50 border border-emerald-100/80 rounded-2xl">
                  <ShieldCheck className="w-4 h-4 text-[#00B074] shrink-0 mt-0.5" />
                  <p className="text-[11px] font-semibold text-gray-500 leading-snug">
                    This home geocenter establishes safe operational boundaries. Deviating outside municipal zones triggers immediate telemetry safety alerts.
                  </p>
                </div>
              </div>

              {/* Operator Session / Logout Card */}
              <div className="bg-white border border-gray-200/80 rounded-[2.5rem] p-6 sm:p-7 shadow-md space-y-4">
                <div className="flex items-center gap-2">
                  <LogOut className="w-4 h-4 text-red-500" />
                  <h3 className="font-display font-black text-xs uppercase tracking-wider text-red-500">
                    OPERATOR SESSION
                  </h3>
                </div>

                <p className="text-xs font-semibold text-gray-400">
                  Log out of your vessel operator account. This clears local variables and secure session state.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    router.push("/login");
                  }}
                  className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-black text-xs uppercase tracking-wider py-3.5 rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>SECURE LOGOUT</span>
                </button>
              </div>

            </div>

          </div>
        </div>
    </AuthLayout>
  );
}