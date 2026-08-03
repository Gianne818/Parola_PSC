import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import { Wind, Waves, MessageSquare, Ship, Anchor, Filter, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import 'leaflet/dist/leaflet.css';

const PH_BOUNDS: LatLngBoundsExpression = [[4.5, 116.0], [21.5, 127.0]];

// ─── Fish families ────────────────────────────────────────────────────────────
export const PELAGIC_FAMILIES = [
  { name: 'Clupeidae',      desc: 'Sardines / Tamban' },
  { name: 'Carangidae',     desc: 'Scads / Galunggong' },
  { name: 'Scombridae',     desc: 'Mackerels & Tunas / Alumahan' },
  { name: 'Engraulidae',    desc: 'Anchovies / Dilis' },
  { name: 'Coryphaenidae',  desc: 'Dolphinfish / Dorado' },
];

export const DEMERSAL_FAMILIES = [
  { name: 'Serranidae',    desc: 'Groupers / Lapu-lapu' },
  { name: 'Lutjanidae',    desc: 'Snappers / Maya-maya' },
  { name: 'Leiognathidae', desc: 'Slipmouths / Sapsap' },
  { name: 'Nemipteridae',  desc: 'Threadfin Breams / Bisugo' },
  { name: 'Lethrinidae',   desc: 'Emperors / Katambak' },
];

// ─── Hotspot data ─────────────────────────────────────────────────────────────
// type = 'general_pelagic'  → shows when useGeneralPelagic is ON
//        'general_demersal' → shows when useGeneralDemersal is ON
//        'family'           → shows when the specific family name is checked

const HOTSPOTS = [
  // ── General Pelagic areas: based on surface currents, temperature fronts, upwelling zones
  { id: 'gp1', lat: 14.5, lng: 119.5, type: 'general_pelagic' as const, family: null, label: 'Upwelling Zone — Mindoro Passage', color: '#0284c7', radius: 32 },
  { id: 'gp2', lat: 11.0, lng: 123.8, type: 'general_pelagic' as const, family: null, label: 'Surface Current Convergence — Visayas Sea', color: '#0284c7', radius: 28 },
  { id: 'gp3', lat: 16.8, lng: 121.2, type: 'general_pelagic' as const, family: null, label: 'Warm Eddy — Pacific Entry, Cagayan', color: '#0284c7', radius: 30 },
  { id: 'gp4', lat: 8.2,  lng: 126.5, type: 'general_pelagic' as const, family: null, label: 'Open Ocean Thermocline — Davao Gulf Mouth', color: '#0284c7', radius: 25 },

  // ── General Demersal areas: based on reef systems, bathymetric shelves, seagrass beds
  { id: 'gd1', lat: 11.2, lng: 123.5, type: 'general_demersal' as const, family: null, label: 'Coastal Shelf — Cebu Strait', color: '#059669', radius: 30 },
  { id: 'gd2', lat: 9.8,  lng: 118.6, type: 'general_demersal' as const, family: null, label: 'Reef Flat Area — Palawan Northwest', color: '#059669', radius: 28 },
  { id: 'gd3', lat: 7.0,  lng: 122.0, type: 'general_demersal' as const, family: null, label: 'Seagrass Bed — Sulu Sea, Zamboanga', color: '#059669', radius: 26 },
  { id: 'gd4', lat: 13.3, lng: 124.2, type: 'general_demersal' as const, family: null, label: 'Rocky Shoal — Samar Sea', color: '#059669', radius: 27 },

  // ── Family-specific hotspots
  { id: 'f1', lat: 13.1, lng: 120.3, type: 'family' as const, family: 'Clupeidae',     label: 'Sardines / Tamban',            color: '#7c3aed', radius: 20 },
  { id: 'f2', lat: 11.8, lng: 122.2, type: 'family' as const, family: 'Carangidae',    label: 'Scads / Galunggong',           color: '#7c3aed', radius: 20 },
  { id: 'f3', lat: 14.2, lng: 119.8, type: 'family' as const, family: 'Scombridae',    label: 'Mackerels & Tunas / Alumahan', color: '#7c3aed', radius: 20 },
  { id: 'f4', lat: 10.2, lng: 125.1, type: 'family' as const, family: 'Engraulidae',   label: 'Anchovies / Dilis',            color: '#7c3aed', radius: 20 },
  { id: 'f5', lat: 15.5, lng: 120.8, type: 'family' as const, family: 'Coryphaenidae', label: 'Dolphinfish / Dorado',         color: '#7c3aed', radius: 20 },
  { id: 'f6', lat: 10.5, lng: 119.3, type: 'family' as const, family: 'Serranidae',    label: 'Groupers / Lapu-lapu',         color: '#ea580c', radius: 20 },
  { id: 'f7', lat: 12.1, lng: 124.3, type: 'family' as const, family: 'Lutjanidae',    label: 'Snappers / Maya-maya',         color: '#ea580c', radius: 20 },
  { id: 'f8', lat: 8.5,  lng: 123.9, type: 'family' as const, family: 'Leiognathidae', label: 'Slipmouths / Sapsap',          color: '#ea580c', radius: 20 },
  { id: 'f9', lat: 9.1,  lng: 125.7, type: 'family' as const, family: 'Nemipteridae',  label: 'Threadfin Breams / Bisugo',    color: '#ea580c', radius: 20 },
  { id: 'f10',lat: 6.9,  lng: 122.6, type: 'family' as const, family: 'Lethrinidae',   label: 'Emperors / Katambak',          color: '#ea580c', radius: 20 },
];

const userIcon = L.divIcon({
  className: '',
  html: `<div style="background:linear-gradient(135deg,#0d9488,#0891b2);width:32px;height:32px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(13,148,136,.5)">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/></svg>
  </div>`,
  iconSize: [32, 32], iconAnchor: [16, 16],
});

const makeIcon = (color: string, size = 22) =>
  L.divIcon({
    className: '',
    html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;border:2.5px solid rgba(255,255,255,0.9);box-shadow:0 3px 10px rgba(0,0,0,.15)"></div>`,
    iconSize: [size, size], iconAnchor: [size / 2, size / 2],
  });

export const DashboardView: React.FC = () => {
  const { referencePoint, weather, settings, toggleFamily, updateSettings, notifications, sendNotificationFeedback } = useAppState();
  if (!referencePoint) return null;

  const feedbackNotif = notifications.find(n => n.type === 'catch_feedback');
  const waveThresholdExceeded = weather.waveHeight > (settings.waveHeightThreshold ?? 2.0);
  const isUnsafe = weather.waveHeight > 2.5 || weather.windSpeed > 30 || weather.stormSignal > 1 || waveThresholdExceeded;

  // ─── Filter logic ─────────────────────────────────────────────────────────
  // General hotspots: visible when the matching General flag is ON
  // Family-specific: visible when the specific family is in targetFamilies
  // Category tab further narrows: Pelagic hides demersal, etc.
  const filteredHotspots = HOTSPOTS.filter(h => {
    const isPelagicType   = h.type === 'general_pelagic'  || (h.type === 'family' && PELAGIC_FAMILIES.some(f => f.name === h.family));
    const isDemersalType  = h.type === 'general_demersal' || (h.type === 'family' && DEMERSAL_FAMILIES.some(f => f.name === h.family));

    // Category tab filter
    if (settings.targetCategory === 'Pelagic'     && !isPelagicType)  return false;
    if (settings.targetCategory === 'Reef/Demersal' && !isDemersalType) return false;

    // Type-specific visibility
    if (h.type === 'general_pelagic')  return settings.useGeneralPelagic;
    if (h.type === 'general_demersal') return settings.useGeneralDemersal;
    if (h.type === 'family')           return settings.targetFamilies.includes(h.family!);
    return false;
  });

  const showPelagicSection  = settings.targetCategory === 'All' || settings.targetCategory === 'Pelagic';
  const showDemersalSection = settings.targetCategory === 'All' || settings.targetCategory === 'Reef/Demersal';

  const renderFamilyBtn = (family: { name: string; desc: string }) => {
    const isSelected = settings.targetFamilies.includes(family.name);
    return (
      <button key={family.name} onClick={() => toggleFamily(family.name)}
        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer text-left ${isSelected ? 'bg-violet-50 border-violet-200 text-violet-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
        <div className="flex flex-col">
          <span className="text-xs font-semibold">{family.name}</span>
          <span className="text-[10px] text-slate-400">{family.desc}</span>
        </div>
        <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${isSelected ? 'border-violet-500 bg-violet-500' : 'border-slate-300'}`}>
          {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto px-4 py-6 md:p-8 space-y-6">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-2xl font-black text-slate-900">Advisory Dashboard</h2>
        <p className="text-slate-500 text-xs mt-0.5">Real-time hotspots, marine warnings, and calibration feeds.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-7xl mx-auto w-full items-stretch">
        {/* ── Map ──────────────────────────────────────────────────────── */}
        <div className="md:col-span-6 lg:col-span-7 flex flex-col">
          <div className="w-full bg-white border border-slate-200 rounded-3xl shadow-md overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 shrink-0">
              <Anchor className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-bold text-slate-800">Fishing Hotspots Live Grid</span>
              <span className="ml-auto text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">{filteredHotspots.length} zones</span>
            </div>

            {/* Legend */}
            <div className="px-4 py-2 border-b border-slate-50 flex flex-wrap gap-3">
              {[
                { color: '#0284c7', label: 'General Pelagic (Sea conditions)' },
                { color: '#059669', label: 'General Demersal (Reef/Bottom)' },
                { color: '#7c3aed', label: 'Specific pelagic family' },
                { color: '#ea580c', label: 'Specific demersal family' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: l.color }} />
                  <span className="text-[9px] text-slate-500">{l.label}</span>
                </div>
              ))}
            </div>

            <div className="relative aspect-[4/5] md:aspect-auto md:h-[540px] w-full flex-1">
              <MapContainer center={[referencePoint.lat, referencePoint.lng]} zoom={7}
                style={{ height: '100%', width: '100%' }}
                maxBounds={PH_BOUNDS} maxBoundsViscosity={1.0} minZoom={6} zoomControl={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />

                {/* User marker */}
                <Marker position={[referencePoint.lat, referencePoint.lng]} icon={userIcon}>
                  <Popup><div className="font-bold text-slate-900">{referencePoint.locationName}</div><div className="text-xs text-slate-500">My Location</div></Popup>
                </Marker>

                {/* Hotspot markers */}
                {filteredHotspots.map(h => {
                  const color = isUnsafe ? '#ef4444' : h.color;
                  const isGeneral = h.type !== 'family';
                  return (
                    <React.Fragment key={h.id}>
                      {/* Glow ring for general hotspots */}
                      {isGeneral && (
                        <CircleMarker center={[h.lat, h.lng]}
                          pathOptions={{ color, fillColor: color, fillOpacity: 0.12, weight: 1.5, opacity: 0.4 }}
                          radius={h.radius + 14} />
                      )}
                      <CircleMarker center={[h.lat, h.lng]}
                        pathOptions={{ color, fillColor: color, fillOpacity: isGeneral ? 0.25 : 0.4, weight: isGeneral ? 2 : 1.5 }}
                        radius={h.radius} />
                      <Marker position={[h.lat, h.lng]} icon={makeIcon(color, isGeneral ? 18 : 14)}>
                        <Popup>
                          <div className="p-1 text-xs">
                            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color }}>
                              {h.type === 'general_pelagic' ? '🌊 General Pelagic Zone' : h.type === 'general_demersal' ? '🪸 General Demersal Zone' : `🐟 ${h.family}`}
                            </p>
                            <p className="font-semibold text-slate-800">{h.label}</p>
                          </div>
                        </Popup>
                      </Marker>
                    </React.Fragment>
                  );
                })}
              </MapContainer>

              {isUnsafe && (
                <div className="absolute top-4 left-4 right-4 z-[1000] bg-red-50 border-2 border-red-200 text-red-700 p-3 rounded-2xl shadow-lg flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider">Unsafe Navigation Notice</p>
                    <p className="text-[10px] opacity-90 mt-0.5">{waveThresholdExceeded ? `Waves exceed your set limit (${settings.waveHeightThreshold}m).` : 'Severe conditions detected in your area.'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Filter Panel ─────────────────────────────────────────────── */}
        <div className="md:col-span-6 lg:col-span-5 flex flex-col">
          <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-md flex flex-col md:h-[700px] space-y-4">
            <div>
              <h3 className="text-sm font-bold text-teal-700 uppercase tracking-wider flex items-center gap-2 mb-0.5">
                <Filter className="w-4 h-4" /> Species Filter System
              </h3>
              <p className="text-slate-500 text-[11px]">Filter hotspots by category and family. <span className="font-semibold text-slate-600">General zones</span> are based on sea conditions; <span className="font-semibold text-slate-600">family filters</span> show species-specific predictions.</p>
            </div>

            {/* Category Tab */}
            <div className="flex bg-slate-100 p-1 rounded-full">
              {[
                { id: 'Pelagic',       label: 'Pelagic' },
                { id: 'Reef/Demersal', label: 'Demersal' },
                { id: 'All',           label: 'Both' },
              ].map(cat => (
                <button key={cat.id} onClick={() => updateSettings({ targetCategory: cat.id as any })}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-full transition-all text-center cursor-pointer ${settings.targetCategory === cat.id ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Scrollable lists */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-1 scrollbar-hide min-h-0">

              {showPelagicSection && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block pb-1 border-b border-blue-50">
                    🌊 Pelagic (Surface / Open-water)
                  </span>

                  {/* General Pelagic toggle */}
                  <button onClick={() => updateSettings({ useGeneralPelagic: !settings.useGeneralPelagic })}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 transition-all cursor-pointer ${settings.useGeneralPelagic ? 'border-blue-300 bg-blue-50 text-blue-900' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}>
                    <div className="flex items-center gap-2">
                      {settings.useGeneralPelagic ? <ToggleRight className="w-5 h-5 text-blue-500" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                      <div className="text-left">
                        <span className="text-sm font-bold block">General Pelagic</span>
                        <span className="text-[10px] text-slate-400">Sea upwellings, current fronts, temp zones</span>
                      </div>
                    </div>
                    {settings.useGeneralPelagic && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 shrink-0">ON</span>}
                  </button>

                  {/* Family-specific */}
                  <div className="pl-1 space-y-1.5">
                    <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest ml-1 mt-2">Or select specific families:</p>
                    {PELAGIC_FAMILIES.map(renderFamilyBtn)}
                  </div>
                </div>
              )}

              {showDemersalSection && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block pb-1 border-b border-emerald-50">
                    🪸 Demersal (Reef / Bottom-dwellers)
                  </span>

                  {/* General Demersal toggle */}
                  <button onClick={() => updateSettings({ useGeneralDemersal: !settings.useGeneralDemersal })}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 transition-all cursor-pointer ${settings.useGeneralDemersal ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}>
                    <div className="flex items-center gap-2">
                      {settings.useGeneralDemersal ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                      <div className="text-left">
                        <span className="text-sm font-bold block">General Demersal</span>
                        <span className="text-[10px] text-slate-400">Reef systems, seagrass beds, rocky shoals</span>
                      </div>
                    </div>
                    {settings.useGeneralDemersal && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0">ON</span>}
                  </button>

                  {/* Family-specific */}
                  <div className="pl-1 space-y-1.5">
                    <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest ml-1 mt-2">Or select specific families:</p>
                    {DEMERSAL_FAMILIES.map(renderFamilyBtn)}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500 shrink-0">
              <span>Active zones on map:</span>
              <span className="font-bold text-teal-600">{filteredHotspots.length} hotspots</span>
            </div>
          </section>
        </div>
      </div>

      {/* ── Weather + SMS ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-7xl mx-auto w-full items-start">
        <div className="md:col-span-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sea & Weather Conditions</h3>
          <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-5">
            <div className={`p-4 rounded-2xl border flex items-center gap-3 ${isUnsafe ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
              <Ship className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-black text-sm uppercase">{isUnsafe ? 'Caution / Hold Sail' : 'Favorable to Sail'}</p>
                <p className="text-[10px] opacity-80 mt-0.5">{isUnsafe ? 'Rough conditions or alerts active' : 'All metrics clear for sailing'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-slate-500 text-xs flex items-center gap-1.5 font-bold"><Wind className="w-3.5 h-3.5 text-teal-600" /> Wind</span>
                <span className="text-xl font-bold font-mono text-slate-900 mt-2 block">{weather.windSpeed} <span className="text-xs font-normal">km/h</span></span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-slate-500 text-xs flex items-center gap-1.5 font-bold"><Waves className="w-3.5 h-3.5 text-teal-600" /> Waves</span>
                <span className={`text-xl font-bold font-mono mt-2 block ${waveThresholdExceeded ? 'text-red-600' : 'text-slate-900'}`}>{weather.waveHeight} <span className="text-xs font-normal">m</span></span>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between items-center"><span className="text-slate-500 font-bold">Storm Signal</span><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${weather.stormSignal > 0 ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-700'}`}>Signal #{weather.stormSignal}</span></div>
              <div className="flex justify-between items-center"><span className="text-slate-500 font-bold">Sea Surface Temp</span><span className="font-mono font-semibold">28.4°C</span></div>
              <div className="flex justify-between items-center"><span className="text-slate-500 font-bold">Tide</span><span className="font-semibold">{weather.tideLevel} Tide</span></div>
            </div>
            <p className="text-[10px] text-slate-400 text-center">Live data from Open-Meteo marine grids.</p>
          </section>
        </div>

        <div className="md:col-span-7 space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Catch Feedback Calibration</h3>
          {feedbackNotif ? (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center border border-teal-100 shrink-0"><MessageSquare className="w-5 h-5 text-teal-600" /></div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{feedbackNotif.title}</h4>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Advisory at {new Date(feedbackNotif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs font-mono leading-relaxed whitespace-pre-wrap">{feedbackNotif.text}</div>
              {feedbackNotif.isInteractive && !feedbackNotif.selectedValue && (
                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Submit Catch Volume Feedback</label>
                  <div className="grid grid-cols-3 gap-2">
                    {feedbackNotif.options?.map(opt => (
                      <button key={opt.value} onClick={() => sendNotificationFeedback(feedbackNotif.id, opt.value, opt.label)}
                        className="py-2.5 px-4 bg-teal-50 border border-teal-200 hover:bg-teal-600 hover:text-white text-teal-700 rounded-full text-xs font-bold transition-all cursor-pointer">
                        [{opt.value}] {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-md text-center text-slate-400 text-sm">No active catch calibration feedback required.</div>
          )}
        </div>
      </div>
    </div>
  );
};
