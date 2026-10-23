/**
 * Geospatial current flow, prime feeding edge, and drift path calculations
 * for interactive hotspot map visualization.
 */

export function getCompassDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((degrees % 360) + 360) % 360 / 22.5) % 16;
  return directions[index];
}

/**
 * Calculates geographic coordinates along a circular arc on a sphere/ellipsoid.
 *
 * @param lat Center latitude
 * @param lng Center longitude
 * @param radiusKm Radius in kilometers
 * @param centerAngleDeg Central bearing in degrees (0 = North, 90 = East)
 * @param spanDeg Total angular width of the arc in degrees (e.g. 90 for ±45°)
 * @param stepDeg Resolution step in degrees
 */
export function calculateArcCoordinates(
  lat: number,
  lng: number,
  radiusKm: number,
  centerAngleDeg: number,
  spanDeg: number = 90,
  stepDeg: number = 3
): [number, number][] {
  const points: [number, number][] = [];
  const startAngle = centerAngleDeg - spanDeg / 2;
  const endAngle = centerAngleDeg + spanDeg / 2;
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const latScale = radiusKm / 111.0;
  const lngScale = radiusKm / (111.0 * (cosLat !== 0 ? cosLat : 1.0));

  for (let a = startAngle; a <= endAngle + 0.001; a += stepDeg) {
    const clampedAngle = Math.min(a, endAngle);
    const rad = (clampedAngle * Math.PI) / 180;
    const ptLat = lat + latScale * Math.cos(rad);
    const ptLng = lng + lngScale * Math.sin(rad);
    points.push([ptLat, ptLng]);
  }
  return points;
}

/**
 * Calculates the upstream prime feeding edge geographic coordinates on the perimeter of the hotspot zone.
 */
export function getUpstreamFeedingCoordinates(
  lat: number,
  lng: number,
  radiusKm: number,
  displayHeading: number
): { angle: number; lat: number; lng: number } {
  const angle = (displayHeading + 180) % 360;
  const rad = (angle * Math.PI) / 180;
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const effectiveCosLat = cosLat !== 0 ? cosLat : 1.0;
  const upstreamLat = lat + (radiusKm / 111.0) * Math.cos(rad);
  const upstreamLng = lng + (radiusKm / (111.0 * effectiveCosLat)) * Math.sin(rad);
  return { angle, lat: upstreamLat, lng: upstreamLng };
}

/**
 * Calculates the downstream drift path rim geographic coordinates on the perimeter of the hotspot zone.
 */
export function getDownstreamDriftCoordinates(
  lat: number,
  lng: number,
  radiusKm: number,
  displayHeading: number
): { lat: number; lng: number } {
  const rad = (displayHeading * Math.PI) / 180;
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const effectiveCosLat = cosLat !== 0 ? cosLat : 1.0;
  const downstreamLat = lat + (radiusKm / 111.0) * Math.cos(rad);
  const downstreamLng = lng + (radiusKm / (111.0 * effectiveCosLat)) * Math.sin(rad);
  return { lat: downstreamLat, lng: downstreamLng };
}

export interface StreamlineVector {
  line: [number, number][]; // [ [startLat, startLng], [endLat, endLng] ]
  arrowHead: [number, number][]; // [ [tipLat, tipLng], [leftWingLat, leftWingLng], [rightWingLat, rightWingLng] ]
  startDot: [number, number]; // [lat, lng]
}

export interface HotspotFlowField {
  center: StreamlineVector;
  left: StreamlineVector;
  right: StreamlineVector;
}

/**
 * Standard nautical marine palette for hotspot flow visualization:
 * Replaces jarring neon greens with professional oceanic azure and refined amber tones.
 */
export const HOTSPOT_FLOW_PALETTE = {
  pelagic: {
    streamline: '#0284C7', // Oceanic Azure
    streamlineGlow: '#38BDF8', // Oceanic Cyan
    arrowhead: '#0284C7',
    arcUnderlay: '#0284C7', // Subtle underlay
    arcMain: '#2563EB', // Crisp Oceanic Cobalt
    badgeAccent: '#38BDF8', // High-contrast Oceanic Cyan
  },
  demersal: {
    streamline: '#D97706', // Refined Warm Amber
    streamlineGlow: '#FBBF24', // Warm Golden Amber
    arrowhead: '#D97706',
    arcUnderlay: '#C2410C', // Terracotta underlay
    arcMain: '#D97706', // Refined Warm Amber
    badgeAccent: '#FBBF24', // High-contrast Warm Golden Amber
  },
  drift: {
    border: '#475569',
    text: '#E2E8F0',
    bg: 'rgba(15, 23, 42, 0.92)',
  },
} as const;

