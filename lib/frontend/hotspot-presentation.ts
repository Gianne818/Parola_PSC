import { predictionPercent } from '@/lib/dashboard';

type HabitatRecord = { type?: string; habitatKnown?: boolean };
export function hotspotHabitat(area: HabitatRecord) {
  if (area.habitatKnown === false) return { key: 'unknown', label: 'Unknown habitat', symbol: '?' } as const;
  if (area.type === 'pelagic') return { key: 'pelagic', label: 'Pelagic · surface water', symbol: 'P' } as const;
  if (area.type === 'demersal') return { key: 'demersal', label: 'Demersal · bottom & reef', symbol: 'D' } as const;
  if (area.type === 'both') return { key: 'mixed', label: 'Mixed habitat', symbol: 'M' } as const;
  return { key: 'unknown', label: 'Unknown habitat', symbol: '?' } as const;
}

/** Display only. Uses the existing fraction/percent contract; never changes eligibility or ranking. */
export function hotspotAppearance(area: HabitatRecord & { catchProbability?: number; source?: string; isUnsafe?: boolean }, guidanceAvailable: boolean) {
  const habitat = hotspotHabitat(area);
  const withheld = !guidanceAvailable || area.isUnsafe === true;
  const percent = withheld || area.source === 'sample' ? null : predictionPercent(area.catchProbability);
  const colored = percent !== null && (habitat.key === 'pelagic' || habitat.key === 'demersal');
  return {
    ...habitat, percent, withheld,
    // Sky blue → strong blue; yellow-green → green. Saturation increases and
    // lightness decreases continuously without changing scores or scientific thresholds.
    color: colored ? habitat.key === 'pelagic'
      ? `hsl(208 ${38 + percent * .58}% ${88 - percent * .33}%)`
      : `hsl(${82 + percent * .6} ${38 + percent * .58}% ${86 - percent * .46}%)` : '#e2e8ec',
    // A fixed habitat outline never implies a score, even when the fill/value is withheld.
    outline: habitat.key === 'pelagic' ? '#2475a8' : habitat.key === 'demersal' ? '#23763e' : '#52665e',
    unavailable: !withheld && percent === null,
    status: withheld ? 'Model estimate withheld · safety checks' : percent === null ? 'Model estimate unavailable' : `${percent}% model estimate · unverified`,
  };
}
