"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ExternalLink, Info, X } from "lucide-react";

interface GenericWebDisplayAdProps {
  format?: "leaderboard" | "inline-banner" | "sidebar";
  className?: string;
  slotId?: string;
}

export function GenericWebDisplayAd({
  format = "inline-banner",
  className = "",
  slotId = "ad-slot-default"
}: GenericWebDisplayAdProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  // Curated programmatic ad creative rotation
  const ads = [
    {
      sponsor: "Petron Marine Fleet Fuel",
      headline: "Power Your Commercial Fleet with Clean Marine Fuel",
      subline: "Official diesel bunkering partner at 18 major Philippine fish ports.",
      badge: "Sponsor",
      cta: "Find Port Station",
      href: "#",
      tagline: "Eco-Grade Marine Diesel"
    },
    {
      sponsor: "Smart Satellite SIM",
      headline: "Affordable 2G/LTE Coastal Connectivity for Bancas",
      subline: "Zero-rated Parola marine safety bulletins across all coastal provinces.",
      badge: "Partner",
      cta: "Learn More",
      href: "#",
      tagline: "CSR Zero-Rated"
    },
    {
      sponsor: "Furuno Marine Electronics",
      headline: "Direct Chartplotter Geo-Pack Integration",
      subline: "Compatible with Parola .GPX, .KML, and .GeoJSON spatial hotspot bundles.",
      badge: "Supported Hardware",
      cta: "View Models",
      href: "#",
      tagline: "Garmin · Furuno · Simrad"
    }
  ];

  const currentAd = ads[0];

  if (format === "leaderboard") {
    return (
      <aside
        id={slotId}
        aria-label="Sponsored Advertisement"
        className={`w-full max-w-7xl mx-auto my-6 px-4 ${className}`}
      >
        <div className="bg-white/80 backdrop-blur-xs border border-[#DAE5E0] rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs hover:border-[#00B37E]/30 transition-all">
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">
              Advertisement
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
      aria-label="Programmatic Web Display Ad"
      className={`bg-white border border-[#DAE5E0] rounded-2xl p-4 shadow-2xs relative group ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
          <Info className="w-3 h-3" />
          <span>Sponsored Community Ad</span>
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
