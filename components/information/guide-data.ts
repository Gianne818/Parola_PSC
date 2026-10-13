export interface StepGuide {
  id: string;
  stepNumber: number;
  category: "Account & Onboarding" | "Vessel & Port" | "Advisories & At Sea";
  title: string;
  duration: string;
  shortDesc: string;
  actionUrl: string;
  actionLabel: string;
  instructions: string[];
  operationalTip: string;
  image: string;
  imageAlt: string;
  imageCaption: string;
}

export const STEPS: StepGuide[] = [
  {
    id: "create-account",
    stepNumber: 1,
    category: "Account & Onboarding",
    title: "How to create your first account",
    duration: "1 min",
    shortDesc:
      "Use your mobile number, a password, and your preferred language.",
    actionUrl: "/register",
    actionLabel: "Open Registration",
    instructions: [
      "Open Registration and enter your Philippine mobile number.",
      "Create a password with at least six characters.",
      "Choose English, Tagalog, Cebuano, or Hiligaynon as your system language.",
      "Select Register & Verify and follow the verification instructions shown on screen. The current verification screen is a preview; it does not confirm live SMS delivery.",
    ],
    operationalTip:
      "Web registration needs internet access. Reading a delivered SMS needs an SMS-capable phone and cellular signal, without mobile data. A trusted person can help you use the web form.",
    image: "/images/guide-registration-current.png",
    imageAlt:
      "Current Parola registration form with mobile number, password, and language selection",
    imageCaption:
      "Actual registration screen: mobile number, password, and system language. Account setup comes before home-port selection.",
  },
  {
    id: "complete-onboarding",
    stepNumber: 2,
    category: "Account & Onboarding",
    title: "How to complete onboarding",
    duration: "2 min",
    shortDesc:
      "Set the coastal region and home-port location used by your dashboard.",
    actionUrl: "/onboarding",
    actionLabel: "Start Onboarding",
    instructions: [
      "Open onboarding after account creation or sign in before opening the setup page.",
      "Search for your home port or province, choose a listed port, or place a pin on the coastal map.",
      "Check the selected region and pinned location before confirming.",
      "Select Confirm Port & Finish to open your dashboard. The current setup records a home port; it is not official vessel registration.",
    ],
    operationalTip:
      "Municipal craft at or below 3.0 GT qualify for free subsidized access. Keep your actual vessel registration details available when reviewing commercial eligibility.",
    image: "/images/parola-onboarding-guide.png",
    imageAlt: "Parola home-port selection map",
    imageCaption:
      "Home-port map reference. Choose or pin your coastal location before completing setup.",
  },
  {
    id: "find-vessel",
    stepNumber: 3,
    category: "Vessel & Port",
    title: "How to find your vessel on the fleet map",
    duration: "1 min",
    shortDesc:
      "Use the dashboard map to review your home-port anchor and nearby fishing guidance.",
    actionUrl: "/dashboard",
    actionLabel: "Open Fleet Map",
    instructions: [
      "Open the dashboard after setting your home port.",
      "Locate your home-port anchor on the map. Zoom or move the map to explore the surrounding area.",
      "Select a hotspot marker to review its coordinates, distance, and bearing from the reference location.",
      "Use the available map views and species filters to compare nearby guidance.",
    ],
    operationalTip:
      "Your home-port anchor is a reference location, not proof of your boat's current GPS position. Do not assume the map is tracking a moving vessel.",
    image: "/images/guide-fleet-map.png",
    imageAlt:
      "Parola Fleet Map on Dashboard showing registered vessel and home anchorage",
    imageCaption:
      "Dashboard map reference with coastal markers and home anchorage. Marker details depend on available data.",
  },
  {
    id: "register-home-port",
    stepNumber: 4,
    category: "Vessel & Port",
    title: "How to update your home port",
    duration: "2 min",
    shortDesc:
      "Review and update the coastal location used as your home-port reference.",
    actionUrl: "/onboarding?from=profile",
    actionLabel: "Manage Home Port",
    instructions: [
      "Open Manage Home Port, or use Edit Vessel Info from Settings to return to the port map.",
      "Search for your port or select a listed coastal location.",
      "If needed, move the pin to your actual home-port location and check the displayed region.",
      "Confirm the updated port and review the new reference location on your dashboard.",
    ],
    operationalTip:
      "A port setting helps localize information. It does not replace official vessel records, port permissions, or current local instructions.",
    image: "/images/parola-onboarding-guide.png",
    imageAlt:
      "Parola Port Selection Onboarding map interface with reference anchor",
    imageCaption:
      "Port Selection map allowing fishers to search or drop an anchor pin at their municipal landing port (e.g. Brgy. Mactan, Lapu-Lapu).",
  },
  {
    id: "read-sms-advisory",
    stepNumber: 5,
    category: "Advisories & At Sea",
    title: "How to read an SMS advisory",
    duration: "2 min",
    shortDesc:
      "Read the location, weather values, and advisory status in a message or dashboard preview.",
    actionUrl: "/alerts",
    actionLabel: "View Advisory Syntax",
    instructions: [
      "Open Alerts to review the advisory preview, or read an SMS delivered by an enabled service.",
      "Check the location and message time before using the information.",
      "Read wave height, wind speed and units, and any fishing-zone guidance. Compare warnings with current official advisories.",
      "ADVISORY, HOTSPOT, and STATUS are sample command examples in the public demo. Confirm the service number, enabled commands, and SMS charges before sending a text.",
    ],
    operationalTip:
      "No mobile data is needed to read an SMS, but cellular signal is still required. An advisory status is not official departure clearance.",
    image: "/images/guide-sms-advisory.png",
    imageAlt: "Parola SMS Advisory Dispatch and GSM payload preview",
    imageCaption:
      "Advisory screen reference showing weather values, fishing guidance, and a dispatch control. Delivery depends on the enabled service.",
  },
  {
    id: "check-fish-probability",
    stepNumber: 6,
    category: "Advisories & At Sea",
    title: "How to check fish probability and catch prediction",
    duration: "2 min",
    shortDesc:
      "Compare suggested fishing areas by species, distance, and the displayed prediction score.",
    actionUrl: "/dashboard",
    actionLabel: "View Catch Predictions",
    instructions: [
      "Access the Species Hotspot module on the Dashboard or review the zone field in your morning SMS bulletin.",
      "Choose a species or species group from the Fish & Species Finder.",
      "Compare the displayed scores and distances rather than treating a percentage as a guaranteed catch.",
      "Select a marker to review coordinates and bearing. Check weather conditions before planning a trip.",
    ],
    operationalTip:
      "Prediction scores rank suggested areas; this presentation does not establish a measured fuel saving or field-validated catch success rate.",
    image: "/images/guide-fish-probability.png",
    imageAlt:
      "Parola Dashboard Hotspot Coordinates list with catch probabilities",
    imageCaption:
      "Hotspot list reference showing prediction scores, depth, distance, and heading. Example percentages are not guaranteed outcomes.",
  },
  {
    id: "submit-catch-feedback",
    stepNumber: 7,
    category: "Advisories & At Sea",
    title: "How to submit catch feedback",
    duration: "1 min",
    shortDesc:
      "Rate how well the latest advisory matched your trip using the dashboard feedback controls.",
    actionUrl: "/dashboard",
    actionLabel: "Submit Harvest Log",
    instructions: [
      "After your trip, open the Municipal Advisor on the dashboard.",
      "Find Cooperative Model Calibration and review the advisory referenced there.",
      "Choose High Accuracy, Medium, or Low to describe how closely the guidance matched your trip.",
      "Wait for the feedback confirmation shown on screen. The current controls collect an accuracy rating, not a catch-weight or fuel log.",
    ],
    operationalTip:
      "Use the available rating controls. Do not send secret fishing coordinates or personal information to an unconfirmed SMS destination.",
    image: "/images/guide-catch-feedback.png",
    imageAlt: "Cooperative Model Calibration catch feedback rating interface",
    imageCaption:
      "Municipal Advisor catch feedback calibration module allowing fishers to rate AI prediction accuracy (High, Medium, Low) after landing.",
  },
  {
    id: "respond-safety-hold",
    stepNumber: 8,
    category: "Advisories & At Sea",
    title: "How to understand and respond to a safety hold alert",
    duration: "2 min",
    shortDesc:
      "Review warning states and the configured thresholds alongside official port instructions.",
    actionUrl: "/alerts",
    actionLabel: "View Safety Protocols",
    instructions: [
      "Open Alerts and read the current warning status, location, and weather values.",
      "Review the configured wave threshold and any storm warning. The public landing simulator uses a sample threshold, not a universal sailing rule.",
      "Follow current official advisories and local port instructions when deciding what to do next.",
      "Check for updated information before departure. The guide does not issue, suspend, or restore official sailing clearance.",
    ],
    operationalTip:
      "A calm status in a preview is not an all-clear. Thresholds and service settings can vary; rely on current official instructions.",
    image: "/images/guide-safety-hold.png",
    imageAlt: "Critical Safety Hold and PAGASA Gale Warning advisory screen",
    imageCaption:
      "Warning-screen reference showing a hazardous-condition state. Sample status labels are not official departure permission.",
  },
  {
    id: "municipal-advisor",
    stepNumber: 9,
    category: "Advisories & At Sea",
    title:
      "How to navigate the Municipal Advisor (Fish Finder & Weather Broadcast)",
    duration: "3 min",
    shortDesc:
      "Explore species guidance, weather information, and advisory controls in the Municipal Advisor.",
    actionUrl: "/dashboard",
    actionLabel: "Open Municipal Advisor",
    instructions: [
      "Open the Municipal Advisor panel on the right side of the Dashboard (it can also be expanded or collapsed using the panel toggle).",
      "In the Fish & Species Finder section, filter by Surface Water (Pelagic), Bottom & Reef (Demersal), or All Predictions.",
      "Expand a species list, such as Tamban, Tulingan, or Lapu-lapu, to review prediction scores and map overlays.",
      "Review wind speed, wave height, storm information, sea surface temperature, and tide values. Check the displayed source and freshness where available.",
      "Review the weather broadcast preview before using a dispatch control. Confirm that SMS delivery is enabled for your registered phone; a preview alone does not establish delivery.",
    ],
    operationalTip:
      "The dashboard combines weather and species information in one place. Review it alongside official guidance; predictions and screen status are decision support.",
    image: "/images/parola-dashboard-guide.png",
    imageAlt:
      "Parola Dashboard showing Municipal Advisor with Fish Finder, Sea & Weather Metrics Grid, and PAGASA Weather Broadcast",
    imageCaption:
      "Municipal Advisor console featuring target fish species selection (pelagic/demersal), real-time Sea & Weather Metrics Grid, and the instant PAGASA Weather Broadcast dispatch.",
  },
];
