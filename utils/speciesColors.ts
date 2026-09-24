export const GENERAL_PELAGIC_SHADES: SpeciesShades = {
  light: "#94A3B8",   // 60-69%: Light Slate (Steel Blue)
  medium: "#64748B",  // 70-79%: Medium Slate
  dark: "#475569",    // 80-89%: Dark Slate
  deepest: "#1E293B", // 90-100%: Deep Navy Slate
};
export const GENERAL_PELAGIC_COLOR = GENERAL_PELAGIC_SHADES.medium; // #64748B

export const GENERAL_DEMERSAL_SHADES: SpeciesShades = {
  light: "#D6D3D1",   // 60-69%: Light Warm Stone
  medium: "#A8A29E",  // 70-79%: Medium Stone
  dark: "#78716C",    // 80-89%: Dark Stone
  deepest: "#44403C", // 90-100%: Deep Seabed Stone
};
export const GENERAL_DEMERSAL_COLOR = GENERAL_DEMERSAL_SHADES.medium; // #A8A29E

export interface SpeciesShades {
  light: string;   // 60-69% (Light Shade)
  medium: string;  // 70-79% (Medium Shade)
  dark: string;    // 80-89% (Dark Shade)
  deepest: string; // 90-100% (Deepest/Darkest Shade)
}

export interface SpeciesConfig {
  name: string;
  family: string;
  localName: string;
  desc: string;
  color: string; // Primary base hex color code (Medium shade)
  shades: SpeciesShades; // 4-tier catch probability color gradient palette
  bgLight: string;
  bgSoft: string;
  border: string;
  text: string;
  ring: string;
}

