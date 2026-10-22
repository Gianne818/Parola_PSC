'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Anchor, ArrowRight } from 'lucide-react';
import { ParolaLogo } from '@/components/ui/ParolaLogo';
import { useApp } from '@/context/AppContext';
import { normalizeNickname, PLAN_IDS, PLANS, workspacePath, type PlanId } from '@/lib/frontend/workspace-preferences';
import { useWorkspacePreferences } from './use-workspace-preferences';
import PreferenceNotice from './PreferenceNotice';
import styles from './workspace.module.css';

export default function PreferenceFlow({ editing = false }: { editing?: boolean }) {
  const { isInitialized, isAuthenticated, userProfile } = useApp();
  const router = useRouter();
  useEffect(() => {
    if (isInitialized && !isAuthenticated) router.replace('/login');
  }, [isInitialized, isAuthenticated, router]);
  if (!isInitialized || !isAuthenticated) return <p role="status">Loading account preferences…</p>;
  if (!userProfile.id) return <p role="alert">Sign in with your registered account to set workspace preferences. <Link href="/login">Sign in</Link></p>;
  return <AccountPreferenceFlow key={`${userProfile.id}:${editing}`} editing={editing} />;
}

function AccountPreferenceFlow({ editing }: { editing: boolean }) {
  const { snapshot, save, retry } = useWorkspacePreferences();
  const { userProfile } = useApp();
  const router = useRouter();
  const [step, setStep] = useState<'plan' | 'nickname'>('plan');
  const [nickname, setNickname] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const ready = snapshot !== null;
  useEffect(() => { heading.current?.focus(); }, [step, ready]);
  const complete = snapshot?.preferences.onboardingCompleted;
  const preferredPlan = snapshot?.preferences.preferredPlan;
  useEffect(() => {
    if (!editing && complete && preferredPlan) router.replace(workspacePath(preferredPlan));
  }, [editing, complete, preferredPlan, router]);
  if (!snapshot) return <p role="status">Loading browser preferences…</p>;
  if (!editing && complete) return <p role="status">Opening your workspace…</p>;
  const choose = (preferredPlan: PlanId) => {
    save({ preferredPlan, browserNoticeSeen: true });
    setStep('nickname');
  };
  const finish = (skip: boolean) => {
    try {
      const next = save({ nickname: skip ? '' : normalizeNickname(nickname ?? snapshot.preferences.nickname), onboardingCompleted: true });
      router.push(workspacePath(next.preferences.preferredPlan));
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Check your nickname and try again.'); }
  };
  return <div className={styles.page} lang="en">
    <header className={styles.flowHeader}><Link href="/dashboard" className={styles.brand} aria-label="Parola"><ParolaLogo iconOnly className="h-8 w-8" /><span>Parola</span></Link>
      <Link href={workspacePath(snapshot.preferences.preferredPlan)}>{editing ? 'Back to workspace' : 'Go to workspace'}</Link></header>
    <main className={styles.flow}>
      <div className={styles.eyebrow}><Anchor size={17} aria-hidden="true" />{editing ? 'Workspace preferences' : 'Welcome aboard'}</div>
      <ol className={styles.steps} aria-label="Welcome progress"><li>Home port saved</li><li aria-current={step === 'plan' ? 'step' : undefined}>Plan interest</li><li aria-current={step === 'nickname' ? 'step' : undefined}>Nickname</li></ol>
      <h1 ref={heading} tabIndex={-1}>{step === 'plan' ? 'A workspace for your next trip.' : 'What should we call you?'}</h1>
      <p className={styles.lead}>{step === 'plan' ? 'Start with Municipal, or register interest in a commercial proposal. You can change your preference later.' : 'Add an optional personal nickname. Your vessel name and account name stay as they are.'}</p>
      {!snapshot.preferences.browserNoticeSeen && <p className={styles.storageNote}>Saved for this account in this browser.</p>}
      <PreferenceNotice notice={snapshot.notice} retry={retry} />
      {step === 'plan' ? <>
        <div className={styles.plans}>{PLAN_IDS.map(id => <section key={id} className={styles.plan} aria-labelledby={`plan-${id}`}>
          <span className={styles.eyebrow}>{id === 'municipal' ? 'Start here' : 'Plan interest'}</span>
          <h2 id={`plan-${id}`}>{PLANS[id].name}</h2><p className={styles.price}>{PLANS[id].price}</p>
          <p className={styles.billing}>{id === 'municipal' ? 'Municipal workspace' : 'per month per vessel · proposed'}</p>
          <p>{PLANS[id].description}</p><button type="button" className={styles.secondary} onClick={() => choose(id)} aria-label={id === 'municipal' ? 'Choose Municipal' : `Register interest in ${PLANS[id].name}`}>{id === 'municipal' ? 'Choose Municipal' : 'Register interest'}<ArrowRight size={16} aria-hidden="true" /></button>
        </section>)}</div>
        <p className={styles.storageNote}>Commercial interest does not activate a subscription, payment, vessel verification or geographic access.</p>
        <button className={styles.primary} type="button" onClick={() => choose('municipal')}>Skip for now<ArrowRight size={17} aria-hidden="true" /></button>
      </> : <form onSubmit={event => { event.preventDefault(); finish(false); }} className={styles.nickname} noValidate>
        <label htmlFor="workspace-nickname">Personal nickname <span>(optional)</span></label>
        <input id="workspace-nickname" autoComplete="nickname" value={nickname ?? snapshot.preferences.nickname} onChange={event => { setNickname(event.target.value); setError(null); }} aria-invalid={Boolean(error)} aria-describedby={`nickname-hint${error ? ' nickname-error' : ''}`} />
        <p id="nickname-hint">Up to 50 characters. No control characters. Only used for your welcome in this browser.</p>
        {error && <p role="alert" id="nickname-error" className={styles.error}>{error}</p>}
        <p>Open the {PLANS[snapshot.preferences.preferredPlan].name} workspace for {userProfile.port || 'your home port'}.</p>
        <div className={styles.actions}><button type="submit" className={styles.primary}>Open my workspace<ArrowRight size={17} aria-hidden="true" /></button><button type="button" className={styles.secondary} onClick={() => finish(true)}>Skip nickname</button><button type="button" className={styles.textButton} onClick={() => setStep('plan')}>Back to plans</button></div>
      </form>}
    </main>
  </div>;
}
