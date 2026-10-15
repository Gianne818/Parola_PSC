'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { useApp } from '@/context/AppContext';
import { fontScales } from '@/utils/fontScale';
import { isClientCoordinate } from '@/lib/frontend/coordinates';
import { DASHBOARD_COPY } from '@/components/dashboard/dashboard-copy';
import { APPLICATION_COPY } from '@/components/application/application-copy';
import type { Language } from '@/types';
import styles from '@/components/application/application.module.css';

const anchorSections: Record<string, string> = { profile: 'profile', port: 'profile', vessel: 'profile', advisories: 'sms', readability: 'preferences', preferences: 'preferences' };

export default function SettingsPage() {
  const { userProfile, language, changeLanguage, fontScale, changeFontScale, isInitialized } = useApp();
  const copy = DASHBOARD_COPY[language];
  const text = APPLICATION_COPY[language];
  useEffect(() => {
    if (!isInitialized) return;
    const navigate = () => {
      const target = anchorSections[window.location.hash.slice(1)];
      if (target) document.getElementById(target)?.scrollIntoView({ block: 'start' });
    };
    navigate();
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, [isInitialized]);
  const rows = [[text.operator, userProfile.vesselName], [text.registeredPhone, userProfile.phone], [text.boatType, userProfile.boatType], [text.licence, userProfile.licenseNo], [copy.homePort, userProfile.port], [copy.advisoryArea, userProfile.regionName]];
  return <AuthLayout variant="application">
    <div className={`${styles.page} ${styles.settings}`}>
      <section id="profile" className={styles.settingsSection} aria-labelledby="profile-heading">
        <div className={styles.panelHeading}><h2 id="profile-heading">{text.profilePort}</h2><Link href="/onboarding?from=profile" className={styles.link}>{copy.changePort}</Link></div><p className={styles.muted}>{text.savedDetails}</p>
        <dl className={`${styles.details} ${styles.profileDetails}`}>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value?.trim() || text.notProvided}</dd></div>)}</dl>
        <details className={styles.disclosure}><summary>{copy.coordinates}</summary><dl className={styles.details}><div><dt>{copy.homePort}</dt><dd>{isClientCoordinate(userProfile.lat, userProfile.lng) ? `${userProfile.lat.toFixed(6)}, ${userProfile.lng.toFixed(6)}` : text.notProvided}</dd></div>{userProfile.fmaZone && <div><dt>FMA</dt><dd>{userProfile.fmaZone}</dd></div>}</dl></details>
      </section>
      <div className={styles.settingsTools}>
      <section id="preferences" className={styles.settingsSection} aria-labelledby="preferences-heading">
        <div className={styles.panelHeading}><h2 id="preferences-heading">{text.languageSize}</h2></div><p className={styles.muted}>{text.immediate}</p>
        <div className={styles.preferenceFields}>
          <label className={styles.field}>{copy.language}<select className={styles.select} value={language} onChange={event => changeLanguage(event.target.value as Language)}><option value="en">English</option><option value="tl">Tagalog</option><option value="ceb">Cebuano</option><option value="hil">Hiligaynon</option></select></label>
          <label className={styles.field}>{text.textSize}<select className={styles.select} value={fontScale} onChange={event => changeFontScale(Number(event.target.value))}>{Object.entries(fontScales).sort((a, b) => Number(a[0]) - Number(b[0])).map(([scale, percentage]) => <option value={scale} key={scale}>{percentage}%{Number(scale) === 0 ? ` — ${text.defaultSize}` : ''}</option>)}</select></label>
        </div><div className={styles.preview}><span className={styles.small}>{text.preview}</span><p>{text.previewText}</p></div>
      </section>
      <section id="sms" className={styles.settingsSection} aria-labelledby="sms-heading"><div className={styles.panelHeading}><h2 id="sms-heading">{text.smsAccess}</h2></div><p className={styles.muted}>{text.smsManual}</p><dl className={styles.details}><div><dt>{text.registeredPhone}</dt><dd>{userProfile.phone?.trim() || text.notProvided}</dd></div></dl><Link href="/alerts" className={styles.link}>{copy.readAdvisory}</Link></section>
      </div>
    </div>
  </AuthLayout>;
}
