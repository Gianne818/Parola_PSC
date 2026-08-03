"use client";

import React from "react";
import { AuthLayout } from "../../components/layouts/AuthLayout";
import { useApp } from "../../context/AppContext";
import { useTranslation } from "../../hooks/use-translation";
import { Anchor, Award, FileText, Info, Compass, ShieldCheck, Ship, Phone } from "lucide-react";

export default function ProfilePage() {
  const { userProfile, language } = useApp();
  const { t } = useTranslation(language);

  return (
    <AuthLayout>
      <div className="space-y-6 md:space-y-8 max-w-4xl mx-auto pb-12">
        {/* Header Title */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
            Cooperative Registry
          </span>
          <h2 className="font-display font-[900] text-3xl text-slate-900 dark:text-[#F7FAF9] mt-0.5 flex items-center gap-2">
            <Ship className="w-7 h-7 text-brand-green" />
            Captain Profile
          </h2>
        </div>

        {/* Vessel Badge Info */}
        <div className="relative bg-white dark:bg-[#12211E] border border-gray-100 dark:border-teal-950 rounded-[2.5rem] p-6 md:p-10 shadow-sm overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-8 text-left">
          {/* Back glows */}
          <div className="absolute top-0 right-0 w-64 h-full bg-brand-green rounded-full blur-[70px] opacity-10 pointer-events-none" />

          <div className="flex items-start gap-6 z-10">
            <div className="w-16 h-16 rounded-full bg-brand-green/10 dark:bg-brand-green/20 flex items-center justify-center text-brand-green shrink-0 border border-brand-green/20">
              <Ship className="w-8 h-8 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-green bg-brand-green/10 dark:bg-[#12211E] px-2.5 py-0.5 rounded-full border border-brand-green/20">
                  {userProfile.boatType === "motorized" ? "Motorized Banca" : "Paddle Banca"}
                </span>
                <span className="text-xs text-gray-400 font-bold">Registered Vessel</span>
              </div>
              <h3 className="font-display font-black text-3xl tracking-tight text-[#12211E] dark:text-white">
                {userProfile.vesselName}
              </h3>
              
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-400">
                <span className="flex items-center gap-1">
                  <Award className="w-4 h-4 text-amber-500" />
                  License: {userProfile.licenseNo}
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1">
                  <Anchor className="w-4 h-4 text-brand-green" />
                  Home anchorage: {userProfile.port}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-teal-950/20 border border-slate-150 dark:border-teal-950 px-6 py-4 rounded-2xl text-left z-10 min-w-[200px]">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">
              Active Transponder Coordinates
            </span>
            <span className="text-lg font-black text-[#12211E] dark:text-white block mt-1">
              {userProfile.lat.toFixed(4)}° N
            </span>
            <span className="text-lg font-black text-[#12211E] dark:text-white block">
              {userProfile.lng.toFixed(4)}° E
            </span>
          </div>
        </div>

        {/* Vessel specs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Certificate parameters */}
          <div className="bg-white dark:bg-[#12211E] border border-gray-100 dark:border-teal-950 rounded-[2rem] p-6 md:p-8 shadow-sm">
            <h4 className="font-display font-black text-lg text-slate-900 dark:text-[#F7FAF9] border-b border-gray-100 dark:border-teal-950 pb-3 mb-4 flex items-center gap-2">
              <FileText className="w-5.5 h-5.5 text-brand-green" />
              Official Registry Data
            </h4>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-gray-500 border-b border-gray-50 dark:border-teal-950 pb-2">
                <span>Vessel ID:</span>
                <span className="text-gray-800 dark:text-white font-extrabold">{userProfile.vesselName.replace(/\s+/g, "-").toUpperCase()}-2026</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-gray-500 border-b border-gray-50 dark:border-teal-950 pb-2">
                <span>BFAR Registry Stamp:</span>
                <span className="text-brand-green font-black flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-brand-green" />
                  Verified Active
                </span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-gray-500 border-b border-gray-50 dark:border-teal-950 pb-2">
                <span>Registered Mobile Link:</span>
                <span className="text-gray-800 dark:text-white font-extrabold flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  {userProfile.phone}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-gray-500 border-b border-gray-50 dark:border-teal-950 pb-2">
                <span>Species Preferences:</span>
                <span className="text-brand-green font-black uppercase tracking-wider text-[11px]">
                  {userProfile.speciesPreference} Target Families
                </span>
              </div>
            </div>
          </div>

          {/* Guidelines notes */}
          <div className="bg-white dark:bg-[#12211E] border border-gray-100 dark:border-teal-950 rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col justify-between">
            <div>
              <h4 className="font-display font-black text-lg text-slate-900 dark:text-[#F7FAF9] border-b border-gray-100 dark:border-teal-950 pb-3 mb-4 flex items-center gap-2">
                <Compass className="w-5.5 h-5.5 text-brand-green" />
                BFAR Fishery Rules
              </h4>

              <p className="text-xs text-gray-400 font-bold leading-relaxed">
                As a registered Parola member, you agree to sustainable catch quotas set by the Bureau of Fisheries and Aquatic Resources (BFAR). Refrain from commercial trawling in protected marine sanctuaries. Keep emergency satellite transponders active during active open-ocean voyages.
              </p>
            </div>

            <div className="bg-amber-50/50 dark:bg-amber-950/15 border border-amber-100 dark:border-amber-900/30 p-4 rounded-2xl text-left mt-6">
              <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider">
                Regulatory Advisory
              </span>
              <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 mt-1 leading-snug">
                Always record pelagic migration shifts. Report visual fish kills directly to municipal port aggregation units via cellular distress channels.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
