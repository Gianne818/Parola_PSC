"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile, AlertNotification, WeatherTelemetry, Hotspot, FuelPool } from "../types";
import { storageService } from "../services/storageService";
import { fetchLiveWeather } from "../services/weatherService";
import { fetchHotspots } from "../services/supabaseHotspotService";
import { fetchWeatherSafetyOverrides, fetchSupabaseWeatherData } from "../services/supabaseWeatherService";
import { fetchUserProfile, createUserProfile, updateUserProfile } from "../services/profileService";
import { supabase } from "../lib/supabase";

// Default pre-configured Philippine hotspots
export const DEFAULT_HOTSPOTS: Hotspot[] = [
  { id: "h1", name: "Apo-Mercedes Deep", type: "pelagic", species: ["Tamban (Clupeidae)", "Tulingan (Scombridae)", "Galunggong (Carangidae)"], lat: 14.25, lng: 123.15, depth: 450, lastUpdated: "Today, 04:00" },
  { id: "h2", name: "San Miguel Bay East", type: "demersal", species: ["Lapu-lapu (Serranidae)", "Maya-maya (Lutjanidae)", "Bisugo (Nemipteridae)"], lat: 13.92, lng: 123.32, depth: 45, lastUpdated: "Today, 05:30" },
  { id: "h3", name: "Apo Reef North", type: "both", species: ["Tulingan (Scombridae)", "Samaral (Siganidae)", "Maya-maya (Lutjanidae)"], lat: 12.69, lng: 120.42, depth: 120, lastUpdated: "Yesterday, 18:20" },
  { id: "h4", name: "Sulu Sea Basin", type: "pelagic", species: ["Tamban (Clupeidae)", "Dilis (Engraulidae)", "Bahi (Belonidae)"], lat: 9.50, lng: 121.20, depth: 800, lastUpdated: "Today, 02:15" },
  { id: "h5", name: "Celebes Trench Edge", type: "pelagic", species: ["Tulingan (Scombridae)", "Tamban (Clupeidae)"], lat: 5.80, lng: 124.50, depth: 1500, lastUpdated: "Today, 01:10" },
  { id: "h6", name: "Bohol Sea Ridge", type: "demersal", species: ["Lapu-lapu (Serranidae)", "Katambak (Lethrinidae)"], lat: 9.35, lng: 124.25, depth: 180, lastUpdated: "Yesterday, 14:45" },
  { id: "h7", name: "Camotes Sea Reef", type: "demersal", species: ["Samaral (Siganidae)", "Maya-maya (Lutjanidae)"], lat: 10.55, lng: 124.45, depth: 65, lastUpdated: "Today, 06:10" },
  { id: "h8", name: "Visayan Sea Hotspot", type: "both", species: ["Galunggong (Carangidae)", "Bisugo (Nemipteridae)", "Samaral (Siganidae)"], lat: 11.50, lng: 123.80, depth: 55, lastUpdated: "Today, 03:00" },
  { id: "h9", name: "San Bernardino Passage", type: "pelagic", species: ["Tulingan (Scombridae)", "Galunggong (Carangidae)"], lat: 12.55, lng: 124.15, depth: 320, lastUpdated: "Today, 07:05" },
  { id: "h10", name: "Lingayen Gulf Shelf", type: "demersal", species: ["Bisugo (Nemipteridae)", "Lapu-lapu (Serranidae)"], lat: 16.25, lng: 120.15, depth: 35, lastUpdated: "Yesterday, 22:15" },
  { id: "h11", name: "Lagonoy Gulf Basin", type: "pelagic", species: ["Tulingan (Scombridae)", "Tamban (Clupeidae)"], lat: 13.60, lng: 123.75, depth: 250, lastUpdated: "Today, 05:00" },
  { id: "h12", name: "Tayabas Bay Bank", type: "both", species: ["Maya-maya (Lutjanidae)", "Samaral (Siganidae)"], lat: 13.70, lng: 121.85, depth: 50, lastUpdated: "Today, 04:30" },
  { id: "h13", name: "Sibuyan Sea Center", type: "pelagic", species: ["Tamban (Clupeidae)", "Galunggong (Carangidae)"], lat: 12.40, lng: 122.50, depth: 190, lastUpdated: "Yesterday, 19:30" },
  { id: "h14", name: "Babuyan Upwelling Zone", type: "pelagic", species: ["Tulingan (Scombridae)", "Galunggong (Carangidae)"], lat: 19.10, lng: 121.60, depth: 600, lastUpdated: "Today, 00:30" },
  { id: "h15", name: "Sarangani Bay Shore", type: "demersal", species: ["Katambak (Lethrinidae)", "Lapu-lapu (Serranidae)"], lat: 6.05, lng: 125.15, depth: 75, lastUpdated: "Today, 06:45" },
  { id: "h16", name: "Cuyo Pass Bank", type: "both", species: ["Galunggong (Carangidae)", "Bisugo (Nemipteridae)", "Maya-maya (Lutjanidae)"], lat: 10.95, lng: 121.05, depth: 85, lastUpdated: "Today, 02:45" },
  { id: "h17", name: "Panay Gulf Ridge", type: "pelagic", species: ["Tulingan (Scombridae)", "Tamban (Clupeidae)"], lat: 10.25, lng: 122.40, depth: 280, lastUpdated: "Yesterday, 23:00" },
  { id: "h18", name: "Davao Gulf Base", type: "demersal", species: ["Lapu-lapu (Serranidae)", "Katambak (Lethrinidae)"], lat: 6.85, lng: 125.80, depth: 110, lastUpdated: "Today, 05:15" }
];