/**
 * Calculates real geographic coordinates for 3 parallel streamline flow vectors across the zone.
 * Because these are in lat/lng, they scale identically and proportionally with the map zoom level.
 */
export function calculateGeographicStreamlines(
  lat: number,
  lng: number,
  radiusKm: number,
  headingDeg: number
): HotspotFlowField {
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const effectiveCosLat = cosLat !== 0 ? cosLat : 1.0;

  // Direction vector along current flow (headingDeg)
  const dirRad = (headingDeg * Math.PI) / 180;
  const dLatDir = Math.cos(dirRad) / 111.0;
  const dLngDir = Math.sin(dirRad) / (111.0 * effectiveCosLat);

  // Perpendicular vector (+90 degrees to the right of flow)
  const perpRad = ((headingDeg + 90) * Math.PI) / 180;
  const dLatPerp = Math.cos(perpRad) / 111.0;
  const dLngPerp = Math.sin(perpRad) / (111.0 * effectiveCosLat);

  const makeStreamline = (
    perpOffsetKm: number,
    startOffsetKm: number,
    endOffsetKm: number,
    arrowLengthKm: number,
    arrowWidthKm: number
  ): StreamlineVector => {
    const baseLat = lat + perpOffsetKm * dLatPerp;
    const baseLng = lng + perpOffsetKm * dLngPerp;

    const startLat = baseLat + startOffsetKm * dLatDir;
    const startLng = baseLng + startOffsetKm * dLngDir;

    const endLat = baseLat + endOffsetKm * dLatDir;
    const endLng = baseLng + endOffsetKm * dLngDir;

    const tipLat = baseLat + (endOffsetKm + arrowLengthKm) * dLatDir;
    const tipLng = baseLng + (endOffsetKm + arrowLengthKm) * dLngDir;

    const leftWingLat = tipLat - arrowLengthKm * dLatDir - (arrowWidthKm / 2) * dLatPerp;
    const leftWingLng = tipLng - arrowLengthKm * dLngDir - (arrowWidthKm / 2) * dLngPerp;

    const rightWingLat = tipLat - arrowLengthKm * dLatDir + (arrowWidthKm / 2) * dLatPerp;
    const rightWingLng = tipLng - arrowLengthKm * dLngDir + (arrowWidthKm / 2) * dLngPerp;

    return {
      line: [[startLat, startLng], [endLat, endLng]],
      arrowHead: [[tipLat, tipLng], [leftWingLat, leftWingLng], [rightWingLat, rightWingLng]],
      startDot: [startLat, startLng],
    };
  };

  // Center streamline: spans from -0.60 * R to +0.60 * R with slim, tapered arrowheads
  const center = makeStreamline(
    0,
    -0.60 * radiusKm,
    0.60 * radiusKm,
    0.11 * radiusKm,
    0.06 * radiusKm
  );

  // Left streamline: offset by -0.38 * R, spans -0.42 * R to +0.42 * R
  const left = makeStreamline(
    -0.38 * radiusKm,
    -0.42 * radiusKm,
    0.42 * radiusKm,
    0.095 * radiusKm,
    0.05 * radiusKm
  );

  // Right streamline: offset by +0.38 * R, spans -0.42 * R to +0.42 * R
  const right = makeStreamline(
    0.38 * radiusKm,
    -0.42 * radiusKm,
    0.42 * radiusKm,
    0.095 * radiusKm,
    0.05 * radiusKm
  );

  return { center, left, right };
}

/**
 * Generates the SVG HTML markup for the 3 parallel streamline flow vectors across the zone.
 */
