export const singleVesselTiers = [
  {
    id: "small-scale",
    name: "Small-Scale Commercial",
    tonnage: "3.1 to 20.0 GT",
    legalCitation: "Sec. 3(n)(1) RA 8550 / RA 10654",
    price: "₱799",
    billingCadence: "/ month per vessel",
    targetVessels:
      "Commercial small-craft bancas, motorized handline fishers, and nearshore coastal crews.",
    scopeDescription:
      "Restricted query selection to a 50 km radius from registered home port outside municipal waters.",
    quotaDescription:
      "1 locked zone download per day with unlimited re-downloads of that same zone for 24 hours.",
    features: [
      "Restricted to 50 km radius from home port outside municipal waters",
      "Multi-species target selection (Pelagic & Demersal models)",
      "Daily quota: 1 locked zone per day (unlimited re-downloads for 24h)",
      "Offline chartplotter Geo-Packs (.GPX, .KML, .GeoJSON)",
      "Daily 04:30 PHT morning SMS marine advisory dispatch",
      "Two-way SMS query syntax (ADVISORY, STATUS, HOTSPOT)",
      "Automated PAGASA gale warnings and wave hazard holds (Hs > 1.5m)",
      "Emergency co-op and VHF Channel 16 muster link",
    ],
  },
  {
    id: "medium-scale",
    name: "Medium-Scale Commercial",
    tonnage: "20.1 to 150.0 GT",
    legalCitation: "Sec. 3(n)(2) RA 8550 / RA 10654",
    price: "₱2,499",
    billingCadence: "/ month per vessel",
    targetVessels:
      "Commercial ring-netters, purse seiners, and multi-day pelagic island fishing vessels.",
    scopeDescription:
      "Permits full coverage of 1 selected Fisheries Management Area (FMA 1 through FMA 12).",
    quotaDescription:
      "1 locked zone per day, unlimited re-downloads for 24 hours.",
    features: [
      "Full coverage of 1 selected Fisheries Management Area (FMA)",
      "Multi-species target selection (Tamban, Galunggong, Skipjack, Tuna)",
      "Daily quota: 1 locked zone per day (unlimited re-downloads for 24h)",
      "Pre-departure 24–72 hour spatial forecast bundles (.GPX, .KML, .GeoJSON)",
      "Multi-zone sea surface temperature (SST) thermal front vector maps",
      "Automated pelagic chlorophyll and schooling zone alerts",
      "Two-way SMS catch feedback logging loop access",
      "Priority harbor muster dispatch for active fleet offshore",
    ],
  },
  {
    id: "large-scale",
    name: "Large-Scale Commercial",
    tonnage: ">150.0 GT",
    legalCitation: "Sec. 3(n)(3) RA 8550 / RA 10654",
    price: "₱6,199",
    billingCadence: "/ month per vessel",
    targetVessels:
      "Distant-water longliners, commercial motherships, and industrial fleet aggregators.",
    scopeDescription:
      "Unrestricted nationwide Philippine Exclusive Economic Zone (EEZ) access.",
    quotaDescription:
      "1 locked zone per day, unlimited re-downloads for 24 hours.",
    features: [
      "Full Philippine Exclusive Economic Zone (EEZ) satellite access",
      "Multi-species target selection across all pelagic families",
      "Daily quota: 1 locked zone per day (unlimited re-downloads for 24h)",
      "High-density 24–72h spatial forecast packages (.GPX, .KML, .GeoJSON)",
      "Priority 24/7 dedicated support & direct API integration",
      "Automated harvest telemetry reporting for BFAR compliance",
      "Dedicated satellite SMS gateway redundancy integration",
      "Harbor master and port marshal dispatch telemetry feed",
    ],
  },
];
