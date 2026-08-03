import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export type Language = 'en' | 'tl' | 'ceb' | 'hil';

export interface User {
  name: string;
  phoneNumber: string;
  isRegistered: boolean;
  isOnboarded: boolean;
}

export interface ReferencePoint {
  lat: number;
  lng: number;
  locationName: string;
}

export interface WeatherData {
  waveHeight: number; // meters
  windSpeed: number; // km/h
  tideLevel: string; // High, Low, Medium
  stormSignal: number; // 0, 1, 2, 3
}

export interface NotificationItem {
  id: string;
  title: string;
  text: string;
  timestamp: string;
  isRead: boolean;
  type: 'weather' | 'catch_feedback' | 'general';
  isInteractive?: boolean;
  options?: { value: string; label: string }[];
  selectedValue?: string;
}

export interface Settings {
  dailySms: boolean;
  extremeWeather: boolean;
  targetCategory: 'All' | 'Pelagic' | 'Reef/Demersal';
  targetFamilies: string[];
  useGeneralPelagic: boolean;
  useGeneralDemersal: boolean;
  emergencyContact: string;
  waveHeightThreshold: number;
  notificationPreference: 'Pelagic' | 'Demersal' | 'Both';
  darkMode: boolean;
}

export interface FuelPool {
  id: string;
  name: string;
  lat: number;
  lng: number;
  currentVolume: number;
  targetVolume: number;
  lastDiscount: string;
  distributionPoint: string;
  activeParticipants: number;
  targetDate: string;
}

const MOCK_POOLS: FuelPool[] = [
  { id: '1', name: 'Iloilo North Pool', lat: 11.0, lng: 122.5, currentVolume: 1420, targetVolume: 2000, lastDiscount: '₱4.80', distributionPoint: 'Barangay Concepcion Port', activeParticipants: 18, targetDate: 'July 25, 2026' },
  { id: '2', name: 'Estancia Port Pool', lat: 11.4, lng: 123.1, currentVolume: 800, targetVolume: 1000, lastDiscount: '₱3.50', distributionPoint: 'Estancia Harbor Pier', activeParticipants: 11, targetDate: 'July 28, 2026' },
  { id: '3', name: 'Navotas Fishery Pool', lat: 14.65, lng: 120.94, currentVolume: 4500, targetVolume: 5000, lastDiscount: '₱6.20', distributionPoint: 'Navotas Fish Port Market', activeParticipants: 42, targetDate: 'July 20, 2026' },
  { id: '4', name: 'Mercedes Port Pool', lat: 14.0, lng: 123.0, currentVolume: 1450, targetVolume: 3000, lastDiscount: '₱2.10', distributionPoint: 'Mercedes Port Side Pier', activeParticipants: 15, targetDate: 'July 22, 2026' },
];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Extreme Weather Warning',
    text: 'PAROLA WEATHER ALERT: Storm Signal #1 is active in Northern Luzon. Coastal waters will be rough. Fishermen are advised to check weather before sailing.',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    isRead: false,
    type: 'weather'
  },
  {
    id: 'n2',
    title: 'Mercedes Port Catch Calibration',
    text: 'PAROLA ADVISORY: Help calibrate the model. How was your catch volume at Mercedes Port today? Reply 1 (High), 2 (Medium), or 3 (Low).',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    isRead: false,
    type: 'catch_feedback',
    isInteractive: true,
    options: [
      { value: '1', label: 'High' },
      { value: '2', label: 'Medium' },
      { value: '3', label: 'Low' }
    ]
  },
  {
    id: 'n3',
    title: 'Co-op Fuel Pool Opening',
    text: 'A new fuel pool has been opened near Estancia Port. Current target volume is 1,000 Liters.',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    isRead: true,
    type: 'general'
  }
];

