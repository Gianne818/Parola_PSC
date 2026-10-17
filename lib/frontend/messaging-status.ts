import { readSchedule } from './profile-client';
import { recordTimestamp } from './timestamps';

const flag = (value: unknown): boolean | null => typeof value === 'boolean' ? value : null;
const phoneKey = (value: string) => value.replace(/\D/g, '').replace(/^0/, '63');

/** Reads existing profile fields only. Consent never implies dispatch eligibility. */
export function readMessagingProfile(input: unknown, accountId: string, phone: string) {
  if (!input || typeof input !== 'object') throw new Error('Messaging profile unavailable.');
  const item = input as Record<string, unknown>;
  if (item.id !== accountId || typeof item.phone_number !== 'string' || phoneKey(item.phone_number) !== phoneKey(phone)) {
    throw new Error('Messaging profile does not match this account and contact.');
  }
  return { consent: flag(item.messaging_consent), consentAt: recordTimestamp(item.messaging_consent_at),
    consentVersion: typeof item.messaging_consent_version === 'string' ? item.messaging_consent_version : null,
    contactVerified: flag(item.contact_verified), eligible: flag(item.messaging_eligible),
    active: flag(item.is_active), demo: item.auth_mode === 'demo', schedule: readSchedule(item) };
}

export type MessagingProfile = ReturnType<typeof readMessagingProfile>;
export type RequestOutcome = 'pending' | 'accepted' | 'simulated' | 'denied' | 'failed' | 'unknown';

/** The existing send endpoint has no callback-backed delivery stage. */
export function readMessagingOutcome(ok: boolean, status: number, input: unknown): RequestOutcome {
  if (status === 401 || status === 403) return 'denied';
  if (!ok) return 'failed';
  if (!input || typeof input !== 'object') return 'unknown';
  const item = input as Record<string, unknown>;
  if (item.success !== true) return item.success === false ? 'failed' : 'unknown';
  if (item.mode === 'MOCK_DRY_RUN') return 'simulated';
  if (item.mode === 'LIVE_DISPATCH') return 'accepted';
  return 'unknown';
}

export const requestOutcomeText: Record<RequestOutcome, string> = {
  pending: 'Sending request…',
  accepted: 'Accepted for SMS dispatch. Delivery has not been confirmed. This response is not a delivery receipt.',
  simulated: 'SMS preview simulated. No message was sent. Live messaging eligibility is unchanged.',
  denied: 'Request denied. Sign in and review your messaging status. No delivery is confirmed.',
  failed: 'The request could not be confirmed. Check before retrying; another request could duplicate a message. No delivery is confirmed.',
  unknown: 'Unrecognized response. Dispatch and delivery are unknown. Check before making another request.',
};
