"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Radio,
  Fish,
  Anchor,
  ShieldAlert,
  Ship,
  Search,
  MessageSquare,
  Sparkles,
  MapPin,
  Check,
  Smartphone,
  ChevronRight,
  ExternalLink,
  Maximize2,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ParolaLogo } from "@/components/ui/ParolaLogo";

interface StepGuide {
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

const STEPS: StepGuide[] = [
  {
    id: "create-account",
    stepNumber: 1,
    category: "Account & Onboarding",
    title: "How to create your first account",
    duration: "1 min",
    shortDesc: "Set up your Parola mobile profile using your Philippine cellular number for 2G SMS connectivity.",
    actionUrl: "/register",
    actionLabel: "Open Registration",
    instructions: [
      "Navigate to the Register page on the web app or text JOIN to Parola's SMS gateway.",
      "Enter your Philippine mobile number starting with +63 (Globe, Smart, or Dito).",
      "Select your role as Municipal Fisher, Cooperative Leader, or Maritime Safety Officer.",
      "Set your secure password or confirm via SMS verification passcode to initialize your account."
    ],
    operationalTip: "Basic keypad feature phones are 100% supported. You do not need smartphone data to activate your profile.",
    image: "/images/parola-login-guide.png",
    imageAlt: "Parola Account Registration page showing mobile number and password fields",
    imageCaption: "Registration portal with Philippine mobile number input (+63) and 2G SMS connectivity support for municipal fishers."
  },
  {
    id: "complete-onboarding",
    stepNumber: 2,
    category: "Account & Onboarding",
    title: "How to complete onboarding and register your vessel",
    duration: "2 min",
    shortDesc: "Record your boat classification, gross tonnage (GT), and fishing gear to calibrate marine advisories.",
    actionUrl: "/onboarding",
    actionLabel: "Start Onboarding",
    instructions: [
      "Access the onboarding flow immediately after account creation.",
      "Enter your official vessel name (e.g., F/B Sto. Niño) and local MFVR registration number if issued by your LGU.",
      "Select your hull type (motorized banca, wooden hull, or steel hull) and enter gross tonnage (GT).",
      "Choose your primary gear (handline, gillnet, ring net, or longline) so hotspot telemetry matches your target fish species."
    ],
    operationalTip: "Artisanal bancas under 3.0 GT qualify for zero-cost municipal access, while 3.1 to 20.0 GT vessels belong to the Small-Scale commercial tier under Section 3(n) of RA 8550 as amended by RA 10654.",
    image: "/images/guide-vessel-profile.png",
    imageAlt: "Parola Captain & Vessel Profile specifications screen",
    imageCaption: "Vessel and captain profile showing registered vessel F/B Sto. Niño, gross tonnage (GT), hull type, and SMS verification status."
  },
  {
    id: "find-vessel",
    stepNumber: 3,
    category: "Vessel & Port",
    title: "How to find your vessel on the fleet map",
    duration: "1 min",
    shortDesc: "Search and locate registered craft, active port anchors, and live telemetry on the Parola dashboard.",
    actionUrl: "/dashboard",
    actionLabel: "Open Fleet Map",
    instructions: [
      "Open your Parola Dashboard and navigate to the interactive Fleet Map section.",
      "Use the search bar at the top to type your vessel name or registration code.",
      "Click on your vessel pin to open the live telemetry card showing home port distance and current sea state.",
      "Toggle between satellite SST layer and navigation map view to inspect surrounding conditions."
    ],
    operationalTip: "If your boat is offshore, your last reported GPS anchor coordinates sync automatically whenever an SMS advisory is triggered.",
    image: "/images/guide-fleet-map.png",
    imageAlt: "Parola Fleet Map on Dashboard showing registered vessel and home anchorage",
    imageCaption: "Interactive Fleet Map with vessel search, live coordinates, 9 km prediction radius, and registered harbor anchorage."
  },
  {
    id: "register-home-port",
    stepNumber: 4,
    category: "Vessel & Port",
    title: "How to register your home port",
    duration: "2 min",
    shortDesc: "Anchor your vessel to a designated coastal pier to receive localized harbor wave and weather forecasts.",
    actionUrl: "/onboarding?from=profile",
    actionLabel: "Manage Home Port",
    instructions: [
      "In the Onboarding map or Profile Settings, select the Home Port selector.",
      "Choose from verified municipal landing centers (such as Mercedes Fish Port, Estancia, Navotas, or Batangas Pier).",
      "Alternatively, tap directly on the map to set a custom GPS coordinate pin for remote barangay coves.",
      "Confirm your primary emergency VHF radio channel (Channel 16 default) for port muster broadcasts."
    ],
    operationalTip: "Local harbor thresholds calibrate your automated departure holds. When local waves exceed 1.5m, your home port triggers a safety hold.",
    image: "/images/parola-onboarding-guide.png",
    imageAlt: "Parola Port Selection Onboarding map interface with reference anchor",
    imageCaption: "Port Selection map allowing fishers to search or drop an anchor pin at their municipal landing port (e.g. Brgy. Mactan, Lapu-Lapu)."
  },
  {
    id: "read-sms-advisory",
    stepNumber: 5,
    category: "Advisories & At Sea",
    title: "How to read an SMS advisory",
    duration: "2 min",
    shortDesc: "Decode daily 04:30 PHT marine weather dispatches and use two-way query commands at sea.",
    actionUrl: "/alerts",
    actionLabel: "View Advisory Syntax",
    instructions: [
      "Check your phone inbox every morning at 04:30 PHT for your automated pre-departure dispatch.",
      "Identify the safety status: 'Safe to sail' means calm waters under 1.0m, while 'Advisory hold' warns of hazardous swells.",
      "Read key telemetry values: significant wave height (e.g. 0.8m), wind speed (e.g. 9 kts), and active fishing zone.",
      "Reply with 'ADVISORY' anytime while offshore to request an updated weather bulletin without internet data."
    ],
    operationalTip: "Query keywords include ADVISORY for sea conditions, HOTSPOT for coordinates, and STATUS for your active departure clearance.",
    image: "/images/guide-sms-advisory.png",
    imageAlt: "Parola SMS Advisory Dispatch and GSM payload preview",
    imageCaption: "Pre-departure SMS advisory preview detailing safe-to-sail status, wave heights, nearest fishing hotspot bearing, and SMS dispatch button."
  },
  {
    id: "check-fish-probability",
    stepNumber: 6,
    category: "Advisories & At Sea",
    title: "How to check fish probability and catch prediction",
    duration: "2 min",
    shortDesc: "Understand satellite sea surface temperature fronts and target species probability percentages.",
    actionUrl: "/dashboard",
    actionLabel: "View Catch Predictions",
    instructions: [
      "Access the Species Hotspot module on the Dashboard or review the zone field in your morning SMS bulletin.",
      "Check the three monitored pelagic species: Tamban (Sardinella), Galunggong (Round scad), and Tuna (Skipjack/Yellowfin).",
      "Look for probability scores above 70%, which indicate active thermal upwelling fronts and chlorophyll feeding zones.",
      "Note the recommended navigation heading and distance offshore (e.g., Zone 3, 12km East-Northeast)."
    ],
    operationalTip: "Thermal boundary zones with 27.5°C to 28.5°C SST fronts concentrate schooling baitfish, reducing fuel scouting time by up to 35%.",
    image: "/images/guide-fish-probability.png",
    imageAlt: "Parola Dashboard Hotspot Coordinates list with catch probabilities",
    imageCaption: "Species hotspot list view ranking optimal fishing zones with catch probabilities (94%, 86%, 75%), depth, distance, and heading."
  },
  {
    id: "submit-catch-feedback",
    stepNumber: 7,
    category: "Advisories & At Sea",
    title: "How to submit catch feedback",
    duration: "1 min",
    shortDesc: "Log your daily harvest via SMS or web to improve community prediction models while protecting secret spots.",
    actionUrl: "/dashboard",
    actionLabel: "Submit Harvest Log",
    instructions: [
      "Upon returning to port or mooring, open the Catch Feedback modal or compose a short SMS.",
      "SMS syntax: Text 'CATCH [Weight in KG] [Species] [Zone or Coords]' (e.g., CATCH 180KG TAMBAN ZONE 3).",
      "Optionally log fuel liters consumed or hours spent at sea to calculate trip efficiency.",
      "Receive instant confirmation that your anonymized catch data has updated the municipal fisheries model."
    ],
    operationalTip: "Exact GPS marks are kept confidential and aggregated into 5-kilometer grid cells to prevent crowding secret family fishing grounds.",
    image: "/images/guide-catch-feedback.png",
    imageAlt: "Cooperative Model Calibration catch feedback rating interface",
    imageCaption: "Municipal Advisor catch feedback calibration module allowing fishers to rate AI prediction accuracy (High, Medium, Low) after landing."
  },
  {
    id: "respond-safety-hold",
    stepNumber: 8,
    category: "Advisories & At Sea",
    title: "How to understand and respond to a safety hold alert",
    duration: "2 min",
    shortDesc: "Recognize automated departure holds when wave swells exceed 1.5 meters or PAGASA issues gale warnings.",
    actionUrl: "/alerts",
    actionLabel: "View Safety Protocols",
    instructions: [
      "If wave height exceeds 1.5m or PAGASA issues a Gale Warning, Parola dispatches an urgent SAFETY HOLD alert.",
      "Your departure clearance is temporarily suspended to protect small motorized bancas from capsizing.",
      "Confirm receipt by replying 'ACK' to the SMS notification or tapping Acknowledge on the Alerts screen.",
      "Check the Coast Guard VHF Channel 16 muster status and wait for the official all-clear dispatch before untying lines."
    ],
    operationalTip: "Safety holds automatically lift once significant wave height drops back below 1.2m and PAGASA cancels coastal gale advisories.",
    image: "/images/guide-safety-hold.png",
    imageAlt: "Critical Safety Hold and PAGASA Gale Warning advisory screen",
    imageCaption: "Active safety hold screen showing hazardous sea state (wave swells > 1.5m), prohibited departure status, and Gale Warning SMS trigger."
  },
  {
    id: "municipal-advisor",
    stepNumber: 9,
    category: "Advisories & At Sea",
    title: "How to navigate the Municipal Advisor (Fish Finder & Weather Broadcast)",
    duration: "3 min",
    shortDesc: "Navigate the Municipal Advisor panel to toggle pelagic and demersal fish finders, review the real-time Sea & Weather Metrics Grid, and trigger PAGASA Weather Broadcast SMS alerts.",
    actionUrl: "/dashboard",
    actionLabel: "Open Municipal Advisor",
    instructions: [
      "Open the Municipal Advisor panel on the right side of the Dashboard (it can also be expanded or collapsed using the panel toggle).",
      "In the Fish & Species Finder section, filter by Surface Water (Pelagic), Bottom & Reef (Demersal), or All Predictions.",
      "Expand the species list (e.g. Tamban, Tulingan, or Lapu-lapu) to view live machine-learning catch probabilities and toggle heatmap overlays on the map.",
      "Inspect the Sea & Weather Metrics Grid for live wind speed, wave height, storm signal warnings, sea surface temperature (SST), and tide level.",
      "Under PAGASA Weather Broadcast, check the safety indicator (Favorable vs. Dangerous) and tap the broadcast button to send live weather bulletins to your registered phone."
    ],
    operationalTip: "When waves exceed 2.0m or PAGASA issues a storm signal, the broadcast card shifts to a red alert state, prompting safety officers and fishers to dispatch a Gale Warning SMS preventing departures.",
    image: "/images/parola-dashboard-guide.png",
    imageAlt: "Parola Dashboard showing Municipal Advisor with Fish Finder, Sea & Weather Metrics Grid, and PAGASA Weather Broadcast",
    imageCaption: "Municipal Advisor console featuring target fish species selection (pelagic/demersal), real-time Sea & Weather Metrics Grid, and the instant PAGASA Weather Broadcast dispatch."
  }
];

export default function GuidePage() {
  const [activeStepId, setActiveStepId] = useState<string>("create-account");
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [zoomImage, setZoomImage] = useState<{ src: string; title: string; caption: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("parola_completed_guide_steps");
    if (saved) {
      try {
        setCompletedSteps(JSON.parse(saved));
      } catch (e) {
        // ignore parse error
      }
    }
  }, []);

