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
  return <section className={styles.areaWeather} aria-busy={weather.loading} aria-labelledby="area-weather-title">
    <div className={styles.areaWeatherHeader}>
      <div>
        <h3 id="area-weather-title">{text.areaWeather}</h3>
        {data && <p className={styles.timestamp}>{text.retrieved}: {received ? `${received} PHT` : copy.unknownTime}</p>}
      </div>
      <button type="button" className={styles.textButton} onClick={weather.refresh} disabled={weather.loading}><RefreshCw size={15} aria-hidden="true" />{text.refreshWeather}</button>
    </div>
    {warning && <p className={styles.warningCallout} role="status">{text.zoneCaution}</p>}
    {weather.loading && <p className={styles.panelDescription} role="status">{copy.loadingWeather}</p>}
    {(weather.failed || incomplete) && !weather.loading && <p className={styles.notice} role="status">{copy.refreshFailed}</p>}
    <dl className={styles.areaWeatherReadings}>
      <ForecastReading label={copy.wind} reading={data?.wind} unit="km/h" icon={Wind} language={language} now={now} />
      <ForecastReading label={copy.waves} reading={data?.waves} unit="m" icon={Waves} language={language} now={now} />
    </dl>
    <WeatherCoverage data={data} requested={area} note={text.gridNote} />
  </section>;
}
