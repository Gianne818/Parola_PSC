import styles from '@/components/dashboard/dashboard.module.css';

export default function Loading() {
  return <div className={styles.loadingShell} aria-busy="true" aria-label="Loading dashboard">
    <aside className={styles.loadingSidebar} aria-hidden="true"><div className={styles.loadingLogo} /><div className={styles.loadingNavRow} /><div className={styles.loadingNavRow} /><div className={styles.loadingNavRow} /><div className={styles.loadingNavRow} /></aside>
    <div className={styles.loadingMain} aria-hidden="true"><div className={styles.loadingHeader}><div className={styles.loadingLogo} /></div>
      <div className={styles.loadingBody}><div className={styles.loadingAdvisory} /><div className={styles.loadingWorkspace}><div className={styles.loadingMap} /><div className={styles.loadingInspector}><div className={styles.loadingNavRow} /><div className={styles.loadingNavRow} /><div className={styles.loadingNavRow} /></div></div></div>
    </div>
  </div>;
}
