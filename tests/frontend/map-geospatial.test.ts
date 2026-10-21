import { describe, expect, it } from 'vitest';
import {
  calculateArcCoordinates,
  calculateGeographicStreamlines,
  getCompassDirection,
  getDownstreamBadgeHtml,
  getDownstreamDriftCoordinates,
  getStreamlinesSvgHtml,
  getUpstreamBadgeHtml,
  getUpstreamFeedingCoordinates,
  HOTSPOT_FLOW_PALETTE,
} from '@/lib/frontend/hotspot-flow';

describe('Map Geospatial & Ocean Current Flow Visualization', () => {
  describe('getCompassDirection', () => {
    it('correctly maps cardinal and intercardinal compass directions', () => {
      expect(getCompassDirection(0)).toBe('N');
      expect(getCompassDirection(360)).toBe('N');
      expect(getCompassDirection(45)).toBe('NE');
      expect(getCompassDirection(90)).toBe('E');
      expect(getCompassDirection(135)).toBe('SE');
      expect(getCompassDirection(180)).toBe('S');
      expect(getCompassDirection(225)).toBe('SW');
      expect(getCompassDirection(270)).toBe('W');
      expect(getCompassDirection(315)).toBe('NW');
    });

    it('handles negative angles or angles > 360 gracefully', () => {
      expect(getCompassDirection(-90)).toBe('W');
      expect(getCompassDirection(450)).toBe('E');
    });
  });

  describe('calculateArcCoordinates', () => {
    it('generates an arc spanning 90 degrees around center angle', () => {
      const centerLat = 10.5;
      const centerLng = 124.0;
      const radiusKm = 9.0;
      const upstreamAngle = 270; // West

      const arc = calculateArcCoordinates(centerLat, centerLng, radiusKm, upstreamAngle, 90, 3);
      expect(arc.length).toBeGreaterThanOrEqual(30);

      // Verify all points are valid numbers
      for (const [lat, lng] of arc) {
        expect(Number.isFinite(lat)).toBe(true);
        expect(Number.isFinite(lng)).toBe(true);
      }

      // Check start angle (270 - 45 = 225 deg: SW, cos negative, sin negative)
      const first = arc[0];
      expect(first[0]).toBeLessThan(centerLat);
      expect(first[1]).toBeLessThan(centerLng);

      // Check middle point (270 deg: West, cos = 0, sin = -1)
      const mid = arc[Math.floor(arc.length / 2)];
      expect(Math.abs(mid[0] - centerLat)).toBeLessThan(0.01);
      expect(mid[1]).toBeLessThan(centerLng);

      // Check end angle (270 + 45 = 315 deg: NW, cos positive, sin negative)
      const last = arc[arc.length - 1];
      expect(last[0]).toBeGreaterThan(centerLat);
      expect(last[1]).toBeLessThan(centerLng);
    });

    it('handles 360 degree wraparound seamlessly', () => {
      const centerLat = 12.0;
      const centerLng = 121.0;
      const arc = calculateArcCoordinates(centerLat, centerLng, 9.0, 350, 90, 5);
      expect(arc.length).toBe(19);
      for (const [lat, lng] of arc) {
        expect(Number.isFinite(lat)).toBe(true);
        expect(Number.isFinite(lng)).toBe(true);
      }
    });
  });

  describe('Upstream and Downstream Geographic Coordinates', () => {
    it('calculates upstream feeding edge coordinates exactly opposite to drift direction', () => {
      const lat = 10.0;
      const lng = 125.0;
      const radiusKm = 9.0;
      const heading = 90; // Water flowing East -> upstream is West (270°)

      const upstream = getUpstreamFeedingCoordinates(lat, lng, radiusKm, heading);
      expect(upstream.angle).toBe(270);
      expect(Math.abs(upstream.lat - lat)).toBeLessThan(0.001); // West: latitude unchanged
      expect(upstream.lng).toBeLessThan(lng); // West: longitude decreases
    });

    it('calculates downstream drift path rim coordinates in the drift direction', () => {
      const lat = 10.0;
      const lng = 125.0;
      const radiusKm = 9.0;
      const heading = 90; // Water flowing East

      const downstream = getDownstreamDriftCoordinates(lat, lng, radiusKm, heading);
      expect(Math.abs(downstream.lat - lat)).toBeLessThan(0.001); // East: latitude unchanged
      expect(downstream.lng).toBeGreaterThan(lng); // East: longitude increases
    });
  });

  describe('Ocean Current Streamlines & Badges', () => {
    it('exports professional nautical marine palette with high-contrast accessibility', () => {
      expect(HOTSPOT_FLOW_PALETTE.pelagic.streamline).toBe('#0284C7');
      expect(HOTSPOT_FLOW_PALETTE.pelagic.badgeAccent).toBe('#38BDF8');
      expect(HOTSPOT_FLOW_PALETTE.pelagic.arcMain).toBe('#2563EB');
      expect(HOTSPOT_FLOW_PALETTE.demersal.streamline).toBe('#D97706');
      expect(HOTSPOT_FLOW_PALETTE.demersal.badgeAccent).toBe('#FBBF24');
      expect(HOTSPOT_FLOW_PALETTE.drift.border).toBe('#475569');
      expect(HOTSPOT_FLOW_PALETTE.drift.text).toBe('#E2E8F0');
    });

    it('getStreamlinesSvgHtml generates 3 parallel streamline flow vectors with default nautical cobalt and excludes UP-CURRENT text', () => {
      const html = getStreamlinesSvgHtml(135);
      expect(html).toContain('rotate(135)');
      expect(html).toContain('stroke-dasharray');
      // Uses sleek nautical oceanic azure by default
      expect(html).toContain('#0284C7');
      expect(html).not.toContain('#10B981');
      // Must NOT contain the old awkward rotated UP-CURRENT label
      expect(html).not.toContain('UP-CURRENT');
      // Contains 3 parallel streamlines (left x=-34, center x=0, right x=34)
      expect(html).toContain('x1="-34"');
      expect(html).toContain('x1="0"');
      expect(html).toContain('x1="34"');
      // Contains directional arrowheads with tapered nautical navigation points
      expect(html).toContain('<polygon points="0,-82 -3.5,-70 3.5,-70"');
      expect(html).toContain('<polygon points="-34,-60 -36.5,-50 -31.5,-50"');
      expect(html).toContain('<polygon points="34,-60 31.5,-50 36.5,-50"');
    });

    it('getUpstreamBadgeHtml formats upright prime feeding edge badge with dark nautical pill and cyan accent', () => {
      const html = getUpstreamBadgeHtml();
      expect(html).toContain('🎯 Prime Feeding Edge (Up-Current)');
      expect(html).toContain('background:rgba(15, 23, 42, 0.92)');
      expect(html).toContain('color:#FFFFFF');
      expect(html).toContain('border:1.5px solid #38BDF8');
      expect(html).toContain('pointer-events:none');
      expect(html).not.toContain('#064E3B');
      expect(html).not.toContain('#10B981');

      // Demersal variant with warm amber accent and simplified clear label
      const demHtml = getUpstreamBadgeHtml(true, false);
      expect(demHtml).toContain('🎯 Up-Current Reef Face (Feeding Slope)');
      expect(demHtml).toContain('border:1.5px solid #FBBF24');
      expect(demHtml).toContain('color:#FFFFFF');
      expect(demHtml).not.toContain('#78350F');

      // Pelagic compact variant
      const compactHtml = getUpstreamBadgeHtml(false, true);
      expect(compactHtml).toContain('🎯 Feeding Edge');
      expect(compactHtml).not.toContain('(Up-Current)');
      expect(compactHtml).toContain('border:1.5px solid #38BDF8');

      // Demersal compact variant
      const demCompactHtml = getUpstreamBadgeHtml(true, true);
      expect(demCompactHtml).toContain('🎯 Reef Face');
      expect(demCompactHtml).not.toContain('Feeding Slope');
      expect(demCompactHtml).toContain('border:1.5px solid #FBBF24');
    });

    it('getDownstreamBadgeHtml formats upright drift path telemetry badge with dark pill and light text', () => {
      const html = getDownstreamBadgeHtml(85, 0.42);
      expect(html).toContain('🧭 Drift Path · 85° E (0.42 m/s)');
      expect(html).toContain('background:rgba(15, 23, 42, 0.92)');
      expect(html).toContain('color:#E2E8F0');
      expect(html).toContain('border:1px solid #475569');
      expect(html).toContain('pointer-events:none');

      // Compact variant
      const compactHtml = getDownstreamBadgeHtml(85, 0.42, true);
      expect(compactHtml).toContain('🧭 85° E');
      expect(compactHtml).not.toContain('Drift Path');
      expect(compactHtml).toContain('border:1px solid #475569');
    });

    it('calculateGeographicStreamlines scales with radius, slims arrowhead geometry, and flows in heading direction', () => {
      const lat = 10.0;
      const lng = 124.0;
      const radiusKm = 9.0;
      const heading = 0; // North flow

      const flow = calculateGeographicStreamlines(lat, lng, radiusKm, heading);
      expect(flow.center.line.length).toBe(2);
      expect(flow.left.line.length).toBe(2);
      expect(flow.right.line.length).toBe(2);

      // In North flow, start is South of center (lower lat), end is North of center (higher lat)
      expect(flow.center.line[0][0]).toBeLessThan(lat);
      expect(flow.center.line[1][0]).toBeGreaterThan(lat);

      // Arrowhead points North and has slim, tapered nautical navigation geometry
      const tip = flow.center.arrowHead[0];
      const leftWing = flow.center.arrowHead[1];
      const rightWing = flow.center.arrowHead[2];
      expect(tip[0]).toBeGreaterThan(flow.center.line[1][0]);

      // Center arrowhead length = 0.11 * radiusKm (0.99 km / 111 deg)
      const cosLat = Math.cos((lat * Math.PI) / 180);
      const expectedTipLengthDeg = (0.11 * radiusKm) / 111.0;
      expect(tip[0] - flow.center.line[1][0]).toBeCloseTo(expectedTipLengthDeg, 4);

      // Center arrowhead width = 0.06 * radiusKm (0.54 km / (111 * cosLat))
      const expectedWidthDeg = (0.06 * radiusKm) / (111.0 * cosLat);
      expect(rightWing[1] - leftWing[1]).toBeCloseTo(expectedWidthDeg, 4);

      // Left streamline is West (lower lng) of center
      expect(flow.left.line[0][1]).toBeLessThan(lng);
      // Right streamline is East (higher lng) of center
      expect(flow.right.line[0][1]).toBeGreaterThan(lng);

      // Check demersal 3 km scaling (should span 1/3 the geographic distance)
      const demFlow = calculateGeographicStreamlines(lat, lng, 3.0, heading);
      const demSpan = demFlow.center.line[1][0] - demFlow.center.line[0][0];
      const pelSpan = flow.center.line[1][0] - flow.center.line[0][0];
      expect(demSpan).toBeCloseTo(pelSpan / 3, 3);
    });
  });
});
