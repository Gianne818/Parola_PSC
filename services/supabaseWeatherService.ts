'use client';

import { supabase } from '../lib/supabase';

export interface WeatherSafetyOverride {
  isActive: boolean;
  reason: string;
  waveHeight?: number;
  windSpeed?: number;
  pagasaSignalLevel?: number;
}

export async function fetchWeatherSafetyOverrides(): Promise<WeatherSafetyOverride[]> {
  try {
    const { data, error } = await supabase
      .from('weather_safety_overrides')
      .select('*')
      .eq('is_hazardous', true)
      .order('check_timestamp', { ascending: false });

    if (error) {
      console.warn('Error fetching weather overrides:', error.message);
      return [];
    }

    if (!data) return [];

    return data.map((item: any) => ({
      isActive: item.is_hazardous,
      reason: item.override_reason || 'Severe weather alert',
      waveHeight: item.max_wave_height_m,
      windSpeed: item.max_wind_speed_knots,
      pagasaSignalLevel: item.pagasa_signal_level
    }));
  } catch (err) {
    console.warn('Unexpected error in fetchWeatherSafetyOverrides:', err);
    return [];
  }
}

export async function fetchSupabaseWeatherData(lat: number, lng: number): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('weather_safety_overrides')
      .select('*')
      .order('check_timestamp', { ascending: false })
      .limit(1);

    if (error) {
      console.warn('Error fetching weather data:', error.message);
      return null;
    }

    return data && data.length > 0 ? data[0] : null;
  } catch (err) {
    console.warn('Unexpected error in fetchSupabaseWeatherData:', err);
    return null;
  }
}
