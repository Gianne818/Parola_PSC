'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRetryAfter } from '@/hooks/use-retry-after';
import { useApp } from '@/context/AppContext';
import { loadMessagingConsent, saveMessagingConsent, RegistrationClientError, type ConsentDocument } from '@/services/registrationService';
import styles from './auth.module.css';

export function useMessagingConsent(ownerId: string) {
  const [document, setDocument] = useState<ConsentDocument | null>(null);
  const [choice, setChoice] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { seconds, deferUntil, isWaiting } = useRetryAfter();
  const revision = useRef(0);
  const reload = useCallback(async () => {
    if (isWaiting()) return;
    const current = ++revision.current;
    setBusy(true); setError(null); setDocument(null); setChoice(null);
    try {
      const result = await loadMessagingConsent(ownerId);
      if (current === revision.current) { setDocument(result); setChoice(result.consent?.messaging_consent ?? null); }
    } catch (reason) {
      if (current === revision.current) {
        setError(reason instanceof Error ? reason.message : 'Consent could not be loaded.');
        if (reason instanceof RegistrationClientError) deferUntil(reason.retryAt);
      }
    } finally { if (current === revision.current) setBusy(false); }
  }, [deferUntil, isWaiting, ownerId]);
  // Initial load only; a rate-limit response must never trigger an automatic retry.
  useEffect(() => {
    let active = true;
    const generation = revision;
    queueMicrotask(() => { if (active) void reload(); });
    return () => { active = false; ++generation.current; };
  }, [reload]);
  return { document, choice, setChoice, error, busy, reload, seconds };
}

export function ConsentChoices({ document, choice, onChange, disabled = false }: {
  document: ConsentDocument; choice: boolean | null; onChange: (value: boolean) => void; disabled?: boolean;
}) {
  return <fieldset className={styles.consent} disabled={disabled} aria-describedby="messaging-consent-text">
    <legend>SMS messaging consent</legend>
    <p id="messaging-consent-text">{document.consent_text}</p>
    <label><input type="radio" name="messaging-consent" checked={choice === true} onChange={() => onChange(true)} />I agree to SMS advisories and safety alerts.</label>
    <label><input type="radio" name="messaging-consent" checked={choice === false} onChange={() => onChange(false)} />I decline SMS messaging. I can still create and use my account.</label>
    <p className={styles.hint}>Consent does not confirm a schedule, dispatch or delivery. Sponsor messages and assisted access are disabled.</p>
  </fieldset>;
}

export function MessagingConsentSettings() {
  const { registration } = useApp();
  return registration?.owner ? <OwnerMessagingConsent key={registration.owner.id} ownerId={registration.owner.id} />
    : <p lang="en">Verify your own phone to manage messaging consent.</p>;
}

function OwnerMessagingConsent({ ownerId }: { ownerId: string }) {
  const consent = useMessagingConsent(ownerId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const retry = useRetryAfter();
  const pending = useRef(false);
  const save = async () => {
    if (pending.current || !consent.document || consent.choice === null || retry.isWaiting()) return;
    pending.current = true; setSaving(true); setError(null); setSaved(null);
    try {
      const result = await saveMessagingConsent(consent.choice, consent.document.consent_version, ownerId);
      setSaved(result.messaging_consent ? 'Messaging consent saved by the server. Scheduling and delivery are separate.'
        : 'Messaging consent withdrawn. Your account is kept. An already submitted SMS cannot be recalled.');
      await consent.reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Consent save was not confirmed.');
      if (reason instanceof RegistrationClientError) retry.deferUntil(reason.retryAt);
    } finally { pending.current = false; setSaving(false); }
  };
  return <div lang="en" className={styles.consentSettings}>
    <p className={styles.hint}>Messaging controls are currently available in English.</p>
    {consent.busy && <p role="status">Loading current consent…</p>}
    {consent.document && <>
      <p>Saved messaging choice: {consent.document.consent ? (consent.document.consent.messaging_consent ? 'agreed' : 'declined / withdrawn') : 'not recorded'}.</p>
      <ConsentChoices document={consent.document} choice={consent.choice} onChange={value => { consent.setChoice(value); setSaved(null); }} disabled={saving} />
      <button type="button" className={styles.primary} disabled={saving || consent.busy || consent.choice === null || retry.seconds > 0} onClick={() => void save()}>{saving ? 'Saving consent…' : 'Save messaging choice'}</button>
    </>}
    {(error || consent.error) && <p role="alert" className={styles.formError}>{error || consent.error} No new saved choice is confirmed. For a conflict, reload the current consent and choose again.</p>}
    {(retry.seconds > 0 || consent.seconds > 0) && <p role="status">Wait {Math.max(retry.seconds, consent.seconds)} seconds before retrying.</p>}
    <button type="button" className={styles.textButton} disabled={saving || consent.busy || consent.seconds > 0} onClick={() => { setError(null); setSaved(null); void consent.reload(); }}>Reload current consent</button>
    {saved && <p role="status">{saved}</p>}
  </div>;
}
