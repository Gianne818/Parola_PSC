import { predictionPercent, type FishingArea } from '@/lib/dashboard';
import type { Hotspot } from '@/types';

type DashboardHotspot = Hotspot & Partial<Pick<FishingArea, 'source' | 'habitatKnown'>>;
export type Habitat = 'pelagic' | 'demersal' | 'mixed' | 'unknown';

/** Presentation only: uses the established score conversion without advisory gating. */
export function hotspotPresentation(area: DashboardHotspot) {
  const habitat: Habitat = area.habitatKnown !== true ? 'unknown'
    : area.type === 'pelagic' || area.type === 'demersal' ? area.type : 'mixed';
  const percent = area.source === 'model' ? predictionPercent(area.catchProbability) : null;
  const { letter, label, outline } = HABITATS[habitat];
  return { habitat, percent, letter, label, outline,
    fill: percent === null ? '#ffffff' : habitatFill(habitat, percent),
    unavailable: percent === null,
  };
}

const HABITATS = {
  pelagic: { letter: 'P', label: 'Pelagic', outline: '#125f94' },
  demersal: { letter: 'D', label: 'Demersal', outline: '#376426' },
  mixed: { letter: 'M', label: 'Mixed habitat', outline: '#59646d' },
  unknown: { letter: '?', label: 'Habitat unknown', outline: '#68737a' },
} as const;

/** The key and markers share the same continuous, normalized 0–100% display scale. */
export function habitatFill(habitat: Habitat, percent: number): string {
  if (habitat === 'mixed') return '#d4dce1';
  if (habitat === 'unknown') return '#edf0f2';
  const amount = percent / 100;
  return habitat === 'pelagic'
    ? `hsl(${199 + 9 * amount} ${52 + 40 * amount}% ${83 - 43 * amount}%)`
    : `hsl(${72 + 64 * amount} ${42 + 30 * amount}% ${80 - 49 * amount}%)`;
}
