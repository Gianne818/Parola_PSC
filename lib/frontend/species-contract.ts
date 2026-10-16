/** Client presentation of Son's MAP-03 contract; no catalog resolution or HSI calculation. */
export type SpeciesFailure = 'species_unsupported' | 'species_catalog_unavailable';

export class SpeciesRequestError extends Error {
  constructor(public readonly code: SpeciesFailure) {
    super(code === 'species_unsupported'
      ? 'This species is unsupported or ambiguous. Choose another target or clear the filter.'
      : 'The species catalog is unavailable. Retry later or clear the target filter.');
    this.name = 'SpeciesRequestError';
  }
}

export interface SpeciesProfileView {
  id: string | number;
  category: 'pelagic' | 'demersal';
  species_name: string | null;
  local_name: string | null;
  representative_species: string | null;
}

export interface ModelEvidenceFields {
  chlorophyll?: number;
  modelEvidence?: {
    scope: 'habitat_model' | 'unverified';
    speciesStatus: 'resolved' | 'not_requested' | 'unverified';
    hsiStatus: 'unavailable' | 'not_requested';
    depthStatus: 'unavailable' | 'unverified';
    requestedSpecies: string | null;
    profile: SpeciesProfileView | null;
    environmentProvenance: 'legacy_unverified' | 'unverified';
  };
}

export function speciesProfileView(value: unknown): SpeciesProfileView | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  if ((typeof item.id !== 'string' && typeof item.id !== 'number')
    || (item.category !== 'pelagic' && item.category !== 'demersal')) return null;
  const text = (value: unknown) => typeof value === 'string' && value.trim() ? value : null;
  return { id: item.id, category: item.category, species_name: text(item.species_name),
    local_name: text(item.local_name), representative_species: text(item.representative_species) };
}