export const CATEGORIZED_SPECIES: { pelagic: SpeciesConfig[]; demersal: SpeciesConfig[] } = {
  pelagic: [
    {
      name: "Tamban / Tunsoy",
      family: "Clupeidae",
      localName: "Family: Clupeidae (Sardines & Herrings)",
      desc: "Upper Ocean Pelagic",
      color: "#F97316", // Medium Orange
      shades: {
        light: "#FFB74D",   // 60-69%: Light Orange
        medium: "#F97316",  // 70-79%: Medium Orange
        dark: "#EA580C",    // 80-89%: Dark Orange
        deepest: "#9A3412", // 90-100%: Deep/Darkest Orange
      },
      bgLight: "bg-orange-500",
      bgSoft: "bg-orange-50",
      border: "border-orange-500",
      text: "text-orange-700",
      ring: "ring-orange-400"
    },
    {
      name: "Galunggong / Talakitok",
      family: "Carangidae",
      localName: "Family: Carangidae (Jacks & Scads)",
      desc: "Upper & Coastal Water",
      color: "#10B981", // Medium Emerald Green
      shades: {
        light: "#6EE7B7",   // 60-69%: Light Emerald
        medium: "#10B981",  // 70-79%: Medium Emerald
        dark: "#047857",    // 80-89%: Dark Emerald
        deepest: "#064E3B", // 90-100%: Deep Emerald
      },
      bgLight: "bg-emerald-500",
      bgSoft: "bg-emerald-50",
      border: "border-emerald-500",
      text: "text-emerald-700",
      ring: "ring-emerald-400"
    },
    {
      name: "Alumahan / Tulingan / Bariles",
      family: "Scombridae",
      localName: "Family: Scombridae (Mackerels & Tunas)",
      desc: "Oceanic Pelagic",
      color: "#2563EB", // Medium Royal Blue
      shades: {
        light: "#93C5FD",   // 60-69%: Light Royal Blue
        medium: "#2563EB",  // 70-79%: Medium Royal Blue
        dark: "#1D4ED8",    // 80-89%: Dark Royal Blue
        deepest: "#1E3A8A", // 90-100%: Deep Navy Blue
      },
      bgLight: "bg-blue-600",
      bgSoft: "bg-blue-50",
      border: "border-blue-600",
      text: "text-blue-700",
      ring: "ring-blue-400"
    },
    {
      name: "Dilis",
      family: "Engraulidae",
      localName: "Family: Engraulidae (Anchovies)",
      desc: "Coastal Surface Water",
      color: "#8B5CF6", // Medium Violet / Purple
      shades: {
        light: "#DDD6FE",   // 60-69%: Light Violet
        medium: "#8B5CF6",  // 70-79%: Medium Violet
        dark: "#6D28D9",    // 80-89%: Dark Violet
        deepest: "#4C1D95", // 90-100%: Deep Purple
      },
      bgLight: "bg-violet-500",
      bgSoft: "bg-violet-50",
      border: "border-violet-500",
      text: "text-violet-700",
      ring: "ring-violet-400"
    },
    {
      name: "Kipalkipal / Bahi",
      family: "Belonidae",
      localName: "Family: Belonidae (Needlefishes)",
      desc: "Surface Water Column",
      color: "#06B6D4", // Medium Cyan / Teal
      shades: {
        light: "#A5F3FC",   // 60-69%: Light Cyan
        medium: "#06B6D4",  // 70-79%: Medium Teal
        dark: "#0E7490",    // 80-89%: Dark Teal
        deepest: "#164E63", // 90-100%: Deep Cyan-Blue
      },
      bgLight: "bg-cyan-500",
      bgSoft: "bg-cyan-50",
      border: "border-cyan-500",
      text: "text-cyan-700",
      ring: "ring-cyan-400"
    },
  ],
  demersal: [
    {
      name: "Lapu-lapu",
      family: "Serranidae",
      localName: "Family: Serranidae (Groupers)",
      desc: "Coral Reef & Rocky Seabed",
      color: "#D97706", // Medium Amber / Gold
      shades: {
        light: "#FDE68A",   // 60-69%: Light Amber
        medium: "#D97706",  // 70-79%: Medium Amber
        dark: "#B45309",    // 80-89%: Dark Amber
        deepest: "#78350F", // 90-100%: Deep Golden-Brown
      },
      bgLight: "bg-amber-600",
      bgSoft: "bg-amber-50",
      border: "border-amber-600",
      text: "text-amber-800",
      ring: "ring-amber-400"
    },
    {
      name: "Maya-maya",
      family: "Lutjanidae",
      localName: "Family: Lutjanidae (Snappers)",
      desc: "Deep Reef Floor",
      color: "#EF4444", // Medium Red
      shades: {
        light: "#FCA5A5",   // 60-69%: Light Red
        medium: "#EF4444",  // 70-79%: Medium Red
        dark: "#B91C1C",    // 80-89%: Dark Red
        deepest: "#7F1D1D", // 90-100%: Deep Crimson
      },
      bgLight: "bg-red-500",
      bgSoft: "bg-red-50",
      border: "border-red-500",
      text: "text-red-700",
      ring: "ring-red-400"
    },
    {
      name: "Bisugo",
      family: "Nemipteridae",
      localName: "Family: Nemipteridae (Threadfin Breams)",
      desc: "Mud & Sand Seabed",
      color: "#EC4899", // Medium Pink / Rose
      shades: {
        light: "#FBCFE8",   // 60-69%: Light Pink
        medium: "#EC4899",  // 70-79%: Medium Pink
        dark: "#BE185D",    // 80-89%: Dark Rose
        deepest: "#831843", // 90-100%: Deep Magenta
      },
      bgLight: "bg-pink-500",
      bgSoft: "bg-pink-50",
      border: "border-pink-500",
      text: "text-pink-700",
      ring: "ring-pink-400"
    },
    {
      name: "Samaral",
      family: "Siganidae",
      localName: "Family: Siganidae (Rabbitfishes)",
      desc: "Reef & Seagrass Beds",
      color: "#65A30D", // Medium Lime / Chartreuse
      shades: {
        light: "#D9F99D",   // 60-69%: Light Lime
        medium: "#65A30D",  // 70-79%: Medium Lime
        dark: "#4D7C0F",    // 80-89%: Dark Olive
        deepest: "#365314", // 90-100%: Deep Forest Green
      },
      bgLight: "bg-lime-600",
      bgSoft: "bg-lime-50",
      border: "border-lime-600",
      text: "text-lime-800",
      ring: "ring-lime-400"
    },
    {
      name: "Katambak / Dugso",
      family: "Lethrinidae",
      localName: "Family: Lethrinidae (Emperors)",
      desc: "Deep Shelf Seabed",
      color: "#6366F1", // Medium Indigo
      shades: {
        light: "#C7D2FE",   // 60-69%: Light Indigo
        medium: "#6366F1",  // 70-79%: Medium Indigo
        dark: "#4338CA",    // 80-89%: Dark Indigo
        deepest: "#312E81", // 90-100%: Deep Navy Indigo
      },
      bgLight: "bg-indigo-500",
      bgSoft: "bg-indigo-50",
      border: "border-indigo-500",
      text: "text-indigo-700",
      ring: "ring-indigo-400"
    },
  ],
};

