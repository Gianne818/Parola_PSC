"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { UserProfile, AlertNotification, Hotspot, FuelPool, PhilippineRegion } from "../types";
import { readUpdates } from '../lib/updates';
import { APPLICATION_COPY } from '../components/application/application-copy';
import { storageService } from "../services/storageService";
import { fetchLiveWeather, UNAVAILABLE_WEATHER, type ClientWeatherTelemetry } from "../services/weatherService";
import { isClientCoordinate, isClientTargetCoordinate } from '@/lib/frontend/coordinates';
import { fetchHotspots } from "../services/supabaseHotspotService";
import { fetchWeatherSafetyOverrides } from "../services/supabaseWeatherService";
import { useRegistration } from "../hooks/use-registration";
import type { RegistrationInput } from "../services/registrationService";
import { PHILIPPINE_REGIONS, detectPhilippineRegion, isCoordinateInRegion } from "../data/philippineRegions";

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
const INITIAL_NOTIFICATIONS: AlertNotification[] = [];

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
  weather: ClientWeatherTelemetry;
  manualOverrideHold: boolean;
  fuelPools: FuelPool[];
  hotspots: Hotspot[];
  toast: { message: string; type: "success" | "error" | "info" } | null;
  showToast: (message: string, type: "success" | "error" | "info") => void;
  hideToast: () => void;
  registration: ReturnType<typeof useRegistration>;
  register: (input: RegistrationInput) => Promise<void>;
  logout: () => Promise<boolean>;
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
  markAllNotificationsRead: () => void;
  purgeNotifications: () => void;
  refreshWeather: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_WEATHER: ClientWeatherTelemetry = UNAVAILABLE_WEATHER;

