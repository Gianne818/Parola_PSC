'use client';

import { supabase } from '../lib/supabase';

export interface UserProfile {
  id?: string;
  phoneNumber: string;
  fullName?: string;
  homePortName: string;
  homePortLat: number;
  homePortLng: number;
  preferredAdvisoryTime?: string;
  homePortGeom?: string;
}



export async function createUserProfile(data: {
  phoneNumber: string;
  fullName?: string;
  homePortName: string;
  homePortLat: number;
  homePortLng: number;
  preferredAdvisoryTime?: string;
}): Promise<boolean> {
  try {
    const insertData = {
      phone_number: data.phoneNumber,
      full_name: data.fullName,
      home_port_name: data.homePortName,
      preferred_advisory_time: data.preferredAdvisoryTime || '05:00:00',
      home_port_geom: `SRID=4326;POINT(${data.homePortLng} ${data.homePortLat})`
    };

    const { error } = await supabase
      .from('users')
      .insert([insertData]);

    if (error) {
      console.warn('Error creating user profile:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('Unexpected error in createUserProfile:', err);
    return false;
  }
}