export interface AppState {
  user: User | null;
  language: Language;
  referencePoint: ReferencePoint | null;
  weather: WeatherData;
  settings: Settings;
  fuelPools: FuelPool[];
  notifications: NotificationItem[];
  currentJoinedPoolId: string | null;
  
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setLanguage: (lang: Language) => void;
  setReferencePoint: (point: ReferencePoint | null) => void;
  setWeather: (weather: WeatherData) => void;
  updateSettings: (newSettings: Partial<Settings>) => void;
  toggleFamily: (family: string) => void;
  addToPool: (poolId: string, amount: number) => void;
  joinPool: (poolId: string) => void;
  createNewPool: (pool: Omit<FuelPool, 'id'>) => void;
  sendNotificationFeedback: (id: string, value: string, label: string) => void;
  markNotificationsAsRead: () => void;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [referencePoint, setReferencePoint] = useState<ReferencePoint | null>(null);
  const [weather, setWeather] = useState<WeatherData>({ waveHeight: 1.5, windSpeed: 15, tideLevel: 'Medium', stormSignal: 0 });
  const [settings, setSettings] = useState<Settings>({
    dailySms: true,
    extremeWeather: true,
    targetCategory: 'All',
    targetFamilies: [],
    useGeneralPelagic: true,
    useGeneralDemersal: true,
    emergencyContact: '',
    waveHeightThreshold: 2.0,
    notificationPreference: 'Both',
    darkMode: false,
  });
  const [fuelPools, setFuelPools] = useState<FuelPool[]>(MOCK_POOLS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [currentJoinedPoolId, setCurrentJoinedPoolId] = useState<string | null>(null);

  // Fetch from Open-Meteo whenever referencePoint changes
  useEffect(() => {
    if (!referencePoint) return;

    let active = true;
    const fetchWeather = async () => {
      try {
        const { lat, lng } = referencePoint;
        
        // Fetch wind speed from Open-Meteo Forecast
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=wind_speed_10m&wind_speed_unit=kmh`
        );
        const weatherData = await weatherRes.json();

        // Fetch wave height from Open-Meteo Marine
        const marineRes = await fetch(
          `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&current=wave_height`
        );
        const marineData = await marineRes.json();

        if (active) {
          const windSpeed = weatherData?.current?.wind_speed_10m ?? 15.0;
          const waveHeight = marineData?.current?.wave_height ?? 1.4;
          
          setWeather({
            windSpeed: Number(windSpeed.toFixed(1)),
            waveHeight: Number(waveHeight.toFixed(1)),
            tideLevel: 'Medium',
            stormSignal: waveHeight > 2.5 ? 1 : 0
          });
        }
      } catch (err) {
        console.error('Failed to fetch from Open-Meteo APIs, using smart fallbacks:', err);
        if (active) {
          // Generate realistic conditions based on location
          const seed = Math.sin(referencePoint.lat) * Math.cos(referencePoint.lng);
          const windSpeed = Math.abs(seed * 20) + 10;
          const waveHeight = Math.abs(seed * 1.8) + 0.6;
          setWeather({
            windSpeed: Number(windSpeed.toFixed(1)),
            waveHeight: Number(waveHeight.toFixed(1)),
            tideLevel: 'Medium',
            stormSignal: waveHeight > 2.2 ? 1 : 0
          });
        }
      }
    };

    fetchWeather();
    return () => {
      active = false;
    };
  }, [referencePoint]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      
      // If targetCategory changes, reset general flags and clear family selections
      if (newSettings.targetCategory !== undefined) {
        updated.targetFamilies = [];
        // Default general flags based on which category was selected
        if (newSettings.targetCategory === 'Pelagic') {
          updated.useGeneralPelagic = true;
          updated.useGeneralDemersal = false;
        } else if (newSettings.targetCategory === 'Reef/Demersal') {
          updated.useGeneralPelagic = false;
          updated.useGeneralDemersal = true;
        } else {
          // 'All' / Both
          updated.useGeneralPelagic = true;
          updated.useGeneralDemersal = true;
        }
      }
      return updated;
    });
  };

  const toggleFamily = (family: string) => {
    setSettings(prev => {
      const exists = prev.targetFamilies.includes(family);
      return {
        ...prev,
        targetFamilies: exists 
          ? prev.targetFamilies.filter(f => f !== family)
          : [...prev.targetFamilies, family]
      };
    });
  };

  const addToPool = (poolId: string, amount: number) => {
    setFuelPools(prev => prev.map(pool => 
      pool.id === poolId 
        ? { 
            ...pool, 
            currentVolume: pool.currentVolume + amount,
            activeParticipants: pool.activeParticipants + 1
          } 
        : pool
    ));
    setCurrentJoinedPoolId(poolId);
  };

  const joinPool = (poolId: string) => {
    setCurrentJoinedPoolId(poolId);
  };

  const createNewPool = (poolData: Omit<FuelPool, 'id'>) => {
    const newPool: FuelPool = {
      ...poolData,
      id: Math.random().toString(36).substring(7)
    };
    setFuelPools(prev => [...prev, newPool]);
    setCurrentJoinedPoolId(newPool.id);
  };

  const sendNotificationFeedback = (id: string, value: string, label: string) => {
    setNotifications(prev => prev.map(notif => {
      if (notif.id === id) {
        return {
          ...notif,
          selectedValue: value,
          text: `PAROLA ADVISORY: Help calibrate the model. How was your catch volume at Mercedes Port today?\n\n[You replied: ${value} (${label})]\n\nParola response: Thank you! Catch report logged. Our LightGBM models will calibrate during the next daily batch refresh.`
        };
      }
      return notif;
    }));
  };

  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
  };

  return (
    <AppStateContext.Provider
      value={{
        user,
        language,
        referencePoint,
        weather,
        settings,
        fuelPools,
        notifications,
        currentJoinedPoolId,
        setUser,
        setLanguage,
        setReferencePoint,
        setWeather,
        updateSettings,
        toggleFamily,
        addToPool,
        joinPool,
        createNewPool,
        sendNotificationFeedback,
        markNotificationsAsRead,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = (): AppState => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
