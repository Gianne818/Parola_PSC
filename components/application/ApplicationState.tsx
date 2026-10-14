'use client';

import Link from 'next/link';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { useApp } from '@/context/AppContext';
import { DASHBOARD_COPY } from '@/components/dashboard/dashboard-copy';
import { APPLICATION_COPY } from './application-copy';
import styles from './application.module.css';

export function ApplicationLoading() {
  const { language } = useApp();
  return <AuthLayout variant="application"><div className={styles.loading} aria-busy="true" aria-label={DASHBOARD_COPY[language].refreshing}><div className={styles.skeleton} /><div className={styles.skeleton} /><div className={styles.skeleton} /></div></AuthLayout>;
}

export function ApplicationError({ retry }: { retry: () => void }) {
  const { language } = useApp();
  const copy = DASHBOARD_COPY[language];
  return <AuthLayout variant="application"><div className={styles.page}><section className={styles.panel}><h2>{APPLICATION_COPY[language].pageError}</h2><div className={styles.actions}><button type="button" onClick={retry} className={styles.button}>{copy.retry}</button><Link href="/dashboard" className={styles.link}>{copy.dashboard}</Link></div></section></div></AuthLayout>;
}
