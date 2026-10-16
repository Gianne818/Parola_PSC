'use client';

import { useRef, useState, type FormEvent } from 'react';
import type { AdvisoryPreferences } from '@/types';
import { describeSampleDays, initialSamplePreferences, PREFERENCE_LANGUAGES, validateSamplePreferences, WEEKDAYS, type PreferenceField } from './advisory-preferences-demo';
import styles from './advisory-preferences-demo.module.css';

const fieldIds: Record<PreferenceField, string> = {
  advisory_days: 'preference-day-1', preferred_advisory_time: 'preference-time',
  preferred_language: 'preference-language', habitat_preference: 'preference-habitat',
};

export default function AdvisoryPreferencesDemo() {
  const [draft, setDraft] = useState(initialSamplePreferences);
  const [saved, setSaved] = useState<AdvisoryPreferences | null>(null);
  const [failNextSave, setFailNextSave] = useState(false);
  const [error, setError] = useState<{ field?: PreferenceField; message: string } | null>(null);
  const [notice, setNotice] = useState('');
  const resultRef = useRef<HTMLHeadingElement>(null);
  const baseline = saved ?? initialSamplePreferences();
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);

  function change<K extends PreferenceField>(field: K, value: AdvisoryPreferences[K]) {
    setDraft(current => ({ ...current, [field]: value }));
    setError(null);
    setNotice('');
  }

  function save(event: FormEvent) {
    event.preventDefault();
    setNotice('');
    const validation = validateSamplePreferences(draft);
    if (!validation.ok) {
      setError(validation);
      document.getElementById(fieldIds[validation.field])?.focus();
      return;
    }
    if (failNextSave) {
      setFailNextSave(false);
      setError({ message: 'Simulated save failure. Your draft is retained and the memory-only saved sample is unchanged. Retry when ready; no request was sent.' });
      return;
    }
    setSaved(validation.value);
    setDraft({ ...validation.value, advisory_days: [...validation.value.advisory_days] });
    setError(null);
    setNotice('Simulated save complete in memory only. No real preferences were persisted, enrollment activated or SMS scheduled.');
    resultRef.current?.focus();
  }

  function reloadSample() {
    const sample = saved ?? initialSamplePreferences();
    setDraft({ ...sample, advisory_days: [...sample.advisory_days] });
    setError(null);
    setNotice(saved ? 'Draft discarded. Reloaded the last memory-only simulated save; no server was read.' : 'Draft discarded. Restored synthetic contract defaults; no saved preferences exist.');
  }

  function reset() {
    setDraft(initialSamplePreferences()); setSaved(null); setFailNextSave(false); setError(null);
    setNotice('Demo reset. All sample edits and simulated saves were discarded. No account or real preference was changed.');
  }

  const fieldError = (field: PreferenceField) => error?.field === field;
  return <main className={styles.page} lang="en">
    <div className={styles.content}>
      <p className={styles.eyebrow}>PAROLA · DISCONNECTED FRONTEND DEMO</p>
      <h1>Advisory preferences demo</h1>
      <aside className={styles.banner} aria-label="Demonstration limits">
        <strong>Synthetic account: Sample Fisher · Preferences fixture</strong>
        <p>No sign-in, verified contact or consent is established here. Nothing is sent to Auth, an API, an SMS provider or a database. This demo cannot open protected account data.</p>
        <p>Edits and simulated saves stay in this page&apos;s memory. Refreshing, leaving or closing this page discards them. Initial values are published new-account defaults, not anyone&apos;s saved profile.</p>
      </aside>
      <form noValidate onSubmit={save}>
        <fieldset aria-describedby={`preference-days-help preference-day-count${fieldError('advisory_days') ? ' preference-error' : ''}`} aria-invalid={fieldError('advisory_days') || undefined}>
          <legend>Routine advisory weekdays</legend>
          <p id="preference-days-help">Choose 0–5 distinct days. Selecting zero pauses routine advisories in this sample.</p>
          <p id="preference-day-count" role="status" aria-atomic="true">{draft.advisory_days.length} of 5 weekdays selected. {draft.advisory_days.length === 0 ? 'Routine advisories paused in this sample.' : 'Sample weekdays only; no delivery is scheduled.'}</p>
          <div className={styles.days}>
            {WEEKDAYS.map(day => <label className={styles.choice} key={day.value}>
              <input type="checkbox" id={`preference-day-${day.value}`} checked={draft.advisory_days.includes(day.value)}
                aria-describedby={fieldError('advisory_days') ? 'preference-error' : undefined}
                aria-invalid={fieldError('advisory_days') || undefined}
                onChange={event => {
                  if (event.target.checked && draft.advisory_days.length === 5) {
                    setError({ field: 'advisory_days', message: 'Five weekdays are already selected. Deselect one before choosing another; a sixth day was not added.' });
                    setNotice(''); return;
                  }
                  change('advisory_days', event.target.checked ? [...draft.advisory_days, day.value].sort((a, b) => a - b) : draft.advisory_days.filter(value => value !== day.value));
                }} />{day.label}
            </label>)}
          </div>
          <button type="button" onClick={() => change('advisory_days', [])}>Clear weekdays (pause sample)</button>
        </fieldset>
        <label htmlFor="preference-time">Advisory time — Asia/Manila (UTC+08:00)</label>
        <input id="preference-time" type="time" step="1" required value={draft.preferred_advisory_time}
          aria-invalid={fieldError('preferred_advisory_time') || undefined}
          aria-describedby={`preference-time-help${fieldError('preferred_advisory_time') ? ' preference-error' : ''}`}
          onChange={event => change('preferred_advisory_time', event.target.value)} />
        <p id="preference-time-help">Any local time from 00:00:00 to 23:59:59. Seconds are supported. The published new-account default is 05:00:00. This is Manila time regardless of your device&apos;s timezone.</p>
        <label htmlFor="preference-language">Advisory language preference</label>
        <select id="preference-language" value={draft.preferred_language} aria-describedby={`preference-language-help${fieldError('preferred_language') ? ' preference-error' : ''}`}
          aria-invalid={fieldError('preferred_language') || undefined} onChange={event => change('preferred_language', event.target.value as AdvisoryPreferences['preferred_language'])}>
          {PREFERENCE_LANGUAGES.map(language => <option key={language.value} value={language.value}>{language.label} ({language.value})</option>)}
        </select>
        <p id="preference-language-help">{draft.preferred_language === 'en' ? 'English sample wording.' : 'English fallback shown for this regional language preference.'} This editor stays in English. No reviewed regional translation or SMS language coverage is claimed; the portal&apos;s device language is unchanged.</p>
        <label htmlFor="preference-habitat">Habitat preference</label>
        <select id="preference-habitat" value={draft.habitat_preference} aria-describedby={`preference-habitat-help${fieldError('habitat_preference') ? ' preference-error' : ''}`}
          aria-invalid={fieldError('habitat_preference') || undefined} onChange={event => change('habitat_preference', event.target.value as AdvisoryPreferences['habitat_preference'])}>
          <option value="pelagic">Pelagic</option><option value="demersal">Demersal</option><option value="both">Both habitats</option>
        </select>
        <p id="preference-habitat-help">A preference does not establish fishing suitability, target availability or marine entitlement. Ranking controls await approved rules.</p>
        <aside className={styles.banner} aria-label="Critical alerts are independent">
          <strong>Critical alerts are independent of selected weekdays.</strong>
          <p>Pausing routine advisories does not pause critical alerts. In a live service, eligible critical alerts may arrive any day; verification, consent, safety and dispatch checks still apply. This demo enrolls nobody and sends nothing.</p>
        </aside>
        <p>{dirty ? 'Unsaved sample edits. Reload sample discards this draft.' : 'No unsaved sample edits.'} A browser refresh resets the entire demonstration.</p>
        <label className={styles.choice}><input type="checkbox" id="preference-fail" checked={failNextSave} onChange={event => setFailNextSave(event.target.checked)} />Simulate failure on the next valid save (demo only)</label>
        <p id="preference-error" role="alert" aria-atomic="true" className={styles.error}>{error?.message}</p>
        <div className={styles.actions}>
          <button className={styles.primary} type="submit">Simulate saving preferences</button>
          <button type="button" onClick={reloadSample}>Reload sample / discard draft</button>
          <button type="button" onClick={reset}>Reset demo and discard all</button>
        </div>
      </form>
      <p role="status" aria-atomic="true">{notice}</p>
      <section aria-labelledby="preference-result">
        <h2 id="preference-result" ref={resultRef} tabIndex={-1}>Memory-only simulated save</h2>
        {saved ? <dl>
          <dt>Sample weekdays</dt><dd>{describeSampleDays(saved.advisory_days)}</dd>
          <dt>Sample Manila time</dt><dd>{saved.preferred_advisory_time} · Asia/Manila (UTC+08:00)</dd>
          <dt>Sample language preference</dt><dd>{PREFERENCE_LANGUAGES.find(language => language.value === saved.preferred_language)?.label} · English sample / fallback; translations unreviewed</dd>
          <dt>Sample habitat</dt><dd>{saved.habitat_preference}</dd>
        </dl> : <p>No simulated save yet. The form contains synthetic defaults only.</p>}
        <p>No persisted preferences or active enrollment. Next routine time unavailable here; no server schedule was requested or calculated.</p>
      </section>
    </div>
  </main>;
}