export const ALL_SPECIES_CONFIGS: SpeciesConfig[] = [
  ...CATEGORIZED_SPECIES.pelagic,
  ...CATEGORIZED_SPECIES.demersal,
];

/**
 * Returns the matching species configuration object for a given species name, family, or text fragment.
 */
export function getSpeciesConfig(queryStr: string): SpeciesConfig | undefined {
  if (!queryStr) return undefined;
  const lower = queryStr.toLowerCase().trim();

  return ALL_SPECIES_CONFIGS.find((sp) => {
    // Direct exact match on name or family
    if (sp.name.toLowerCase() === lower || sp.family.toLowerCase() === lower) return true;

    // Match individual slash-separated subnames e.g. "Tamban / Tunsoy" -> "Tamban", "Tunsoy"
    const subNames = sp.name.toLowerCase().split(/\s*\/\s*/);
    for (const sub of subNames) {
      if (sub.length >= 3 && (lower.includes(sub) || sub.includes(lower))) return true;
    }

    if (sp.family.toLowerCase().includes(lower) || lower.includes(sp.family.toLowerCase())) return true;
    if (sp.name.toLowerCase().includes(lower) || lower.includes(sp.name.toLowerCase())) return true;

    // Keyword match for common local & english names
    if (lower.includes("sardine") || lower.includes("tamban") || lower.includes("tunsoy") || lower.includes("clupeidae")) return sp.family === "Clupeidae";
    if (lower.includes("tuna") || lower.includes("tulingan") || lower.includes("scombridae") || lower.includes("bariles") || lower.includes("alumahan")) return sp.family === "Scombridae";
    if (lower.includes("mackerel") || lower.includes("galunggong") || lower.includes("carangidae") || lower.includes("talakitok") || lower.includes("scad")) return sp.family === "Carangidae";
    if (lower.includes("snapper") || lower.includes("maya-maya") || lower.includes("lutjanidae")) return sp.family === "Lutjanidae";
    if (lower.includes("grouper") || lower.includes("lapu-lapu") || lower.includes("serranidae")) return sp.family === "Serranidae";
    if (lower.includes("anchov") || lower.includes("dilis") || lower.includes("engraulidae")) return sp.family === "Engraulidae";
    if (lower.includes("needle") || lower.includes("kipalkipal") || lower.includes("bahi") || lower.includes("belonidae")) return sp.family === "Belonidae";
    if (lower.includes("bisugo") || lower.includes("nemipteridae") || lower.includes("bream")) return sp.family === "Nemipteridae";
    if (lower.includes("samaral") || lower.includes("siganidae") || lower.includes("rabbit")) return sp.family === "Siganidae";
    if (lower.includes("katambak") || lower.includes("dugso") || lower.includes("lethrinidae") || lower.includes("emperor")) return sp.family === "Lethrinidae";

    return false;
  });
}

/**
 * Returns the exact shade hex color for General Pelagic ocean predictions based on catch probability.
 */
