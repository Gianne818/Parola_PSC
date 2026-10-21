import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AreaDetails } from '@/components/dashboard/FishingAreas';
import { DASHBOARD_COPY } from '@/components/dashboard/dashboard-copy';
import type { FishingArea } from '@/lib/dashboard';

const baseArea: FishingArea = {
  id: 'test-spot-1',
  name: 'Bantayan Deep Trench',
  type: 'pelagic',
  species: ['Yellowfin Tuna'],
  lat: 11.2,
  lng: 123.7,
  depth: 65,
  lastUpdated: '2026-10-21T00:00:00Z',
  catchProbability: 0.78,
  source: 'model',
  speciesAdjusted: false,
  habitatKnown: true,
  distanceKm: 14.2,
  compassBearing: 'NW',
  predictionDate: '2026-10-21',
};

describe('Ocean Current & Drift Advisory Card in AreaDetails', () => {
  it('does not render the drift card when current telemetry is absent', () => {
    const html = renderToStaticMarkup(
      React.createElement(AreaDetails, { area: baseArea, copy: DASHBOARD_COPY.en })
    );
    expect(html).not.toContain('Ocean Current &amp; Drift Advisory');
    expect(html).not.toContain('Prime Feeding Edge');
    expect(html).not.toContain('Recommended Drift');
  });

  it('renders optimal flow advisory with correct velocity, direction, badges, and tactical entry', () => {
    const areaWithDrift: FishingArea = {
      ...baseArea,
      currentSpeed: 0.32,
      currentHeading: 218,
    };
    const html = renderToStaticMarkup(
      React.createElement(AreaDetails, { area: areaWithDrift, copy: DASHBOARD_COPY.en })
    );

    // Header and title
    expect(html).toContain('Ocean Current &amp; Drift Advisory');
    // Flow velocity & direction
    expect(html).toContain('0.32 m/s (0.6 kts)');
    expect(html).toContain('218° SW');
    // Badge
    expect(html).toContain('Optimal Feeding Flow');
    expect(html).toContain('driftBadge_optimal');
    // Up-Current Prime Feeding Edge
    expect(html).toContain('NE Boundary');
    expect(html).toContain('Prime Feeding Edge');
    expect(html).toContain('Predatory fish face into oncoming flow here.');
    // Recommended Drift
    expect(html).toContain('Drift SW across the zone');
    // Tactical summary
    expect(html).toContain('driftAdviceText');
    expect(html).toContain('Predatory pelagics face into oncoming current along the NE rim');
  });

  it('renders strong current state with amber badge and drift warning for high current speeds', () => {
    const areaStrong: FishingArea = {
      ...baseArea,
      currentSpeed: 0.85,
      currentHeading: 90,
    };
    const html = renderToStaticMarkup(
      React.createElement(AreaDetails, { area: areaStrong, copy: DASHBOARD_COPY.en })
    );

    expect(html).toContain('0.85 m/s (1.7 kts)');
    expect(html).toContain('90° E');
    expect(html).toContain('Strong Current');
    expect(html).toContain('driftBadge_strong');
    expect(html).toContain('W Boundary');
    expect(html).toContain('Drift E across the zone');
  });

  it('renders slack current state with slate badge for low current speeds', () => {
    const areaSlack: FishingArea = {
      ...baseArea,
      currentSpeed: 0.08,
      currentHeading: 180,
    };
    const html = renderToStaticMarkup(
      React.createElement(AreaDetails, { area: areaSlack, copy: DASHBOARD_COPY.en })
    );

    expect(html).toContain('0.08 m/s (0.2 kts)');
    expect(html).toContain('180° S');
    expect(html).toContain('Slack Current');
    expect(html).toContain('driftBadge_slack');
    expect(html).toContain('N Boundary');
    expect(html).toContain('Drift S across the zone');
  });

  it('adapts tactical advice for demersal species bottom structure', () => {
    const areaDemersal: FishingArea = {
      ...baseArea,
      type: 'demersal',
      currentSpeed: 0.40,
      currentHeading: 270,
    };
    const html = renderToStaticMarkup(
      React.createElement(AreaDetails, { area: areaDemersal, copy: DASHBOARD_COPY.en })
    );

    expect(html).toContain('E Boundary');
    expect(html).toContain('Drift W across the zone');
    expect(html).toContain('Current sweeps W into the reef slope');
    expect(html).toContain('Fish or anchor along the up-current (E) face');
  });

  it('renders localized terms in Tagalog, Cebuano, and Hiligaynon', () => {
    const areaWithDrift: FishingArea = {
      ...baseArea,
      currentSpeed: 0.35,
      currentHeading: 45,
    };

    // Tagalog
    const htmlTl = renderToStaticMarkup(
      React.createElement(AreaDetails, { area: areaWithDrift, copy: DASHBOARD_COPY.tl })
    );
    expect(htmlTl).toContain('Bilis ng Agos');
    expect(htmlTl).toContain('Direksiyon ng Drift');
    expect(htmlTl).toContain('Pangunahing Gilid ng Pagkain');

    // Cebuano
    const htmlCeb = renderToStaticMarkup(
      React.createElement(AreaDetails, { area: areaWithDrift, copy: DASHBOARD_COPY.ceb })
    );
    expect(htmlCeb).toContain('Kusog sa Sulog');
    expect(htmlCeb).toContain('Direksiyon sa Drift');
    expect(htmlCeb).toContain('Unang Dapit sa Pagpakaon');

    // Hiligaynon
    const htmlHil = renderToStaticMarkup(
      React.createElement(AreaDetails, { area: areaWithDrift, copy: DASHBOARD_COPY.hil })
    );
    expect(htmlHil).toContain('Kadasigon sang Sulog');
    expect(htmlHil).toContain('Direksiyon sang Drift');
    expect(htmlHil).toContain('Panguna nga Kilid sang Pagkaon');
  });
});
