import { smsService } from '@/services/smsServiceInstance';
import type { SmsSendRequest } from '@/services/iprogSmsService';
import { requireUser } from '@/lib/route-auth';
import { smsRecipientEligible } from '@/lib/registration';
import { RATE_LIMITS, checkRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit';
import { prepareGeographicAdvisory } from '@/lib/geographic-sms';
import { GeographicAccessError } from '@/lib/geographic-access';
import { checkGeographicEligibility, isProfileId } from '@/lib/geographic-eligibility';
import { getDbPool } from '@/lib/db';
import { claimRoutineAttempt, recordRoutineOutcome } from '@/lib/routine-delivery';
import type { Pool } from 'pg';

const ALLOWED_CATEGORIES: ReadonlySet<SmsSendRequest['category']> = new Set([
  'weather',
  'emergency',
  'catch_log',
  'port_alert',
  'custom',
]);
const MAX_MESSAGE_CHARS = 1000;

export async function POST(request: Request) {
  let claimed: { db: Pool; id: string } | undefined;
  try {
    const limit = await checkRateLimit(request, RATE_LIMITS.smsSend);
    if (!limit.allowed) {
      return rateLimitExceededResponse(RATE_LIMITS.smsSend, limit, 'sms-send');
    }
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }
    const { recipient, message, category, advisory_id: advisoryId } = body as {
      recipient?: unknown;
      message?: unknown;
      category?: unknown;
      advisory_id?: unknown;
    };
    if (advisoryId !== undefined && (typeof advisoryId !== 'string' || !isProfileId(advisoryId)
      || message !== undefined || category !== undefined)) {
      return Response.json({ error: 'Use a valid advisory_id without message or category overrides.' }, { status: 400 });
    }

    if (typeof recipient !== 'string' || !recipient.trim()) {
      return Response.json(
        { error: 'recipient and message are required fields.' },
        { status: 400 }
      );
    }
    if (advisoryId === undefined && (typeof message !== 'string' || !message.trim())) {
      return Response.json(
        { error: 'recipient and message are required fields.' },
        { status: 400 }
      );
    }
    if (typeof message === 'string' && message.length > MAX_MESSAGE_CHARS) {
      return Response.json(
        { error: `message must be at most ${MAX_MESSAGE_CHARS} characters.` },
        { status: 400 }
      );
    }
    if (category !== undefined && (typeof category !== 'string' || !ALLOWED_CATEGORIES.has(category as SmsSendRequest['category']))) {
      return Response.json(
        { error: `category must be one of: ${[...ALLOWED_CATEGORIES].join(', ')}.` },
        { status: 400 }
      );
    }

    // Live (billed) dispatch always requires an authenticated user or admin.
    // Mock dry-runs stay open for the demo so onboarding/alerts previews keep working.
    const isLive = !smsService.getConfig().mockMode;
    let dispatchMessage = typeof message === 'string' ? message : 'Parola demo advisory preview. No target verification or live SMS.';
    if (isLive) {
      const { user, error } = await requireUser(request);
      if (error) return error;
      // A user may send only to their own registered contact. System dispatch
      // can use an admin key, but cannot bypass recipient verification/consent.
      if (!await smsRecipientEligible(recipient, user?.id)) {
        return Response.json({ error: 'Recipient is not eligible for live messaging.' }, { status: 403 });
      }
      if (typeof advisoryId === 'string') {
        const prepared = await prepareGeographicAdvisory(advisoryId, recipient, user?.id);
        const db = getDbPool(3);
        if (!db) throw new GeographicAccessError(503, 'delivery_unavailable', 'Delivery tracking is unavailable.');
        const attempt = await claimRoutineAttempt(db, prepared.profileId, prepared.date);
        if (!attempt) return Response.json({ error: 'No unsent eligible routine job is available.', code: 'routine_job_unavailable' }, { status: 409 });
        claimed = { db, id: attempt.id };
        const decision = await checkGeographicEligibility(db, prepared.profileId, prepared.lat, prepared.lon);
        if (decision.status !== 'allowed') {
          await recordRoutineOutcome(db, attempt.id, { state: 'rejected' });
          claimed = undefined;
          throw new GeographicAccessError(decision.status === 'denied' ? 403 : 503, decision.reason, 'Fishing target access is unavailable.');
        }
        dispatchMessage = prepared.message;
      } else {
        // Trusted operators can issue non-target safety warnings independently of
        // fishing coverage. User-authored live fishing guidance needs a stored target.
        if (user || !['weather', 'emergency', 'port_alert'].includes(String(category))) {
          return Response.json({ error: 'Live fishing advisories require advisory_id; free-form safety warnings require an operator.' }, { status: 403 });
        }
      }
    }

    const result = await smsService.sendSms({
      recipient,
      message: dispatchMessage,
      category:
        typeof category === 'string'
          ? (category as SmsSendRequest['category'])
          : undefined,
    });
    if (claimed) {
      const accepted = result.success && result.mode === 'LIVE_DISPATCH' && typeof result.messageId === 'string'
        && result.messageId.trim().length > 0 && !/^(?:MOCK-|LIVE-\d+$)/.test(result.messageId);
      await recordRoutineOutcome(claimed.db, claimed.id, accepted
        ? { state: 'submitted', provider_message_id: result.messageId! } : { state: 'unknown' });
      claimed = undefined;
      if (!accepted) return Response.json({ error: 'Submission is unconfirmed; do not resend automatically.', code: 'submission_unconfirmed' }, { status: 503 });
    }
    return Response.json(result);
  } catch (error) {
    if (claimed) await recordRoutineOutcome(claimed.db, claimed.id, { state: 'unknown' }).catch(() => {});
    if (error instanceof GeographicAccessError) return Response.json({ error: error.message, code: error.code }, { status: error.status });
    console.error('[SMS Send API] dispatch failed');
    return Response.json({ error: 'SMS Dispatch unavailable.' }, { status: 503 });
  }
}
