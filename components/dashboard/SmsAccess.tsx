'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, MessageSquare, Phone } from 'lucide-react';
import { authHeaders } from '@/utils/auth-fetch';
import { isValidPhilippineMobile } from '@/lib/philippine-mobile';
import { isReadingCurrent, maskedPhone, smsOutcome, type AdvisoryState, type DashboardWeather } from '@/lib/dashboard';
import { displayTime } from './Advisory';
import type { DashboardCopy } from './dashboard-copy';
import styles from './dashboard.module.css';

export default function SmsAccess({ phone, port, weather, state, stale, copy, language }: {
  phone: string; port: string; weather: DashboardWeather | null; state: AdvisoryState;
  stale: boolean; copy: DashboardCopy; language: string;
}) {
  const [result, setResult] = useState<{ key: string; outcome: 'pending' | 'accepted' | 'simulated' | 'failed' } | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const key = `${phone},${port},${weather?.receivedAt}`;
  const outcome = result?.key === key ? result.outcome : null;
  useEffect(() => () => { controllerRef.current?.abort(); controllerRef.current = null; }, [key]);
  const validPhone = isValidPhilippineMobile(phone);
  const currentWeather = weather && [weather.wind, weather.waves].every(reading => isReadingCurrent(reading));
  const canSend = Boolean(validPhone && currentWeather && !stale && outcome !== 'pending');
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
        'Open-Meteo forecast.', copy.footer,
      ].join('\n');
      const response = await fetch('/api/sms/send', {
        method: 'POST', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
        headers: await authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ recipient: phone, message, category: 'weather' }),
      });
      const data = await response.json();
      const nextOutcome = smsOutcome(response.ok, data);
      if (!controller.signal.aborted) setResult({ key, outcome: nextOutcome });
    } catch {
      if (!controller.signal.aborted) setResult({ key, outcome: 'failed' });
    } finally { if (controllerRef.current === controller) controllerRef.current = null; }
  };
  return <section className={styles.sms} aria-labelledby="sms-title">
      <div className={styles.smsHeading}><MessageSquare size={18} aria-hidden="true" /><h2 id="sms-title">{copy.smsTitle}</h2></div>
      <button type="button" className={styles.primary} disabled={!canSend} onClick={() => void send()}>{outcome === 'pending' ? copy.sending : outcome === 'failed' ? copy.retry : copy.sendSms}</button>
      <div className={styles.smsMeta}>
        {validPhone && <p className={styles.phone}><Phone size={14} aria-hidden="true" />{maskedPhone(phone)}</p>}
        <details className={styles.smsExplanation}><summary>{copy.smsHelp}<ChevronDown size={14} aria-hidden="true" /></summary><p>{copy.smsDescription}</p></details>
      </div>
      <div className={styles.smsStatus} data-error={outcome === 'failed'} role="status" aria-live="polite">
        {!validPhone ? <p>{copy.noPhone} <Link href="/profile" className={styles.textButton}>{copy.profile}</Link></p>
          : !currentWeather || stale ? <p>{copy.smsUnavailable}</p>
            : outcome && <p>{outcome === 'accepted' ? copy.smsAccepted : outcome === 'simulated' ? copy.smsSimulated : outcome === 'failed' ? copy.smsFailed : copy.sending}</p>}
      </div>
    </section>;
}
