"use client";

import React, { useEffect, useId, useRef, useState } from "react";
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const downloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleId = useId();
  const horizonId = useId();
  const formatId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      if (downloadTimer.current !== null) clearTimeout(downloadTimer.current);
      downloadTimer.current = null;
      setIsDownloading(false);
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownload = (format: "gpx" | "kml" | "geojson") => {
    if (downloadTimer.current !== null) return;
    setIsDownloading(true);

    // Generate local sample files; these are not validated forecasts or device imports.
    downloadTimer.current = setTimeout(() => {
      downloadTimer.current = null;
      let content = "";
      let filename = `parola_DEMO_${forecastHorizon}_zone3.${format}`;
      let mimeType = "application/octet-stream";

      if (format === "gpx") {
        mimeType = "application/gpx+xml";
        content = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Parola sample exporter" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>DEMO ONLY - ${forecastHorizon} selector example - ${zoneName}</name>
    <desc>Static sample coordinates, not a forecast or navigation guidance. Time is file creation time, not prediction validity. No licence or device support established.</desc>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <wpt lat="14.128" lon="123.084">
    <name>DEMO_POINT_01</name>
    <desc>Illustrative point only; no observed species, environmental reading or catch probability.</desc>
    <sym>Fishing Area</sym>
  </wpt>
  <wpt lat="14.180" lon="123.140">
    <name>DEMO_POINT_02</name>
    <desc>Illustrative point only; not a verified fishing target.</desc>
    <sym>Fish Haven</sym>
  </wpt>
</gpx>`;
      } else if (format === "kml") {
        mimeType = "application/vnd.google-earth.kml+xml";
        content = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>DEMO ONLY - ${forecastHorizon} selector example</name>
    <description>Static sample coordinates, not a forecast or navigation guidance. No device support established.</description>
    <Placemark>
      <name>DEMO_POINT_01</name>
      <description>Illustrative point only; no verified catch probability.</description>
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
              engine: "Parola sample exporter",
              notice: "DEMO ONLY: static sample coordinates, not a forecast or navigation guidance. All feature values are illustrative. Time is file creation time, not prediction validity. No device support established.",
              licenseQuota: "Demo only; no entitlement or zone lock",
              forecastHorizon,
              zone: zoneName,
              timestamp: new Date().toISOString()
            },
            features: [
              {
                type: "Feature",
                geometry: { type: "Point", coordinates: [123.084, 14.128] },
                properties: {
                  species: "Sample only; no observed species",
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
    <dialog ref={dialogRef} aria-labelledby={titleId} lang="en"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-3xl border border-[#DAE5E0] bg-white p-0 text-[#12211E] shadow-2xl backdrop:bg-[#12211E]/60">
      <div className="relative min-w-0 p-6 md:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 flex min-h-11 min-w-11 items-center justify-center text-gray-500 hover:text-[#12211E] rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#00B37E]/10 border border-[#00B37E]/25 text-[#00B37E] text-[11px] font-bold uppercase tracking-wider">
            <HardDrive className="w-3.5 h-3.5" />
            <span>Local Geo-Pack demo</span>
          </div>
          <h3 id={titleId} className="text-xl md:text-2xl font-display font-black text-[#12211E] tracking-tight pr-6">
            Sample file export
          </h3>
          <p className="text-xs text-[#12211E]/70 leading-relaxed">
            Static demonstration points only, not forecasts or navigation guidance. Device imports are unverified. Horizon buttons change the sample label, not the data.
          </p>
        </div>

        {/* Quota Status Box */}
        <div className="bg-[#F2F6F4] border border-[#DAE5E0] rounded-2xl p-4 mb-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold flex items-center gap-1.5 text-[#12211E]">
              <Lock className="w-3.5 h-3.5 text-[#00B37E]" />
              <span>Sample zone — no verified entitlement</span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#00B37E] bg-[#00B37E]/10 px-2 py-0.5 rounded-full">
              Demo only
            </span>
          </div>
          <div className="text-xs text-[#12211E]/75 leading-relaxed">
            Displayed sample zone: <strong className="text-[#12211E]">{zoneName}</strong> ({zoneCoordinates}).
            Downloads use fixed example points. This display does not verify access, validity, a zone lock or re-download rights.
          </div>
          <div className="flex items-center gap-2 pt-1 text-[11px] text-gray-500 font-medium">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span>No live reset time is available. Zone cycle rules remain pending.</span>
          </div>
        </div>

        {/* Configuration Options */}
        <div className="space-y-4 mb-6">
          <div>
            <p id={horizonId} className="block text-xs font-bold uppercase tracking-wider text-[#12211E]/70 mb-2">
              Sample horizon label — no forecast generated
            </p>
            <div role="group" aria-labelledby={horizonId} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(["24h", "48h", "72h"] as const).map((horizon) => (
                <button
                  key={horizon}
                  type="button"
                  aria-pressed={forecastHorizon === horizon}
                  onClick={() => setForecastHorizon(horizon)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    forecastHorizon === horizon
                      ? "bg-[#00B37E] text-white border-[#00B37E] shadow-2xs"
                      : "bg-[#F2F6F4] text-[#12211E]/80 border-[#DAE5E0] hover:bg-[#E2EBE6]"
                  }`}
                >
                  {horizon} demo
                </button>
              ))}
            </div>
          </div>

          <div>
            <p id={formatId} className="block text-xs font-bold uppercase tracking-wider text-[#12211E]/70 mb-2">
              Select sample file format
            </p>
            <div role="group" aria-labelledby={formatId} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: "gpx", label: ".GPX", desc: "Sample waypoints" },
                { id: "kml", label: ".KML", desc: "Sample placemark" },
                { id: "geojson", label: ".GeoJSON", desc: "Sample feature" }
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  aria-pressed={selectedFormat === fmt.id}
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
            aria-expanded={showSatelliteSyncDetails}
            onClick={() => setShowSatelliteSyncDetails(!showSatelliteSyncDetails)}
            className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between w-full text-xs font-bold text-[#12211E] hover:text-[#00B37E] transition-colors cursor-pointer text-left"
          >
            <span className="flex min-w-0 max-w-full items-center gap-1.5">
              <Satellite className="w-4 h-4 shrink-0 text-[#C57E2C]" />
              <span className="min-w-0 [overflow-wrap:anywhere]">Satellite sync — planned, unavailable</span>
            </span>
            <span className="text-[11px] font-semibold text-[#00B37E]">
              {showSatelliteSyncDetails ? "Hide Details" : "View planned scope"}
            </span>
          </button>

          {showSatelliteSyncDetails && (
            <div className="mt-3 bg-[#F2F6F4] border border-[#DAE5E0] rounded-xl p-3 text-xs text-[#12211E]/75 space-y-1.5 animate-in fade-in">
              <p>
                <strong>Roadmap concept:</strong> Satellite forecast refreshes require a working integration and validated data. No binary payload or operational byte size has been established.
              </p>
              <p>
                No satellite provider, onboard device compatibility, transmission cost or bandwidth saving has been verified.
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
                <span>Creating sample file...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download .{selectedFormat.toUpperCase()} sample</span>
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
    </dialog>
  );
}
