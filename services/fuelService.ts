'use client';

import { supabase } from '../lib/supabase';

export async function fetchFuelPools(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('coop_fuel_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching fuel pools:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.warn('Unexpected error in fetchFuelPools:', err);
    return [];
  }
}

export async function createFuelPool(pool: any): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('coop_fuel_orders')
      .insert([pool]);

    if (error) {
      console.warn('Error creating fuel pool:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('Unexpected error in createFuelPool:', err);
    return false;
  }
}

export async function commitToFuelPool(coopId: string, userId: string, liters: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('coop_fuel_orders')
      .insert([{
        coop_id: coopId,
        user_id: userId,
        requested_liters: liters,
        status: 'PENDING'
      }]);

    if (error) {
      console.warn('Error committing to fuel pool:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('Unexpected error in commitToFuelPool:', err);
    return false;
  }
}
