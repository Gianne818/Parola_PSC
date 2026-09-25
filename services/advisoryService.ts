'use client';

import { supabase } from '../lib/supabase';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';

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

export async function logAdvisory(data: AdvisoryLogData): Promise<{ success: boolean; advisoryId?: string; error?: string }> {
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
      const res = await fetchWithTimeout(`${apiBaseUrl}/api/advisories/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        timeoutMs: 8000,
        retries: 1,
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, advisoryId: json.advisory_id || json.advisoryId };
      }
      // Fail closed: a backend rejection (validation, auth, 5xx) must surface,
      // never silently fall through to a direct Supabase write that bypasses it.
      const detail = await res.text().catch(() => '');
      const message = `Advisory service rejected the request (HTTP ${res.status})${detail ? `: ${detail.slice(0, 200)}` : ''}.`;
      console.error('[advisoryService] logAdvisory failed:', message);
      return { success: false, error: message };
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
      const message = `Supabase insert failed: ${error.message}`;
      console.error('[advisoryService] logAdvisory failed:', message);
      return { success: false, error: message };
    }

    return { success: true, advisoryId: insertData?.id?.toString() };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[advisoryService] Unexpected error in logAdvisory:', message);
    return { success: false, error: message };
  }
}

export interface FeedbackData {
  userId?: string;
  advisoryId?: string;
  feedbackValue: 1 | 2 | 3;
  rawSmsBody?: string;
}

export async function submitCatchFeedback(data: FeedbackData): Promise<{ success: boolean; feedbackId?: string; error?: string }> {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (apiBaseUrl) {
      const payload = {
        user_id: data.userId,
        advisory_id: data.advisoryId,
        feedback_value: data.feedbackValue,
        raw_sms_body: data.rawSmsBody
      };
      const res = await fetchWithTimeout(`${apiBaseUrl}/api/feedback/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        timeoutMs: 8000,
        retries: 1,
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, feedbackId: json.feedback_id || json.feedbackId };
      }
      // Fail closed: surface backend rejections instead of silently
      // falling through to a direct Supabase write that bypasses them.
      const detail = await res.text().catch(() => '');
      const message = `Feedback service rejected the request (HTTP ${res.status})${detail ? `: ${detail.slice(0, 200)}` : ''}.`;
      console.error('[advisoryService] submitCatchFeedback failed:', message);
      return { success: false, error: message };
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
      const message = `Supabase insert failed: ${error.message}`;
      console.error('[advisoryService] submitCatchFeedback failed:', message);
      return { success: false, error: message };
    }

    return { success: true, feedbackId: insertData?.id?.toString() };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[advisoryService] Unexpected error in submitCatchFeedback:', message);
    return { success: false, error: message };
  }
}
