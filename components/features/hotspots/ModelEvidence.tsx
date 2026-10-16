import type { Hotspot } from '@/types';
import type { ModelEvidenceFields } from '@/lib/frontend/species-contract';
import { predictionPercent } from '@/lib/dashboard';

/** English fallback until regional terminology is reviewed under UI-02/D10. */
export default function ModelEvidence({ area }: { area: Hotspot & ModelEvidenceFields }) {
  const evidence = area.modelEvidence;
  const profile = evidence?.profile;
  const percent = predictionPercent(area.catchProbability);
  const reading = (value: number | undefined, unit: string) => typeof value === 'number' && Number.isFinite(value) ? `${value} ${unit}` : 'Unavailable';
  return <div lang="en">
    <dl>
      <div><dt>{evidence?.scope === 'habitat_model' ? 'Habitat-model score' : 'Model score (scope unverified)'}</dt><dd>{percent === null ? 'Unavailable' : `${percent}%`}</dd></div>
      <div><dt>Species HSI</dt><dd>{evidence?.hsiStatus === 'not_requested' ? 'Not requested' : evidence?.scope === 'habitat_model' ? 'Unavailable; habitat scores are unchanged' : 'Unavailable; validated inputs not supplied'}</dd></div>
      <div><dt>Verified species presence</dt><dd>Unavailable; no species evidence supplied</dd></div>
      {evidence?.requestedSpecies && <>
        <div><dt>Requested target</dt><dd>{evidence.requestedSpecies}</dd></div>
        <div><dt>Catalog resolution</dt><dd>{evidence.speciesStatus === 'resolved' ? 'Resolved catalog match; not species presence' : 'Unavailable'}</dd></div>
      </>}
      {profile && <>
        <div><dt>Resolved catalog name</dt><dd>{profile.species_name || 'Unavailable'} ({profile.category}:{profile.id})</dd></div>
        <div><dt>Local name</dt><dd>{profile.local_name || 'Unavailable'}</dd></div>
        <div><dt>Scientific representative</dt><dd>{profile.representative_species || 'Unavailable'}</dd></div>
      </>}
      <div><dt>Depth</dt><dd>{evidence?.depthStatus === 'unavailable' ? 'Unavailable' : 'Unavailable; no validated depth supplied'}</dd></div>
      <div><dt>Stored SST (unverified)</dt><dd>{reading(area.sst, '°C')}</dd></div>
      <div><dt>Stored chlorophyll (unverified; units unavailable)</dt><dd>{reading(area.chlorophyll, '').trim()}</dd></div>
    </dl>
    <p>Habitat scores and catalog matches do not establish species HSI or verified species presence.</p>
    <p>{evidence?.environmentProvenance === 'legacy_unverified' ? 'Legacy environment provenance is unverified.' : 'Environment provenance is unavailable.'} Stored values are not verified measured conditions. Use weather details for separate forecast readings.</p>
  </div>;
}