export function getGeneralPelagicProbabilityColor(catchProbability?: number): string {
  if (catchProbability === undefined || catchProbability === null || isNaN(catchProbability)) {
    return GENERAL_PELAGIC_SHADES.medium;
  }
  const probPct = catchProbability <= 1.0 ? catchProbability * 100 : catchProbability;
  if (probPct >= 90) return GENERAL_PELAGIC_SHADES.deepest;
  if (probPct >= 80) return GENERAL_PELAGIC_SHADES.dark;
  if (probPct >= 70) return GENERAL_PELAGIC_SHADES.medium;
  return GENERAL_PELAGIC_SHADES.light;
}

/**
 * Returns the exact shade hex color for General Demersal predictions based on catch probability.
 */
export function getGeneralDemersalProbabilityColor(catchProbability?: number): string {
  if (catchProbability === undefined || catchProbability === null || isNaN(catchProbability)) {
    return GENERAL_DEMERSAL_SHADES.medium;
  }
  const probPct = catchProbability <= 1.0 ? catchProbability * 100 : catchProbability;
  if (probPct >= 90) return GENERAL_DEMERSAL_SHADES.deepest;
  if (probPct >= 80) return GENERAL_DEMERSAL_SHADES.dark;
  if (probPct >= 70) return GENERAL_DEMERSAL_SHADES.medium;
  return GENERAL_DEMERSAL_SHADES.light;
}

/**
 * Returns the exact shade hex color for a species based on its catch probability.
 * Catch probability can be passed as a fraction (0.60 to 1.00) or percentage (60 to 100).
 * Brackets:
 *  - 60-69% => Light
 *  - 70-79% => Medium
 *  - 80-89% => Dark
 *  - 90-100% => Deepest
 */
export function getSpeciesProbabilityColor(
  species: string | string[],
  catchProbability?: number,
  defaultColor: string = GENERAL_PELAGIC_COLOR
): string {
  const config = Array.isArray(species)
    ? species.map((s) => getSpeciesConfig(s)).find((c) => c !== undefined)
    : getSpeciesConfig(species);

  if (!config) return defaultColor;
  if (catchProbability === undefined || catchProbability === null || isNaN(catchProbability)) {
    return config.color;
  }

  // Normalize probability to percentage integer (0-100)
  const probPct = catchProbability <= 1.0 ? catchProbability * 100 : catchProbability;

  if (probPct >= 90) return config.shades.deepest;
  if (probPct >= 80) return config.shades.dark;
  if (probPct >= 70) return config.shades.medium;
  return config.shades.light; // 60-69% (or lower)
}

/**
 * Returns color hex string for a given species name or list of species, optionally considering catch probability.
 */
export function getSpeciesColor(
  species: string | string[],
  defaultColor: string = GENERAL_PELAGIC_COLOR,
  catchProbability?: number
): string {
  return getSpeciesProbabilityColor(species, catchProbability, defaultColor);
}

/**
 * Determines the display color for a hotspot on the map canvas based on:
 * 1. Selected species family matching
 * 2. Catch probability shade gradient intensity (both for species and general models)
 */
export function getHotspotDisplayColor(
  type: "pelagic" | "demersal" | string,
  selectedSpecies: string[] = [],
  hotspotSpecies: string[] = [],
  catchProbability?: number
): string {
  if (selectedSpecies && selectedSpecies.length > 0) {
    const matchedSel = selectedSpecies.find((sel) =>
      hotspotSpecies.some((sp: string) => {
        const selConf = getSpeciesConfig(sel);
        const spConf = getSpeciesConfig(sp);
        if (selConf && spConf && selConf.family === spConf.family) return true;
        if (selConf && (sp.toLowerCase().includes(selConf.family.toLowerCase()) || selConf.family.toLowerCase().includes(sp.toLowerCase()))) return true;
        return sp.toLowerCase().includes(sel.toLowerCase()) || sel.toLowerCase().includes(sp.toLowerCase());
      })
    );
    if (matchedSel) {
      return getSpeciesProbabilityColor(matchedSel, catchProbability);
    }
  }

  // If no species filter active, return General Model 4-tier probability gradient color
  if (type === "demersal") {
    return getGeneralDemersalProbabilityColor(catchProbability);
  }
  return getGeneralPelagicProbabilityColor(catchProbability);
}



