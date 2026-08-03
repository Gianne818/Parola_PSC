"use client";

import React, { useState } from "react";
import { AuthLayout } from "../../components/layouts/AuthLayout";
import { useApp } from "../../context/AppContext";
import { MapComponent } from "../../components/features/hotspots/MapComponent";
import { Compass, Search } from "lucide-react";

export default function MapPage() {
  const { hotspots } = useApp();
  const [selectedHotspot, setSelectedHotspot] = useState<any>(null);
  const [mapFilterType, setMapFilterType] = useState<"pelagic" | "demersal" | "both">("both");
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  const [localSearchQuery, setLocalSearchQuery] = useState("");

  const allSpeciesList = Array.from(new Set(hotspots.flatMap((h) => h.species)));

  const handleSpeciesToggle = (species: string) => {
    if (selectedSpecies.includes(species)) {
      setSelectedSpecies(selectedSpecies.filter((s) => s !== species));
    } else {
      setSelectedSpecies([...selectedSpecies, species]);
    }
  };

  const filteredHotspots = hotspots.filter((h) => {
    const term = localSearchQuery.toLowerCase();
    const matchesSearch = h.name.toLowerCase().includes(term) || h.species.some(s => s.toLowerCase().includes(term));
    return matchesSearch;
  });

  return (
    <AuthLayout>
      <div className="space-y-6 md:space-y-8 pb-12">
        {/* Title */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
            Nautical Charts
          </span>
          <h2 className="font-display font-[900] text-3xl text-slate-900 dark:text-[#F7FAF9] mt-0.5 flex items-center gap-2">
            <Compass className="w-7 h-7 text-brand-green" />
            ECDIS Fullscreen Chart Plotter
          </h2>
        </div>

        {/* Filters bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white dark:bg-[#12211E] border border-gray-100 dark:border-teal-950 p-4 rounded-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-1">
              Category:
            </span>
            {["both", "pelagic", "demersal"].map((type) => (
              <button
                key={type}
                onClick={() => setMapFilterType(type as any)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition ${
                  mapFilterType === type
                    ? "bg-brand-green text-white shadow-sm"
                    : "bg-slate-50 dark:bg-teal-950/20 text-gray-400 hover:text-gray-700 dark:hover:text-white"
                }`}
              >
                {type === "both" ? "All" : type}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5 max-w-xl">
            {allSpeciesList.map((sp) => {
              const isSelected = selectedSpecies.includes(sp);
              return (
                <button
                  key={sp}
                  onClick={() => handleSpeciesToggle(sp)}
                  className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wide border transition ${
                    isSelected
                      ? "bg-brand-green/15 text-brand-green border-brand-green/20"
                      : "bg-gray-50 border-gray-200 text-gray-400 dark:bg-zinc-800 dark:border-teal-950"
                  }`}
                >
                  {sp}
                </button>
              );
            })}
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search hotspots..."
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-teal-950/20 border border-slate-200 dark:border-teal-900 rounded-full h-10 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:border-brand-green"
            />
          </div>
        </div>

        {/* Map Plotter */}
        <MapComponent
          hotspots={filteredHotspots}
          selectedHotspot={selectedHotspot}
          onSelectHotspot={setSelectedHotspot}
          filterType={mapFilterType}
          selectedSpecies={selectedSpecies}
        />
      </div>
    </AuthLayout>
  );
}
