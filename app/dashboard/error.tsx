'use client';

import { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { DASHBOARD_COPY } from '@/components/dashboard/dashboard-copy';
import styles from '@/components/dashboard/dashboard.module.css';

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { language } = useApp();
  const copy = DASHBOARD_COPY[language];
  useEffect(() => { console.error(error); }, [error]);
  return <div className={styles.standalone}><div><h2>{copy.pageError}</h2><p>{copy.pageErrorDescription}</p>
    <button type="button" className={styles.primary} onClick={retry}>{copy.retry}</button>
  </div></div>;
}
