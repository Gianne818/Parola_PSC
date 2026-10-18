import type { LucideIcon } from 'lucide-react';
import { isReadingCurrent, type WeatherReading } from '@/lib/dashboard';
import type { Language } from '@/types';
import { DASHBOARD_COPY } from './dashboard-copy';
import { GUIDANCE_COPY } from './guidance-copy';
import { displayTime } from './Advisory';
import styles from './forecast-reading.module.css';

export default function ForecastReading({ label, reading, unit, icon: Icon, language, now, emphasis = false, record = false }: {
  label: string; reading: WeatherReading | undefined; unit: string; icon: LucideIcon;
  language: Language; now: Date; emphasis?: boolean; record?: boolean;
}) {
  const copy = DASHBOARD_COPY[language];
  const text = GUIDANCE_COPY[language];
  const current = Boolean(reading && isReadingCurrent(reading, now));
  const time = displayTime(reading?.observedAt, language);
  const validUntil = displayTime(reading?.validUntil, language);
  const value = typeof reading?.value === 'number' && Number.isFinite(reading.value) ? reading.value : null;
  const stateLabel = value === null
    ? copy.unavailable
    : reading?.available === false
      ? copy.lastAvailable
      : !time
        ? copy.unknownTime
        : current
          ? (record ? copy.holdRecorded : text.forecast)
          : text.outdated;
  return <div className={styles.reading} data-emphasis={emphasis} data-current={current}>
    <div className={styles.readingHeader}>
      <dt><Icon size={18} aria-hidden="true" /><span>{label}</span></dt>
      <dd className={styles.state} data-current={current}>{stateLabel}</dd>
    </div>
    <dd className={styles.value}>{value !== null
      ? <>{value.toLocaleString(language, { maximumFractionDigits: 1 })}{unit ? <span>{unit}</span> : null}</>
      : <span className={styles.unavailable}>{copy.unavailable}</span>}</dd>
    <dd className={styles.meta}><span>{copy.source}: {reading?.source || copy.unavailable}</span>
      <span>{record ? copy.observed : text.forecastTime}: {time ? `${time} PHT` : copy.unknownTime}</span>
      <span lang="en">Valid until: {validUntil ? `${validUntil} PHT` : 'Unavailable'}</span></dd>
  </div>;
}
