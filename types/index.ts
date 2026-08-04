export interface UserProfile {
  id?: string;
  vesselName: string;
  licenseNo: string;
  phone: string;
  boatType: string;
  speciesPreference: 'pelagic' | 'demersal' | 'both';
  port: string;
  lat: number;
  lng: number;
}

export interface FuelPool {
  id: string;
  name: string;
  port: string;
  distance: number; // calculated relative to active port
  currentVolume: number;
  targetVolume: number;
  participants: number;
  closingDate: string;
  discountPerLiter: number;
  commits: { [phone: string]: number }; // phone -> committed liters
  createdByPhone?: string;
}

export interface PriceTier {
  name: string;
  targetVolume: number;
  discount: number;
}

export interface AlertNotification {
  id: string;
  type: 'weather' | 'fuel' | 'survey' | 'community';
  title: {
    en: string;
    tl: string;
    ceb: string;
    hil: string;
  };
  message: {
    en: string;
    tl: string;
    ceb: string;
    hil: string;
  };
  timestamp: string;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
  location?: string;
  actionRequired?: boolean;
}

export interface Hotspot {
  id: string;
  name: string;
  type: 'pelagic' | 'demersal' | 'both';
  species: string[];
  lat: number;
  lng: number;
  depth: number; // meters
  lastUpdated: string;
  catchProbability?: number;
  sst?: number;
  chlA?: number;
  distanceKm?: number;
  bearingDegrees?: number;
  compassBearing?: string;
}

export interface WeatherTelemetry {
  temp: number;
  windSpeed: number; // km/h
  windDirection: string;
  waveHeight: number; // meters
  tide: 'High' | 'Medium' | 'Low';
  stormSignal: number;
}

export type Language = 'en' | 'tl' | 'ceb' | 'hil';
