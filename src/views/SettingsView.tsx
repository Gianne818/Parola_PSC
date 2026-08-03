import React from 'react';
import { Settings as SettingsIcon, Bell, CloudLightning, Phone, ShieldAlert, BookOpen, ChevronDown, Fish, ToggleLeft, ToggleRight, Moon, Sun } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { PELAGIC_FAMILIES, DEMERSAL_FAMILIES } from './DashboardView';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, toggleFamily } = useAppState();

  const showPelagicSection = settings.targetCategory === 'All' || settings.targetCategory === 'Pelagic';
  const showDemersalSection = settings.targetCategory === 'All' || settings.targetCategory === 'Reef/Demersal';

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center pb-24 overflow-y-auto">
      <div className="w-full max-w-md mt-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="w-8 h-8 text-teal-600" />
          <h2 className="text-3xl font-black text-slate-900">Settings</h2>
        </div>

        {/* Appearance */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-4">Appearance</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                settings.darkMode ? 'bg-slate-800 border-slate-700' : 'bg-amber-50 border-amber-100'
              }`}>
                {settings.darkMode ? <Moon className="w-5 h-5 text-cyan-300" /> : <Sun className="w-5 h-5 text-amber-500" />}
              </div>
              <div>
                <p className="text-slate-900 font-bold">{settings.darkMode ? 'Dark Mode' : 'Light Mode'}</p>
                <p className="text-xs text-slate-500">{settings.darkMode ? 'Ocean-themed dark environment' : 'Clean, high-contrast light view'}</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ darkMode: !settings.darkMode })}
              className={`relative w-12 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${
                settings.darkMode ? 'bg-cyan-500' : 'bg-slate-300'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm absolute top-1 transition-all ${
                settings.darkMode ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-xs font-bold text-teal-600 uppercase tracking-wider">Notifications</h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                <Bell className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="text-slate-900 font-medium">Daily SMS Advisories</p>
                <p className="text-xs text-slate-500">Receive daily hotspot updates</p>
              </div>
            </div>
            <button 
              onClick={() => updateSettings({ dailySms: !settings.dailySms })}
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.dailySms ? 'bg-teal-500' : 'bg-slate-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm absolute top-1 transition-all ${settings.dailySms ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between opacity-70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0 border border-red-100">
                <CloudLightning className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-slate-900 font-medium">Extreme Weather Alerts</p>
                <p className="text-xs text-red-500 font-bold">Forced ON for safety</p>
              </div>
            </div>
            <button className="w-12 h-6 rounded-full bg-red-500 relative cursor-not-allowed">
              <div className="w-4 h-4 bg-white rounded-full shadow-sm absolute top-1 left-7" />
            </button>
          </div>

          {/* SMS Advisory Alerts Preference */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <label className="text-xs text-slate-700 font-semibold block">SMS Advisory Alerts Preference</label>
            <div className="flex bg-slate-100 p-1 rounded-full w-full">
              {[
                { id: 'Pelagic', label: 'Pelagic' },
                { id: 'Demersal', label: 'Demersal' },
                { id: 'Both', label: 'Both' }
              ].map((pref) => (
                <button
                  key={pref.id}
                  onClick={() => updateSettings({ notificationPreference: pref.id as any })}
                  className={`flex-1 py-1.5 text-[10px] sm:text-xs font-bold rounded-full transition-all text-center cursor-pointer ${
                    settings.notificationPreference === pref.id ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {pref.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Select which species categories you wish to receive daily SMS hotspot predictions for.
            </p>
          </div>
        </div>

        {/* Species Target Preferences */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center shrink-0 border border-teal-100">
              <Fish className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-slate-900 font-bold">Target Preferences</p>
              <p className="text-xs text-slate-500">Customize map hotspot filters</p>
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="text-xs text-slate-500 mb-2 block font-bold uppercase tracking-wider">Category</label>
            <div className="flex bg-slate-100 p-1 rounded-full w-full">
              {[
                { id: 'All', label: 'Both' },
                { id: 'Pelagic', label: 'Pelagic' },
                { id: 'Reef/Demersal', label: 'Demersal' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => updateSettings({ targetCategory: cat.id as any })}
                  className={`flex-1 py-2 text-xs font-bold rounded-full transition-all text-center cursor-pointer ${
                    settings.targetCategory === cat.id ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Species lists with General toggles */}
          <div className="space-y-5">
            {showPelagicSection && (
              <div className="space-y-2">
                <label className="text-xs text-blue-600 font-bold uppercase tracking-wider border-b border-blue-100 pb-1 block">Pelagic Families</label>
                {/* General Pelagic toggle */}
                <button
                  onClick={() => updateSettings({ useGeneralPelagic: !settings.useGeneralPelagic })}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                    settings.useGeneralPelagic ? 'border-blue-300 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {settings.useGeneralPelagic ? <ToggleRight className="w-5 h-5 text-blue-500" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                    <span className="text-sm font-bold">General Pelagic</span>
                    {settings.useGeneralPelagic && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">ALL</span>}
                  </div>
                  <span className="text-[10px] text-slate-400">Show all pelagic</span>
                </button>
                {/* Individual family list */}
                <div className="space-y-1.5 pl-1">
                  {PELAGIC_FAMILIES.map(family => {
                    const isSelected = settings.targetFamilies.includes(family.name);
                    return (
                      <button key={family.name} onClick={() => toggleFamily(family.name)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${isSelected ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900'}`}
                      >
                        <div className="flex flex-col items-start text-left">
                          <span className="font-bold text-sm leading-tight">{family.name}</span>
                          <span className="text-xs text-slate-500">{family.desc}</span>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                          {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {showDemersalSection && (
              <div className="space-y-2">
                <label className="text-xs text-emerald-600 font-bold uppercase tracking-wider border-b border-emerald-100 pb-1 block">Demersal Families</label>
                {/* General Demersal toggle */}
                <button
                  onClick={() => updateSettings({ useGeneralDemersal: !settings.useGeneralDemersal })}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                    settings.useGeneralDemersal ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {settings.useGeneralDemersal ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                    <span className="text-sm font-bold">General Demersal</span>
                    {settings.useGeneralDemersal && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">ALL</span>}
                  </div>
                  <span className="text-[10px] text-slate-400">Show all demersal</span>
                </button>
                {/* Individual family list */}
                <div className="space-y-1.5 pl-1">
                  {DEMERSAL_FAMILIES.map(family => {
                    const isSelected = settings.targetFamilies.includes(family.name);
                    return (
                      <button key={family.name} onClick={() => toggleFamily(family.name)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${isSelected ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900'}`}
                      >
                        <div className="flex flex-col items-start text-left">
                          <span className="font-bold text-sm leading-tight">{family.name}</span>
                          <span className="text-xs text-slate-500">{family.desc}</span>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                          {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Safety Threshold & Emergency */}
        <div className="bg-red-50 rounded-3xl p-5 border border-red-200 shadow-sm space-y-5">
          <h3 className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> Safety & Emergency
          </h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-red-950 font-bold ml-1">Wave Height Safety Threshold</label>
              <div className="relative">
                <select value={settings.waveHeightThreshold ?? 2.0} onChange={(e) => updateSettings({ waveHeightThreshold: parseFloat(e.target.value) })}
                  className="w-full pl-5 pr-10 py-3 rounded-full bg-white border border-red-200 text-slate-800 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all shadow-xs appearance-none cursor-pointer">
                  <option value="1.5">1.5 meters (Conservative Limit)</option>
                  <option value="2.0">2.0 meters (Standard Fishing Limit)</option>
                  <option value="2.5">2.5 meters (Advanced Craft Limit)</option>
                  <option value="3.0">3.0 meters (Storm Hazard Limit)</option>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronDown className="w-4 h-4" /></div>
              </div>
            </div>
            <div className="space-y-1 pt-2">
              <label className="text-xs text-red-950 font-bold ml-1">Emergency SOS Contact Number</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2"><Phone className="w-4 h-4 text-red-400" /></div>
                <input type="tel" value={settings.emergencyContact} onChange={(e) => updateSettings({ emergencyContact: e.target.value })}
                  placeholder="Family or Coast Guard number"
                  className="w-full pl-12 pr-6 py-3 rounded-full bg-white border border-red-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all shadow-xs" />
              </div>
            </div>
          </div>
        </div>

        {/* Offline Map Guide */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-teal-600 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Offline Map Guide
          </h3>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
            <ul className="text-[11px] text-slate-500 list-disc list-inside space-y-2 leading-relaxed">
              <li><strong>Compass Alignment:</strong> Match target bearing metrics with boat heading.</li>
              <li><strong>Offline Basemaps:</strong> Leaflet bounds cache local coastal grids within 40 nautical miles.</li>
              <li><strong>Navigational Buoys:</strong> Philippine standard markings place red buoys on starboard returning.</li>
              <li><strong>SOS Fallback:</strong> Trigger emergency beacons using long-press on Parola physical transceivers.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};
