import { describe, expect, it, vi } from 'vitest';
import { environmentalNumber, loadSpeciesProfile, resolveSpecies } from './species-catalog';

const catalog = [
  { id: 1, category: 'pelagic' as const, species_name: 'Tamban / Tunsoy', family: 'Clupeidae', local_name: 'Sardines' },
  { id: 1, category: 'demersal' as const, species_name: 'Lapu-lapu', family: 'Serranidae', local_name: 'Groupers' },
];
describe('exact stored species aliases', () => {
  it('resolves the deployed common name and representative species without inventing a local name', async () => {
    const row = { id: 7, category: 'pelagic' as const, species_name: 'Sardines', common_name: 'Sardines',
      representative_species: 'Sardinella lemuru', family: 'Clupeidae', local_name: null, name_source: 'common_name' };
    const query = vi.fn().mockResolvedValue({ rows: [row] });
    expect(await loadSpeciesProfile({ query } as never, 'Sardinella lemuru')).toEqual(row);
    expect(resolveSpecies([row], 'Sardines')).toEqual(row);
    expect(resolveSpecies([row], 'lemuru')).toBeNull();
  });
  it.each(['Tamban', ' TUNSOY ', 'Clupeidae', 'Sardines', 'pelagic:1'])('resolves %s consistently', query => {
    expect(resolveSpecies(catalog, query)).toEqual(catalog[0]);
  });
  it.each(['unknown', 'Tam', '%', '_', '', ' ', '1'])('never chooses a first row for %j', query => {
    expect(resolveSpecies(catalog, query)).toBeNull();
  });
  it('rejects an ambiguous alias but allows its scoped identifier', () => {
    const rows = [catalog[0], { ...catalog[1], local_name: 'Sardines' }];
    expect(resolveSpecies(rows, 'Sardines')).toBeNull();
    expect(resolveSpecies(rows, 'demersal:1')).toEqual(rows[1]);
  });
  it('propagates schema failures without another unfiltered lookup', async () => {
    const query = vi.fn().mockRejectedValue({ code: '42703' });
    await expect(loadSpeciesProfile({ query } as never, 'unknown')).rejects.toMatchObject({ code: '42703' });
    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0][0]).not.toMatch(/WHERE name|ILIKE|LIMIT 1\b/);
  });
  it('preserves real zero values while keeping missing inputs unavailable', () => {
    expect(environmentalNumber(0)).toBe(0);
    expect(environmentalNumber('0')).toBe(0);
    for (const value of [null, undefined, '', 'bad', NaN]) expect(environmentalNumber(value)).toBeNull();
  });
});
