"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ExternalLink, Info, X } from "lucide-react";

interface GenericWebDisplayAdProps {
  format?: "leaderboard" | "inline-banner" | "sidebar";
  className?: string;
  slotId?: string;
  sample?: boolean;
}

export function GenericWebDisplayAd({
  format = "inline-banner",
  className = "",
  slotId = "ad-slot-default",
  sample = false,
}: GenericWebDisplayAdProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  if (sample) {
    return (
      <aside id={slotId} aria-label="Sample sponsor placement" className={`bg-white border border-[#DAE5E0] rounded-xl p-4 ${className}`}>
        <p className="font-bold text-[#087F5B] mb-2">Sample sponsor placement</p>
        <h4 className="font-display font-extrabold text-lg text-[#12211E]">Local marine services</h4>
        <p className="mt-2 text-[#12211E]/75">A brief sponsor acknowledgment could help fund municipal advisories.</p>
        <p className="mt-3 pt-3 border-t border-[#DAE5E0] text-[#52665E]">Illustrative advertising only. No named sponsor or partnership is represented.</p>
      </aside>
    );
  }

  // Curated programmatic ad creative rotation
  const ads = [
    {
      sponsor: "Sample marine services advertiser",
      headline: "Illustrative marine services placement",
      subline: "Demonstration only; no sponsor, port coverage or partnership is established.",
      badge: "Sample",
      cta: "Sample placement",
      href: "#",
      tagline: "Illustrative only"
    },
    {
      sponsor: "Sample connectivity advertiser",
      headline: "Illustrative coastal connectivity placement",
      subline: "No zero-rating, telecom agreement or nationwide coverage is established.",
      badge: "Sample",
      cta: "Sample placement",
      href: "#",
      tagline: "No provider agreement"
    },
    {
      sponsor: "Sample marine electronics advertiser",
      headline: "Illustrative marine electronics placement",
      subline: "Device imports are unverified; sample file formats do not establish compatibility.",
      badge: "Sample",
      cta: "Sample placement",
      href: "#",
      tagline: "Device support unverified"
    }
  ];

  const currentAd = ads[0];

  if (format === "leaderboard") {
    return (
      <aside
        id={slotId}
        aria-label="Sample advertising placement"
        className={`w-full max-w-7xl mx-auto my-6 px-4 ${className}`}
      >
        <div className="bg-white/80 backdrop-blur-xs border border-[#DAE5E0] rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs hover:border-[#00B37E]/30 transition-all">
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">
              Sample advertisement
            </span>
            <div className="text-left">
              <div className="text-xs font-bold text-[#12211E] flex items-center gap-2">
                <span>{currentAd.sponsor}</span>
                <span className="text-[10px] text-[#00B37E] font-medium hidden md:inline">
                  • {currentAd.tagline}
                </span>
              </div>
              <p className="text-[11px] text-[#12211E]/70 line-clamp-1">
                {currentAd.headline} — {currentAd.subline}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={currentAd.href}
              className="text-[11px] font-bold text-[#00B37E] hover:text-[#008F64] hover:underline flex items-center gap-1 px-3 py-1 rounded-full bg-[#00B37E]/10"
            >
              <span>{currentAd.cta}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={() => setIsDismissed(true)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full transition-colors cursor-pointer"
              title="Close Ad"
              aria-label="Close Ad"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // Default inline banner
  return (
    <div
      id={slotId}
      aria-label="Sample web display advertisement"
      className={`bg-white border border-[#DAE5E0] rounded-2xl p-4 shadow-2xs relative group ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
          <Info className="w-3 h-3" />
          <span>Sample community ad</span>
        </span>
        <span className="text-[10px] font-semibold text-[#00B37E] bg-[#00B37E]/10 px-2 py-0.5 rounded-full">
          {currentAd.tagline}
        </span>
      </div>

      <div className="space-y-1">
        <h4 className="text-xs font-bold text-[#12211E] group-hover:text-[#00B37E] transition-colors">
          {currentAd.headline}
        </h4>
        <p className="text-[11px] text-[#12211E]/70 leading-relaxed">
          {currentAd.subline}
        </p>
      </div>

      <div className="mt-3 pt-2.5 border-t border-[#DAE5E0]/70 flex items-center justify-between text-[11px]">
        <span className="text-gray-500 font-medium">{currentAd.sponsor}</span>
        <a
          href={currentAd.href}
          className="font-bold text-[#00B37E] hover:underline flex items-center gap-1"
        >
          <span>{currentAd.cta}</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
