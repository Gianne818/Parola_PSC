'use client';

import { ChevronRight, Compass, Fish } from 'lucide-react';
import type { ReactNode } from 'react';
import { manilaDate, predictionPercent, type FishingArea } from '@/lib/dashboard';
import type { DashboardCopy } from './dashboard-copy';
import styles from './dashboard.module.css';
import PredictionProvenance from './PredictionProvenance';

export function AreaDetails({ area, copy, weather }: { area: FishingArea; copy: DashboardCopy; weather?: ReactNode }) {
  const percent = area.source === 'model' ? predictionPercent(area.catchProbability) : null;
  return <div className={styles.areaDetails}>
    <div className={styles.areaDistance}><Compass size={22} aria-hidden="true" /><strong>{area.distanceKm.toFixed(1)} km</strong><span>{area.compassBearing}</span></div>
    <p className={styles.panelDescription}>{copy.areasDescription}</p>
    {weather}
    <dl>
      <div><dt>{copy.coordinates}</dt><dd>{area.lat.toFixed(4)}° N, {area.lng.toFixed(4)}° E</dd></div>
      <div><dt>{copy.habitat}</dt><dd>{area.habitatKnown ? area.type === 'pelagic' ? copy.surface : area.type === 'demersal' ? copy.bottom : copy.mixed : copy.unavailable}</dd></div>
      {percent !== null && <div><dt>{copy.modelEstimate}</dt><dd>{percent}%</dd></div>}
      <div><dt>{copy.predictionTime}</dt><dd>{area.predictionDate?.slice(0, 10) || copy.dateUnknown}</dd></div>
    </dl>
    <PredictionProvenance area={area} />
    <p className={styles.panelDescription}>{copy.estimateNote}</p>
    {area.source === 'sample' && <p className={styles.notice}>{copy.sample}</p>}
    {area.speciesAdjusted && <p className={styles.panelDescription}>{copy.speciesNote}</p>}
  </div>;
}

export default function FishingAreas({ areas, loading, failed, retry, limit, showMore, select, filtered, clearFilters, hold, speciesUnavailable, copy }: {
  areas: FishingArea[]; loading: boolean; failed: boolean; retry: () => void; limit: number; showMore: () => void;
  select: (area: FishingArea) => void; filtered: boolean; clearFilters: () => void; hold: boolean; speciesUnavailable: boolean; copy: DashboardCopy;
}) {
  const today = manilaDate(new Date());
  return <section id="fishing-areas" aria-busy={loading}>
    <p className={styles.panelDescription}>{copy.areasDescription}</p>
    {hold && <p className={styles.notice}>{copy.reference}</p>}
    {speciesUnavailable && <p className={styles.notice} role="status">{copy.fishUnavailable}</p>}
    {failed && <div className={styles.empty} role="status"><Fish size={23} aria-hidden="true" /><h3>{copy.areasFailed}</h3>
      {areas.length > 0 && <p>{copy.lastAvailable}</p>}<button type="button" className={styles.textButton} onClick={retry} disabled={loading}>{copy.retry}</button></div>}
    {loading ? <p className={styles.panelDescription} role="status">{copy.loadingAreas}</p>
      : areas.length === 0 && !failed && <div className={styles.empty}><Fish size={26} aria-hidden="true" /><h3>{filtered ? copy.noMatches : copy.noAreas}</h3>
        <p>{filtered ? copy.noMatchesDescription : copy.noAreasDescription}</p>{filtered && <button type="button" className={styles.textButton} onClick={clearFilters}>{copy.clearFilters}</button>}</div>}
    <ol className={styles.areaList}>{areas.slice(0, limit).map(area => <li key={area.id}>
      <button className={styles.areaRow} type="button" onClick={() => select(area)} aria-label={`${copy.details}: ${area.name}`}>
        <span className={styles.areaText}><strong>{area.name}</strong><span className={styles.areaMeta}><Compass size={14} aria-hidden="true" />{area.distanceKm.toFixed(1)} km · {area.compassBearing}</span>
          <span className={styles.areaHabitat}>{area.habitatKnown ? area.type === 'pelagic' ? copy.surface : area.type === 'demersal' ? copy.bottom : copy.mixed : copy.unavailable}</span>
          {area.source === 'sample' ? <span className={styles.timestamp}>{copy.sample}</span> : !area.predictionDate ? <span className={styles.timestamp}>{copy.dateUnknown}</span>
            : manilaDate(area.predictionDate) !== today && <span className={styles.timestamp}>{copy.olderPrediction} · {area.predictionDate.slice(0, 10)}</span>}
        </span><ChevronRight size={17} aria-hidden="true" />
      </button>
    </li>)}</ol>
    {limit < areas.length && <button className={styles.moreButton} type="button" onClick={showMore}>{limit === 3 ? copy.seeAll : copy.showMore} ({areas.length})</button>}
  </section>;
}
