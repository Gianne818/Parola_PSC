import type { LucideIcon } from 'lucide-react';
import { isReadingCurrent, type WeatherReading } from '@/lib/dashboard';
import type { Language } from '@/types';
import { DASHBOARD_COPY } from './dashboard-copy';
import { GUIDANCE_COPY } from './guidance-copy';
import { APPLICATION_COPY } from '@/components/application/application-copy';
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
  return <div className={styles.reading} data-emphasis={emphasis}>
    <dt><Icon size={20} aria-hidden="true" />{label}</dt>
    <dd className={styles.value}>{reading?.value != null
      ? <>{reading.value.toLocaleString(language, { maximumFractionDigits: 1 })}<span>{unit}</span></>
      : <span className={styles.unavailable}>{copy.unavailable}</span>}</dd>
    <dd className={styles.meta}><span>{copy.source}: {reading?.source || copy.unavailable}</span>
      <span>{record ? copy.observed : text.forecastTime}: {time ? `${time} PHT` : copy.unknownTime}</span></dd>
    <dd className={styles.state} data-current={current}>{reading?.value == null ? copy.unavailable : current ? APPLICATION_COPY[language].current : text.outdated}</dd>
  </div>;
}
