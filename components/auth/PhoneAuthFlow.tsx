'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { useRetryAfter } from '@/hooks/use-retry-after';
import { canEnterPhilippineMobile, isValidPhilippineMobile } from '@/lib/philippine-mobile';
import { isClientCoordinate } from '@/lib/frontend/coordinates';
import { requestRegistrationCode, RegistrationClientError } from '@/services/registrationService';
import { PORT_PRESETS } from '@/components/onboarding/home-port';
import { ConsentChoices, useMessagingConsent } from './MessagingConsent';
import styles from './auth.module.css';

export default function PhoneAuthFlow({ mode }: { mode: 'login' | 'register' }) {
  const { isInitialized, isAuthenticated, registration, logout } = useApp();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [requested, setRequested] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const retry = useRetryAfter();
  const pending = useRef(false);
  const codeRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const savedHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (requested) codeRef.current?.focus(); else phoneRef.current?.focus(); }, [requested, isInitialized]);
  useEffect(() => { if (isAuthenticated) savedHeading.current?.focus(); }, [isAuthenticated]);
  useEffect(() => {
    if (error && !busy) (requested ? codeRef : phoneRef).current?.focus();
  }, [error, busy, requested]);
  const seconds = retry.seconds;
  const run = async (action: () => Promise<unknown>) => {
    if (pending.current || retry.isWaiting()) return;
    pending.current = true; setBusy(true); setError(null); setNotice(null);
    try { await action(); }
    catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The request was not confirmed. Try again.');
      if (reason instanceof RegistrationClientError && reason.retryAt) retry.deferUntil(reason.retryAt);
    } finally { pending.current = false; setBusy(false); }
  };
  const requestCode = () => run(async () => {
    if (!isValidPhilippineMobile(phone)) { phoneRef.current?.focus(); throw new Error('Enter a valid Philippine mobile number.'); }
    await requestRegistrationCode(phone);
    setCode(''); setRequested(true);
    setNotice('Code request accepted. Handset delivery has not been confirmed. Enter the code from your SMS; codes are never displayed here.');
  });
  const switchAccount = async () => {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError(null); setNotice(null);
    try {
      if (await logout()) { setRequested(false); setPhone(''); setCode(''); }
    } finally { pending.current = false; setBusy(false); }
  };

  if (!isInitialized) return <p role="status" lang="en">Restoring your Supabase session…</p>;
  return <section lang="en" aria-labelledby="auth-title">
    <p className={styles.hint}>Phone verification and consent are currently available in English.</p>
    {isAuthenticated ? <>
      <div className={styles.heading}><h1 id="auth-title" ref={savedHeading} tabIndex={-1}>Your account is saved</h1><p>Signed in with your verified phone: {registration.profile.phone}.</p></div>
      <p role="status">Your registration is saved. Messaging consent is separate from scheduling, dispatch and SMS delivery.</p>
      {!isClientCoordinate(registration.profile.lat, registration.profile.lng) && <>
        <p role="status">Home-port coordinates are unavailable in this session. Confirm your home port to use location-based map and weather information.</p>
        <Link href="/onboarding?from=profile" className={styles.textButton}>Confirm home port</Link>
      </>}
      <Link href="/dashboard" className={styles.primary}>Continue to dashboard</Link>
      <Link href="/settings#sms" className={styles.textButton}>Manage messaging consent</Link>
    </> : registration.owner ? <RegistrationDetails key={registration.owner.id} /> : registration.profileStatus === 'error' ? <>
      <h1 id="auth-title">Account status unavailable</h1>
      <p role="alert" className={styles.formError}>{registration.sessionError} No account save has been confirmed here.</p>
      <button className={styles.primary} type="button" disabled={busy} onClick={() => void run(registration.reloadRegistration)}>Check saved account</button>
    </> : <>
      <div className={styles.heading}><h1 id="auth-title">{requested ? 'Verify your phone' : mode === 'register' ? 'Create your Parola account' : 'Sign in with an SMS code'}</h1>
        <p>{requested ? `Enter the six-digit code for ${phone}. Phone verification comes before account creation.` : 'Use your own Philippine mobile number. Passwords and assisted registration are unavailable.'}</p></div>
      <form className={styles.form} noValidate aria-busy={busy} onSubmit={(event: FormEvent) => {
        event.preventDefault();
        if (!requested) { void requestCode(); return; }
        void run(async () => { await registration.verifyCode(phone, code); setCode(''); });
      }}>
        {!requested ? <div className={styles.field}>
          <label className={styles.label} htmlFor="auth-phone">Mobile number</label>
          <input ref={phoneRef} id="auth-phone" className={styles.input} type="tel" inputMode="tel" autoComplete="tel" placeholder="09123456789" value={phone} disabled={busy} required aria-invalid={!!error && !isValidPhilippineMobile(phone) || undefined} aria-describedby={`phone-hint${error ? ' phone-auth-error' : ''}`} onChange={event => { if (canEnterPhilippineMobile(event.target.value)) { setPhone(event.target.value); setError(null); } }} />
          <p id="phone-hint" className={styles.hint}>Use 09, 9 or +63 format. Requesting a code may create an Auth identity; your Parola profile is saved separately.</p>
        </div> : <div className={styles.field}>
          <label className={styles.label} htmlFor="auth-code">SMS verification code</label>
          <input ref={codeRef} id="auth-code" className={`${styles.input} ${styles.codeInput}`} type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} disabled={busy} required aria-describedby={`code-hint${error ? ' phone-auth-error' : ''}`} onChange={event => { setCode(event.target.value.replace(/\D/g, '').slice(0, 6)); setError(null); }} />
          <p id="code-hint" className={styles.hint}>Enter all six digits, including leading zeros. An expired, invalid or reused code does not sign you in.</p>
        </div>}
        <button className={styles.primary} disabled={busy || seconds > 0} type="submit">{busy ? 'Please wait…' : requested ? 'Verify code' : 'Request SMS code'}</button>
        {requested && <>
          <button className={styles.textButton} disabled={busy || seconds > 0} type="button" onClick={() => void requestCode()}>Request a new code</button>
          <button className={styles.textButton} disabled={busy} type="button" onClick={() => { setRequested(false); setCode(''); setError(null); setNotice(null); }}>Change phone number</button>
        </>}
      </form>
    </>}
    {seconds > 0 && <p role="status">Wait {seconds} seconds before another attempt.</p>}
    {notice && !registration.owner && <p role="status" className={styles.hint}>{notice}</p>}
    {error && <p id="phone-auth-error" role="alert" className={styles.formError}>{error}</p>}
    {registration.owner || registration.sessionError ? <button type="button" className={styles.textButton} disabled={busy} onClick={() => void switchAccount()}>Sign out / verify another phone</button> : null}
    <p className={styles.hint}>Assisted access is disabled. Verify and manage only your own account.</p>
  </section>;
}

