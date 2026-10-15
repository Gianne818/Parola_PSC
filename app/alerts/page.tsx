'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { CircleHelp, CloudLightning, RefreshCw, ShieldAlert, ShieldCheck, Thermometer, Waves, Wind } from 'lucide-react';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { useApp } from '@/context/AppContext';
import { PHILIPPINE_REGIONS, detectPhilippineRegion } from '@/data/philippineRegions';
import { advisoryState, isReadingCurrent } from '@/lib/dashboard';
import { useAdvisoryWeather, useDashboardClock } from '@/components/dashboard/use-dashboard-data';
import { DASHBOARD_COPY } from '@/components/dashboard/dashboard-copy';
import { displayTime } from '@/components/dashboard/Advisory';
import SmsAccess from '@/components/dashboard/SmsAccess';
import { APPLICATION_COPY } from '@/components/application/application-copy';
import styles from '@/components/application/application.module.css';
import ForecastReading from '@/components/dashboard/ForecastReading';
import { GUIDANCE_COPY } from '@/components/dashboard/guidance-copy';
import WeatherCoverage from '@/components/dashboard/WeatherCoverage';

export default function AdvisoriesPage() {
  const { userProfile, language, manualOverrideHold } = useApp();
  const copy = DASHBOARD_COPY[language];
  const text = APPLICATION_COPY[language];
  const guidance = GUIDANCE_COPY[language];
  const now = useDashboardClock();
  const region = useMemo(() => PHILIPPINE_REGIONS.find(item => item.id === userProfile.regionId)
    || detectPhilippineRegion(userProfile.lat, userProfile.lng, userProfile.port), [userProfile]);
  const weather = useAdvisoryWeather(userProfile.lat, userProfile.lng, region.id);
  const state = advisoryState(weather.data, manualOverrideHold, weather.failed, now);
  const Icon = state === 'hold' ? ShieldAlert : state === 'clear' ? ShieldCheck : CircleHelp;
  const readings = [
    { label: copy.wind, reading: weather.data?.wind, unit: 'km/h', icon: Wind },
    { label: copy.waves, reading: weather.data?.waves, unit: 'm', icon: Waves },
    { label: copy.temperature, reading: weather.data?.temperature, unit: '°C', icon: Thermometer },
    { label: copy.storm, reading: weather.data?.stormSignal, unit: '', icon: CloudLightning },
  ];
  const stale = weather.failed || readings.some(({ reading }) => reading?.value != null && !isReadingCurrent(reading, now));
  const received = displayTime(weather.data?.receivedAt, language);
  return <AuthLayout variant="application">
    <div className={`${styles.page} ${styles.advisories}`}><div className={styles.columns}>
      <article className={styles.bulletin}>
        <section className={styles.status} data-state={state} aria-busy={weather.loading} aria-labelledby="current-advisory">
          <div className={styles.statusHeading}><Icon size={24} aria-hidden="true" /><h2 id="current-advisory" aria-live="polite">{state === 'hold' ? copy.hold : state === 'clear' ? copy.clear : copy.incomplete}</h2></div>
          <p className={styles.advisoryPort}>{userProfile.port || copy.portMissing}</p>
          <p>{state === 'hold' ? copy.holdDescription : state === 'clear' ? copy.clearDescription : copy.incompleteDescription}</p>
          {weather.data?.hold.active && weather.data.hold.reason && <p><strong>{text.regionalReason}: </strong>{weather.data.hold.reason}</p>}
          <p className={styles.small}>{weather.loading ? copy.refreshing : received ? `${guidance.retrieved}: ${received} PHT` : copy.unknownTime}</p>
          {stale && weather.data && !weather.loading && <p className={styles.small}>{copy.lastAvailable}</p>}
          {weather.failed && !weather.loading && <p role="status" className={styles.muted}>{copy.refreshFailed}</p>}
          <div className={styles.actions}><button type="button" className={styles.button} onClick={weather.refresh} disabled={weather.loading}><RefreshCw size={16} aria-hidden="true" />{copy.refresh}</button><Link className={styles.link} href="/dashboard">{copy.viewAreas}</Link></div>
        </section>
        <section className={styles.weatherSection} aria-labelledby="weather-information">
          <div className={styles.panelHeading}><h2 id="weather-information">{guidance.portWeather}</h2></div>
          <dl className={styles.primaryWeather}>{readings.slice(0, 2).map(({ label, reading, unit, icon }) =>
            <ForecastReading key={label} label={label} reading={reading} unit={unit} icon={icon} language={language} now={now} emphasis />)}</dl>
          <dl className={styles.supportingWeather}>{readings.slice(2).map(({ label, reading, unit, icon }, index) =>
            <ForecastReading key={label} label={label} reading={reading} unit={unit} icon={icon} language={language} now={now} record={index === 1} />)}</dl>
          <p className={styles.regionalNote}>{guidance.regionalNote}</p>
          <WeatherCoverage data={weather.data} requested={userProfile} regionName={region.name} />
          <details className={styles.disclosure}><summary>{text.methodology}</summary><p>{text.methodologyText}</p><p>{text.forecastNote}</p><p>{copy.holdChecks}: {weather.data?.hold.available ? copy.holdRecorded : copy.holdUnknown}. {displayTime(weather.data?.hold.checkedAt, language) || copy.unknownTime}</p></details>
        </section>
      </article>
      <aside className={`${styles.panel} ${styles.smsSupport}`}><SmsAccess phone={userProfile.phone} port={userProfile.port} weather={weather.data} state={state} stale={weather.failed || weather.loading} copy={copy} language={language} /><div className={styles.help}><h3>{copy.guidanceHelp}</h3><Link href="/resources/guide" className={styles.link}>{copy.openGuide}</Link></div></aside>
    </div></div>
  </AuthLayout>;
}