export const MUNICIPAL_PORTS = [
  { name: "Mercedes Fish Port", lat: 14.0122, lng: 123.0114, province: "Camarines Norte" },
  { name: "Estancia Shoreline", lat: 11.4542, lng: 123.1558, province: "Iloilo" },
  { name: "Navotas Complex", lat: 14.6542, lng: 120.9412, province: "Metro Manila" },
  { name: "General Santos Port", lat: 6.0642, lng: 125.1512, province: "South Cotabato" },
  { name: "Batangas Pier", lat: 13.7634, lng: 121.0421, province: "Batangas" },
  { name: "Lucena Harbour", lat: 13.8842, lng: 121.6212, province: "Quezon" },
  { name: "Aparri Base", lat: 18.3542, lng: 121.6412, province: "Cagayan" },
  { name: "Zamboanga Port", lat: 6.9042, lng: 122.0712, province: "Zamboanga del Sur" },
  { name: "Nasugbu Bay", lat: 14.0842, lng: 120.6212, province: "Batangas" },
  { name: "Sual Port", lat: 16.0742, lng: 120.0912, province: "Pangasinan" },
  { name: "Real Terminal", lat: 14.6642, lng: 121.6012, province: "Quezon" },
  { name: "Davao Gulf Base", lat: 7.0442, lng: 125.6512, province: "Davao del Sur" },
  { name: "Sariaya Shoreline", lat: 13.8542, lng: 121.5212, province: "Quezon" },
  { name: "Bredco Sea Port", lat: 10.6742, lng: 122.9212, province: "Negros Occidental" }
];

