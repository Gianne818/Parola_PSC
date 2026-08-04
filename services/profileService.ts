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

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*, home_port_geom:home_port_geom::text')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('Error fetching user profile:', error.message);
      return null;
    }

    if (!data) return null;

    let lat = 10.3157, lng = 123.8854; // Default to Brgy Pasil, Cebu coordinates
    if (data.home_port_geom) {
      const match = (data.home_port_geom as string).match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
      if (match) {
        lng = parseFloat(match[1]);
        lat = parseFloat(match[2]);
      }
    }

    return {
      id: data.id,
      phoneNumber: data.phone_number,
      fullName: data.full_name,
      homePortName: data.home_port_name,
      homePortLat: lat,
      homePortLng: lng,
      preferredAdvisoryTime: data.preferred_advisory_time
    };
  } catch (err) {
    console.warn('Unexpected error in fetchUserProfile:', err);
    return null;
  }
}

export async function updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<boolean> {
  try {
    const updateData: any = {};
    if (profile.phoneNumber) updateData.phone_number = profile.phoneNumber;
    if (profile.fullName) updateData.full_name = profile.fullName;
    if (profile.homePortName) updateData.home_port_name = profile.homePortName;
    if (profile.preferredAdvisoryTime) updateData.preferred_advisory_time = profile.preferredAdvisoryTime;
    
    if (profile.homePortLat !== undefined && profile.homePortLng !== undefined) {
      updateData.home_port_geom = `SRID=4326;POINT(${profile.homePortLng} ${profile.homePortLat})`;
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      console.warn('Error updating user profile:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('Unexpected error in updateUserProfile:', err);
    return false;
  }
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
