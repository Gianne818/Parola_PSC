export const singleVesselTiers = [
  {
    id: "small-scale",
    name: "Small-Scale Commercial",
    tonnage: "3.1 to 20.0 GT",
    legalCitation: "Proposed class; legal classification and marine eligibility require review.",
    price: "₱799",
    billingCadence: "/ month per vessel",
    targetVessels:
      "Commercial small-craft bancas, motorized handline fishers, and nearshore coastal crews.",
    scopeDescription:
      "Proposed scope: 50 km from home port outside municipal waters; authoritative boundaries and access checks pending.",
    quotaDescription:
      "One zone per cycle proposed; cycle, expiry and re-download rules pending. Demo exports do not establish a quota.",
    features: [
      "Proposed port-based scope; no fishing permission granted by a plan",
      "Species filters available; species-specific model support needs validation",
      "Zone locks and re-download entitlements pending",
      "Sample .GPX, .KML and .GeoJSON downloads; device imports unverified",
      "Routine SMS planned for up to five selected weekdays; timing pending",
      "Outbound SMS proposal; no inbound command or reply required",
      "Any-day critical alerts planned, separately from routine scheduling",
      "Emergency coordination integrations planned; follow official instructions",
    ],
  },
  {
    id: "medium-scale",
    name: "Medium-Scale Commercial",
    tonnage: "20.1 to 150.0 GT",
    legalCitation: "Proposed class; legal classification and marine eligibility require review.",
    price: "₱2,499",
    billingCadence: "/ month per vessel",
    targetVessels:
      "Commercial ring-netters, purse seiners, and multi-day pelagic island fishing vessels.",
    scopeDescription:
      "Proposed scope: one selected Fisheries Management Area (FMA); full coverage and access are not established.",
    quotaDescription:
      "Zone cycle, expiry and re-download policy pending; demo downloads only.",
    features: [
      "Selected FMA coverage proposed; validation pending",
      "Species filters available; support varies with validated data",
      "Zone locks and re-download entitlements pending",
      "24–72 hour forecast controls are demos, not validated forecasts",
      "Multi-zone thermal front exports planned",
      "Environmental alerts planned; no confirmed schooling or catch",
      "Voluntary portal trip reports planned; internet access needed",
      "Harbor dispatch integration planned",
    ],
  },
  {
    id: "large-scale",
    name: "Large-Scale Commercial",
    tonnage: ">150.0 GT",
    legalCitation: "Proposed class; legal classification and marine eligibility require review.",
    price: "₱6,199",
    billingCadence: "/ month per vessel",
    targetVessels:
      "Distant-water longliners, commercial motherships, and industrial fleet aggregators.",
    scopeDescription:
      "Proposed Philippine EEZ scope; no unrestricted access, legal clearance or nationwide coverage established.",
    quotaDescription:
      "Zone cycle, expiry and re-download policy pending; demo downloads only.",
    features: [
      "EEZ coverage proposed; satellite access remains roadmap work",
      "Species support requires validation; filters are not sightings",
      "Zone locks and re-download entitlements pending",
      "Sample exports only; 24–72h forecasts require validation",
      "Dedicated support and API integration planned; no SLA established",
      "Harvest reporting planned; no BFAR compliance certification",
      "Satellite gateway integration planned and unverified",
      "Port dispatch telemetry feed planned",
    ],
  },
];