// Initial default notifications
const INITIAL_NOTIFICATIONS: AlertNotification[] = [
  {
    id: "n1",
    type: "weather",
    title: {
      en: "Storm Signal #1 Raised",
      tl: "Storm Signal #1 Itinaas",
      ceb: "Storm Signal #1 Gipahibalo",
      hil: "Storm Signal #1 Gintukod"
    },
    message: {
      en: "PAGASA raised Signal 1 over eastern Luzon waters. Wave heights up to 2.8m expected near Mercedes Deep. Small motorized bancas hold sailing.",
      tl: "Nagtaas ang PAGASA ng Signal 1 sa karagatan ng silangang Luzon. Alon na aabot sa 2.8m ay inaasahan malapit sa Mercedes Deep. Iwasang pumalaot muna.",
      ceb: "Nagpagula ang PAGASA og Signal 1 sa sidlakang bahin sa Luzon. Alon nga moabot og 2.8m gipaabot duol sa Mercedes Deep. Likayi una ang paglawig.",
      hil: "Nagpapanaug ang PAGASA sang Signal 1 sa sidlangan sang Luzon. Balod nga madata sa 2.8m ginalantaw malapit sa Mercedes Deep. Likawi anay ang magpalaot."
    },
    timestamp: "10 mins ago",
    read: false,
    priority: "high",
    location: "Mercedes Deep",
    actionRequired: true
  },
  {
    id: "n2",
    type: "fuel",
    title: {
      en: "Fuel Pool Nearing Goal",
      tl: "Krudo Pool Malapit na sa Layunin",
      ceb: "Krudo Pool Hapit na sa Target",
      hil: "Krudo Pool Malapit na sa Target"
    },
    message: {
      en: "Mercedes Fishermen Pool B is now at 85% volume (3,400L / 4,000L). Lock in your discount of -₱2.50/L before closing tonight!",
      tl: "Ang Mercedes Fishermen Pool B ay nasa 85% na (3,400L / 4,000L). Sumali na para makuha ang discount na -₱2.50/L bago mag-sarado mamayang gabi!",
      ceb: "Ang Mercedes Fishermen Pool B anaa na sa 85% (3,400L / 4,000L). Apil na aron makuha ang diskwento nga -₱2.50/L sa dili pa mosira karong gabii!",
      hil: "Ang Mercedes Fishermen Pool B yara na sa 85% (3,400L / 4,000L). Mangin parte na para makuha ang diskwento nga -₱2.50/L antes magsirado karong gabii!"
    },
    timestamp: "1 hour ago",
    read: false,
    priority: "medium",
    location: "Mercedes Fish Port"
  }
];

// Initial default fuel pools
const DEFAULT_POOLS: FuelPool[] = [
  {
    id: "pool1",
    name: "Mercedes Fishermen Pool B",
    port: "Mercedes Fish Port",
    distance: 0,
    currentVolume: 3400,
    targetVolume: 4000,
    participants: 12,
    closingDate: "2026-08-04",
    discountPerLiter: 2.50,
    commits: { "0912 345 6789": 150 },
    createdByPhone: "0912 345 6789"
  },
  {
    id: "pool2",
    name: "Camarines East Fuel Co-op",
    port: "Mercedes Fish Port",
    distance: 1.5,
    currentVolume: 1200,
    targetVolume: 2500,
    participants: 6,
    closingDate: "2026-08-05",
    discountPerLiter: 1.50,
    commits: {}
  },
  {
    id: "pool3",
    name: "Estancia Bulk Fuel Aggregator",
    port: "Estancia Shoreline",
    distance: 340,
    currentVolume: 5100,
    targetVolume: 6000,
    participants: 22,
    closingDate: "2026-08-04",
    discountPerLiter: 4.00,
    commits: {}
  }
];

