'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { blankTrip, confirmedReport, draftFromReport, tripFromDraft, validateTrip,
  type CatchReport, type DraftErrors, type ReportCommand, type ReportUnits, type TripDraft } from '@/lib/frontend/catch-reporting';
import styles from './reporting.module.css';

interface Props {
  actorId: string; fisherId: string; fisherName: string; units: ReportUnits | null;
  canSubmit: boolean; correction: CatchReport | null;
  submit: (command: ReportCommand) => Promise<unknown>;
  saved: (report: CatchReport) => void; busyChanged: (busy: boolean) => void; cancel: () => void;
}
export default function TripReportForm({ actorId, fisherId, fisherName, units, canSubmit, correction, submit, saved, busyChanged, cancel }: Props) {
  const id = useId();
  const [draft, setDraft] = useState(() => correction ? draftFromReport(correction) : blankTrip());
  const [errors, setErrors] = useState<DraftErrors>({});
  const [failure, setFailure] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [gpsNotice, setGpsNotice] = useState('');
  const pending = useRef(false);
  const requestId = useRef<string | null>(null);
  const gpsRequest = useRef(0);
  const errorSummary = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const measureUnits = correction?.trip.units ?? units;
  useEffect(() => { if (correction) heading.current?.focus(); }, [correction]);
  useEffect(() => () => { gpsRequest.current++; }, []);
  useEffect(() => { if (failure || Object.keys(errors).length) errorSummary.current?.focus(); }, [failure, errors]);

  function edit(patch: Partial<TripDraft>) {
    setDraft(current => ({ ...current, ...patch })); setErrors({}); setFailure(''); setConfirmed(false); requestId.current = null;
  }
  function requestGps() {
    if (gpsBusy || pending.current) return;
    if (!navigator.geolocation) { setGpsNotice('GPS is unavailable. You can still report using an approximate area.'); return; }
    const request = ++gpsRequest.current;
    setGpsBusy(true); setGpsNotice('Requesting your current location…');
    navigator.geolocation.getCurrentPosition(position => {
      if (request !== gpsRequest.current) return;
      setGpsBusy(false);
      if (!Number.isFinite(position.coords.latitude) || !Number.isFinite(position.coords.longitude)
        || Math.abs(position.coords.latitude) > 90 || Math.abs(position.coords.longitude) > 180) {
        setGpsNotice('GPS returned invalid coordinates. Use an approximate area or enter coordinates yourself.'); return;
      }
      edit({ latitude: String(position.coords.latitude), longitude: String(position.coords.longitude) });
      setGpsNotice('Current location added. Check that it describes the trip area; remove it if it does not.');
    }, error => {
      if (request !== gpsRequest.current) return;
      setGpsBusy(false); setGpsNotice(error.code === 1 ? 'GPS permission was denied. Approximate-area reporting is still available.' : 'GPS could not be retrieved. Approximate-area reporting is still available.');
    }, { timeout: 10000, maximumAge: 0, enableHighAccuracy: false });
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (pending.current || confirmed || gpsBusy) return;
    const invalid = validateTrip(draft, measureUnits, Boolean(correction));
    setErrors(invalid); setFailure('');
    if (Object.keys(invalid).length) return;
    if (!canSubmit || !measureUnits) { setFailure('Submission is unavailable. Your draft has been kept.'); return; }
    pending.current = true; setBusy(true); busyChanged(true);
    try {
      // A failed/uncertain response keeps this identity for a manual retry of the same draft.
      requestId.current ??= crypto.randomUUID();
      const command: ReportCommand = { actorId, fisherId, requestId: requestId.current, trip: tripFromDraft(draft, measureUnits),
        correction: correction ? { reportId: correction.id, revision: correction.revision, reason: draft.correctionReason.trim() } : null };
      const report = confirmedReport(await submit(command), command);
      setConfirmed(true); saved(report);
    } catch (error) {
      setFailure(`${error instanceof Error ? error.message : 'The report could not be confirmed.'} Your draft is kept. Retry to confirm this submission.`);
    } finally { pending.current = false; setBusy(false); busyChanged(false); }
  }
  const field = (name: keyof TripDraft, label: string, options: { type?: 'date' | 'text'; hint?: string; decimal?: boolean; disabled?: boolean; required?: boolean } = {}) =>
    <label className={styles.field} htmlFor={`${id}-${name}`}>
      {label}<input id={`${id}-${name}`} name={name} type={options.type ?? 'text'} inputMode={options.decimal ? 'decimal' : undefined}
        value={draft[name]} disabled={options.disabled} required={options.required} aria-invalid={Boolean(errors[name])}
        aria-describedby={`${id}-${name}-help`} onChange={event => edit({ [name]: event.target.value })} />
      <span id={`${id}-${name}-help`} className={errors[name] ? styles.fieldError : styles.hint}>{errors[name] || options.hint}</span>
    </label>;

  return <section className={styles.formPanel} aria-labelledby={`${id}-heading`}>
    <p className={styles.eyebrow}>{correction ? 'Amend an existing record' : 'Voluntary trip report'}</p>
    <h2 id={`${id}-heading`} ref={heading} tabIndex={-1}>{correction ? 'Correct a report' : 'Record your trip'}</h2>
    <p className={styles.muted}>For {fisherName}. Drafts stay on this open page only; leaving or reloading clears them.</p>
    {correction && <p className={styles.notice}>Correcting report {correction.id}. The existing record stays unchanged until the reporting service confirms a correction. Review status is determined by the service.</p>}
    <form onSubmit={event => void save(event)} noValidate aria-label={correction ? 'Correct trip report' : 'Trip report'} aria-busy={busy}>
      {(failure || Object.keys(errors).length > 0) && <div className={styles.error} ref={errorSummary} role="alert" tabIndex={-1}>
        <strong>{failure || 'Check the highlighted fields.'}</strong>
        {Object.keys(errors).length > 0 && <ul>{Object.entries(errors).map(([name, message]) => <li key={name}>{name === 'units' ? message : <a href={`#${id}-${name}`}>{message}</a>}</li>)}</ul>}
      </div>}
      <fieldset disabled={busy} className={styles.formFields}>
        <legend><span>01</span> Trip & area</legend>
        {field('date', 'Trip date', { type: 'date', required: true })}
        {field('area', 'Approximate fishing area', { required: true, hint: 'Use a familiar area or local place name. Exact GPS is optional.' })}
        <details className={styles.gps}>
          <summary>Optional GPS coordinates</summary>
          <p className={styles.hint}>Current GPS describes where you are now, which may differ from the trip location. No background tracking is used.</p>
          <div className={styles.actions}><button type="button" onClick={requestGps} disabled={gpsBusy}>Use current GPS</button>
            <button type="button" onClick={() => { gpsRequest.current++; setGpsBusy(false); edit({ latitude: '', longitude: '' }); setGpsNotice('Coordinates removed. Approximate-area reporting is still available.'); }}>Remove GPS</button></div>
          <p role="status" className={styles.hint}>{gpsNotice}</p>
          <div className={styles.fieldPair}>
            {field('latitude', 'Latitude', { decimal: true, disabled: gpsBusy, hint: '−90 to 90' })}
            {field('longitude', 'Longitude', { decimal: true, disabled: gpsBusy, hint: '−180 to 180' })}
          </div>
        </details>
      </fieldset>
      <fieldset disabled={busy} className={styles.formFields}>
        <legend><span>02</span> Catch & effort</legend>
        {!measureUnits && <p className={styles.notice}>Weight and effort units are not yet available. These fields and submission remain unavailable; no unit has been assumed.</p>}
        {field('species', 'Species', { hint: 'Describe the species reported. Zero-catch reporting does not require a positive catch.' })}
        <div className={styles.fieldPair}>
          {field('weight', `Catch weight${measureUnits ? ` (${measureUnits.weight})` : ' — unit unavailable'}`, { decimal: true, required: true, disabled: !measureUnits, hint: '0 is a valid zero-catch value.' })}
          {field('effort', `Effort${measureUnits ? ` (${measureUnits.effort})` : ' — unit unavailable'}`, { decimal: true, required: true, disabled: !measureUnits, hint: 'Use the displayed effort unit.' })}
        </div>
        <button type="button" disabled={!measureUnits} onClick={() => edit({ weight: '0', species: '' })}>Record zero catch</button>
        {correction && field('correctionReason', 'Reason for correction', { required: true, hint: 'Explain what changed so the correction can be reviewed.' })}
      </fieldset>
      <div className={styles.submitArea}>
        <p className={styles.hint}>Internet access is needed to submit a report. Reports are optional for receiving advisories.</p>
        <div className={styles.actions}><button className={styles.primary} type="submit" disabled={!canSubmit || !measureUnits || busy || gpsBusy || confirmed}>
          {busy ? 'Confirming submission…' : confirmed ? 'Submission confirmed' : correction ? 'Submit correction' : 'Submit trip report'}</button>
          {correction && <button type="button" disabled={busy} onClick={cancel}>Back to new report</button>}</div>
        {confirmed && <p className={styles.success} role="status">{correction ? 'Correction' : 'Report'} saved and confirmed by the reporting service. Review status is shown in history.</p>}
        {!canSubmit && <p className={styles.hint}>Submission is unavailable for this account or reporting service. Nothing has been saved.</p>}
      </div>
    </form>
  </section>;
}
