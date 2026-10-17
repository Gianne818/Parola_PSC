'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Phone } from 'lucide-react';
import { authHeaders } from '@/utils/auth-fetch';
import { isValidPhilippineMobile } from '@/lib/philippine-mobile';
import { isReadingCurrent, maskedPhone, type AdvisoryState, type DashboardWeather } from '@/lib/dashboard';
import { readMessagingOutcome, requestOutcomeText, type RequestOutcome } from '@/lib/frontend/messaging-status';
import { displayTime } from './Advisory';
import type { DashboardCopy } from './dashboard-copy';
import styles from './dashboard.module.css';
import MessagingStatus from './MessagingStatus';
import { useMessagingProfile } from './use-messaging-profile';

export default function SmsAccess({ accountId, phone, port, weather, state, stale, copy, language }: {
  accountId?: string;
  phone: string; port: string; weather: DashboardWeather | null; state: AdvisoryState;
  stale: boolean; copy: DashboardCopy; language: string;
}) {
  const [result, setResult] = useState<{ key: string; outcome: RequestOutcome } | null>(null);
  const profile = useMessagingProfile(accountId, phone);
  const controllerRef = useRef<AbortController | null>(null);
  const key = JSON.stringify([accountId, phone, port, weather?.receivedAt]);
  const outcome = result?.key === key ? result.outcome : null;
  useEffect(() => () => { controllerRef.current?.abort(); controllerRef.current = null; }, [key]);
  const validPhone = isValidPhilippineMobile(phone);
  const currentWeather = weather && [weather.wind, weather.waves].every(reading => isReadingCurrent(reading));
  const blockedProfile = profile.status !== 'ready' || profile.data?.demo || profile.data?.consent !== true
    || profile.data?.eligible === false || profile.data?.contactVerified === false || profile.data?.active === false;
  const canSend = Boolean(validPhone && currentWeather && state !== 'incomplete' && !stale && !blockedProfile
    && outcome !== 'pending' && outcome !== 'accepted' && outcome !== 'simulated' && outcome !== 'denied');
  const send = async () => {
    if (!canSend || !weather || controllerRef.current) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    setResult({ key, outcome: 'pending' });
    try {
      const status = state === 'hold' ? copy.hold : state === 'clear' ? copy.clear : copy.incomplete;
      const message = [
        `PAROLA: ${port.slice(0, 180)}`, status,
        `${copy.wind}: ${weather.wind.value?.toFixed(1)} km/h (${displayTime(weather.wind.observedAt, language)} PHT).`,
        `${copy.waves}: ${weather.waves.value?.toFixed(1)} m (${displayTime(weather.waves.observedAt, language)} PHT).`,
        weather.hold.active ? `Regional hold: ${weather.hold.reason || 'Reason unavailable'} (${displayTime(weather.hold.checkedAt, language) || copy.unknownTime} PHT).` : '',
        weather.stormSignal.value != null && weather.stormSignal.value > 0 ? `Recorded storm signal: ${weather.stormSignal.value}.` : '',
        `Sources: ${weather.wind.source}; ${weather.waves.source}.`, copy.footer,
      ].join('\n');
      const response = await fetch('/api/sms/send', {
        method: 'POST', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
        headers: await authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ recipient: phone, message, category: 'weather' }),
      });
      const data: unknown = await response.json().catch(() => null);
      const nextOutcome = readMessagingOutcome(response.ok, response.status, data);
      if (!controller.signal.aborted) setResult({ key, outcome: nextOutcome });
    } catch {
      if (!controller.signal.aborted) setResult({ key, outcome: 'failed' });
    } finally { if (controllerRef.current === controller) controllerRef.current = null; }
  };
  return <section className={styles.sms} aria-label={copy.smsTitle}>
      <button type="button" className={styles.primary} disabled={!canSend} onClick={() => void send()}>{outcome === 'pending' ? copy.sending : outcome === 'failed' ? copy.retry : copy.sendSms}</button>
      <div className={styles.smsMeta}>
        {validPhone && <p className={styles.phone}><Phone size={14} aria-hidden="true" />{maskedPhone(phone)}</p>}
        <details className={styles.smsExplanation}><summary>{copy.smsHelp}<ChevronDown size={14} aria-hidden="true" /></summary><p>{copy.smsDescription}</p></details>
      </div>
      <div className={styles.smsStatus} data-error={outcome === 'failed'} role="status" aria-live="polite">
        {outcome && <p lang="en">{requestOutcomeText[outcome]}</p>}
        {!validPhone ? <p>{copy.noPhone} <Link href="/profile" className={styles.textButton}>{copy.profile}</Link></p>
          : (!currentWeather || stale || state === 'incomplete') && <p>{copy.smsUnavailable}</p>}
        {blockedProfile && profile.status === 'ready' && <p lang="en">Manual SMS unavailable for this account. Saved consent or a schedule does not establish live eligibility.</p>}
      </div>
      <MessagingStatus data={profile.data} status={profile.status} refresh={profile.refresh} language={language} />
    </section>;
}