  const activeIndex = STEPS.findIndex((s) => s.id === activeStepId);
  const currentStep = STEPS[activeIndex] || STEPS[0];

  const toggleComplete = (id: string) => {
    let updated: string[];
    if (completedSteps.includes(id)) {
      updated = completedSteps.filter((s) => s !== id);
    } else {
      updated = [...completedSteps, id];
    }
    setCompletedSteps(updated);
    localStorage.setItem("parola_completed_guide_steps", JSON.stringify(updated));
  };

  const progressPercent = Math.round((completedSteps.length / STEPS.length) * 100);

  const categories = [
    { name: "Account & Onboarding", items: STEPS.filter((s) => s.category === "Account & Onboarding") },
    { name: "Vessel & Port", items: STEPS.filter((s) => s.category === "Vessel & Port") },
    { name: "Advisories & At Sea", items: STEPS.filter((s) => s.category === "Advisories & At Sea") }
  ];

  return (
    <div className="min-h-screen bg-[#F2F6F4] text-[#12211E] font-sans antialiased overflow-x-hidden selection:bg-[#00B37E]/20 selection:text-[#12211E]">
      {/* Background Atmosphere: Coastal Ambient Depth */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 bg-[#F2F6F4]">
        <div
          className="absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage: "radial-gradient(#12211E 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}
        />
        <div className="absolute top-0 right-1/4 w-[640px] h-[360px] bg-[#00B37E]/8 blur-[130px] rounded-full" />
        <div className="absolute top-[30%] left-[-80px] w-[450px] h-[450px] bg-[#C57E2C]/5 blur-[120px] rounded-full" />
      </div>

      {/* Header Navigation (strictly <= 68px single line) */}
      <header className="sticky top-0 w-full border-b border-[#DAE5E0] bg-[#F2F6F4]/90 backdrop-blur-md z-40">
        <div className="flex items-center justify-between h-[68px] px-6 md:px-12 max-w-7xl mx-auto w-full">
          <Link href="/" className="flex items-center gap-3 group">
            <ParolaLogo iconOnly className="w-8 h-8 group-hover:scale-105 transition-transform" />
            <span className="font-display text-xl font-black tracking-tight text-[#12211E] uppercase">
              Parola
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-[#12211E]/75">
            <Link href="/#how-it-works" className="hover:text-[#00B37E] transition-colors">
              Features
            </Link>
            <Link href="/guide" className="text-[#00B37E] font-black border-b-2 border-[#00B37E] pb-1">
              System Guide
            </Link>
            <Link href="/pricing" className="hover:text-[#00B37E] transition-colors">
              Pricing
            </Link>
            <Link href="/about" className="hover:text-[#00B37E] transition-colors">
              About
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-xs font-bold uppercase tracking-wider text-[#12211E]/75 hover:text-[#12211E] transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="bg-[#00B37E] hover:bg-[#00B37E]/90 text-white px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-sm hover:shadow active:scale-[0.98]"
            >
              Register Vessel
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-6 py-10 md:py-14 space-y-10">
        {/* Page Hero Title & Subtext */}
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C57E2C]/10 border border-[#C57E2C]/25 text-[#9A5B18] text-[11px] font-bold uppercase tracking-wider shadow-2xs">
            <Sparkles className="w-3 h-3 text-[#C57E2C]" />
            <span>Operational Walkthrough</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-black tracking-tight text-[#12211E] leading-tight">
            Learn Parola, one practical task at a time.
          </h1>
          <p className="text-sm sm:text-base text-[#12211E]/75 leading-relaxed font-normal">
            Nine step-by-step guides that take you from registering your vessel to receiving SMS advisories, tracking fish hotspots, navigating the municipal advisor, and responding to safety alerts. Go through them in order or jump to the one you need, and tick each off as you go.
          </p>
        </div>

        {/* 2-Column Responsive Layout: Left Sidebar + Right Active Lesson */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT SIDEBAR: Progress & Grouped Step List (Col-span 4) */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Progress Card (Elevated white card with border) */}
            <div className="bg-white border border-[#DAE5E0] rounded-2xl p-5 shadow-[0_2px_12px_rgba(18,33,30,0.04)] space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#12211E]">Your progress</span>
                <span className="text-[#00B37E] font-display font-black text-sm">
                  {completedSteps.length} of {STEPS.length}
                </span>
              </div>
              <div className="w-full bg-[#F2F6F4] border border-[#DAE5E0] h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#00B37E] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="text-[11px] text-[#12211E]/60 font-medium">
                {progressPercent === 100
                  ? "All steps completed! You are ready for coastal operations."
                  : `${STEPS.length - completedSteps.length} practical lessons remaining.`}
              </div>
            </div>

            {/* Category Groups */}
            <div className="space-y-6">
              {categories.map((cat, cIdx) => {
                const catCompleted = cat.items.filter((item) => completedSteps.includes(item.id)).length;

                return (
                  <div key={cIdx} className="space-y-2">
                    <div className="flex items-center justify-between px-2 text-[11px] font-bold text-[#12211E]/55 uppercase tracking-wider">
                      <span>{cat.name}</span>
                      <span>
                        {catCompleted}/{cat.items.length}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {cat.items.map((step) => {
                        const isActive = step.id === activeStepId;
                        const isDone = completedSteps.includes(step.id);

                        return (
                          <button
                            key={step.id}
                            onClick={() => setActiveStepId(step.id)}
                            className={`w-full text-left p-3.5 rounded-xl transition-all flex items-center justify-between gap-3 text-xs cursor-pointer border ${
                              isActive
                                ? "bg-[#00B37E]/10 border-[#00B37E]/40 text-[#12211E] shadow-sm font-bold"
                                : "bg-white hover:bg-[#EAF1ED] border-[#DAE5E0] text-[#12211E]/75 font-medium shadow-2xs"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleComplete(step.id);
                                }}
                                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors border ${
                                  isDone
                                    ? "bg-[#00B37E] border-[#00B37E] text-white"
                                    : "border-gray-300 bg-[#F2F6F4] text-gray-500 hover:border-[#00B37E]"
                                }`}
                                title={isDone ? "Completed (tap to uncheck)" : "Mark complete"}
                              >
                                {isDone ? (
                                  <Check className="w-3 h-3 stroke-[3]" />
                                ) : (
                                  <span className="text-[10px] font-bold">{step.stepNumber}</span>
                                )}
                              </div>
                              <span className={`truncate ${isDone && !isActive ? "text-[#12211E]/50 line-through" : ""}`}>
                                {step.title}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#12211E]/55 shrink-0 font-mono">
                              {step.duration}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* RIGHT PANE: Active Lesson Interactive Card (Elevated white card) */}
          <section className="lg:col-span-8 bg-white border border-[#DAE5E0] rounded-3xl p-6 md:p-10 shadow-[0_4px_24px_rgba(18,33,30,0.06)] space-y-8">
            {/* Lesson Eyebrow & Headline */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#9A5B18] uppercase tracking-wider bg-[#C57E2C]/10 px-3 py-1 rounded-full border border-[#C57E2C]/20">
                  {currentStep.category} · Step {currentStep.stepNumber} of {STEPS.length}
                </span>
                <span className="text-xs text-[#12211E]/55 font-mono">
                  Est. {currentStep.duration}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-black text-[#12211E] tracking-tight">
                {currentStep.title}
              </h2>
              <p className="text-sm text-[#12211E]/75 leading-relaxed">
                {currentStep.shortDesc}
              </p>
            </div>

            {/* Interface Screenshot Visual Reference (Replaced Live Simulation) */}
            <div className="bg-[#F2F6F4] border border-[#DAE5E0] rounded-2xl p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between text-xs pb-3 border-b border-[#DAE5E0]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#00B37E]" />
                  <span className="font-bold text-[#12211E] uppercase tracking-wide">
                    Interface Screenshot Reference
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-[#12211E]/60 font-mono">
                    Step {currentStep.stepNumber} of {STEPS.length}
                  </span>
                  <button
                    onClick={() =>
                      setZoomImage({
                        src: currentStep.image,
                        title: currentStep.title,
                        caption: currentStep.imageCaption
                      })
                    }
                    className="text-[11px] font-bold text-[#00B37E] hover:text-[#00B37E]/80 flex items-center gap-1 transition-colors cursor-pointer"
                    title="Zoom in screenshot"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Zoom In</span>
                  </button>
                </div>
              </div>

              {/* Clickable Image Preview Container */}
              <div
                onClick={() =>
                  setZoomImage({
                    src: currentStep.image,
                    title: currentStep.title,
                    caption: currentStep.imageCaption
                  })
                }
                className="group relative rounded-xl overflow-hidden border border-[#DAE5E0] bg-white shadow-xs cursor-pointer"
              >
                <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-[#E2EBE6]">
                  <img
                    src={currentStep.image}
                    alt={currentStep.imageAlt}
                    className="w-full h-full object-contain sm:object-cover object-top transition-transform duration-300 group-hover:scale-[1.01]"
                    loading="eager"
                  />
                  {/* Subtle hover overlay with zoom prompt */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-all flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-[#12211E]/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md">
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Click to enlarge screenshot</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Caption Reference Note */}
              <div className="flex items-start gap-2.5 px-1 text-xs text-[#12211E]/75">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00B37E] mt-1.5 shrink-0" />
                <p className="leading-relaxed">
                  <strong className="text-[#12211E] font-semibold">Visual Guide:</strong> {currentStep.imageCaption}
                </p>
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#12211E]">
                Practical Checklist
              </h3>
              <ol className="space-y-3 text-xs md:text-sm text-[#12211E]/80">
                {currentStep.instructions.map((inst, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#F2F6F4] border border-[#DAE5E0] flex items-center justify-center text-[10px] font-bold text-[#12211E] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{inst}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Operational Tip Callout (Beacon Amber highlight) */}
            <div className="p-4 rounded-2xl bg-[#C57E2C]/10 border border-[#C57E2C]/25 text-xs text-[#12211E] space-y-1">
              <div className="font-bold text-[#9A5B18] uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C57E2C]" />
                <span>Field Operator Tip</span>
              </div>
              <p className="leading-relaxed text-[#12211E]/80">
                {currentStep.operationalTip}
              </p>
            </div>

            {/* Action Buttons: Mark Complete + Step Navigation */}
            <div className="pt-4 border-t border-[#DAE5E0] flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={() => toggleComplete(currentStep.id)}
                className={`px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  completedSteps.includes(currentStep.id)
                    ? "bg-[#00B37E] text-white shadow-sm"
                    : "bg-[#F2F6F4] hover:bg-[#E2EBE6] text-[#12211E] border border-[#DAE5E0]"
                }`}
              >
                <Check className="w-4 h-4" />
                <span>
                  {completedSteps.includes(currentStep.id) ? "Marked as complete" : "Mark as complete"}
                </span>
              </button>

              <div className="flex items-center gap-2">
                <Link
                  href={currentStep.actionUrl}
                  className="px-4 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider text-[#00B37E] hover:bg-[#00B37E]/10 transition-colors flex items-center gap-1.5"
                >
                  <span>{currentStep.actionLabel}</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>

                {activeIndex > 0 && (
                  <button
                    onClick={() => setActiveStepId(STEPS[activeIndex - 1].id)}
                    className="p-2.5 rounded-full border border-[#DAE5E0] bg-white hover:bg-[#F2F6F4] text-[#12211E] transition-colors cursor-pointer"
                    title="Previous lesson"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}

                {activeIndex < STEPS.length - 1 && (
                  <button
                    onClick={() => setActiveStepId(STEPS[activeIndex + 1].id)}
                    className="bg-[#12211E] hover:bg-[#12211E]/90 text-white px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>Next lesson</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* FOOTER (Grounded coastal tone, zero em-dashes) */}
      <footer className="bg-[#E7EFEA] border-t border-[#DAE5E0] py-12 px-6 mt-16">
        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#12211E]/70">
          <div className="flex items-center gap-3">
            <ParolaLogo iconOnly className="w-7 h-7" />
            <span className="font-display text-base font-black text-[#12211E] tracking-tight uppercase">
              Parola Fisheries System
            </span>
          </div>

          <nav className="flex flex-wrap items-center gap-6 font-semibold">
            <Link href="/#how-it-works" className="hover:text-[#00B37E] transition-colors">
              Features
            </Link>
            <Link href="/guide" className="text-[#00B37E] transition-colors">
              System Guide
            </Link>
            <Link href="/pricing" className="hover:text-[#00B37E] transition-colors">
              Pricing
            </Link>
            <Link href="/about" className="hover:text-[#00B37E] transition-colors">
              About
            </Link>
            <Link href="/login" className="hover:text-[#00B37E] transition-colors">
              Log In
            </Link>
            <Link href="/register" className="hover:text-[#00B37E] transition-colors">
              Register
            </Link>
          </nav>

          <div className="text-[11px] text-[#12211E]/55">
            © {new Date().getFullYear()} Parola. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Lightbox / Zoom Modal for Full Image Inspection */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomImage(null)}
            className="fixed inset-0 z-50 bg-[#12211E]/80 backdrop-blur-sm p-4 sm:p-8 flex items-center justify-center cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-white/20 cursor-default"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#DAE5E0] bg-[#F2F6F4]">
                <div className="min-w-0 pr-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#00B37E]">
                    Interface Visual Reference
                  </div>
                  <div className="text-sm font-bold text-[#12211E] truncate">
                    {zoomImage.title}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={zoomImage.src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-[#12211E]/70 hover:text-[#00B37E] transition-colors rounded-lg hover:bg-white flex items-center gap-1 text-xs font-bold"
                    title="Open raw image in new tab"
                  >
                    <span>Full Tab</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => setZoomImage(null)}
                    className="p-1.5 text-[#12211E]/70 hover:text-[#12211E] transition-colors rounded-lg hover:bg-white cursor-pointer"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Image Body */}
              <div className="overflow-auto p-2 sm:p-4 bg-slate-900/5 flex items-center justify-center">
                <img
                  src={zoomImage.src}
                  alt={zoomImage.title}
                  className="max-h-[68vh] w-auto max-w-full rounded-lg object-contain shadow-sm"
                />
              </div>

              {/* Modal Footer Caption */}
              <div className="px-5 py-3 border-t border-[#DAE5E0] bg-white text-xs text-[#12211E]/75 flex items-start gap-2">
                <span className="font-bold text-[#12211E] shrink-0">Note:</span>
                <span>{zoomImage.caption}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
