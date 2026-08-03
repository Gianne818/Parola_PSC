"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  MapPin,
  Navigation,
  ArrowLeft,
  Check,
  Volume2,
  AlertTriangle,
  Anchor,
  Compass,
  Info,
  X,
  Map as MapIcon
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MapComponent } from '../../components/features/hotspots/MapComponent';
import { ParolaLogo } from '../../components/ui/ParolaLogo';

const PORT_PRESETS = [
  { name: 'Mercedes Fish Port', lat: 14.0122, lng: 123.0114, province: 'Camarines Norte' },
  { name: 'Estancia Shoreline Port', lat: 11.4552, lng: 123.1491, province: 'Iloilo' },
  { name: 'Navotas Fish Port Complex', lat: 14.6406, lng: 120.9419, province: 'Metro Manila' },
  { name: 'General Santos Fish Port', lat: 6.0592, lng: 125.1436, province: 'South Cotabato' },
  { name: 'Batangas Coastal Pier', lat: 13.7565, lng: 121.0583, province: 'Batangas' },
  { name: 'Lucena Harbour Port', lat: 13.8967, lng: 121.6263, province: 'Quezon' },
  { name: 'Aparri Port Base', lat: 18.3551, lng: 121.6412, province: 'Cagayan' },
  { name: 'Zamboanga Port', lat: 6.9075, lng: 122.0785, province: 'Zamboanga' },
  { name: 'Nasugbu Fishing Bay', lat: 14.0722, lng: 120.6275, province: 'Batangas' },
  { name: 'Sual Fish Port', lat: 16.0689, lng: 120.1031, province: 'Pangasinan' },
  { name: 'Real Port Terminal', lat: 14.6625, lng: 121.6031, province: 'Quezon' },
  { name: 'Davao Gulf Base', lat: 7.0731, lng: 125.6128, province: 'Davao' },
  { name: 'Sariaya Shoreline', lat: 13.9167, lng: 121.5167, province: 'Quezon' },
  { name: 'Bredco Sea Port', lat: 10.6764, lng: 122.9322, province: 'Negros Occidental' }
];

