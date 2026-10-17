'use client';

import { useRef, useState, type FormEvent } from 'react';
import type { AdvisoryPreferences, AdvisorySchedule, AdvisoryWeekday, Language } from '@/types';
import { validatePreferences } from '@/lib/frontend/profile-client';
import styles from '@/components/application/application.module.css';
import formStyles from './preferences.module.css';

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const languages: [Language, string][] = [['en', 'English'], ['tl', 'Tagalog'], ['ceb', 'Cebuano'], ['hil', 'Hiligaynon']];
const preferenceFields = (value: AdvisoryPreferences): AdvisoryPreferences => ({
  advisory_days: [...value.advisory_days], preferred_advisory_time: value.preferred_advisory_time,
  preferred_language: value.preferred_language, habitat_preference: value.habitat_preference,
});

interface Props {
  schedule: AdvisorySchedule | null;
  save: (preferences: AdvisoryPreferences) => Promise<AdvisorySchedule>;
  reload: () => Promise<AdvisorySchedule | null>;
}

export default function AdvisoryPreferencesEditor({ schedule, save, reload }: Props) {
  const [saved, setSaved] = useState(schedule);
  const [draft, setDraft] = useState(() => schedule ? preferenceFields(schedule) : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const pending = useRef(false);
  const dirty = Boolean(draft && saved && JSON.stringify(draft) !== JSON.stringify(preferenceFields(saved)));

  const edit = (patch: Partial<AdvisoryPreferences>) => {
    setDraft(current => current ? { ...current, ...patch } : null);
    setError(null);
    setNotice('');
  };
  const toggleDay = (day: AdvisoryWeekday) => {
    if (!draft) return;
    const days = draft.advisory_days.includes(day) ? draft.advisory_days.filter(value => value !== day)
      : [...draft.advisory_days, day].sort((a, b) => a - b);
    if (days.length > 5) { setError('Choose up to five different weekdays. Remove a day before adding another.'); return; }
    edit({ advisory_days: days });
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft || pending.current || !dirty) return;
    const invalid = validatePreferences(draft);
    if (invalid) { setError(invalid); return; }
    pending.current = true; setBusy(true); setError(null); setNotice('');
    try {
      const confirmed = await save(preferenceFields(draft));
      setSaved(confirmed); setDraft(preferenceFields(confirmed));
      setNotice('Preferences saved and confirmed by the server.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Preferences could not be confirmed. Your draft has been kept.');
    } finally { pending.current = false; setBusy(false); }
  };
  const reloadSaved = async () => {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError(null); setNotice('');
    try {
      const confirmed = await reload();
      setSaved(confirmed); setDraft(confirmed ? preferenceFields(confirmed) : null);
      setNotice(confirmed ? 'Saved preferences reloaded.' : 'Saved preferences are unavailable. No defaults have been saved.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Saved details could not be loaded. Your draft has been kept.');
    } finally { pending.current = false; setBusy(false); }
  };

  return <section id="advisory-preferences" className={styles.settingsSection} lang="en" aria-labelledby="advisory-preferences-heading">
    <div className={styles.panelHeading}><h2 id="advisory-preferences-heading">Routine advisory preferences</h2></div>
    <p className={styles.muted}>Choose up to five weekdays, or clear every day to pause routine messages. Critical warnings have separate eligibility and may arrive any day.</p>
    {!draft ? <p className={formStyles.notice} role="status">Saved preferences are unavailable. Reload them before editing; no schedule has been assumed.</p> :
      <form onSubmit={event => void submit(event)} aria-busy={busy} aria-label="Routine advisory preferences" noValidate>
        <fieldset className={formStyles.fields} disabled={busy}>
          <legend>Routine weekdays <span>({draft.advisory_days.length}/5 selected)</span></legend>
          <div className={formStyles.weekdays}>{weekdays.map((name, index) => <label key={name}>
            <input type="checkbox" checked={draft.advisory_days.includes((index + 1) as AdvisoryWeekday)}
              onChange={() => toggleDay((index + 1) as AdvisoryWeekday)} aria-describedby="schedule-help" />{name}
          </label>)}</div>
          <p id="schedule-help" className={styles.small}>{draft.advisory_days.length ? 'Changes affect future unsent advisories; there is no edit cutoff.' : 'Draft: routine messages paused. Save to apply this choice.'}</p>
          <div className={styles.preferenceFields}>
            <label className={styles.field}>Advisory time (Asia/Manila)<input className={styles.input} type="time" step="1" required
              value={draft.preferred_advisory_time} onChange={event => edit({ preferred_advisory_time: event.target.value })} /></label>
            <label className={styles.field}>Message language<select className={styles.select} value={draft.preferred_language}
              onChange={event => edit({ preferred_language: event.target.value as Language })}>{languages.map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select></label>
            <label className={styles.field}>Fish habitat<select className={styles.select} value={draft.habitat_preference}
              onChange={event => edit({ habitat_preference: event.target.value as AdvisoryPreferences['habitat_preference'] })}>
              <option value="pelagic">Pelagic (surface)</option><option value="demersal">Demersal (bottom)</option><option value="both">Both habitats</option>
            </select></label>
          </div>
          <p className={formStyles.notice}>Portal language and text size below change this device immediately. Message language is saved separately; current advisory messages use English fallback and regional translations are not yet reviewed.</p>
          <div className={styles.actions}>
            <button className={styles.primary} type="submit" disabled={!dirty}>{busy ? 'Saving…' : 'Save advisory preferences'}</button>
            <button className={styles.button} type="button" disabled={!dirty} onClick={() => { setDraft(saved ? preferenceFields(saved) : null); setError(null); setNotice('Draft discarded. Showing the last confirmed preferences.'); }}>Discard draft</button>
          </div>
        </fieldset>
      </form>}
    <div className={styles.actions}><button type="button" className={styles.button} disabled={busy} onClick={() => void reloadSaved()}>{busy ? 'Please wait…' : dirty ? 'Reload saved preferences (discard draft)' : 'Reload saved preferences'}</button></div>
    {error && <p className={formStyles.error} role="alert">{error}</p>}
    <p className={formStyles.notice} role="status">{notice || (dirty ? 'Unsaved changes. Your saved schedule is unchanged.' : busy ? 'Waiting for the server…' : '')}</p>
    {saved && <dl className={styles.details} aria-label="Last confirmed schedule">
      <div><dt>Saved routine schedule</dt><dd>{saved.routine_paused ? 'Paused' : `${saved.advisory_days.map(day => weekdays[day - 1]).join(', ')} at ${saved.preferred_advisory_time} Asia/Manila`}</dd></div>
      <div><dt>Next scheduled candidate</dt><dd>{saved.next_routine_at ? new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(saved.next_routine_at)) + ' Asia/Manila' : saved.routine_paused ? 'None while paused' : 'Unavailable'}</dd></div>
    </dl>}
    <p className={formStyles.notice}>A saved schedule is not SMS enrollment, contact verification or delivery confirmation. Demo accounts cannot receive live SMS. Weather, consent and dispatch checks still apply.</p>
  </section>;
}
