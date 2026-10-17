'use client';

import { RefreshCw, Waves, Wind } from 'lucide-react';
import type { DashboardWeather, FishingArea } from '@/lib/dashboard';
import { isReadingCurrent } from '@/lib/dashboard';
import type { Language } from '@/types';
import ForecastReading from './ForecastReading';
import { displayTime } from './Advisory';
import { DASHBOARD_COPY } from './dashboard-copy';
import { GUIDANCE_COPY } from './guidance-copy';
import { useAreaWeather, useDashboardClock } from './use-dashboard-data';
import styles from './dashboard.module.css';
import WeatherCoverage from './WeatherCoverage';
import SafetyEvidence from './SafetyEvidence';

export default function AreaWeather({ area, regionId, cache, language }: {
  area: FishingArea; regionId: string; cache: Map<string, DashboardWeather>; language: Language;
}) {
  const weather = useAreaWeather(area.lat, area.lng, regionId, cache);
  const now = useDashboardClock();
  const copy = DASHBOARD_COPY[language];
  const text = GUIDANCE_COPY[language];
  const data = weather.data;
  const incomplete = data && [data.wind, data.waves].some(reading => !isReadingCurrent(reading, now));
  const warning = data && ((data.wind.value != null && data.wind.value / 1.852 >= 20) || (data.waves.value != null && data.waves.value >= 2));
  const received = displayTime(data?.receivedAt, language);
  const readings = [
    { label: copy.wind, reading: data?.wind, unit: 'km/h' },
    { label: copy.waves, reading: data?.waves, unit: 'm' },
  ];
  return <section className={styles.areaWeather} aria-busy={weather.loading} aria-labelledby="area-weather-title">
    <h3 id="area-weather-title">{text.areaWeather}</h3>
    {weather.loading && <p className={styles.panelDescription} role="status">{copy.loadingWeather}</p>}
    {(weather.failed || incomplete) && !weather.loading && <p className={styles.panelDescription} role="status">{copy.refreshFailed}</p>}
    <dl className={styles.weatherSummary}>{readings.map(({ label, reading, unit }) => <div key={label}>
      <dt>{label} <span>{text.forecast}</span></dt>
      <dd>{typeof reading?.value === 'number' && Number.isFinite(reading.value) ? <>{reading.value.toLocaleString(language, { maximumFractionDigits: 1 })}<span>{unit}</span></> : copy.unavailable}</dd>
      <dd className={styles.weatherState}>{!reading || reading.value == null ? copy.unavailable : reading.available === false ? copy.lastAvailable : !displayTime(reading.observedAt, language) ? copy.unknownTime : !isReadingCurrent(reading, now) ? text.outdated : null}</dd>
    </div>)}</dl>
    {(data?.hold.active || (data?.stormSignal.value != null && data.stormSignal.value > 0)) && <SafetyEvidence data={data} failed={weather.failed} now={now} language={language} />}
    {warning && <p className={styles.notice}>{text.zoneCaution}</p>}
    <details className={styles.disclosure}>
      <summary lang="en">Weather sources &amp; times</summary>
      <dl className={styles.areaWeatherReadings}>
        <ForecastReading label={copy.wind} reading={data?.wind} unit="km/h" icon={Wind} language={language} now={now} />
        <ForecastReading label={copy.waves} reading={data?.waves} unit="m" icon={Waves} language={language} now={now} />
      </dl>
      <p className={styles.panelDescription}>{text.gridNote}</p>
      {data && <p className={styles.timestamp}>{text.retrieved}: {received ? `${received} PHT` : copy.unknownTime}</p>}
      <button type="button" className={styles.textButton} onClick={weather.refresh} disabled={weather.loading}><RefreshCw size={16} aria-hidden="true" />{text.refreshWeather}</button>
      {!(data?.hold.active || (data?.stormSignal.value != null && data.stormSignal.value > 0)) && <SafetyEvidence data={data} failed={weather.failed} now={now} language={language} />}
      <WeatherCoverage data={data} requested={area} />
    </details>
  </section>;
}
