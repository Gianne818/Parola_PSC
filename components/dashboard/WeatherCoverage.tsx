import type { DashboardWeather, ForecastCoordinates } from '@/lib/dashboard';
import { isClientCoordinate } from '@/lib/frontend/coordinates';
import styles from './dashboard.module.css';

export function weatherLocation(value: ForecastCoordinates | null | undefined): string {
  return value && isClientCoordinate(value.lat, value.lng) ? `${value.lat.toFixed(4)}, ${value.lng.toFixed(4)} (lat, lon)` : 'Unavailable';
}

/** Reports supplied locations only; this does not decide geographic applicability. */
export default function WeatherCoverage({ data, requested, regionName }: {
  data: DashboardWeather | null; requested?: ForecastCoordinates; regionName?: string;
}) {
  return <details className={styles.areaForecastLocations} lang="en">
    <summary>Weather locations and coverage</summary>
    <dl>
      <div><dt>Requested location</dt><dd>{weatherLocation(data?.location?.requested || requested)}</dd></div>
      <div><dt>Latest response wind / temperature grid</dt><dd>{weatherLocation(data?.location?.weatherGrid)}</dd></div>
      <div><dt>Latest response wave grid</dt><dd>{weatherLocation(data?.location?.marineGrid)}</dd></div>
      <div><dt>Region requested for hold lookup</dt><dd>{regionName || 'Unavailable in this response'}</dd></div>
    </dl>
    <p className={styles.panelDescription}>Grid locations may differ from the requested point; retained readings may belong to an earlier response grid. Applicable warning geography, coverage completeness and validated backup status are unavailable in this response. A missing hold record does not establish safety clearance.</p>
  </details>;
}
