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
      "Select Continue, then use the displayed demo code and Create account to continue. No verification SMS is sent; this does not verify phone ownership or enroll you in automatic advisories.",
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
      "Select Confirm home port to open your dashboard. The current setup records a home port; it is not official vessel registration.",
    ],
    operationalTip:
      "Standard municipal access is free. Home-port setup does not verify vessel eligibility, grant fishing permission or activate a commercial plan.",
    image: "/images/parola-onboarding-guide.png",
    imageAlt: "Parola home-port selection map",
    imageCaption:
      "Home-port map reference. Choose or pin your coastal location before completing setup.",
  },
  {
    id: "find-vessel",
    stepNumber: 3,
    category: "Vessel & Port",
    title: "How to find your home port on the map",
    duration: "1 min",
    shortDesc:
      "Use the dashboard map to review your home-port anchor and nearby fishing guidance.",
    actionUrl: "/dashboard",
    actionLabel: "Open Home-Port Map",
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
      "Dashboard map reference showing a home-port anchor, not live vessel tracking",
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
      "Open Manage Home Port, or use Change home port from Settings to return to the port map.",
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
    actionLabel: "View Advisory Preview",
    instructions: [
      "Open Alerts to review the advisory preview, or read an SMS delivered by an enabled service.",
      "Check the location and message time before using the information.",
      "Read wave height, wind speed and units, and any fishing-zone guidance. Compare warnings with current official advisories.",
      "No inbound command or rating reply is required. Routine SMS for up to five selected weekdays and separate any-day critical alerts are planned; the current portal offers manual weather requests when enabled, not automatic enrollment.",
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
      "Open Fishing Areas on the dashboard. A manual weather SMS does not establish fishing-zone delivery or a morning schedule.",
      "Open Filter fish and choose an optional target fish. Unsupported adjustments are labelled; a selection is not evidence of fish presence.",
      "Compare the displayed scores and distances. A percentage is not a field-validated catch probability, species sighting or guaranteed catch.",
      "Select a marker to review coordinates and bearing. Check weather conditions before planning a trip.",
    ],
    operationalTip:
      "Prediction scores rank suggested areas; this presentation does not establish a measured fuel saving or field-validated catch success rate.",
    image: "/images/guide-fish-probability.png",
    imageAlt:
      "Parola Dashboard Hotspot Coordinates list with catch probabilities",
    imageCaption:
      "Historical hotspot-list reference. The current list shows distance and habitat; area details show a model estimate only when supplied. Depth and species evidence may be unavailable.",
  },
  {
    id: "submit-catch-feedback",
    stepNumber: 7,
    category: "Advisories & At Sea",
    title: "Voluntary trip reporting — planned",
    duration: "1 min",
    shortDesc:
      "Structured trip reports are planned; the current dashboard does not provide a trip-report form or catch-rating controls.",
    actionUrl: "/dashboard",
    actionLabel: "Return to Dashboard",
    instructions: [
      "The reporting proposal covers voluntary portal entry or authorized assistance; it requires internet access.",
      "Planned reports include zero catch, approximate area, species, weight and effort; exact GPS is optional.",
      "A report form, authorized-assistance flow and server-confirmed save are not available in the current dashboard.",
      "No SMS reply or catch report is required to receive advisories. A historical rating example is not a submitted trip report or proof of model calibration.",
    ],
    operationalTip:
      "Reporting is optional. Do not treat a local preview, draft or historical screenshot as a submitted report.",
    image: "/images/guide-catch-feedback.png",
    imageAlt: "Cooperative Model Calibration catch feedback rating interface",
    imageCaption:
      "Historical rating-screen reference only. These controls are absent from the current dashboard; ratings do not establish calibrated accuracy or a submitted catch report.",
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
      "Open the dashboard. Use Areas on a small screen or tablet to read the available fishing areas.",
      "Open Filter fish to choose a habitat or optional target fish. Clear filters to return to general areas.",
      "Select an area from the list or map to review its coordinates, distance, prediction date and any supplied model estimate. Species adjustment is distinct from a recorded fish sighting.",
      "Open Weather details or Advisories for wind, waves, air temperature and regional storm records. Read each source, forecast or record time, and unavailable state; this screen does not supply tide readings.",
      "Use Weather by SMS only as a manual request for your saved number when current readings are available. A simulated preview sends nothing; accepted dispatch does not confirm delivery.",
    ],
    operationalTip:
      "The dashboard combines weather and model-area information in one place. Review it alongside official guidance; predictions and screen status are decision support.",
    image: "/images/parola-dashboard-guide.png",
    imageAlt:
      "Historical dashboard reference showing species filters, weather values and broadcast controls",
    imageCaption:
      "Historical dashboard reference, not live conditions. Current weather cards identify their actual source and forecast time; manual SMS requests do not confirm receipt or automatic scheduling.",
  },
];
