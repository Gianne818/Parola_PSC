'use client';

import { supabase } from '../lib/supabase';

export interface AdvisoryLogData {
  userId?: string;
  advisoryDate: string;
  targetGridId?: number;
  distanceKm: number;
  compassBearing: string;
  rawGpsLat: number;
  rawGpsLon: number;
  smsText: string;
  mapsShortLink?: string;
  smsMessageId?: string;
}

export async function logAdvisory(data: AdvisoryLogData): Promise<{ success: boolean; advisoryId?: string }> {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (apiBaseUrl) {
      const payload = {
        user_id: data.userId,
        advisory_date: data.advisoryDate,
        target_grid_id: data.targetGridId,
        distance_km: data.distanceKm,
        compass_bearing: data.compassBearing,
        raw_gps_lat: data.rawGpsLat,
        raw_gps_lon: data.rawGpsLon,
        sms_text: data.smsText,
        maps_short_link: data.mapsShortLink,
        sms_message_id: data.smsMessageId
      };
      const res = await fetch(`${apiBaseUrl}/api/advisories/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, advisoryId: json.advisory_id || json.advisoryId };
      }
    }

    const { data: insertData, error } = await supabase
      .from('daily_advisories')
      .insert([{
        user_id: data.userId,
        advisory_date: data.advisoryDate,
        target_grid_id: data.targetGridId,
        distance_km: data.distanceKm,
        compass_bearing: data.compassBearing,
        raw_gps_lat: data.rawGpsLat,
        raw_gps_lon: data.rawGpsLon,
        sms_text: data.smsText,
        maps_short_link: data.mapsShortLink,
        sms_message_id: data.smsMessageId
      }])
      .select('id')
      .single();

    if (error) {
      console.warn('Error logging advisory to Supabase:', error.message);
      return { success: false };
    }

    return { success: true, advisoryId: insertData?.id?.toString() };
  } catch (err) {
    console.warn('Unexpected error in logAdvisory:', err);
    return { success: false };
  }
}

export interface FeedbackData {
  userId?: string;
  advisoryId?: string;
  feedbackValue: 1 | 2 | 3;
  rawSmsBody?: string;
}

export async function submitCatchFeedback(data: FeedbackData): Promise<{ success: boolean; feedbackId?: string }> {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (apiBaseUrl) {
      const payload = {
        user_id: data.userId,
        advisory_id: data.advisoryId,
        feedback_value: data.feedbackValue,
        raw_sms_body: data.rawSmsBody
      };
      const res = await fetch(`${apiBaseUrl}/api/feedback/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, feedbackId: json.feedback_id || json.feedbackId };
      }
    }

    const { data: insertData, error } = await supabase
      .from('catch_feedbacks')
      .insert([{
        user_id: data.userId,
        advisory_id: data.advisoryId,
        feedback_value: data.feedbackValue,
        raw_sms_body: data.rawSmsBody
      }])
      .select('id')
      .single();

    if (error) {
      console.warn('Error submitting feedback to Supabase:', error.message);
      return { success: false };
    }

    return { success: true, feedbackId: insertData?.id?.toString() };
  } catch (err) {
    console.warn('Unexpected error in submitCatchFeedback:', err);
    return { success: false };
  }
}
