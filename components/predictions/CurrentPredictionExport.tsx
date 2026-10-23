'use client';

import { useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { requestPredictionExport, startPredictionDownload, PredictionExportError, type PredictionArtifact, type PredictionExportQuery } from '@/lib/frontend/prediction-export';
import { GEOGRAPHIC_LABELS } from '@/lib/frontend/geographic-access';
import styles from './access-export.module.css';

interface Props { query: PredictionExportQuery; regionName: string }
type ExportState = { kind: 'idle' | 'loading' } | { kind: 'error'; message: string } | { kind: 'download' | 'empty'; artifact: PredictionArtifact };

export default function CurrentPredictionExport(props: Props) {
  const { isAuthenticated, userProfile } = useApp();
  const query = props.query;
  // A changed account/query unmounts the old request and clears old success labels.
  const key = JSON.stringify([userProfile.id, query.lat, query.lng, query.regionId, query.habitat, query.species, isAuthenticated]);
  return <ExportPanel key={key} {...props} signedIn={isAuthenticated && Boolean(userProfile.id)} />;
}

function ExportPanel({ query, regionName, signedIn }: Props & { signedIn: boolean }) {
  const [state, setState] = useState<ExportState>({ kind: 'idle' });
  const pending = useRef(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const download = async () => {
    if (!signedIn || pending.current) return;
    pending.current = true;
    const controller = new AbortController();
    request.current = controller;
    setState({ kind: 'loading' });
    try {
      const artifact = await requestPredictionExport(query, AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]));
      if (controller.signal.aborted) return;
      if (artifact.count > 0) startPredictionDownload(artifact);
      setState({ kind: artifact.count ? 'download' : 'empty', artifact });
    } catch (error) {
      if (!controller.signal.aborted) setState({ kind: 'error', message: error instanceof PredictionExportError ? error.message : 'The download could not be started. Retry the export.' });
    } finally {
      pending.current = false;
    }
  };
  const artifact = state.kind === 'download' || state.kind === 'empty' ? state.artifact : null;
  return <details className={styles.export} lang="en">
    <summary>Current prediction export</summary>
    <div className={styles.exportBody}>
      <p>GeoJSON from the latest stored selection, which may be historical. Model estimates are unverified, not validated catch probabilities or navigation guidance.</p>
      <p className={styles.muted}>The map’s score threshold and returned-date display filter do not apply. Operational eligibility remains false. A demo-preview export does not verify access.</p>
      {!signedIn && <p role="status">Sign in with your registered account to request an export.</p>}
      <button type="button" onClick={() => void download()} disabled={!signedIn || state.kind === 'loading'} className={styles.download}>
        <Download size={16} aria-hidden="true" />{state.kind === 'loading' ? 'Requesting GeoJSON…' : state.kind === 'error' ? 'Retry GeoJSON export' : 'Download GeoJSON'}
      </button>
      <div role="status" aria-live="polite" aria-atomic="true" className={styles.result} data-state={state.kind}>
        {state.kind === 'loading' && <p>Checking the server response. No download has started.</p>}
        {state.kind === 'error' && <p>{state.message}</p>}
        {state.kind === 'download' && <p>Download requested for {state.artifact.count} prediction records. Check your browser downloads; saving to disk cannot be confirmed here.</p>}
        {state.kind === 'empty' && <p>No stored predictions matched this export query. No file was downloaded. This does not establish fish absence or permitted access.</p>}
        {artifact && <p className={styles.artifactSummary}>{artifact.mode === 'demo_preview' ? 'Demo preview · access not evaluated.' : 'Geographically filtered selection.'} Unverified · operational_eligible=false.</p>}
      </div>
      {artifact && <details className={styles.supportingDetails}>
        <summary>Returned export details</summary>
        <dl className={styles.metadata} aria-label="Returned export metadata">
          <div><dt>Export mode</dt><dd>{artifact.mode === 'demo_preview' ? 'Demo preview · access not evaluated' : 'Geographically filtered selection'} ({artifact.mode})</dd></div>
          <div><dt>Geographic coverage</dt><dd>{GEOGRAPHIC_LABELS[artifact.geography.status].title}</dd></div>
          <div><dt>Prediction date</dt><dd>{artifact.predictionDate || 'Unavailable'} · {artifact.dateStatus}</dd></div>
          <div><dt>Provenance / validity</dt><dd>legacy_unverified / unverified</dd></div>
          <div><dt>Lineage</dt><dd>{artifact.lineage}</dd></div>
          <div><dt>Operational eligibility</dt><dd>false · not operational guidance</dd></div>
        </dl>
      </details>}
      <details className={styles.supportingDetails}>
        <summary>Query and sample details</summary>
        <dl className={styles.metadata}>
          <div><dt>Query area</dt><dd>{regionName}</dd></div>
          <div><dt>Nearest to home port</dt><dd>{query.lat.toFixed(4)}, {query.lng.toFixed(4)} (latitude, longitude)</dd></div>
          <div><dt>Habitat / fish request</dt><dd>{query.habitat === 'both' ? 'Both habitats' : query.habitat === 'pelagic' ? 'Pelagic' : 'Demersal'} / {query.species || 'No fish filter'}</dd></div>
        </dl>
        <p className={styles.muted}>Up to 1,000 nearest records. No 24–72h forecast is generated. The server checks account and geographic access again for every request.</p>
        <p className={styles.sampleNote}>Local sample exports in <a href="/pricing">Pricing</a> use fixed example coordinates and illustrative horizons. They are separate from this server export. GPX and KML are sample formats only.</p>
      </details>
    </div>
  </details>;
}
