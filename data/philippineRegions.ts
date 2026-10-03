import { Hotspot, PhilippineRegion } from "../types";

/**
 * Standard Ray-casting algorithm to test whether a coordinate is inside a polygon ring.
 * Coordinates are formatted as [lat, lng].
 */
export function pointInPolygon(point: [number, number], vs: [number, number][]): boolean {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Curated Philippine Administrative & Fisheries Regions
 * Each region includes territorial water polygons and bounds for mapping and scoping.
 */
export const PHILIPPINE_REGIONS: PhilippineRegion[] = [
  {
    id: "reg-7",
    code: "REGION-VII",
    name: "Region VII (Central Visayas)",
    shortName: "Central Visayas",
    fmaZone: "FMA 10 & 11 (Visayan & Bohol Sea)",
    provinces: ["Cebu", "Bohol", "Negros Oriental", "Siquijor"],
    center: [10.3157, 123.8854],
    bounds: [[9.15, 122.95], [11.50, 124.70]],
    coordinates: [
      [11.50, 123.60],
      [11.45, 124.15],
      [11.10, 124.60],
      [10.60, 124.70],
      [10.05, 124.65],
      [9.60, 124.50],
      [9.15, 123.70],
      [9.18, 123.20],
      [9.55, 122.95],
      [10.10, 123.15],
      [10.55, 123.35],
      [11.15, 123.45],
      [11.50, 123.60]
    ]
  },
  {
    id: "reg-5",
    code: "REGION-V",
    name: "Region V (Bicol Region)",
    shortName: "Bicol Region",
    fmaZone: "FMA 7 & 8 (San Miguel Bay & Lagonoy Gulf)",
    provinces: ["Camarines Norte", "Camarines Sur", "Albay", "Sorsogon", "Catanduanes", "Masbate"],
    center: [13.6218, 123.1948],
    bounds: [[11.70, 122.30], [14.65, 124.60]],
    coordinates: [
      [14.65, 122.70],
      [14.50, 123.40],
      [14.20, 124.40],
      [13.60, 124.60],
      [12.80, 124.30],
      [12.40, 124.15],
      [11.70, 123.70],
      [11.85, 123.00],
      [12.50, 122.50],
      [13.40, 122.80],
      [14.15, 122.30],
      [14.65, 122.70]
    ]
  },
  {
    id: "reg-6",
    code: "REGION-VI",
    name: "Region VI (Western Visayas)",
    shortName: "Western Visayas",
    fmaZone: "FMA 10 & 11 (Guimaras Strait & Panay Gulf)",
    provinces: ["Iloilo", "Negros Occidental", "Capiz", "Aklan", "Antique", "Guimaras"],
    center: [10.7202, 122.5621],
    bounds: [[9.00, 121.75], [12.25, 123.60]],
    coordinates: [
      [12.25, 122.05],
      [12.00, 123.25],
      [11.55, 123.60],
      [10.70, 123.45],
      [9.80, 123.10],
      [9.00, 122.80],
      [9.50, 122.15],
      [10.45, 121.80],
      [11.50, 121.75],
      [12.25, 122.05]
    ]
  },
  {
    id: "reg-4a",
    code: "REGION-IV-A",
    name: "Region IV-A (CALABARZON)",
    shortName: "CALABARZON",
    fmaZone: "FMA 5 & 12 (Verde Island Passage & Tayabas Bay)",
    provinces: ["Batangas", "Quezon", "Cavite", "Laguna", "Rizal"],
    center: [14.1008, 121.0794],
    bounds: [[13.20, 120.45], [15.20, 122.65]],
    coordinates: [
      [15.20, 121.50],
      [14.95, 122.10],
      [14.60, 122.65],
      [13.80, 122.50],
      [13.35, 121.70],
      [13.20, 120.95],
      [13.60, 120.45],
      [14.30, 120.55],
      [14.80, 121.15],
      [15.20, 121.50]
    ]
  },
  {
    id: "reg-ncr",
    code: "NCR",
    name: "National Capital Region (Metro Manila)",
    shortName: "Metro Manila",
    fmaZone: "FMA 12 (Manila Bay Zone)",
    provinces: ["Metro Manila", "Navotas", "Manila", "Pasay", "Parañaque", "Las Piñas"],
    center: [14.6042, 120.9822],
    bounds: [[14.35, 120.75], [14.80, 121.15]],
    coordinates: [
      [14.80, 120.88],
      [14.75, 121.12],
      [14.45, 121.15],
      [14.35, 120.95],
      [14.45, 120.75],
      [14.68, 120.82],
      [14.80, 120.88]
    ]
  },
  {
    id: "reg-11",
    code: "REGION-XI",
    name: "Region XI (Davao Region)",
    shortName: "Davao Region",
    fmaZone: "FMA 2 (Davao Gulf & Philippine Sea)",
    provinces: ["Davao del Sur", "Davao City", "Davao Oriental", "Davao de Oro", "Davao Occidental", "Davao del Norte"],
    center: [7.1907, 125.4553],
    bounds: [[5.50, 125.00], [8.00, 126.65]],
    coordinates: [
      [8.00, 125.80],
      [7.85, 126.60],
      [7.00, 126.65],
      [6.30, 126.20],
      [5.50, 125.65],
      [5.65, 125.25],
      [6.80, 125.00],
      [7.50, 125.30],
      [8.00, 125.80]
    ]
  },
  {
    id: "reg-12",
    code: "REGION-XII",
    name: "Region XII (SOCCSKSARGEN)",
    shortName: "SOCCSKSARGEN",
    fmaZone: "FMA 3 (Celebes Sea & Sarangani Bay)",
    provinces: ["South Cotabato", "Sarangani", "Cotabato", "Sultan Kudarat", "General Santos"],
    center: [6.1164, 125.1716],
    bounds: [[5.40, 124.00], [7.25, 125.60]],
    coordinates: [
      [7.25, 124.20],
      [7.10, 125.20],
      [6.40, 125.60],
      [5.60, 125.40],
      [5.40, 124.90],
      [5.80, 124.20],
      [6.60, 124.00],
      [7.25, 124.20]
    ]
  },
  {
    id: "reg-1",
    code: "REGION-I",
    name: "Region I (Ilocos Region)",
    shortName: "Ilocos Region",
    fmaZone: "FMA 6 (Lingayen Gulf & West Philippine Sea)",
    provinces: ["Pangasinan", "La Union", "Ilocos Sur", "Ilocos Norte"],
    center: [16.0433, 120.3333],
    bounds: [[15.70, 119.70], [18.70, 120.95]],
    coordinates: [
      [18.70, 120.55],
      [18.50, 120.95],
      [16.80, 120.80],
      [15.80, 120.60],
      [15.70, 119.90],
      [16.35, 119.70],
      [17.50, 120.20],
      [18.70, 120.55]
    ]
  },
  {
    id: "reg-2",
    code: "REGION-II",
    name: "Region II (Cagayan Valley)",
    shortName: "Cagayan Valley",
    fmaZone: "FMA 1 (Babuyan Channel & Pacific Seaboard)",
    provinces: ["Cagayan", "Isabela", "Batanes", "Quirino", "Nueva Vizcaya"],
    center: [17.6132, 121.7270],
    bounds: [[16.20, 121.10], [19.50, 122.50]],
    coordinates: [
      [19.50, 121.50],
      [19.20, 122.30],
      [18.40, 122.50],
      [16.80, 122.45],
      [16.20, 121.50],
      [16.70, 121.10],
      [18.30, 121.25],
      [19.50, 121.50]
    ]
  },
  {
    id: "reg-9",
    code: "REGION-IX",
    name: "Region IX (Zamboanga Peninsula)",
    shortName: "Zamboanga Peninsula",
    fmaZone: "FMA 4 (Sulu Sea & Basilan Strait)",
    provinces: ["Zamboanga del Sur", "Zamboanga City", "Zamboanga del Norte", "Zamboanga Sibugay"],
    center: [6.9214, 122.0790],
    bounds: [[6.80, 121.75], [8.70, 123.60]],
    coordinates: [
      [8.70, 123.30],
      [8.40, 123.60],
      [7.60, 123.40],
      [7.20, 122.80],
      [6.80, 122.35],
      [6.85, 121.85],
      [7.80, 122.00],
      [8.50, 122.50],
      [8.70, 123.30]
    ]
  },
  {
    id: "reg-4b",
    code: "REGION-IV-B",
    name: "Region IV-B (MIMAROPA)",
    shortName: "MIMAROPA",
    fmaZone: "FMA 5 & 12 (Sulu Sea & Mindoro Strait)",
    provinces: ["Palawan", "Occidental Mindoro", "Oriental Mindoro", "Romblon", "Marinduque"],
    center: [9.8349, 118.7384],
    bounds: [[8.30, 116.90], [13.60, 122.70]],
    coordinates: [
      [13.60, 120.40],
      [13.40, 122.20],
      [12.30, 122.70],
      [11.50, 120.80],
      [10.50, 119.80],
      [8.30, 117.20],
      [8.80, 116.90],
      [11.20, 118.80],
      [12.80, 120.00],
      [13.60, 120.40]
    ]
  },
  {
    id: "reg-8",
    code: "REGION-VIII",
    name: "Region VIII (Eastern Visayas)",
    shortName: "Eastern Visayas",
    fmaZone: "FMA 8 & 9 (Leyte Gulf & Samar Sea)",
    provinces: ["Leyte", "Southern Leyte", "Samar", "Eastern Samar", "Northern Samar", "Biliran"],
    center: [11.2444, 125.0039],
    bounds: [[9.80, 124.20], [12.80, 125.95]],
    coordinates: [
      [12.80, 124.50],
      [12.55, 125.40],
      [11.80, 125.75],
      [10.80, 125.95],
      [9.80, 125.30],
      [10.40, 124.60],
      [11.30, 124.20],
      [12.20, 124.30],
      [12.80, 124.50]
    ]
  },
  {
    id: "reg-10",
    code: "REGION-X",
    name: "Region X (Northern Mindanao)",
    shortName: "Northern Mindanao",
    fmaZone: "FMA 9 & 11 (Bohol Sea & Macajalar Bay)",
    provinces: ["Misamis Oriental", "Misamis Occidental", "Bukidnon", "Camiguin", "Lanao del Norte"],
    center: [8.4822, 124.6472],
    bounds: [[7.70, 123.60], [9.35, 125.30]],
    coordinates: [
      [9.35, 124.70],
      [9.10, 125.25],
      [8.30, 125.30],
      [7.70, 124.80],
      [7.90, 123.80],
      [8.50, 123.60],
      [8.90, 124.40],
      [9.35, 124.70]
    ]
  },
  {
    id: "reg-13",
    code: "REGION-XIII",
    name: "Region XIII (Caraga)",
    shortName: "Caraga Region",
    fmaZone: "FMA 1 & 2 (Surigao Strait & Philippine Sea)",
    provinces: ["Surigao del Norte", "Surigao del Sur", "Agusan del Norte", "Agusan del Sur", "Dinagat Islands"],
    center: [8.9515, 125.5288],
    bounds: [[7.90, 125.20], [10.40, 126.40]],
    coordinates: [
      [10.40, 125.60],
      [9.95, 126.25],
      [9.10, 126.40],
      [7.90, 126.30],
      [8.20, 125.50],
      [9.00, 125.20],
      [9.80, 125.40],
      [10.40, 125.60]
    ]
  },
  {
    id: "reg-3",
    code: "REGION-III",
    name: "Region III (Central Luzon)",
    shortName: "Central Luzon",
    fmaZone: "FMA 6 & 12 (Subic Bay & West Philippine Sea)",
    provinces: ["Bataan", "Zambales", "Aurora", "Pampanga", "Bulacan", "Tarlac", "Nueva Ecija"],
    center: [15.1500, 120.4000],
    bounds: [[14.40, 119.80], [16.45, 122.25]],
    coordinates: [
      [16.45, 122.00],
      [15.80, 121.75],
      [15.20, 121.40],
      [14.70, 120.75],
      [14.40, 120.50],
      [14.80, 120.15],
      [15.60, 119.80],
      [16.00, 120.25],
      [16.45, 122.00]
    ]
  },
  {
    id: "reg-barmm",
    code: "BARMM",
    name: "Bangsamoro (BARMM)",
    shortName: "Bangsamoro",
    fmaZone: "FMA 3 & 4 (Sulu Archipelago & Moro Gulf)",
    provinces: ["Sulu", "Tawi-Tawi", "Basilan", "Maguindanao", "Lanao del Sur"],
    center: [5.0500, 119.9500],
    bounds: [[4.60, 119.20], [7.70, 124.50]],
    coordinates: [
      [7.70, 124.30],
      [6.90, 124.40],
      [6.50, 122.20],
      [6.00, 121.10],
      [5.10, 120.10],
      [4.60, 119.30],
      [5.20, 119.20],
      [6.30, 121.00],
      [7.40, 123.50],
      [7.70, 124.30]
    ]
  }
];

/**
 * Calculates Euclidean distance squared between two points.
 */
function distSq(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  return dLat * dLat + dLng * dLng;
}

/**
 * Automatically detects the corresponding PhilippineRegion from coordinates and/or geocoded text.
 */
export function detectPhilippineRegion(
  lat: number,
  lng: number,
  addressText?: string
): PhilippineRegion {
  const normalizedText = (addressText || "").toLowerCase();

  // 1. Text match by province or region name
  if (normalizedText.length > 2) {
    for (const region of PHILIPPINE_REGIONS) {
      if (
        normalizedText.includes(region.shortName.toLowerCase()) ||
        normalizedText.includes(region.code.toLowerCase())
      ) {
        return region;
      }
      for (const prov of region.provinces) {
        if (normalizedText.includes(prov.toLowerCase())) {
          return region;
        }
      }
    }
  }

  // 2. Strict Point-in-Polygon check
  for (const region of PHILIPPINE_REGIONS) {
    if (pointInPolygon([lat, lng], region.coordinates)) {
      return region;
    }
  }

  // 3. Bounding box check with margin
  for (const region of PHILIPPINE_REGIONS) {
    const [[s, w], [n, e]] = region.bounds;
    const margin = 0.25;
    if (lat >= s - margin && lat <= n + margin && lng >= w - margin && lng <= e + margin) {
      return region;
    }
  }

  // 4. Fallback: Nearest regional centroid
  let closest = PHILIPPINE_REGIONS[0];
  let minDistance = Infinity;

  for (const region of PHILIPPINE_REGIONS) {
    const d = distSq(lat, lng, region.center[0], region.center[1]);
    if (d < minDistance) {
      minDistance = d;
      closest = region;
    }
  }

  return closest;
}

/**
 * Checks whether a hotspot or coordinate belongs to an assigned region.
 */
export function isCoordinateInRegion(
  lat: number,
  lng: number,
  regionId?: string | null
): boolean {
  if (!regionId) return true; // Unrestricted if no region assigned
  const region = PHILIPPINE_REGIONS.find((r) => r.id === regionId);
  if (!region) return true;

  // Strict check: coordinate MUST be within the polygon boundary
  return pointInPolygon([lat, lng], region.coordinates);
}

/**
 * Seeded, realistic fishing hotspots per region for immediate high-density coverage.
 */
export const REGIONAL_PRESET_HOTSPOTS: Record<string, Hotspot[]> = {
  // ---------------- Region VII: Central Visayas (Cebu, Bohol, Negros Oriental, Siquijor) ----------------
  "reg-7": [
    {
      id: "cebu-1",
      name: "Bantayan Deep Trench",
      type: "pelagic",
      species: ["Tamban (Clupeidae)", "Galunggong (Carangidae)", "Tulingan (Scombridae)"],
      lat: 11.28,
      lng: 123.65,
      depth: 180,
      catchProbability: 0.93,
      lastUpdated: "Today, 04:15",
      regionId: "reg-7",
      province: "Cebu"
    },
    {
      id: "cebu-2",
      name: "Camotes Sea Coral Ridge",
      type: "demersal",
      species: ["Lapu-lapu (Serranidae)", "Maya-maya (Lutjanidae)", "Bisugo (Nemipteridae)"],
      lat: 10.65,
      lng: 124.35,
      depth: 65,
      catchProbability: 0.88,
      lastUpdated: "Today, 05:00",
      regionId: "reg-7",
      province: "Cebu"
    },
    {
      id: "cebu-3",
      name: "Danao Coastal Bank",
      type: "pelagic",
      species: ["Tulingan (Scombridae)", "Alumahan (Scombridae)", "Tamban (Clupeidae)"],
      lat: 10.52,
      lng: 124.08,
      depth: 120,
      catchProbability: 0.84,
      lastUpdated: "Today, 03:45",
      regionId: "reg-7",
      province: "Cebu"
    },
    {
      id: "cebu-4",
      name: "Tañon Strait North Pass",
      type: "pelagic",
      species: ["Galunggong (Carangidae)", "Dilis (Engraulidae)", "Tamban (Clupeidae)"],
      lat: 10.90,
      lng: 123.48,
      depth: 280,
      catchProbability: 0.91,
      lastUpdated: "Yesterday, 22:30",
      regionId: "reg-7",
      province: "Cebu"
    },
    {
      id: "cebu-5",
      name: "Olango Channel Dropoff",
      type: "demersal",
      species: ["Samaral (Siganidae)", "Bisugo (Nemipteridae)", "Maya-maya (Lutjanidae)"],
      lat: 10.25,
      lng: 124.05,
      depth: 55,
      catchProbability: 0.79,
      lastUpdated: "Today, 06:10",
      regionId: "reg-7",
      province: "Cebu"
    },
    {
      id: "cebu-6",
      name: "Mactan Reef Edge",
      type: "demersal",
      species: ["Lapu-lapu (Serranidae)", "Katambak (Lethrinidae)"],
      lat: 10.28,
      lng: 123.98,
      depth: 45,
      catchProbability: 0.82,
      lastUpdated: "Today, 04:50",
      regionId: "reg-7",
      province: "Cebu"
    },
    {
      id: "cebu-7",
      name: "Badian-Moalboal Reef Basin",
      type: "both",
      species: ["Kipalkipal (Belonidae)", "Tamban (Clupeidae)", "Samaral (Siganidae)"],
      lat: 9.85,
      lng: 123.35,
      depth: 110,
      catchProbability: 0.76,
      lastUpdated: "Yesterday, 19:20",
      regionId: "reg-7",
      province: "Cebu"
    },
    {
      id: "cebu-8",
      name: "Danajon Bank Double Barrier",
      type: "demersal",
      species: ["Maya-maya (Lutjanidae)", "Samaral (Siganidae)", "Bisugo (Nemipteridae)"],
      lat: 10.18,
      lng: 124.32,
      depth: 40,
      catchProbability: 0.89,
      lastUpdated: "Today, 05:40",
      regionId: "reg-7",
      province: "Bohol"
    },
    {
      id: "cebu-9",
      name: "Bohol Sea - Oslob Shoal",
      type: "pelagic",
      species: ["Tulingan (Scombridae)", "Galunggong (Carangidae)", "Bahi (Belonidae)"],
      lat: 9.48,
      lng: 123.42,
      depth: 320,
      catchProbability: 0.95,
      lastUpdated: "Today, 02:40",
      regionId: "reg-7",
      province: "Cebu"
    }
  ],

  // ---------------- Region V: Bicol Region (Camarines Norte, etc.) ----------------
  "reg-5": [
    {
      id: "bicol-1",
      name: "Apo-Mercedes Deep",
      type: "pelagic",
      species: ["Tamban (Clupeidae)", "Tulingan (Scombridae)", "Galunggong (Carangidae)"],
      lat: 14.25,
      lng: 123.15,
      depth: 450,
      catchProbability: 0.94,
      lastUpdated: "Today, 04:00",
      regionId: "reg-5",
      province: "Camarines Norte"
    },
    {
      id: "bicol-2",
      name: "San Miguel Bay East",
      type: "demersal",
      species: ["Lapu-lapu (Serranidae)", "Maya-maya (Lutjanidae)", "Bisugo (Nemipteridae)"],
      lat: 13.92,
      lng: 123.32,
      depth: 45,
      catchProbability: 0.86,
      lastUpdated: "Today, 05:30",
      regionId: "reg-5",
      province: "Camarines Sur"
    },
    {
      id: "bicol-3",
      name: "Lagonoy Gulf Basin",
      type: "pelagic",
      species: ["Tulingan (Scombridae)", "Tamban (Clupeidae)"],
      lat: 13.60,
      lng: 123.75,
      depth: 250,
      catchProbability: 0.75,
      lastUpdated: "Today, 05:00",
      regionId: "reg-5",
      province: "Albay"
    },
    {
      id: "bicol-4",
      name: "San Bernardino Passage",
      type: "pelagic",
      species: ["Tulingan (Scombridae)", "Galunggong (Carangidae)"],
      lat: 12.55,
      lng: 124.15,
      depth: 320,
      catchProbability: 0.96,
      lastUpdated: "Today, 07:05",
      regionId: "reg-5",
      province: "Sorsogon"
    },
    {
      id: "bicol-5",
      name: "Mercedes Shoreline Bank",
      type: "pelagic",
      species: ["Galunggong (Carangidae)", "Dilis (Engraulidae)"],
      lat: 14.05,
      lng: 123.05,
      depth: 35,
      catchProbability: 0.89,
      lastUpdated: "Today, 04:45",
      regionId: "reg-5",
      province: "Camarines Norte"
    }
  ],

  // ---------------- Region VI: Western Visayas (Iloilo, etc.) ----------------
  "reg-6": [
    {
      id: "wv-1",
      name: "Estancia Shoreline Shelf",
      type: "pelagic",
      species: ["Tamban (Clupeidae)", "Galunggong (Carangidae)"],
      lat: 11.45,
      lng: 123.18,
      depth: 45,
      catchProbability: 0.92,
      lastUpdated: "Today, 04:30",
      regionId: "reg-6",
      province: "Iloilo"
    },
    {
      id: "wv-2",
      name: "Gigantes Islands Shoal",
      type: "both",
      species: ["Galunggong (Carangidae)", "Bisugo (Nemipteridae)", "Samaral (Siganidae)"],
      lat: 11.55,
      lng: 123.35,
      depth: 55,
      catchProbability: 0.85,
      lastUpdated: "Today, 03:00",
      regionId: "reg-6",
      province: "Iloilo"
    },
    {
      id: "wv-3",
      name: "Guimaras Strait Reef",
      type: "demersal",
      species: ["Lapu-lapu (Serranidae)", "Maya-maya (Lutjanidae)"],
      lat: 10.55,
      lng: 122.75,
      depth: 38,
      catchProbability: 0.83,
      lastUpdated: "Today, 05:15",
      regionId: "reg-6",
      province: "Guimaras"
    },
    {
      id: "wv-4",
      name: "Panay Gulf Ridge",
      type: "pelagic",
      species: ["Tulingan (Scombridae)", "Tamban (Clupeidae)"],
      lat: 10.25,
      lng: 122.40,
      depth: 280,
      catchProbability: 0.89,
      lastUpdated: "Yesterday, 23:00",
      regionId: "reg-6",
      province: "Iloilo"
    }
  ],

  // ---------------- Region IV-A: CALABARZON (Batangas, Quezon) ----------------
  "reg-4a": [
    {
      id: "cal-1",
      name: "Verde Island Passage Deep",
      type: "pelagic",
      species: ["Tulingan (Scombridae)", "Galunggong (Carangidae)", "Alumahan (Scombridae)"],
      lat: 13.55,
      lng: 120.95,
      depth: 320,
      catchProbability: 0.96,
      lastUpdated: "Today, 04:10",
      regionId: "reg-4a",
      province: "Batangas"
    },
    {
      id: "cal-2",
      name: "Tayabas Bay Bank",
      type: "both",
      species: ["Maya-maya (Lutjanidae)", "Samaral (Siganidae)"],
      lat: 13.70,
      lng: 121.85,
      depth: 50,
      catchProbability: 0.74,
      lastUpdated: "Today, 04:30",
      regionId: "reg-4a",
      province: "Quezon"
    },
    {
      id: "cal-3",
      name: "Batangas Coastal Pier Basin",
      type: "demersal",
      species: ["Lapu-lapu (Serranidae)", "Bisugo (Nemipteridae)"],
      lat: 13.72,
      lng: 121.02,
      depth: 60,
      catchProbability: 0.81,
      lastUpdated: "Today, 05:20",
      regionId: "reg-4a",
      province: "Batangas"
    },
    {
      id: "cal-4",
      name: "Real Polillo Strait",
      type: "pelagic",
      species: ["Tamban (Clupeidae)", "Tulingan (Scombridae)"],
      lat: 14.70,
      lng: 121.65,
      depth: 180,
      catchProbability: 0.88,
      lastUpdated: "Today, 03:50",
      regionId: "reg-4a",
      province: "Quezon"
    }
  ],

  // ---------------- NCR: Metro Manila (Navotas) ----------------
  "reg-ncr": [
    {
      id: "ncr-1",
      name: "Navotas Outer Roadstead",
      type: "pelagic",
      species: ["Tamban (Clupeidae)", "Dilis (Engraulidae)", "Galunggong (Carangidae)"],
      lat: 14.65,
      lng: 120.90,
      depth: 25,
      catchProbability: 0.86,
      lastUpdated: "Today, 04:00",
      regionId: "reg-ncr",
      province: "Metro Manila"
    },
    {
      id: "ncr-2",
      name: "Manila Bay Western Shallows",
      type: "demersal",
      species: ["Bisugo (Nemipteridae)", "Samaral (Siganidae)"],
      lat: 14.55,
      lng: 120.82,
      depth: 22,
      catchProbability: 0.78,
      lastUpdated: "Today, 05:15",
      regionId: "reg-ncr",
      province: "Metro Manila"
    }
  ],

  // ---------------- Region XI: Davao Region ----------------
  "reg-11": [
    {
      id: "dav-1",
      name: "Davao Gulf Center Basin",
      type: "pelagic",
      species: ["Tulingan (Scombridae)", "Tamban (Clupeidae)", "Galunggong (Carangidae)"],
      lat: 7.02,
      lng: 125.75,
      depth: 600,
      catchProbability: 0.94,
      lastUpdated: "Today, 04:30",
      regionId: "reg-11",
      province: "Davao del Sur"
    },
    {
      id: "dav-2",
      name: "Samal Island East Ridge",
      type: "demersal",
      species: ["Lapu-lapu (Serranidae)", "Katambak (Lethrinidae)"],
      lat: 7.08,
      lng: 125.78,
      depth: 85,
      catchProbability: 0.87,
      lastUpdated: "Today, 06:00",
      regionId: "reg-11",
      province: "Davao del Norte"
    }
  ],

  // ---------------- Region XII: SOCCSKSARGEN ----------------
  "reg-12": [
    {
      id: "soc-1",
      name: "Sarangani Bay Shore",
      type: "demersal",
      species: ["Katambak (Lethrinidae)", "Lapu-lapu (Serranidae)"],
      lat: 6.05,
      lng: 125.15,
      depth: 75,
      catchProbability: 0.85,
      lastUpdated: "Today, 06:45",
      regionId: "reg-12",
      province: "South Cotabato"
    },
    {
      id: "soc-2",
      name: "Celebes Trench Edge",
      type: "pelagic",
      species: ["Tulingan (Scombridae)", "Tamban (Clupeidae)"],
      lat: 5.80,
      lng: 124.50,
      depth: 1500,
      catchProbability: 0.92,
      lastUpdated: "Today, 01:10",
      regionId: "reg-12",
      province: "Sarangani"
    }
  ]
};

/**
 * Gets all hotspots belonging to a specific region, or returns fallback hotspots.
 */
export function getHotspotsForRegion(regionId: string, globalHotspots?: Hotspot[]): Hotspot[] {
  // If we have curated regional preset hotspots, use them as primary or merge (strictly filtered)
  const regionalPresets = (REGIONAL_PRESET_HOTSPOTS[regionId] || []).filter((h) =>
    isCoordinateInRegion(h.lat ?? h.position?.[0] ?? 0, h.lng ?? h.position?.[1] ?? 0, regionId)
  );

  if (globalHotspots && globalHotspots.length > 0) {
    const matched = globalHotspots.filter((h) => {
      return isCoordinateInRegion(h.lat ?? h.position?.[0] ?? 0, h.lng ?? h.position?.[1] ?? 0, regionId);
    });

    if (matched.length > 0) {
      // Merge unique by id
      const combined = [...matched];
      for (const preset of regionalPresets) {
        if (!combined.some((c) => c.id === preset.id)) {
          combined.push(preset);
        }
      }
      return combined;
    }
  }

  return regionalPresets;
}
