import styles from './workspace.module.css';

export default function PreferenceNotice({ notice, retry }: { notice: string | null; retry: () => void }) {
  return notice ? <div className={styles.notice} role="status"><p>{notice}</p><button type="button" className={styles.secondary} onClick={retry}>Retry browser storage</button></div> : null;
}
