import { describe, expect, it } from 'vitest';
import { createPortSelection, homePortProfilePatch, isInCoverage, PORT_PRESETS, provinceFromAddress } from '@/components/onboarding/home-port';

describe('home-port selection', () => {
  it('assigns the selected port province rather than the region’s first province', () => {
    const port = PORT_PRESETS.find((candidate) => candidate.name === 'Bredco Sea Port')!;
    const selection = createPortSelection(port);
    expect(selection.region.shortName).toBe('Western Visayas');
    expect(selection.region.provinces[0]).toBe('Iloilo');
    expect(homePortProfilePatch(selection).province).toBe('Negros Occidental');
    expect(selection.coordinates).toEqual([port.lat, port.lng]);
  });

  it('infers a province from a reverse-geocoded address', () => {
    const selection = createPortSelection({ name: 'Brgy. Canjulao, Lapu-Lapu City, Cebu', lat: 10.3, lng: 123.9 });
    expect(selection.province).toBe('Cebu');
    expect(selection.region.id).toBe('reg-7');
    expect(provinceFromAddress('Coastal Spot (10.0000, 124.0000)')).toBeUndefined();
  });

  it('keeps coordinate-based region detection when the address is unavailable', () => {
    const selection = createPortSelection({ name: 'Coastal Spot (14.0122, 123.0114)', lat: 14.0122, lng: 123.0114 });
    expect(selection.region.id).toBe('reg-5');
    expect(homePortProfilePatch(selection).province).toBe('');
  });

  it('rejects nonfinite and outside-coverage coordinates', () => {
    for (const [lat, lng] of [[NaN, 123], [Infinity, 123], [4.49, 123], [21.51, 123], [12, 115.99], [12, 127.01]]) {
      expect(isInCoverage(lat, lng)).toBe(false);
      expect(() => createPortSelection({ name: 'Outside coverage', lat, lng })).toThrow('coverage');
    }
    expect(isInCoverage(4.5, 116)).toBe(true);
    expect(isInCoverage(21.5, 127)).toBe(true);
  });

  it('updates only home-port fields when merged into an existing profile', () => {
    const selection = createPortSelection(PORT_PRESETS[2]);
    const existing = { vesselName: 'F/B Existing', licenseNo: 'Existing license', phone: '+639120000000', emergencyName: 'Existing contact', emergencyPhone: '+639170000000', boatType: 'motorized', speciesPreference: 'both' };
    const updated = { ...existing, ...homePortProfilePatch(selection) };
    expect(updated).toMatchObject(existing);
    expect(updated.port).toBe('Mercedes Fish Port');
    expect(Object.keys(homePortProfilePatch(selection)).sort()).toEqual(['fmaZone', 'lat', 'lng', 'port', 'province', 'regionId', 'regionName', 'regionalBounds']);
  });
});
