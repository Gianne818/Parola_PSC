"use client";

import React, { useState } from "react";
import {
  Download,
  FileCode,
  HardDrive,
  Radio,
  Clock,
  CheckCircle2,
  Lock,
  RefreshCw,
  X,
  Compass,
  Zap,
  Satellite
} from "lucide-react";

interface OfflineGeoPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  zoneName?: string;
  zoneCoordinates?: string;
  vesselClass?: "Small-Scale (3.1-20 GT)" | "Medium-Scale (20.1-150 GT)" | "Large-Scale (>150 GT)";
}

export function OfflineGeoPackModal({
  isOpen,
  onClose,
  zoneName = "Zone 3 - Camarines Norte Pelagic Grounds",
  zoneCoordinates = "14.128°N, 123.084°E",
  vesselClass = "Medium-Scale (20.1-150 GT)"
}: OfflineGeoPackModalProps) {
  const [forecastHorizon, setForecastHorizon] = useState<"24h" | "48h" | "72h">("48h");
  const [selectedFormat, setSelectedFormat] = useState<"gpx" | "kml" | "geojson">("gpx");
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasUnlockedToday, setHasUnlockedToday] = useState(true);
  const [showSatelliteSyncDetails, setShowSatelliteSyncDetails] = useState(false);

  if (!isOpen) return null;

  const handleDownload = (format: "gpx" | "kml" | "geojson") => {
    setIsDownloading(true);

    // Generate simulated valid chartplotter payload
    setTimeout(() => {
      let content = "";
      let filename = `parola_forecast_${forecastHorizon}_zone3.${format}`;
      let mimeType = "application/octet-stream";

      if (format === "gpx") {
        mimeType = "application/gpx+xml";
        content = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Parola Marine Spatial Engine" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>Parola ${forecastHorizon} Fishery Hotspot Pack - ${zoneName}</name>
    <desc>RA 8550 Commercial Single-Vessel License Quota Export</desc>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <wpt lat="14.128" lon="123.084">
    <name>HOTSPOT_PELAGIC_01</name>
    <desc>Tamban/Sardine Schooling Zone - SST 28.2C Front - Prob 84%</desc>
    <sym>Fishing Area</sym>
  </wpt>
  <wpt lat="14.180" lon="123.140">
    <name>HOTSPOT_PELAGIC_02</name>
    <desc>Skipjack Tuna Migratory Vector - Prob 78%</desc>
    <sym>Fish Haven</sym>
  </wpt>
</gpx>`;
      } else if (format === "kml") {
        mimeType = "application/vnd.google-earth.kml+xml";
        content = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Parola Forecast ${forecastHorizon}</name>
    <Placemark>
      <name>Zone 3 Center Hotspot</name>
      <description>High probability pelagic feeding zone (84%)</description>
      <Point>
        <coordinates>123.084,14.128,0</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>`;
      } else {
        mimeType = "application/geo+json";
        content = JSON.stringify(
          {
            type: "FeatureCollection",
            properties: {
              engine: "Parola Oceanographic Hotspot Engine",
              licenseQuota: "1 Locked Zone per 24h Cycle",
              forecastHorizon,
              zone: zoneName,
              timestamp: new Date().toISOString()
            },
            features: [
              {
                type: "Feature",
                geometry: { type: "Point", coordinates: [123.084, 14.128] },
                properties: {
                  species: "Tamban & Galunggong",
                  sstFront: "28.2°C",
                  confidence: 0.84,
                  waveHeightMeters: 0.9
                }
              }
            ]
          },
          null,
          2
        );
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsDownloading(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#12211E]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#DAE5E0] rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl relative overflow-hidden text-[#12211E]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-[#12211E] p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#00B37E]/10 border border-[#00B37E]/25 text-[#00B37E] text-[11px] font-bold uppercase tracking-wider">
            <HardDrive className="w-3.5 h-3.5" />
            <span>Offline Geo-Pack Deliveries</span>
          </div>
          <h3 className="text-xl md:text-2xl font-display font-black text-[#12211E] tracking-tight">
            Chartplotter Forecast Export
          </h3>
          <p className="text-xs text-[#12211E]/70 leading-relaxed">
            Bundle spatial hotspot forecasts directly into your vessel&apos;s GPS chartplotter before departure.
          </p>
        </div>

        {/* Quota Status Box */}
        <div className="bg-[#F2F6F4] border border-[#DAE5E0] rounded-2xl p-4 mb-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold flex items-center gap-1.5 text-[#12211E]">
              <Lock className="w-3.5 h-3.5 text-[#00B37E]" />
              <span>Daily Quota: 1 Locked Zone per 24h Cycle</span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#00B37E] bg-[#00B37E]/10 px-2 py-0.5 rounded-full">
              Unlocked & Active
            </span>
          </div>
          <div className="text-xs text-[#12211E]/75 leading-relaxed">
            Current unlocked zone: <strong className="text-[#12211E]">{zoneName}</strong> ({zoneCoordinates}).
            You may re-download all file formats (.GPX, .KML, .GeoJSON) for this zone continuously without consuming extra quota.
          </div>
          <div className="flex items-center gap-2 pt-1 text-[11px] text-gray-500 font-medium">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span>Next daily zone unlock cycle resets in 14h 22m (00:00 PHT).</span>
          </div>
        </div>

        {/* Configuration Options */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#12211E]/70 mb-2">
              Select Forecast Horizon
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["24h", "48h", "72h"] as const).map((horizon) => (
                <button
                  key={horizon}
                  onClick={() => setForecastHorizon(horizon)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    forecastHorizon === horizon
                      ? "bg-[#00B37E] text-white border-[#00B37E] shadow-2xs"
                      : "bg-[#F2F6F4] text-[#12211E]/80 border-[#DAE5E0] hover:bg-[#E2EBE6]"
                  }`}
                >
                  {horizon} Horizon
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#12211E]/70 mb-2">
              Select Chartplotter Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "gpx", label: ".GPX", desc: "Garmin & Furuno" },
                { id: "kml", label: ".KML", desc: "Raymarine & Earth" },
                { id: "geojson", label: ".GeoJSON", desc: "Simrad & ECDIS" }
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt.id as any)}
                  className={`p-2.5 rounded-xl text-left transition-all cursor-pointer border ${
                    selectedFormat === fmt.id
                      ? "bg-white border-[#00B37E] ring-2 ring-[#00B37E]/20 shadow-xs"
                      : "bg-[#F2F6F4] border-[#DAE5E0] hover:bg-[#E2EBE6]"
                  }`}
                >
                  <div className="text-xs font-bold text-[#12211E]">{fmt.label}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{fmt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Low-Bandwidth Satellite Sync Add-on Collapsible Info */}
        <div className="border-t border-[#DAE5E0] pt-4 mb-6">
          <button
            onClick={() => setShowSatelliteSyncDetails(!showSatelliteSyncDetails)}
            className="flex items-center justify-between w-full text-xs font-bold text-[#12211E] hover:text-[#00B37E] transition-colors cursor-pointer text-left"
          >
            <span className="flex items-center gap-1.5">
              <Satellite className="w-4 h-4 text-[#C57E2C]" />
              <span>Low-Bandwidth Satellite Sync Add-on Available</span>
            </span>
            <span className="text-[11px] font-semibold text-[#00B37E]">
              {showSatelliteSyncDetails ? "Hide Details" : "View Byte-Stream Specs"}
            </span>
          </button>

          {showSatelliteSyncDetails && (
            <div className="mt-3 bg-[#F2F6F4] border border-[#DAE5E0] rounded-xl p-3 text-xs text-[#12211E]/75 space-y-1.5 animate-in fade-in">
              <p>
                <strong>Proprietary Binary Payload:</strong> Hotspot coordinates and SST thermal fronts are compiled into a tiny <strong>1.8 KB binary byte-stream</strong>.
              </p>
              <p>
                Compatible with <strong>Starlink Maritime</strong>, <strong>Iridium Go!</strong>, and <strong>Inmarsat FleetBroadband</strong> for mid-voyage refreshes with zero bandwidth waste.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => handleDownload(selectedFormat)}
            disabled={isDownloading}
            className="w-full sm:flex-1 bg-[#00B37E] hover:bg-[#00B37E]/90 text-white py-3.5 px-6 rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isDownloading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Exporting Geo-Pack...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download .{selectedFormat.toUpperCase()} Geo-Pack</span>
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto bg-[#F2F6F4] hover:bg-[#E2EBE6] text-[#12211E] py-3.5 px-6 rounded-full font-bold text-xs uppercase tracking-wider transition-all border border-[#DAE5E0] cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