export function getStreamlinesSvgHtml(heading: number, color: string = HOTSPOT_FLOW_PALETTE.pelagic.streamline): string {
  return `
    <div style="position:relative;width:200px;height:200px;margin-left:-100px;margin-top:-100px;pointer-events:none;display:flex;align-items:center;justify-content:center;">
      <svg viewBox="-100 -100 200 200" width="200" height="200" style="overflow:visible;pointer-events:none;">
        <g transform="rotate(${heading})" style="filter: drop-shadow(0 1px 3px rgba(0,0,0,0.55));">
          <!-- Left-offset streamline -->
          <line x1="-34" y1="48" x2="-34" y2="-48" stroke="${color}" stroke-width="1.8" stroke-dasharray="5 4" stroke-linecap="round" opacity="0.8" />
          <polygon points="-34,-60 -36.5,-50 -31.5,-50" fill="${color}" opacity="0.85" />
          <circle cx="-34" cy="48" r="2" fill="${color}" opacity="0.8" />

          <!-- Center main streamline -->
          <line x1="0" y1="68" x2="0" y2="-68" stroke="${color}" stroke-width="2.6" stroke-dasharray="6 4" stroke-linecap="round" opacity="0.95" />
          <polygon points="0,-82 -3.5,-70 3.5,-70" fill="${color}" opacity="0.95" />
          <circle cx="0" cy="68" r="2.8" fill="${color}" opacity="0.95" />

          <!-- Right-offset streamline -->
          <line x1="34" y1="48" x2="34" y2="-48" stroke="${color}" stroke-width="1.8" stroke-dasharray="5 4" stroke-linecap="round" opacity="0.8" />
          <polygon points="34,-60 31.5,-50 36.5,-50" fill="${color}" opacity="0.85" />
          <circle cx="34" cy="48" r="2" fill="${color}" opacity="0.8" />
        </g>
      </svg>
    </div>
  `.trim();
}

// Lucide Target and Compass outlines (ISC), serialized for Leaflet HTML labels.
// Decorative icons inherit the existing label color and font size.
const feedingEdgeIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>';
const driftDirectionIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" style="flex-shrink:0"><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/><circle cx="12" cy="12" r="10"/></svg>';

/**
 * Generates the upright HTML markup for the Up-Current Prime Feeding Edge badge.
 * Uses high-contrast dark nautical pill container with vivid zone accents.
 */
export function getUpstreamBadgeHtml(isDemersal: boolean = false, compact: boolean = false): string {
  const accent = isDemersal ? HOTSPOT_FLOW_PALETTE.demersal.badgeAccent : HOTSPOT_FLOW_PALETTE.pelagic.badgeAccent;
  const label = compact
    ? (isDemersal ? 'Reef Face' : 'Feeding Edge')
    : (isDemersal ? 'Up-Current Reef Face (Feeding Slope)' : 'Prime Feeding Edge (Up-Current)');
  const padding = compact ? '3px 8px' : '4px 11px';
  const font = compact ? '700 10px system-ui, -apple-system, sans-serif' : '700 11px system-ui, -apple-system, sans-serif';

  return `<div style="transform:translate(-50%, -50%);background:rgba(15, 23, 42, 0.92);color:#FFFFFF;border:1.5px solid ${accent};border-radius:999px;padding:${padding};font:${font};box-shadow:0 3px 10px rgba(0,0,0,0.45);display:inline-flex;align-items:center;gap:6px;white-space:nowrap;pointer-events:none;">${feedingEdgeIcon}${label}</div>`;
}

/**
 * Generates the upright HTML markup for the Down-Current Drift Path badge.
 * Uses high-contrast dark nautical pill container with telemetry frame and light text.
 */
export function getDownstreamBadgeHtml(heading: number, speed: number, compact: boolean = false): string {
  const dir = getCompassDirection(heading);
  const padding = compact ? '3px 8px' : '4px 11px';
  const font = compact ? '700 10px system-ui, -apple-system, sans-serif' : '700 11px system-ui, -apple-system, sans-serif';
  const label = compact
    ? `${Math.round(heading)}° ${dir}`
    : `Drift Path · ${Math.round(heading)}° ${dir} (${speed.toFixed(2)} m/s)`;

  return `<div style="transform:translate(-50%, -50%);background:rgba(15, 23, 42, 0.92);color:#E2E8F0;border:1px solid #475569;border-radius:999px;padding:${padding};font:${font};box-shadow:0 3px 10px rgba(0,0,0,0.45);display:inline-flex;align-items:center;gap:6px;white-space:nowrap;pointer-events:none;">${driftDirectionIcon}${label}</div>`;
}