function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isInitialized, isAuthenticated, userProfile, updateProfile, hotspots, showToast } = useApp();

  const fromProfile = searchParams.get('from') === 'profile';

  // Security check: Redirect to login if not authenticated
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/login');
    }
  }, [isInitialized, isAuthenticated, router]);

  // Clear registration flow flag on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem('just-registered');
    }
  }, []);

  const [port, setPort] = useState(userProfile?.port || 'Mercedes Fish Port');
  const [coordinates, setCoordinates] = useState<[number, number]>([
    userProfile?.lat || 14.0122,
    userProfile?.lng || 123.0114
  ]);

  const [prevProfile, setPrevProfile] = useState(userProfile);
  if (userProfile !== prevProfile) {
    setPrevProfile(userProfile);
    if (userProfile?.port) {
      setPort(userProfile.port);
    }
    if (userProfile?.lat && userProfile?.lng) {
      setCoordinates([userProfile.lat, userProfile.lng]);
    }
  }

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Drawer and Geofence Warning states
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [outOfBoundsCoords, setOutOfBoundsCoords] = useState<[number, number] | null>(null);

  const findNearestPreset = (lat: number, lng: number) => {
    let nearest = PORT_PRESETS[0];
    let minDistance = Infinity;
    for (const preset of PORT_PRESETS) {
      const dist = getDistanceInKm(lat, lng, preset.lat, preset.lng);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = preset;
      }
    }
    return { ...nearest, distance: minDistance };
  };

  const handleMapClick = (lat: number, lng: number) => {
    // Geofencing verification boundaries: 4.5° N to 21.5° N, 116.0° E to 127.0° E
    if (lat < 4.5 || lat > 21.5 || lng < 116.0 || lng > 127.0) {
      setOutOfBoundsCoords([lat, lng]);
      setWarningModalOpen(true);
      return;
    }

    const nearest = findNearestPreset(lat, lng);
    setCoordinates([lat, lng]);

    let portName = "";
    if (nearest.distance < 15) {
      portName = nearest.name;
    } else {
      portName = `Coastal Spot near ${nearest.name} (${nearest.province})`;
    }

    setPort(portName);
    setSearchQuery(portName);
    setShowRecommendations(false);
    setDrawerOpen(true);
  };

  const handleUseCurrentLocation = () => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          handleMapClick(lat, lng);
        },
        (error) => {
          console.error("Geolocation error, falling back to Mercedes Port:", error);
          handleMapClick(14.0122, 123.0114);
        }
      );
    } else {
      handleMapClick(14.0122, 123.0114);
    }
  };

  const handlePresetSelect = (preset: typeof PORT_PRESETS[0]) => {
    setCoordinates([preset.lat, preset.lng]);
    setPort(preset.name);
    setSearchQuery(preset.name);
    setShowRecommendations(false);
    setDrawerOpen(true);
  };

  const handleConfirmPort = () => {
    // Save details to Context User Profile and LocalStorage
    updateProfile({
      port: port,
      lat: coordinates[0],
      lng: coordinates[1],
      vesselName: userProfile?.vesselName || 'F/V Parola I',
      licenseNo: userProfile?.licenseNo || 'FL-2026-8893',
      phone: userProfile?.phone || '0912 345 6789',
      boatType: (userProfile?.boatType as any) || 'motorized',
      speciesPreference: userProfile?.speciesPreference || 'both'
    });

    if (typeof window !== "undefined") {
      localStorage.setItem('profile-port', port);
      localStorage.setItem('profile-lat', String(coordinates[0]));
      localStorage.setItem('profile-lng', String(coordinates[1]));

      // Set other sensible defaults
      if (!localStorage.getItem('profile-boatType')) {
        localStorage.setItem('profile-boatType', 'motorized');
      }
      if (!localStorage.getItem('profile-species')) {
        localStorage.setItem('profile-species', 'pelagic');
      }
      if (!localStorage.getItem('profile-phone')) {
        localStorage.setItem('profile-phone', '0912 345 6789');
      }
      localStorage.setItem('profile-vesselName', userProfile?.vesselName || 'F/V Parola I');
      localStorage.setItem('profile-licenseNo', userProfile?.licenseNo || 'FL-2026-8893');
      localStorage.setItem('profile-emergencyName', 'Maria Santos');
      localStorage.setItem('profile-emergencyPhone', '0917 111 2222');
    }

    showToast("Vessel home port coordinates updated successfully!", "success");

    if (fromProfile) {
      router.push('/profile');
    } else {
      router.push('/dashboard');
    }
  };

  const playVoiceGuide = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const text = "Please click on the coastal map to set your home port in the Philippines. We will monitor safety conditions at this location.";
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  if (!isInitialized || !isAuthenticated) return null;

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col relative bg-brand-offwhite font-sans antialiased">

      {/* 1. TOP HEADER INSTRUCTION BANNER */}
      <header className="absolute top-0 left-0 right-0 z-10 bg-brand-black text-white px-4 py-3.5 md:px-8 md:py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          {fromProfile ? (
            <button
              onClick={() => router.push('/profile')}
              className="mr-1 p-2 bg-white/10 hover:bg-white/15 text-white rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer border border-white/5 shadow-sm active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-brand-green" />
              <span className="hidden sm:inline">Back to Profile</span>
              <span className="sm:hidden">Back</span>
            </button>
          ) : (
            <ParolaLogo iconOnly className="w-9 h-9 shadow-md hover:scale-105 transition-transform" />
          )}
          <div>
            <h1 className="text-xs md:text-sm font-bold uppercase tracking-widest text-brand-green leading-none">
              {fromProfile ? 'Edit Home Port' : 'Port Selection Onboarding'}
            </h1>
            <p className="text-[11px] md:text-xs text-white/60 font-semibold mt-0.5">
              {fromProfile ? 'Reposition your reference port anchorage on the map' : 'Tap your home port or shoreline reference location on the map'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={playVoiceGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all text-[11px] font-bold text-white/90 cursor-pointer"
            title="Read instructions out loud"
          >
            <Volume2 className="w-3.5 h-3.5 text-brand-green" />
            <span className="hidden sm:inline">Voice Assist</span>
          </button>

          <button
            onClick={() => router.push('/login')}
            className="text-white/40 hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. FULLSCREEN LEAFLET MAP */}
      <div className="w-full h-full pt-[68px] pb-[160px] relative z-0">
        <MapComponent
          hotspots={hotspots}
          selectedHotspot={null}
          onSelectHotspot={() => { }}
          filterType="both"
          selectedSpecies={[]}
          hideSidebar={true}
          center={coordinates}
          onMapClick={handleMapClick}
        />

        {/* Floating Controls Overlay (Current GPS PIN button) */}
        <div className="absolute top-24 right-4 z-10 flex flex-col gap-2">
          <button
            onClick={handleUseCurrentLocation}
            className="p-3.5 bg-white hover:bg-gray-50 text-brand-green rounded-full shadow-lg border border-gray-200 transition-all hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer"
            title="Locate my GPS position"
          >
            <Navigation className="w-5 h-5" />
          </button>
        </div>

        {/* Floating Search & Location Recommendations Panel */}
        <div className="absolute top-20 left-4 right-4 md:right-auto md:w-96 z-10 bg-white/95 backdrop-blur-md p-4 rounded-[2rem] shadow-xl border border-gray-150 space-y-3">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-brand-black/45">
            <MapPin className="w-3.5 h-3.5 text-brand-green" />
            <span>Search Home Reference Port</span>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Type port or province name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowRecommendations(true);
                setPort(e.target.value || 'Mercedes Fish Port');
              }}
              onFocus={() => setShowRecommendations(true)}
              className="w-full px-4 py-3 bg-brand-offwhite border border-gray-250 hover:border-brand-green/45 focus:border-brand-green focus:ring-1 focus:ring-brand-green rounded-2xl text-xs font-bold text-brand-black shadow-inner outline-none placeholder:text-brand-black/35"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowRecommendations(true);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-black/40 hover:text-brand-black p-1 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {showRecommendations && (
            <div className="border border-gray-100 p-2 rounded-2xl bg-white space-y-1 max-h-52 overflow-y-auto pr-1">
              <span className="text-[9px] font-black text-brand-black/45 uppercase tracking-widest block px-2 py-1">
                {searchQuery ? 'Matching Locations' : 'Recommended Ports'}
              </span>
              {PORT_PRESETS.filter(p => {
                if (!searchQuery) return true;
                const q = searchQuery.toLowerCase();
                return p.name.toLowerCase().includes(q) || p.province.toLowerCase().includes(q);
              }).length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-brand-black/45 font-semibold">
                  No matching ports found. Type a custom name or tap the map!
                </div>
              ) : (
                PORT_PRESETS.filter(p => {
                  if (!searchQuery) return true;
                  const q = searchQuery.toLowerCase();
                  return p.name.toLowerCase().includes(q) || p.province.toLowerCase().includes(q);
                }).map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handlePresetSelect(preset)}
                    className={`w-full px-3 py-2.5 text-left rounded-xl text-xs font-bold transition-all flex items-center justify-between hover:bg-gray-50 cursor-pointer ${port === preset.name
                        ? 'bg-brand-green/10 text-brand-green border-l-4 border-brand-green pl-2'
                        : 'text-brand-black/80'
                      }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Anchor className={`w-3.5 h-3.5 shrink-0 ${port === preset.name ? 'text-brand-green' : 'text-brand-black/40'}`} />
                      <span className="truncate">{preset.name}</span>
                    </div>
                    <span className="text-[9px] text-brand-black/35 font-extrabold uppercase shrink-0 bg-gray-100 px-1.5 py-0.5 rounded">
                      {preset.province}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. BOTTOM CONFIRMATION DRAWER */}
      {drawerOpen && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-white shadow-xl border-t border-gray-200 px-6 py-5 md:px-12 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-green shrink-0">
              <Compass className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <span className="text-[9px] font-black text-brand-green uppercase tracking-widest block">
                Selected Reference Anchor
              </span>
              <h2 className="text-base md:text-lg font-display font-black text-brand-black uppercase leading-tight mt-0.5">
                {port}
              </h2>
              <p className="text-xs text-brand-black/50 font-bold tracking-wide mt-0.5">
                Latitude {(coordinates?.[0] ?? 14.0122).toFixed(4)}° N, Longitude {(coordinates?.[1] ?? 123.0114).toFixed(4)}° E
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleUseCurrentLocation}
              className="flex-1 md:flex-none px-5 py-3 rounded-2xl border border-gray-200 hover:border-gray-300 text-brand-black/75 hover:text-brand-black font-bold text-xs uppercase tracking-wider transition-all hover:bg-gray-50 text-center cursor-pointer"
            >
              GPS Reset
            </button>

            <button
              onClick={handleConfirmPort}
              className="flex-[2] md:flex-none px-8 py-3.5 bg-brand-green hover:bg-brand-green/95 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] text-center cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Confirm Port & Finish</span>
            </button>
          </div>
        </div>
      )}

      {/* OUT-OF-BOUNDS WARNING GEOMODAL */}
      {warningModalOpen && outOfBoundsCoords && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-6 md:p-8 max-w-md w-full border border-gray-150 shadow-2xl space-y-4 text-left">
            <div className="flex items-center gap-3.5 text-brand-red">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-brand-red flex items-center justify-center border border-red-100 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-display font-black uppercase text-brand-black leading-tight">
                  Out of Territorial Waters
                </h3>
                <p className="text-[10px] font-bold text-brand-red uppercase tracking-widest mt-0.5">
                  Geofence Bounds Limit
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-brand-black/70 leading-relaxed font-semibold">
              <p>
                The coordinates you clicked are outside Philippine municipal border grids:
                <strong className="text-brand-black block mt-0.5 font-bold">
                  {(outOfBoundsCoords?.[0] ?? 0).toFixed(4)}° N, {(outOfBoundsCoords?.[1] ?? 0).toFixed(4)}° E
                </strong>
              </p>
              <p className="font-normal text-brand-black/55">
                Parola satellite weather monitoring operates exclusively within Philippine coastal territories (from <strong className="font-bold">4.5° N to 21.5° N</strong> and <strong className="font-bold">116.0° E to 127.0° E</strong>).
              </p>
              <p className="font-normal text-brand-black/55">
                Please reposition your home anchor pin inside Philippine municipal territories to unlock local automated safety transponders.
              </p>
            </div>

            <button
              onClick={() => {
                setWarningModalOpen(false);
                setOutOfBoundsCoords(null);
              }}
              className="w-full bg-brand-black hover:bg-brand-black/95 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-full transition-all cursor-pointer text-center"
            >
              Adjust Pin Coordinate
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen bg-brand-offwhite flex flex-col items-center justify-center space-y-4">
        <Compass className="w-12 h-12 text-brand-green animate-spin [animation-duration:3s]" />
        <span className="text-xs font-black uppercase tracking-widest text-gray-400">Loading Onboarding...</span>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
