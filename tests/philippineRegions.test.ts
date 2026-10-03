import { describe, it, expect } from "vitest";
import {
  detectPhilippineRegion,
  isCoordinateInRegion,
  getHotspotsForRegion,
  PHILIPPINE_REGIONS,
} from "../data/philippineRegions";

describe("Philippine Regional Scoping Engine", () => {
  it("detects Region VII (Central Visayas) when selecting Cebu by coordinates", () => {
    // Cebu City coordinates
    const region = detectPhilippineRegion(10.3157, 123.8854);
    expect(region.id).toBe("reg-7");
    expect(region.name).toContain("Central Visayas");
    expect(region.provinces).toContain("Cebu");
  });

  it("detects Region VII when searching with text containing Cebu", () => {
    const region = detectPhilippineRegion(10.3157, 123.8854, "Cebu Port Pier 1, Cebu City");
    expect(region.id).toBe("reg-7");
  });

  it("detects Region V (Bicol) for Mercedes Fish Port in Camarines Norte", () => {
    const region = detectPhilippineRegion(14.0122, 123.0114, "Mercedes Fish Port, Camarines Norte");
    expect(region.id).toBe("reg-5");
    expect(region.provinces).toContain("Camarines Norte");
  });

  it("detects Region VI (Western Visayas) for Estancia, Iloilo", () => {
    const region = detectPhilippineRegion(11.4552, 123.1491, "Estancia Shoreline Port, Iloilo");
    expect(region.id).toBe("reg-6");
    expect(region.provinces).toContain("Iloilo");
  });

  it("restricts coordinates correctly with isCoordinateInRegion", () => {
    // Bantayan Island (inside Cebu / Region VII)
    expect(isCoordinateInRegion(11.28, 123.65, "reg-7")).toBe(true);

    // Mactan Island (inside Cebu / Region VII)
    expect(isCoordinateInRegion(10.28, 123.98, "reg-7")).toBe(true);

    // Mercedes, Camarines Norte (Region V) should NOT be in Region VII
    expect(isCoordinateInRegion(14.0122, 123.0114, "reg-7")).toBe(false);

    // General Santos, South Cotabato (Region XII) should NOT be in Region VII
    expect(isCoordinateInRegion(6.0592, 125.1436, "reg-7")).toBe(false);
  });

  it("returns rich localized hotspots strictly for Cebu / Region VII", () => {
    const cebuHotspots = getHotspotsForRegion("reg-7");
    expect(cebuHotspots.length).toBeGreaterThanOrEqual(5);

    // Verify all returned hotspots are within Region VII
    for (const spot of cebuHotspots) {
      expect(spot.regionId).toBe("reg-7");
      expect(isCoordinateInRegion(spot.lat, spot.lng, "reg-7")).toBe(true);
    }
  });

  it("guarantees every preset hotspot across every Philippine region is strictly within its regional polygon", () => {
    for (const region of PHILIPPINE_REGIONS) {
      const hotspots = getHotspotsForRegion(region.id);
      for (const spot of hotspots) {
        const isInside = isCoordinateInRegion(spot.lat, spot.lng, region.id);
        expect(
          isInside,
          `Hotspot ${spot.id} (${spot.name}) at [${spot.lat}, ${spot.lng}] is outside ${region.name} polygon`
        ).toBe(true);
      }
    }
  });
});
