import { smsService } from '@/services/smsServiceInstance';
import type { SmsSendRequest } from '@/services/iprogSmsService';
import { requireUser } from '@/lib/route-auth';
import { smsRecipientEligible } from '@/lib/registration';
import { RATE_LIMITS, checkRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit';

const ALLOWED_CATEGORIES: ReadonlySet<SmsSendRequest['category']> = new Set([
  'weather',
  'emergency',
  'catch_log',
  'port_alert',
  'custom',
]);
const MAX_MESSAGE_CHARS = 1000;

export async function POST(request: Request) {
  try {
    const limit = await checkRateLimit(request, RATE_LIMITS.smsSend);
    if (!limit.allowed) {
      return rateLimitExceededResponse(RATE_LIMITS.smsSend, limit, 'sms-send');
    }
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }
    const { recipient, message, category } = body as {
      recipient?: unknown;
      message?: unknown;
      category?: unknown;
    };

    if (typeof recipient !== 'string' || !recipient.trim()) {
      return Response.json(
        { error: 'recipient and message are required fields.' },
        { status: 400 }
      );
    }
    if (typeof message !== 'string' || !message.trim()) {
      return Response.json(
        { error: 'recipient and message are required fields.' },
        { status: 400 }
      );
    }
    if (message.length > MAX_MESSAGE_CHARS) {
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
    if (isLive) {
      const { user, error } = await requireUser(request);
      if (error) return error;
      // A user may send only to their own registered contact. System dispatch
      // can use an admin key, but cannot bypass recipient verification/consent.
      if (!await smsRecipientEligible(recipient, user?.id)) {
        return Response.json({ error: 'Recipient is not eligible for live messaging.' }, { status: 403 });
      }
    }

    const result = await smsService.sendSms({
      recipient,
      message,
      category:
        typeof category === 'string'
          ? (category as SmsSendRequest['category'])
          : undefined,
    });
    return Response.json(result);
  } catch {
    console.error('[SMS Send API] dispatch failed');
    return Response.json({ error: 'SMS Dispatch unavailable.' }, { status: 503 });
  }
}
