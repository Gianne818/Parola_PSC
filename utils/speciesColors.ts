export interface SpeciesConfig {
  name: string;
  family: string;
  localName: string;
  desc: string;
  color: string; // Primary hex color code
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
      color: "#10B981", // Green (Sardines)
      bgLight: "bg-emerald-500",
      bgSoft: "bg-emerald-50",
      border: "border-emerald-500",
      text: "text-emerald-700",
      ring: "ring-emerald-400"
    },
    {
      name: "Galunggong / Talakitok",
      family: "Carangidae",
      localName: "Family: Carangidae (Jacks & Scads)",
      desc: "Upper & Coastal Water",
      color: "#F97316", // Orange (Mackerel/Scads)
      bgLight: "bg-orange-500",
      bgSoft: "bg-orange-50",
      border: "border-orange-500",
      text: "text-orange-700",
      ring: "ring-orange-400"
    },
    {
      name: "Alumahan / Tulingan / Bariles",
      family: "Scombridae",
      localName: "Family: Scombridae (Mackerels & Tunas)",
      desc: "Oceanic Pelagic",
      color: "#2563EB", // Royal Blue (Tuna)
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
      color: "#8B5CF6", // Purple / Violet
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
      color: "#06B6D4", // Teal / Cyan
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
      color: "#D97706", // Amber / Gold
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
      color: "#EF4444", // Red (Snapper)
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
      color: "#EC4899", // Pink / Rose
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
      color: "#65A30D", // Lime / Chartreuse
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
      color: "#6366F1", // Indigo
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
 * Returns color hex string for a given species name or list of species.
 */
export function getSpeciesColor(species: string | string[], defaultColor: string = "#00B074"): string {
  if (Array.isArray(species)) {
    for (const item of species) {
      const config = getSpeciesConfig(item);
      if (config) return config.color;
    }
    return defaultColor;
  }
  const config = getSpeciesConfig(species);
  return config ? config.color : defaultColor;
}