// TTL cache + in-flight dedupe for telemetry/hotspot loads (fixes sequential waterfall)
const TELEMETRY_TTL_MS = 60_000;
interface TelemetryCacheEntry {
  timestamp: number;
  weather: ClientWeatherTelemetry;
  hotspots: Hotspot[];
  hasActiveOverride: boolean;
}
const telemetryCache = new Map<string, TelemetryCacheEntry>();
const telemetryInflight = new Map<string, Promise<TelemetryCacheEntry>>();
const telemetryCacheKey = (lat: number, lng: number) =>
  `${lat.toFixed(3)},${lng.toFixed(3)}`;

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const registration = useRegistration();
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const isInitialized = preferencesLoaded && registration.initialized;
  const isAuthenticated = !!registration.owner && registration.profileStatus === 'saved';
  const userProfile = registration.profile;
  const [language, setLanguage] = useState<'en' | 'tl' | 'ceb' | 'hil'>('en');
  const [fontScale, setFontScale] = useState<number>(0);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [notifications, setNotifications] = useState<AlertNotification[]>(INITIAL_NOTIFICATIONS);
  const [fuelPools, setFuelPools] = useState<FuelPool[]>(DEFAULT_POOLS);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [weather, setWeather] = useState<ClientWeatherTelemetry>(DEFAULT_WEATHER);
  const [manualOverrideHold, setManualOverrideHold] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);



  // Load from localStorage on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      // Legacy local credentials/profile flags never establish an owner session.
      storageService.removeItem("parola-auth");
      storageService.removeItem("parola-profile");
      storageService.removeItem("parola-registered-users");
      setLanguage(storageService.getItem("parola-language", "en"));
      setFontScale(storageService.getItem("parola-font-scale", 0));
      setTheme("light");
      setNotifications(storageService.getItem("parola-notifications-clean", INITIAL_NOTIFICATIONS));
      setFuelPools(storageService.getItem("parola-fuelpools", DEFAULT_POOLS));
      setManualOverrideHold(storageService.getItem("parola-manual-override-hold", false));
      setPreferencesLoaded(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isInitialized) storageService.setItem("parola-notifications-clean", notifications);
  }, [isInitialized, notifications]);

  // Sync state to body element for global font-scale and theme classes
  useEffect(() => {
    if (typeof document !== "undefined") {
      const html = document.documentElement;
      html.classList.remove("dark");
    }
  }, []);

  // Toast helpers defined before effects that reference them (avoids use-before-declaration).
  // Stable via useCallback so effects can depend on showToast without ref-sync during render.
  const showToast = useCallback((message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
  }, []);

  const hideToast = () => setToast(null);

  // Load weather, overrides and hotspots whenever user coordinates change.
  // Parallelized with Promise.all + TTL cache + in-flight dedupe (was sequential waterfall).
  useEffect(() => {
    let cancelled = false;
    const lat = userProfile.lat;
    const lng = userProfile.lng;
    if (!isClientCoordinate(lat, lng)) {
      queueMicrotask(() => { if (!cancelled) setHotspots([]); });
      return () => { cancelled = true; };
    }
    const key = telemetryCacheKey(lat, lng);

    const loadTelemetryAndHotspots = async () => {
      await Promise.resolve();
      if (cancelled) return;
      setHotspots([]);
      // Serve fresh TTL cache instantly
      const cached = telemetryCache.get(key);
      if (cached && Date.now() - cached.timestamp < TELEMETRY_TTL_MS) {
        setWeather(cached.weather);
        setHotspots(cached.hotspots.filter(h => isClientTargetCoordinate(h.lat, h.lng)));
        if (cached.hasActiveOverride) setManualOverrideHold(true);
        return;
      }

      // Dedupe concurrent loads for the same coordinates
      let inflight = telemetryInflight.get(key);
      if (!inflight) {
        inflight = (async (): Promise<TelemetryCacheEntry> => {
          const [liveRes, overridesRes, hotspotsRes] = await Promise.all([
            fetchLiveWeather(lat, lng).catch((weatherErr) => {
              console.warn("Could not fetch weather; readings remain unavailable:", weatherErr);
              return DEFAULT_WEATHER;
            }),
            fetchWeatherSafetyOverrides().catch((e) => {
              console.warn("Could not load weather safety overrides:", e);
              return [];
            }),
            fetchHotspots(lat, lng).catch((e) => {
              console.warn("Could not load fishing hotspots:", e);
              return [] as Hotspot[];
            }),
          ]);

          // An unlocated latest database row cannot establish weather at this port.
          const live: ClientWeatherTelemetry = { ...liveRes };

          const overrides = (overridesRes ?? []) as { isActive: boolean; reason: string }[];
          const hasActiveOverride = overrides.some((o) => o.isActive);

          let mapped: Hotspot[];
          const sbHotspots = (hotspotsRes ?? []) as Hotspot[];

          if (sbHotspots.length > 0) {
            mapped = sbHotspots.filter(h => isClientTargetCoordinate(h.lat, h.lng)).map((h) => ({
              ...h,
              type: (h.type === 'pelagic' || h.type === 'demersal' || h.type === 'both') ? h.type : 'both',
            })) as Hotspot[];
          } else {
            mapped = [];
          }

          const entry: TelemetryCacheEntry = {
            timestamp: Date.now(),
            weather: live,
            hotspots: mapped,
            hasActiveOverride,
          };
          telemetryCache.set(key, entry);
          return entry;
        })();
        telemetryInflight.set(key, inflight);
        try {
          await inflight;
        } finally {
          telemetryInflight.delete(key);
        }
      }

      try {
        const entry = await inflight;
        if (cancelled) return;
        setWeather(entry.weather);
        setHotspots(entry.hotspots);
        if (entry.hasActiveOverride) {
          setManualOverrideHold(true);
          // Toast once per fresh load; overrides list already fetched above
          fetchWeatherSafetyOverrides()
            .then((overrides) => {
              if (cancelled) return;
              const active = overrides.find((o) => o.isActive);
              if (active) showToast(`⚠️ Safety Override: ${active.reason}`, "error");
            })
            .catch(() => {});
        }
      } catch (err) {
        console.warn("Error loading telemetry and hotspots:", err);
      }
    };

    loadTelemetryAndHotspots().catch((err) => {
      console.warn("Unhandled rejection in loadTelemetryAndHotspots:", err);
    });
    return () => {
      cancelled = true;
    };
  }, [userProfile.port, userProfile.lat, userProfile.lng, userProfile.regionId, showToast]);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (
        !event.reason ||
        event.reason instanceof Event ||
        (typeof event.reason === "object" && event.reason !== null && "type" in event.reason) ||
        String(event.reason) === "[object Event]"
      ) {
        event.preventDefault();
        event.stopImmediatePropagation?.();
      }
    };

    const handleWindowError = (event: ErrorEvent) => {
      if (
        event.error instanceof Event ||
        (typeof event.error === "object" && event.error !== null && "type" in event.error) ||
        String(event.error) === "[object Event]" ||
        (event.message && event.message.includes("[object Event]"))
      ) {
        event.preventDefault();
        event.stopImmediatePropagation?.();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("unhandledrejection", handleUnhandledRejection);
      window.addEventListener("error", handleWindowError);
      return () => {
        window.removeEventListener("unhandledrejection", handleUnhandledRejection);
        window.removeEventListener("error", handleWindowError);
      };
    }
  }, []);

  const register = registration.register;
  const logout = registration.logout;
  const updateProfile = async (patch: Partial<UserProfile>) => {
    try {
      await registration.updateProfile(patch);
      showToast("Home port saved by the server.", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Profile save was not confirmed.", "error");
      throw error;
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
      provenance: "sample",
      occurredAt: new Date().toISOString(),
      read: false,
      priority: randomTemplate.priority,
      location: userProfile.port,
      actionRequired: randomTemplate.actionRequired
    };

    setNotifications(previous => [newAlert, ...previous]);
    
    // Play sound or fire toast
    showToast(`New ${randomTemplate.type} alert received: "${randomTemplate.title[language]}"`, "info");
  };

  const markNotificationRead = (id: string) => {
    setNotifications(previous => readUpdates(previous, id));
  };

  const markAllNotificationsRead = () => {
    setNotifications(previous => readUpdates(previous));
  };

  const purgeNotifications = () => {
    setNotifications([]);
    storageService.setItem("parola-notifications-clean", []);
    showToast(APPLICATION_COPY[language].historyCleared, "info");
  };

  const refreshWeather = async () => {
    try {
      const live = await fetchLiveWeather(userProfile.lat, userProfile.lng);
      setWeather(live);
      // Keep TTL cache coherent so the next effect load doesn't serve stale weather
      const key = telemetryCacheKey(userProfile.lat, userProfile.lng);
      const prev = telemetryCache.get(key);
      telemetryCache.set(key, {
        timestamp: Date.now(),
        weather: live,
        hotspots: prev?.hotspots ?? [],
        hasActiveOverride: prev?.hasActiveOverride ?? false,
      });
      const complete = live.temp !== null && live.windSpeed !== null && live.waveHeight !== null;
      showToast(complete ? "Available Open-Meteo forecasts refreshed; tide and storm signal remain unavailable."
        : "Some Open-Meteo forecasts are unavailable. No readings were generated.", complete ? "success" : "info");
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
        registration,
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
        markAllNotificationsRead,
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
