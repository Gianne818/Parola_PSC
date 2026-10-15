'use client';

import Link from 'next/link';
import { CircleHelp, RefreshCw, ShieldAlert, ShieldCheck, Waves, Wind } from 'lucide-react';
import { isReadingCurrent, type AdvisoryState, type DashboardWeather } from '@/lib/dashboard';
import type { DashboardCopy } from './dashboard-copy';
import styles from './dashboard.module.css';
import { GUIDANCE_COPY } from './guidance-copy';
import { recordTimestamp } from '@/lib/frontend/timestamps';
import WeatherCoverage from './WeatherCoverage';

export function displayTime(value: string | null | undefined, language: string): string | null {
  const timestamp = recordTimestamp(value);
  if (!timestamp) return null;
  return new Intl.DateTimeFormat(language === 'tl' ? 'fil' : language, {
    timeZone: 'Asia/Manila', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(new Date(timestamp));
}

export default function Advisory({ data, state, loading, failed, refresh, openDetails, copy, language }: {
  data: DashboardWeather | null; state: AdvisoryState; loading: boolean; failed: boolean;
  refresh: () => void; openDetails: () => void; copy: DashboardCopy; language: string;
}) {
  const Icon = state === 'hold' ? ShieldAlert : state === 'clear' ? ShieldCheck : CircleHelp;
  const title = state === 'hold' ? copy.hold : state === 'clear' ? copy.clear : copy.incomplete;
  const oldReadings = Boolean(data && [data.wind, data.waves, data.stormSignal].some(reading => !isReadingCurrent(reading)));
  const received = displayTime(data?.receivedAt, language);
  return <section className={styles.advisory} data-state={state} aria-labelledby="advisory-title" aria-busy={loading}>
    <div className={styles.advisoryStatus}><Icon size={20} aria-hidden="true" /><div><h2 id="advisory-title" aria-live="polite">{title}</h2>
      <p className={styles.timestamp}>{loading ? copy.refreshing : received ? `${GUIDANCE_COPY[language as keyof typeof GUIDANCE_COPY]?.retrieved || GUIDANCE_COPY.en.retrieved}: ${received} PHT` : copy.unknownTime}</p>
      {(failed || oldReadings) && data && <p className={styles.timestamp}>{copy.lastAvailable}</p>}
    </div></div>
    <dl className={styles.readings}>
      <div><Wind size={18} aria-hidden="true" /><dt>{copy.wind}</dt><dd>{data?.wind.value != null ? `${data.wind.value.toFixed(1)} km/h` : copy.unavailable}</dd></div>
      <div><Waves size={18} aria-hidden="true" /><dt>{copy.waves}</dt><dd>{data?.waves.value != null ? `${data.waves.value.toFixed(1)} m` : copy.unavailable}</dd></div>
    </dl>
    <div className={styles.advisoryActions}>
      <button type="button" className={styles.iconButton} onClick={refresh} disabled={loading} title={copy.refresh} aria-label={copy.refresh}><RefreshCw size={17} aria-hidden="true" /></button>
      <button type="button" className={styles.textButton} onClick={openDetails}>{copy.weatherDetails}</button>
      {state === 'hold' && <Link className={styles.holdLink} href="/alerts">{copy.readAdvisory}</Link>}
    </div>
    {failed && !loading && <p className={styles.advisoryNotice} role="status">{copy.refreshFailed}</p>}
  </section>;
}

export function WeatherDetails({ data, state, copy, language }: { data: DashboardWeather | null; state: AdvisoryState; copy: DashboardCopy; language: string }) {
  const sources = [
    { label: copy.wind, reading: data?.wind, unit: 'km/h' }, { label: copy.waves, reading: data?.waves, unit: 'm' },
    { label: copy.temperature, reading: data?.temperature, unit: '°C' }, { label: copy.storm, reading: data?.stormSignal, unit: '' },
  ];
  return <>
    <p className={styles.panelDescription}>{state === 'hold' ? copy.holdDescription : state === 'clear' ? copy.clearDescription : copy.incompleteDescription}</p>
    <dl className={styles.sourceList}>{sources.map(({ label, reading, unit }) => <div key={label}><dt>{label}</dt>
      <dd className={styles.sourceValue}>{reading?.value != null ? `${reading.value} ${unit}` : copy.unavailable}</dd>
      <dd>{copy.source}: {reading?.source || copy.unavailable}</dd><dd>{copy.observed}: {displayTime(reading?.observedAt, language) || copy.unknownTime}</dd>
      <dd lang="en">Valid until: {displayTime(reading?.validUntil, language) || 'Unavailable'}</dd>
      <dd>{reading?.value == null ? copy.unavailable : reading.available === false ? copy.lastAvailable : !displayTime(reading.observedAt, language) ? copy.unknownTime : !isReadingCurrent(reading) ? GUIDANCE_COPY[language as keyof typeof GUIDANCE_COPY]?.outdated || GUIDANCE_COPY.en.outdated : null}</dd>
    </div>)}
      <div><dt>{copy.holdChecks}</dt><dd>{data?.hold.available ? copy.holdRecorded : copy.holdUnknown}</dd><dd>{displayTime(data?.hold.checkedAt, language) || copy.unknownTime}</dd>
        {data?.hold.active && data.hold.reason && <dd>{data.hold.reason}</dd>}
      </div>
    </dl>
    <WeatherCoverage data={data} />
  </>;
}
