import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { MapComponent } from '@/components/features/hotspots/MapComponent';
import type { Hotspot } from '@/types';

vi.mock('next/dynamic', () => ({ default: () => () => null }));
vi.mock('@/context/AppContext', () => ({ useApp: () => ({
  userProfile: { port: 'Saved port', lat: 'broken', lng: Infinity }, showToast() {}, manualOverrideHold: false,
}) }));
const area: Hotspot = { id: '1', name: 'Area', lat: 10.4, lng: 123.9, type: 'pelagic', species: [], depth: NaN, lastUpdated: '' };
const renderMap = (selected: Hotspot) => renderToStaticMarkup(React.createElement(MapComponent, {
  hotspots: [selected], selectedHotspot: selected, onSelectHotspot() {}, filterType: 'both', selectedSpecies: [], hideLegend: true,
}));

describe('legacy map details with malformed or absent information', () => {
  it('does not crash or invent a home-port distance for a malformed stored port', () => {
    const html = renderMap(area);
    expect(html).toContain('Coordinates unavailable');
    expect(html).not.toContain('NaN'); expect(html).not.toContain('Infinity');
    expect(html).toContain('Unavailable; no species evidence supplied');
    expect(html).not.toContain('NaN meters');
    expect(html).not.toContain('Territorial Waters');
  });
  it('does not show details for a malformed selected target', () => {
    expect(renderMap({ ...area, lat: NaN })).not.toContain('GPS Anchor:');
  });
});
