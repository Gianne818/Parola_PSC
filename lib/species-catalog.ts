import type { Pool } from 'pg';

export interface SpeciesProfile {
  id: number | string; category: 'pelagic' | 'demersal'; species_name: string | null;
  common_name?: string | null; representative_species?: string | null; name_source?: string;
  family: string | null; local_name: string | null;
}

function normalize(value: string) {
  return value.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Exact identifiers/aliases from the real catalog; never a wildcard or first-row fallback. */
export function resolveSpecies(rows: SpeciesProfile[], query: string): SpeciesProfile | null {
  const key = normalize(query);
  if (!key) return null;
  const matches = rows.filter(row => {
    if (`${row.category}:${row.id}` === key) return true;
    return [row.species_name, row.family, row.local_name, row.common_name, row.representative_species].filter((value): value is string => typeof value === 'string')
      .some(value => [value, ...value.split(/[\/(),;]/)].some(alias => normalize(alias) === key));
  });
  return matches.length === 1 ? matches[0] : null;
}

export async function loadSpeciesProfile(db: Pick<Pool, 'query'>, query: string): Promise<SpeciesProfile | null> {
  const result = await db.query<SpeciesProfile>(`
    SELECT id, 'pelagic'::text AS category, common_name AS species_name, common_name, family, representative_species, NULL::text AS local_name, 'common_name'::text AS name_source FROM public.pelagic_species
    UNION ALL
    SELECT id, 'demersal'::text AS category, common_name AS species_name, common_name, family, representative_species, NULL::text AS local_name, 'common_name'::text AS name_source FROM public.demersal_species
    LIMIT 201`);
  if (result.rows.length > 200) throw new Error('Species catalog exceeds the reviewed lookup bound.');
  return resolveSpecies(result.rows, query);
}

export function environmentalNumber(value: unknown): number | null {
  if ((typeof value !== 'number' && typeof value !== 'string') || (typeof value === 'string' && !value.trim())) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