function RegistrationDetails() {
  const { registration, register } = useApp();
  const consent = useMessagingConsent(registration.owner!.id);
  const [name, setName] = useState('');
  const [port, setPort] = useState('');
  const [customName, setCustomName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const retry = useRetryAfter();
  const pending = useRef(false);
  const form = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => { nameRef.current?.focus(); }, []);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (pending.current || !consent.document || retry.isWaiting() || registration.profileStatus !== 'missing') return;
    if (!form.current?.reportValidity()) return;
    if (consent.choice === null) { setError('Choose whether to agree or decline SMS messaging. Either choice allows account creation.'); return; }
    const preset = PORT_PRESETS.find(item => item.name === port);
    const lat = preset?.lat ?? (latitude.trim() ? Number(latitude) : NaN);
    const lng = preset?.lng ?? (longitude.trim() ? Number(longitude) : NaN);
    if (!isClientCoordinate(lat, lng)) { setError('Enter valid numeric home-port coordinates. Zero is allowed.'); return; }
    pending.current = true; setBusy(true); setError(null);
    try {
      await register({ phone_number: registration.owner!.phone!, full_name: name, home_port_name: preset?.name ?? customName,
        latitude: lat, longitude: lng, messaging_consent: consent.choice, consent_version: consent.document.consent_version });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Registration save was not confirmed.');
      if (reason instanceof RegistrationClientError) retry.deferUntil(reason.retryAt);
    } finally { pending.current = false; setBusy(false); }
  };
  return <>
    <div className={styles.heading}><h1 id="auth-title">Complete your registration</h1><p>Your phone is verified. {registration.profileStatus === 'missing' ? 'No linked Parola profile was found.' : 'Saved profile status is not yet confirmed.'}</p></div>
    <form ref={form} className={styles.form} aria-busy={busy} onSubmit={event => void submit(event)}>
      <p>Verified phone: {registration.owner?.phone}</p>
      <div className={styles.field}><label className={styles.label} htmlFor="registration-name">Full name</label><input ref={nameRef} id="registration-name" className={styles.input} autoComplete="name" required maxLength={100} value={name} onChange={event => setName(event.target.value)} disabled={busy} /></div>
      <div className={styles.field}><label className={styles.label} htmlFor="registration-port">Home port</label><select id="registration-port" className={styles.input} required value={port} onChange={event => setPort(event.target.value)} disabled={busy}>
        <option value="">Choose your home port</option>{PORT_PRESETS.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}<option value="custom">Another home port — enter coordinates</option>
      </select><p className={styles.hint}>Port coordinates describe your home port; they do not establish marine suitability or fishing permissions.</p></div>
      {port === 'custom' && <>
        <label className={styles.label} htmlFor="custom-port">Home-port name<input id="custom-port" className={styles.input} required maxLength={100} value={customName} onChange={event => setCustomName(event.target.value)} disabled={busy} /></label>
        <label className={styles.label} htmlFor="port-latitude">Latitude<input id="port-latitude" className={styles.input} required type="number" step="any" min={-90} max={90} value={latitude} onChange={event => setLatitude(event.target.value)} disabled={busy} /></label>
        <label className={styles.label} htmlFor="port-longitude">Longitude<input id="port-longitude" className={styles.input} required type="number" step="any" min={-180} max={180} value={longitude} onChange={event => setLongitude(event.target.value)} disabled={busy} /></label>
      </>}
      {consent.busy && <p role="status">Loading current messaging consent…</p>}
      {consent.document && <ConsentChoices document={consent.document} choice={consent.choice} onChange={consent.setChoice} disabled={busy} />}
      {consent.error && <p role="alert" className={styles.formError}>{consent.error}</p>}
      {consent.seconds > 0 && <p role="status">Wait {consent.seconds} seconds before reloading consent.</p>}
      <button type="button" className={styles.textButton} disabled={busy || consent.busy || consent.seconds > 0} onClick={() => void consent.reload()}>Reload current consent</button>
      {error && <p role="alert" className={styles.formError}>{error} No saved success is confirmed. Check the saved account for a duplicate or a lost response; reload consent for a version conflict. Your entries remain unsaved in this form.</p>}
      {registration.sessionError && <p role="alert" className={styles.formError}>{registration.sessionError}</p>}
      {registration.profileStatus === 'loading' && <p role="status">Checking saved account…</p>}
      {retry.seconds > 0 && <p role="status">Wait {retry.seconds} seconds before retrying registration.</p>}
      <button type="button" className={styles.textButton} disabled={busy} onClick={() => void registration.reloadRegistration().catch(reason => setError(reason instanceof Error ? reason.message : 'Account read failed.'))}>Check saved account</button>
      <button className={styles.primary} type="submit" disabled={busy || consent.busy || !consent.document || consent.choice === null || retry.seconds > 0 || registration.profileStatus !== 'missing'}>{busy ? 'Saving registration…' : 'Create account'}</button>
      <p className={styles.hint}>No licence or municipal identifier is generated or required. Advisory scheduling is outside this registration step.</p>
    </form>
  </>;
}
