'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Anchor, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import GeographicAccessStatus from '@/components/predictions/GeographicAccessStatus';
import CurrentPredictionExport from '@/components/predictions/CurrentPredictionExport';
import Advisory, { WeatherDetails } from '@/components/dashboard/Advisory';
import { DASHBOARD_COPY } from '@/components/dashboard/dashboard-copy';
import { useDashboardClock, useDashboardData } from '@/components/dashboard/use-dashboard-data';
import { PHILIPPINE_REGIONS, detectPhilippineRegion } from '@/data/philippineRegions';
import { advisoryState } from '@/lib/dashboard';
import { AreaLoadError } from '@/lib/frontend/prediction-presentation';
import { PLAN_IDS, PLANS, workspacePath, type PlanId } from '@/lib/frontend/workspace-preferences';
import { useWorkspacePreferences } from './use-workspace-preferences';
import PreferenceNotice from './PreferenceNotice';
import styles from './workspace.module.css';

export default function PlanWorkspace({ plan }: { plan: PlanId }) {
  const { isInitialized, isAuthenticated, userProfile } = useApp();
  return <AuthLayout variant="application">{isInitialized && isAuthenticated && userProfile.id
    ? <AccountWorkspace key={userProfile.id} plan={plan} />
    : <p role="status">A persisted account is required. <Link href="/login">Sign in</Link></p>}</AuthLayout>;
}

function AccountWorkspace({ plan }: { plan: PlanId }) {
  const { userProfile, language, manualOverrideHold } = useApp();
  const { snapshot, retry } = useWorkspacePreferences();
  const [weatherOpen, setWeatherOpen] = useState(false);
  const now = useDashboardClock();
  const region = useMemo(() => PHILIPPINE_REGIONS.find(item => item.id === userProfile.regionId)
    || detectPhilippineRegion(userProfile.lat, userProfile.lng, userProfile.port), [userProfile.regionId, userProfile.lat, userProfile.lng, userProfile.port]);
  const { weather, areas } = useDashboardData(userProfile.lat, userProfile.lng, region.id, '');
  const state = advisoryState(weather.data, manualOverrideHold, weather.failed, now);
  const copy = DASHBOARD_COPY[language];
  const preferred = snapshot?.preferences.preferredPlan;
  const tier = PLANS[plan];
  const coverage = areas.error instanceof AreaLoadError ? areas.error.geography : areas.data?.coverage?.geography;
  return <div className={styles.workspace} lang="en">
    <section className={styles.welcome} aria-labelledby="workspace-title">
      <div className={styles.eyebrow}><Anchor size={17} aria-hidden="true" />{plan === 'municipal' ? 'Municipal · free' : 'Commercial proposal · plan interest'}</div>
      <h2 id="workspace-title">{tier.name} workspace</h2>
      <p className={styles.lead}>{snapshot?.preferences.nickname ? `Welcome aboard, ${snapshot.preferences.nickname}.` : 'Welcome aboard.'} {tier.description}</p>
      <div className={styles.actions}><Link className={styles.primary} href="/dashboard">Open home-port guidance<ArrowRight size={17} aria-hidden="true" /></Link><Link className={styles.secondary} href="/workspace/preferences">Edit nickname &amp; plan interest</Link></div>
    </section>
    <PreferenceNotice notice={snapshot?.notice ?? null} retry={retry} />
    <nav className={styles.workspaceTabs} aria-label="Workspace views">{PLAN_IDS.map(id => <Link key={id} href={workspacePath(id)} aria-current={plan === id ? 'page' : undefined}>{PLANS[id].name}</Link>)}</nav>
    <div className={styles.overview}>
      <section className={styles.scope} aria-labelledby="scope-title"><span className={styles.eyebrow}>{plan === 'municipal' ? 'Home-port guidance' : 'Proposed scope'}</span><h3 id="scope-title">{tier.scope}</h3><p>{userProfile.port || 'Home port unavailable'} · {region.name}</p>
        {plan !== 'municipal' && <><p className={styles.price}>{tier.price}<span className={styles.billing}> / month / vessel · proposed</span></p><p>This is a plan-interest workspace, not an active subscription. Scope is proposal information; no radius enforcement, FMA selection, EEZ grant or verified eligibility is provided.</p></>}
        <p>{preferred ? `Your browser preference: ${PLANS[preferred].name}${preferred === 'municipal' ? ' (free)' : ' plan interest'}.` : 'Loading browser preference…'} Opening a workspace URL does not change your preference or authorize access.</p>
        <Link href="/onboarding?from=profile">Edit home port</Link>
      </section>
      <section className={styles.scope} aria-labelledby="current-title"><span className={styles.eyebrow}>Available current data</span><h3 id="current-title">Check the conditions first.</h3><p>Use the dashboard for existing safety warnings, model estimates and ocean-current flow visualization. Model estimates are unverified; neither plan interest nor data availability is fishing permission.</p><Link href="/dashboard">View dashboard and current flow<ArrowRight size={16} aria-hidden="true" /></Link></section>
    </div>
    <Advisory data={weather.data} state={state} loading={weather.loading} failed={weather.failed} refresh={weather.refresh} openDetails={() => setWeatherOpen(value => !value)} copy={copy} language={language} />
    {weatherOpen && <section className={styles.scope} aria-label="Weather evidence"><WeatherDetails data={weather.data} state={state} copy={copy} language={language} /></section>}
    <section className={styles.data} aria-labelledby="workspace-data"><div className={styles.sectionTitle}><h3 id="workspace-data">Current predictions &amp; GeoJSON</h3><button className={styles.secondary} type="button" disabled={areas.loading} onClick={areas.refresh}>Refresh coverage</button></div>
      <p>Downloads require internet and available, authorized data. Saved GeoJSON can be used afterward with compatible software. It does not include offline basemap tiles.</p>
      {areas.failed && <p role="status">{areas.error?.message || 'Current data could not be loaded. Retry when connected.'}</p>}
      <GeographicAccessStatus coverage={coverage} loading={areas.loading} failed={areas.failed} />
      <CurrentPredictionExport query={{ lat: userProfile.lat, lng: userProfile.lng, regionId: region.id, habitat: 'both', species: '' }} regionName={region.name} />
      <p className={styles.storageNote}>Every workspace uses the same server account and geographic checks. Daily zone locks, quotas, re-download windows, forecast horizons, GPX/KML exports and device certification are unavailable. Checkout, payments and fleet workspaces are not offered here.</p>
    </section>
  </div>;
}