interface AppContextType {
  isInitialized: boolean;
  isAuthenticated: boolean;
  language: 'en' | 'tl' | 'ceb' | 'hil';
  fontScale: number; // -2 to 4
  theme: 'light' | 'dark';
  userProfile: UserProfile;
  notifications: AlertNotification[];
  weather: WeatherTelemetry;
  manualOverrideHold: boolean;
  fuelPools: FuelPool[];
  hotspots: Hotspot[];
  toast: { message: string; type: "success" | "error" | "info" } | null;
  showToast: (message: string, type: "success" | "error" | "info") => void;
  hideToast: () => void;
  login: (phone: string, pin: string) => Promise<boolean>;
  register: (profile: Partial<UserProfile>, password?: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (profile: Partial<UserProfile>) => void | Promise<void>;
  changeLanguage: (lang: 'en' | 'tl' | 'ceb' | 'hil') => void;
  changeFontScale: (scale: number) => void;
  toggleTheme: () => void;
  setManualOverrideHold: (hold: boolean) => void;
  addFuelCommit: (poolId: string, liters: number) => void;
  createFuelPool: (pool: Partial<FuelPool>) => void;
  deleteFuelPool: (poolId: string) => void;
  simulateNotification: () => void;
  markNotificationRead: (id: string) => void;
  purgeNotifications: () => void;
  refreshWeather: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_PROFILE: UserProfile = {
  vesselName: "F/V Parola I",
  licenseNo: "FL-2026-8893",
  phone: "0912 345 6789",
  boatType: "motorized",
  speciesPreference: "pelagic",
  port: "Mercedes Fish Port",
  lat: 14.0122,
  lng: 123.0114,
};

const DEFAULT_WEATHER: WeatherTelemetry = {
  temp: 29.5,
  windSpeed: 14.5,
  windDirection: "NE",
  waveHeight: 1.2,
  tide: "Medium",
  stormSignal: 0,
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [language, setLanguage] = useState<'en' | 'tl' | 'ceb' | 'hil'>('en');
  const [fontScale, setFontScale] = useState<number>(0);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [notifications, setNotifications] = useState<AlertNotification[]>(INITIAL_NOTIFICATIONS);
  const [fuelPools, setFuelPools] = useState<FuelPool[]>(DEFAULT_POOLS);
  const [hotspots, setHotspots] = useState<Hotspot[]>(DEFAULT_HOTSPOTS);
  const [weather, setWeather] = useState<WeatherTelemetry>(DEFAULT_WEATHER);
  const [manualOverrideHold, setManualOverrideHold] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);



  // Load from localStorage on mount
  useEffect(() => {
    setTimeout(() => {
      setIsAuthenticated(storageService.getItem("parola-auth", false));
      setLanguage(storageService.getItem("parola-language", "en"));
      setFontScale(storageService.getItem("parola-font-scale", 0));
      setTheme("light");
      setUserProfile(storageService.getItem("parola-profile", DEFAULT_PROFILE));
      setNotifications(storageService.getItem("parola-notifications-clean", INITIAL_NOTIFICATIONS));
      setFuelPools(storageService.getItem("parola-fuelpools", DEFAULT_POOLS));
      setManualOverrideHold(storageService.getItem("parola-manual-override-hold", false));
      setIsInitialized(true);
    }, 0);
  }, []);

  // Sync state to body element for global font-scale and theme classes
  useEffect(() => {
    if (typeof document !== "undefined") {
      const html = document.documentElement;
      html.classList.remove("dark");
    }
  }, []);

  // Load weather, overrides and hotspots whenever user coordinates change
  useEffect(() => {
    const loadTelemetryAndHotspots = async () => {
      if (!userProfile.lat || !userProfile.lng) return;

      try {
        // 1. Fetch live weather from Open-Meteo
        let live: WeatherTelemetry;
        try {
          live = await fetchLiveWeather(userProfile.lat, userProfile.lng);
        } catch (weatherErr) {
          console.warn("Could not fetch live weather, fallback to default weather:", weatherErr);
          live = DEFAULT_WEATHER;
        }

        try {
          // 2. Fetch latest weather data from Supabase
          const sbWeather = await fetchSupabaseWeatherData(userProfile.lat, userProfile.lng);
          if (sbWeather) {
            live.temp = sbWeather.temperature ?? live.temp;
            live.windSpeed = sbWeather.wind_speed ?? live.windSpeed;
            live.waveHeight = sbWeather.wave_height ?? live.waveHeight;
            live.stormSignal = sbWeather.storm_signal ?? live.stormSignal;
          }
        } catch (e) {
          console.warn("Could not load Supabase weather telemetry:", e);
        }

        setWeather(live);

        try {
          // 3. Fetch safety overrides from Supabase
          const overrides = await fetchWeatherSafetyOverrides();
          const hasActiveOverride = overrides.some(o => o.isActive);
          if (hasActiveOverride) {
            setManualOverrideHold(true);
            const activeOverride = overrides.find(o => o.isActive);
            if (activeOverride) {
              showToast(`⚠️ Safety Override: ${activeOverride.reason}`, "error");
            }
          }
        } catch (e) {
          console.warn("Could not load weather safety overrides:", e);
        }

        try {
          // 4. Fetch hotspots from Supabase/API
          const sbHotspots = await fetchHotspots(userProfile.lat, userProfile.lng);
          if (sbHotspots && sbHotspots.length > 0) {
            const mapped = sbHotspots.map(h => ({
              ...h,
              type: (h.type === 'pelagic' || h.type === 'demersal' || h.type === 'both') ? h.type : 'both'
            })) as Hotspot[];
            setHotspots(mapped);
          } else {
            setHotspots(DEFAULT_HOTSPOTS);
          }
        } catch (e) {
          console.warn("Could not load fishing hotspots:", e);
          setHotspots(DEFAULT_HOTSPOTS);
        }
      } catch (err) {
        console.warn("Error loading telemetry and hotspots:", err);
      }
    };

    loadTelemetryAndHotspots().catch((err) => {
      console.warn("Unhandled rejection in loadTelemetryAndHotspots:", err);
    });
  }, [userProfile.port, userProfile.lat, userProfile.lng]);

  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
  };

