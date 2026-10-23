'use client';

import Link from 'next/link';
import { PLANS } from '@/lib/frontend/workspace-preferences';
import { useWorkspacePreferences } from './use-workspace-preferences';
import styles from '@/components/application/application.module.css';

export default function WorkspaceSettings() {
  const { snapshot, retry } = useWorkspacePreferences();
  const preferences = snapshot?.preferences;
  return <section id="workspace-preferences" className={styles.settingsSection} aria-labelledby="workspace-preferences-heading" lang="en">
    <div className={styles.panelHeading}><h2 id="workspace-preferences-heading">Nickname &amp; plan interest</h2></div>
    <p className={styles.muted}>Choose how you’re greeted and which workspace to open. Commercial choices record interest only.</p>
    {preferences ? <dl className={styles.details}>
      <div><dt>Personal nickname</dt><dd>{preferences.nickname || 'Not set'}</dd></div>
      <div><dt>Preferred workspace</dt><dd>{PLANS[preferences.preferredPlan].name}{preferences.preferredPlan === 'municipal' ? ' · free' : ' · plan interest'}</dd></div>
    </dl> : <p role="status">Loading browser preferences…</p>}
    <div className={styles.actions}><Link href="/workspace" className={styles.button}>Open workspace</Link><Link href="/workspace/preferences" className={styles.link}>Edit nickname &amp; plan interest</Link></div>
    {snapshot?.notice ? <div role="status"><p className={styles.small}>{snapshot.notice}</p><button type="button" className={styles.link} onClick={retry}>Retry browser storage</button></div>
      : <p className={styles.small}>Saved for this account in this browser. This does not activate a subscription or geographic access.</p>}
  </section>;
}
