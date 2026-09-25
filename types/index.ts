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
  type: 'weather' | 'fuel' | 'survey' | 'community' | 'evaluation';
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
  waveHeight?: number; // meters
  windSpeed?: number; // km/h
  stormSignal?: number;
  distanceKm?: number;
  bearingDegrees?: number;
  compassBearing?: string;
  // Alternate/legacy payload shapes (Supabase rows, API responses) — optional
  position?: [number, number]; // [lat, lng] tuple form
  group?: string; // legacy type discriminator ('pelagic' | 'demersal')
  family?: string; // legacy single-species label
  label?: string; // legacy display name
  desc?: string; // legacy species description
  icon?: string; // map marker emoji override
  isUnsafe?: boolean; // per-hotspot safety flag
}

/** Hotspot enriched with client-side distance/catch computations (dashboard). */
export interface ProcessedHotspot extends Hotspot {
  distance: string;
  bearing: string;
  distValue: number;
  catchProbPercent: number;
  efficiencyRatio: number;
}

/** SMS gateway dispatch result (alerts page). */
export interface SmsDispatchResult {
  mode?: string;
  messageId?: string;
  recipientFormatted?: string;
  dualMode?: boolean;
  pelagicResult?: SmsDispatchResult;
  error?: string;
  [key: string]: unknown;
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