  const hideToast = () => setToast(null);

  const login = async (phone: string, pin: string): Promise<boolean> => {
    if (!phone || !pin) return false;
    const cleanedPhone = phone.trim();

    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: cleanedPhone,
          password: pin,
        }),
      });

      if (res.ok) {
        const userData = await res.json();
        const profile: UserProfile = {
          ...userProfile,
          phone: userData.phone_number,
          vesselName: userData.full_name || userProfile.vesselName,
          port: userData.home_port_name || userProfile.port,
          lat: userData.latitude || userProfile.lat,
          lng: userData.longitude || userProfile.lng,
        };
        setIsAuthenticated(true);
        storageService.setItem("parola-auth", true);
        setUserProfile(profile);
        storageService.setItem("parola-profile", profile);
        showToast(`Welcome back, ${profile.vesselName || 'Captain'}!`, "success");
        return true;
      } else {
        const errData = await res.json().catch(() => ({}));
        
        // If backend server is offline or unavailable (503 / offline flag), fall back to local authentication
        if (res.status === 503 || errData.offline) {
          const storedProfile = storageService.getItem<UserProfile>("parola-profile", DEFAULT_PROFILE);
          const updatedProfile: UserProfile = {
            ...storedProfile,
            phone: cleanedPhone,
          };
          setIsAuthenticated(true);
          storageService.setItem("parola-auth", true);
          setUserProfile(updatedProfile);
          storageService.setItem("parola-profile", updatedProfile);
          showToast(`Welcome back, ${updatedProfile.vesselName || 'Captain'}!`, "success");
          return true;
        }

        const errorMessage = errData.error || (res.status === 401 ? "Incorrect password. Please try again." : "Account not found. Please register first.");
        showToast(errorMessage, "error");
        return false;
      }
    } catch (err) {
      // Local authentication fallback when fetch encounters network error
      const storedProfile = storageService.getItem<UserProfile>("parola-profile", DEFAULT_PROFILE);
      const updatedProfile: UserProfile = {
        ...storedProfile,
        phone: cleanedPhone,
      };
      setIsAuthenticated(true);
      storageService.setItem("parola-auth", true);
      setUserProfile(updatedProfile);
      storageService.setItem("parola-profile", updatedProfile);
      showToast(`Welcome back, ${updatedProfile.vesselName || 'Captain'}!`, "success");
      return true;
    }
  };

  const updateUserWithBackend = async (prof: UserProfile) => {
    try {
      if (!prof.phone) return;
      await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: prof.phone,
          full_name: prof.vesselName || 'Captain',
          home_port_name: prof.port || 'Mercedes Fish Port',
          latitude: prof.lat || 14.0122,
          longitude: prof.lng || 123.0114,
          preferred_advisory_time: '05:00:00',
        }),
      });
    } catch (err) {
      console.warn('Profile update sync deferred:', err);
    }
  };

  const register = async (profile: Partial<UserProfile>, password?: string): Promise<{ ok: boolean; error?: string }> => {
    const updated = { ...DEFAULT_PROFILE, ...profile };

    try {
      if (updated.phone) {
        const res = await fetch('/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone_number: updated.phone,
            full_name: updated.vesselName || 'Captain',
            home_port_name: updated.port || 'Mercedes Fish Port',
            latitude: updated.lat || 14.0122,
            longitude: updated.lng || 123.0114,
            preferred_advisory_time: '05:00:00',
            password: password || undefined,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));

          // If backend server is offline or unavailable (503 / offline flag), register user locally
          if (res.status === 503 || errData.offline) {
            setUserProfile(updated);
            storageService.setItem("parola-profile", updated);
            setIsAuthenticated(true);
            storageService.setItem("parola-auth", true);
            showToast("Registration completed!", "success");
            return { ok: true };
          }

          const errMsg = errData.error || (res.status === 400 || res.status === 409
            ? "An account with this phone number already exists. Please sign in instead."
            : "Registration failed. Please try again.");
          showToast(errMsg, "error");
          return { ok: false, error: errMsg };
        }
      }
    } catch (err) {
      console.warn('Registration network error, falling back to local registration:', err);
    }

    setUserProfile(updated);
    storageService.setItem("parola-profile", updated);
    setIsAuthenticated(true);
    storageService.setItem("parola-auth", true);
    showToast("Registration completed!", "success");
    return { ok: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    storageService.setItem("parola-auth", false);
    showToast("Logged out.", "info");
  };

  const updateProfile = async (profile: Partial<UserProfile>) => {
    try {
      const updated = { ...userProfile, ...profile };
      setUserProfile(updated);
      storageService.setItem("parola-profile", updated);
      showToast("Vessel profile updated.", "success");
      await updateUserWithBackend(updated);
    } catch (err) {
      console.warn("Failed to update profile backend sync:", err);
    }
  };

  const changeLanguage = (lang: 'en' | 'tl' | 'ceb' | 'hil') => {
    setLanguage(lang);
    storageService.setItem("parola-language", lang);
    showToast(`Language switched!`, "info");
  };

  const changeFontScale = (scale: number) => {
    setFontScale(scale);
    storageService.setItem("parola-font-scale", scale);
  };

  const toggleTheme = () => {
    setTheme("light");
    storageService.setItem("parola-theme", "light");
  };

  const addFuelCommit = (poolId: string, liters: number) => {
    const targetPool = fuelPools.find(p => p.id === poolId);
    const phone = userProfile.phone || "0912 345 6789";
    const oldCommit = targetPool?.commits?.[phone] || 0;
    const commitDiff = liters - oldCommit;

    if (targetPool && targetPool.currentVolume >= targetPool.targetVolume && commitDiff > 0) {
      showToast("This fuel pool has reached its target volume and is already full.", "error");
      return;
    }

    const updated = fuelPools.map(pool => {
      if (pool.id === poolId) {
        const newCommit = liters;
        
        const newCommits = { ...pool.commits, [phone]: newCommit };
        const nextVolume = Math.min(pool.targetVolume, pool.currentVolume + commitDiff);
        
        return {
          ...pool,
          currentVolume: nextVolume,
          commits: newCommits,
          participants: oldCommit === 0 && newCommit > 0 ? pool.participants + 1 : pool.participants
        };
      }
      return pool;
    });
    setFuelPools(updated);
    storageService.setItem("parola-fuelpools", updated);
    showToast(`Committed ${liters}L bulk order.`, "success");
  };

  const createFuelPool = (pool: Partial<FuelPool>) => {
    const newPool: FuelPool = {
      id: "pool_" + Date.now(),
      name: pool.name || "Fleet Aggregate",
      port: pool.port || userProfile.port,
      distance: 0,
      currentVolume: pool.currentVolume || 0,
      targetVolume: pool.targetVolume || 4000,
      participants: 1,
      closingDate: pool.closingDate || "2026-08-10",
      discountPerLiter: pool.discountPerLiter || 2.5,
      commits: pool.commits || {},
      createdByPhone: userProfile.phone || "0912 345 6789",
    };
    const updated = [newPool, ...fuelPools];
    setFuelPools(updated);
    storageService.setItem("parola-fuelpools", updated);
    showToast("New cooperative pool launched!", "success");
  };

  const deleteFuelPool = (poolId: string) => {
    const updated = fuelPools.filter(pool => pool.id !== poolId);
    setFuelPools(updated);
    storageService.setItem("parola-fuelpools", updated);
    showToast("Cooperative fuel pool deleted.", "info");
  };

  const simulateNotification = () => {
    const list = [
      {
        type: "weather" as const,
        title: {
          en: "Wave advisory: Rising Swell",
          tl: "Abiso ng Alon: Pagtaas ng Alon",
          ceb: "Pahibalo sa Alon: Pagtaas sa Balod",
          hil: "Paandam sa Balod: Pagtaas sang Balod"
        },
        message: {
          en: "Local winds increasing. Wave heights in Apo Reef expected to reach 2.2m. Exercise caution.",
          tl: "Lumalakas ang hanging habagat. Alon sa Apo Reef inaasahang aabot sa 2.2m. Mag-ingat sa pagpalaot.",
          ceb: "Nokusog ang hangin habagat. Alon sa Apo Reef gipaabot nga moabot og 2.2m. Pag-amping sa paglawig.",
          hil: "Nagakusog ang hangin habagat. Balod sa Apo Reef ginalantaw nga madata sa 2.2m. Mag-andam sa pagpalaot."
        },
        priority: "high" as const,
      },
      {
        type: "fuel" as const,
        title: {
          en: "Fuel Pool Goal Reached! 🎉",
          tl: "Target sa Krudo Pool Naabot na! 🎉",
          ceb: "Target sa Krudo Pool Naabot na! 🎉",
          hil: "Target sa Krudo Pool Naabot na! 🎉"
        },
        message: {
          en: "Gold Tier achieved! Fuel discount at Mercedes Pier now maximized to -₱4.00/L. Ready for pickup tomorrow.",
          tl: "Naabot na ang Gold Tier! Diskonto sa krudo sa Mercedes Pier sagad na sa -₱4.00/L. Handa nang kunin bukas.",
          ceb: "Naabot na ang Gold Tier! Diskwento sa krudo sa Mercedes Pier sagad na sa -₱4.00/L. Andam nang kuhaon ugma.",
          hil: "Naabot na ang Gold Tier! Diskwento sa krudo sa Mercedes Pier sagad na sa -₱4.00/L. Handa na kuhaon bwas."
        },
        priority: "medium" as const,
      },
      {
        type: "survey" as const,
        title: {
          en: "Sustainable Catch Survey",
          tl: "Surbey sa Masaganang Huli",
          ceb: "Surbey sa Masaganang Kuha",
          hil: "Surbey sa Masaganang Kuha"
        },
        message: {
          en: "Help BFAR map pelagic migrations. Report today's Tamban catch rating inside the notifications log.",
          tl: "Tulungan ang BFAR na i-mapa ang migrasyon ng isda. Iulat ang huling Tamban ngayon sa log.",
          ceb: "Tabangi ang BFAR sa pag-mapa sa migrasyon sa isda. I-report ang kuha nga Tamban karon sa log.",
          hil: "Buligi ang BFAR sa pag-mapa sang migrasyon sang isda. I-report ang kuha nga Tamban subong sa log."
        },
        priority: "low" as const,
        actionRequired: true,
      },
    ];

    const randomTemplate = list[Math.floor(Math.random() * list.length)];
    const newAlert: AlertNotification = {
      id: "n_" + Date.now(),
      type: randomTemplate.type,
      title: randomTemplate.title,
      message: randomTemplate.message,
      timestamp: "Just now",
      read: false,
      priority: randomTemplate.priority,
      location: userProfile.port,
      actionRequired: randomTemplate.actionRequired
    };

    const updated = [newAlert, ...notifications];
    setNotifications(updated);
    storageService.setItem("parola-notifications-clean", updated);
    
    // Play sound or fire toast
    showToast(`New ${randomTemplate.type} alert received: "${randomTemplate.title[language]}"`, "info");
  };

  const markNotificationRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    storageService.setItem("parola-notifications-clean", updated);
  };

  const purgeNotifications = () => {
    setNotifications([]);
    storageService.setItem("parola-notifications-clean", []);
    showToast("Notifications cleared.", "info");
  };

  const refreshWeather = async () => {
    try {
      const live = await fetchLiveWeather(userProfile.lat, userProfile.lng);
      setWeather(live);
      showToast("Live PAGASA weather metrics refreshed.", "success");
    } catch (err) {
      console.warn("Failed to refresh weather metrics:", err);
      showToast("Could not refresh live weather metrics.", "error");
    }
  };

  return (
    <AppContext.Provider
      value={{
        isInitialized,
        isAuthenticated,
        language,
        fontScale,
        theme,
        userProfile,
        notifications,
        weather,
        manualOverrideHold,
        fuelPools,
        hotspots,
        toast,
        showToast,
        hideToast,
        login,
        register,
        logout,
        updateProfile,
        changeLanguage,
        changeFontScale,
        toggleTheme,
        setManualOverrideHold,
        addFuelCommit,
        createFuelPool,
        deleteFuelPool,
        simulateNotification,
        markNotificationRead,
        purgeNotifications,
        refreshWeather,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
