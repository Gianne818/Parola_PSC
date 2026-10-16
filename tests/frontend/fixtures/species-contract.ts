// Disconnected examples of the published response; these are not catalog/science evidence.
export const speciesProfile = { id: 1, category: 'pelagic', species_name: 'Sample sardine',
  common_name: 'Sample sardine', local_name: null, family: 'Sample family',
  representative_species: 'Sample scientific name', name_source: 'common_name' };
export const prediction = { grid_id: 23, target_lat: 10.4, target_lon: 123.9, model_type: 'pelagic',
  catch_probability: 0.6, prediction_date: '2026-10-13', created_at: '2026-10-13T00:00:00Z',
  sst: 0, chl_a: 0, depth: null, depth_status: 'unavailable', depth_unit: 'm',
  environment_provenance: 'legacy_unverified', prediction_scope: 'habitat_model', species_hsi_status: 'unavailable' };
export const resolvedResponse = { hotspots: [prediction], species_status: 'resolved', species_profile: speciesProfile,
  prediction_scope: 'habitat_model', species_hsi_status: 'unavailable', provenance: 'legacy_unverified' };
