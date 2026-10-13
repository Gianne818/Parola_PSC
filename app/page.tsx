"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  ShieldAlert,
  Radio,
  ArrowRight,
  Fish,
  Anchor,
  CheckCircle2,
  Ship,
  Lock,
  Building2,
  PhoneCall,
  Layers,
  ShieldCheck
} from "lucide-react";
import { ParolaLogo } from "@/components/ui/ParolaLogo";
import ProductPreview from "@/components/landing/ProductPreview";
import styles from "@/components/landing/landing.module.css";
import { useLandingMotion } from "@/components/landing/useLandingMotion";

export default function LandingPage() {

  // Interactive 2-Way SMS Command Engine Simulation
  const [selectedCommand, setSelectedCommand] = useState<"ADVISORY" | "HOTSPOT" | "STATUS">("ADVISORY");

  // Interactive Safety Hold Threshold Simulator
  const [simulateGale, setSimulateGale] = useState<boolean>(false);
  const root = useLandingMotion(selectedCommand, simulateGale);

  const smsResponses: Record<"ADVISORY" | "HOTSPOT" | "STATUS", { query: string; response: string }> = {
    ADVISORY: {
      query: "ADVISORY",
      response: "PAROLA (Mercedes): Waves 0.8m, wind 9kts ENE. Zone 3 active for Tamban. Return harbor by 17:00 PHT.\nSample sponsored footer."
    },
    HOTSPOT: {
      query: "HOTSPOT",
      response: "PAROLA: Zone 3 (14.128°N, 123.084°E) active. 12km ENE offshore. SST 28.2°C thermal front. Tamban prob 84%.\nSample sponsored footer."
    },
    STATUS: {
      query: "STATUS",
      response: "PAROLA: Sample vessel, Mercedes home port. Advisory status: no sample hold. Check current official port instructions.\nSample sponsored footer."
    }
  };


  return (
    <div ref={root} className={`${styles.page} min-h-screen bg-[#F2F6F4] text-[#12211E] relative z-0 font-sans antialiased overflow-x-clip selection:bg-[#087F5B]/20 selection:text-[#12211E]`}>
      <a href="#landing-content" className={styles.skipLink}>Skip to content</a>

      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 bg-[#F2F6F4]">

        <div className={`${styles.atmosphere} absolute inset-0`} />
      </div>

      <header className="sticky top-0 w-full border-b border-[#DAE5E0] bg-[#F2F6F4]/90 backdrop-blur-md z-40">
        <div className="flex items-center justify-between gap-3 h-[68px] px-4 sm:px-6 md:px-12 max-w-7xl mx-auto w-full">
          <Link href="/" className="flex items-center gap-3 group">
            <ParolaLogo iconOnly className="w-8 h-8 group-hover:scale-105 transition-transform" />
            <span className="font-display text-xl font-black tracking-tight text-[#12211E] uppercase">
              Parola
            </span>
          </Link>

          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-6 lg:gap-8 text-xs font-bold uppercase tracking-wider text-[#12211E]/75">
            <a href="#how-it-works" className="hover:text-[#087F5B] transition-colors cursor-pointer">
              Features
            </a>
            <Link href="/guide" className="hover:text-[#087F5B] transition-colors">
              System Guide
            </Link>
            <Link href="/pricing" className="hover:text-[#087F5B] transition-colors">
              Pricing
            </Link>
            <Link href="/about" className="hover:text-[#087F5B] transition-colors">
              About
            </Link>
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/login"
              className="inline-flex items-center min-h-11 text-xs font-bold uppercase tracking-wider text-[#12211E]/75 hover:text-[#12211E] transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center min-h-11 bg-[#087F5B] hover:bg-[#066B4C] text-white px-3 sm:px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-[0.98]"
            >
              Register Vessel
            </Link>
          </div>
        </div>
        <nav aria-label="Mobile navigation" className={styles.mobileNav}>
          <Link href="/guide">System Guide</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/about">About</Link>
        </nav>
      </header>

      <main id="landing-content" tabIndex={-1}>
      <section
        data-hero
        aria-labelledby="landing-heading"
        className="pt-10 md:pt-14 pb-14 md:pb-16 px-6 max-w-7xl mx-auto w-full border-b border-[#DAE5E0]"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">

          <div className="lg:col-span-6 space-y-6">

            <div className={`${styles.eyebrow} inline-flex items-center gap-2 text-[#9A5B18] text-[11px] font-semibold uppercase tracking-wider`}>
              <Radio className="w-3 h-3 text-[#C57E2C]" />
              <span>Built for Philippine coastal communities</span>
            </div>

            <h1 id="landing-heading" className="text-[2rem] min-[390px]:text-4xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight text-[#12211E] leading-[1.05]">
              Maritime safety and fish hotspots, delivered by <span data-sms-word className={styles.smsWord}>SMS<span data-sms-underline aria-hidden="true" className={styles.smsUnderline} /></span>.
            </h1>

            <p data-hero-copy className="text-base md:text-lg text-[#12211E]/75 leading-relaxed font-normal max-w-xl">
              Weather advisories and fishing hotspot guidance for Philippine coastal communities, delivered to basic mobile phones.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/register"
                className="bg-[#087F5B] hover:bg-[#066B4C] text-white px-8 py-4 rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-[0.98] text-center"
              >
                Register Your Vessel
              </Link>
              <Link
                href="/guide"
                className="bg-white hover:bg-[#EAF1ED] text-[#12211E] border border-[#DAE5E0] px-8 py-4 rounded-full font-bold text-xs uppercase tracking-wider transition-all text-center flex items-center justify-center gap-2 shadow-2xs"
              >
                <span>Explore System Guide</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#087F5B]" />
              </Link>
            </div>
            <p className={styles.startNote}>
              <Link href="/pricing#municipal-access">Free access for municipal craft at or below 3.0 GT.</Link>
              <span>Create an account first, then set your home port.</span>
            </p>
          </div>

          <div className={`${styles.heroProduct} lg:col-span-6 flex items-center justify-center`}>
            <div data-hero-beacon aria-hidden="true" className={styles.heroBeacon} />
            <div className="relative w-full max-w-xl lg:max-w-2xl">
              <ProductPreview />
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="py-14 md:py-20 px-6 max-w-7xl mx-auto w-full border-b border-[#DAE5E0]"
      >

        <div className="max-w-3xl mb-12">
          <h2 className="text-2xl md:text-4xl font-display font-black text-[#12211E] tracking-tight leading-tight">
            Built for the coast. Ready for a basic phone.
          </h2>
          <p className="text-sm md:text-base text-[#12211E]/75 leading-relaxed font-normal mt-3 max-w-2xl">
            Marine weather, fishing hotspots, and safety alerts reach coastal communities without mobile data. Try the sample tools below.
          </p>
        </div>

        <div data-demo-grid className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          <div data-demo-panel className={`${styles.smsPanel} lg:col-span-7 border border-[#DAE5E0] rounded-3xl p-6 md:p-8 flex flex-col justify-between`}>
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#087F5B]/10 flex items-center justify-center text-[#087F5B]">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-display font-extrabold text-[#12211E]">
                Marine advisories, without mobile data
              </h3>
              <p className="text-sm text-[#12211E]/75 leading-relaxed font-normal max-w-lg">
                Read advisories on an SMS-capable phone without mobile data. Delivery still needs cellular signal and an active SMS service. Try the sample commands below.
              </p>
            </div>

            <div className="mt-6 pt-5 border-t border-[#DAE5E0] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#12211E]/70">
                <span className="font-semibold">Try an SMS command</span>
                <span>Demo · sample responses</span>
              </div>

              <div role="group" aria-label="Sample SMS commands" className="flex flex-wrap gap-2">
                {(["ADVISORY", "HOTSPOT", "STATUS"] as const).map((cmd) => (
                  <button
                    key={cmd}
                    type="button"
                    aria-pressed={selectedCommand === cmd}
                    aria-controls="sample-sms-response"
                    onClick={() => setSelectedCommand(cmd)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      selectedCommand === cmd
                        ? "bg-[#087F5B] text-white shadow-xs"
                        : "bg-white text-[#12211E]/70 hover:bg-[#E2EBE6] border border-[#DAE5E0]"
                    }`}
                  >
                    {cmd}
                  </button>
                ))}
              </div>

              <div aria-hidden="true" className={styles.dispatchTrack}>
                <span className={styles.dispatchLine} />
                <MessageSquare data-message-packet className={styles.messagePacket} />
              </div>
              <div className={`${styles.smsConsole} text-xs font-mono space-y-3 bg-[#12211E] text-white p-4 rounded-xl`}>
                <div className="text-[#C4D8CE]">You sent: {smsResponses[selectedCommand].query}</div>
                <div className={`${styles.smsResponse} text-[#A7F3D0] leading-relaxed`}>

                  {Object.entries(smsResponses).map(([command, sample]) => (
                    <div key={command} aria-hidden="true">{sample.response}</div>
                  ))}
                  <div id="sample-sms-response" role="status" aria-live="polite" aria-atomic="true" aria-label="Sample SMS response">
                    <div data-sms-reply>
                      {smsResponses[selectedCommand].response}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div data-demo-panel className={`${styles.safetyCard} lg:col-span-5 border border-[#DAE5E0] rounded-3xl p-6 md:p-8 flex flex-col justify-between`}>
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-display font-extrabold text-[#12211E]">
                A safety alert before departure
              </h3>
              <p className="text-sm text-[#12211E]/75 leading-relaxed font-normal">
                See how a warning changes the advisory. This sample uses a 1.5m wave threshold; actual alerts depend on the configured service. Follow current official warnings and port instructions.
              </p>
            </div>

            <div className="mt-6 pt-5 border-t border-[#DAE5E0] space-y-3">
              <p className="text-xs text-[#12211E]/70">Safety demo · sample conditions</p>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-semibold text-[#12211E]">
                  {simulateGale ? "Waves above 1.5m" : "Waves 0.8m"}
                </span>
                <button
                  type="button"
                  aria-pressed={simulateGale}
                  aria-controls="sample-safety-status"
                  onClick={() => setSimulateGale(previous => !previous)}
                  className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                    simulateGale
                      ? "bg-rose-100 border-rose-300 text-rose-700"
                      : "bg-[#087F5B]/10 border-[#00B37E]/25 text-[#087F5B]"
                  }`}
                >
                  {simulateGale ? "Restore calm conditions" : "Simulate rough seas"}
                </button>
              </div>

              <div
                data-safety-panel
                id="sample-safety-status"
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className={`${styles.statusPanel} p-4 min-h-24 rounded-xl text-sm border ${
                  simulateGale
                    ? "bg-rose-50 border-rose-200 text-rose-800"
                    : "bg-[#EDF5F0] border-[#DAE5E0] text-[#12211E]/75"
                }`}
              >
                {simulateGale ? (
                  <span className="flex items-start gap-2 text-rose-800">
                    <ShieldAlert aria-hidden="true" className="w-5 h-5 shrink-0 mt-0.5" />
                    <span><strong className="block">Sample departure hold</strong>Rough seas detected. A hold notification is triggered.</span>
                  </span>
                ) : (
                  <span className="flex items-start gap-2">
                    <ShieldCheck aria-hidden="true" className="w-5 h-5 text-[#087F5B] shrink-0 mt-0.5" />
                    <span><strong className="block text-[#087F5B]">No sample hold triggered</strong>Conditions are below this demo&apos;s wave threshold.</span>
                  </span>
                )}
              </div>

              <Link
                href="/alerts"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#087F5B] hover:underline"
              >
                <span>View safety alerts</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-12 bg-[#EAF3ED] border border-[#DAE5E0] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_2px_16px_rgba(18,33,30,0.03)]">
            <div className="space-y-2.5 max-w-xl">
              <div className="w-10 h-10 rounded-xl bg-[#087F5B]/10 flex items-center justify-center text-[#087F5B]">
                <Fish className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-display font-extrabold text-[#12211E]">
                Ocean signals point to fishing hotspots
              </h3>
              <p className="text-sm text-[#12211E]/75 leading-relaxed font-normal">
                Sea temperature and chlorophyll information help identify potential fishing areas for Tamban, Galunggong, and Tuna. Hotspots are guidance, not guaranteed catches.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
              <Link
                href="/guide"
                className="bg-white hover:bg-[#EAF1ED] text-[#12211E] border border-[#DAE5E0] px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider transition-all text-center shadow-2xs"
              >
                View System Guide
              </Link>
              <Link
                href="/pricing"
                className="bg-[#087F5B] hover:bg-[#066B4C] text-white px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider transition-all text-center shadow-sm"
              >
                View Tonnage Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section
        className="py-14 md:py-20 px-6 max-w-7xl mx-auto w-full border-b border-[#DAE5E0]"
      >
        <div className="max-w-3xl mb-12">
          <h2 className="text-2xl md:text-4xl font-display font-black text-[#12211E] tracking-tight leading-tight">
            From home port to daily guidance
          </h2>
          <p className="text-sm md:text-base text-[#12211E]/75 leading-relaxed font-normal mt-3 max-w-2xl">
            From vessel registration at the municipal dock to daily SMS marine bulletins and catch reports, Parola connects the entire fisheries workflow.
          </p>
        </div>

        <div data-workflow className={styles.workflow}>
        <span aria-hidden="true" className={styles.workflowRail}><span data-workflow-line /></span>
        <ol className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: "Step 01",
              title: "Port registration",
              desc: "Register your vessel and home port to receive local bulletins and record emergency contacts.",
              icon: Anchor,
              href: "/onboarding"
            },
            {
              step: "Step 02",
              title: "SMS advisories",
              desc: "Review marine weather, wave heights, and fishing guidance. Dispatch timing depends on your advisory settings.",
              icon: MessageSquare,
              href: "/guide"
            },
            {
              step: "Step 03",
              title: "Catch feedback",
              desc: "Rate the latest advisory against your trip using the dashboard's catch-accuracy feedback.",
              icon: Fish,
              href: "/dashboard"
            },
            {
              step: "Step 04",
              title: "Safety holds",
              desc: "Review weather warnings and advisory status alongside official instructions before departure.",
              icon: ShieldAlert,
              href: "/alerts"
            }
          ].map((item) => (
            <li key={item.href} data-workflow-step className={styles.workflowStep}>
              <Link
                href={item.href}
                className="p-6 rounded-2xl transition-colors h-full block group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div data-step-marker className={`${styles.stepMarker} w-9 h-9 text-[#087F5B] flex items-center justify-center`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium text-[#9A5B18] tabular-nums">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-base text-[#12211E] group-hover:text-[#087F5B] transition-colors flex items-center gap-1.5">
                    <span>{item.title}</span>
                    <ArrowRight aria-hidden="true" className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-sm text-[#12211E]/70 leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ol>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/guide"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#087F5B] hover:underline"
          >
            <span>Read the interactive step-by-step guide</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      <section
        className="py-14 md:py-20 px-6 max-w-7xl mx-auto w-full border-b border-[#DAE5E0]"
      >
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 text-[#9A5B18] text-xs font-medium mb-3">
            <Ship className="w-3.5 h-3.5 text-[#C57E2C]" />
            <span>Municipal access and commercial vessel plans</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-display font-black text-[#12211E] tracking-tight leading-tight">
            Plans matched to your vessel
          </h2>
          <p className="text-sm md:text-base text-[#12211E]/75 leading-relaxed font-normal mt-3 max-w-2xl">
            Municipal craft at or below 3.0 GT receive free subsidized access. Commercial plans are monthly, per vessel, and matched to registered gross tonnage.
          </p>
        </div>

        <div className={styles.municipalAccess}>
          <div>
            <h3>Municipal access, without a subscription.</h3>
            <p>Start with your mobile number and home port. Read advisories on a basic phone when SMS delivery is enabled.</p>
            <Link href="/pricing#municipal-access">Check eligibility and getting-started details <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
          <div className={styles.municipalPrice}>₱0<span>Municipal subscription</span></div>
        </div>

        <div data-quiet-group className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="bg-white border border-[#DAE5E0] rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-[0_2px_12px_rgba(18,33,30,0.04)]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#9A5B18] uppercase tracking-wider bg-[#C57E2C]/10 px-3 py-1 rounded-full border border-[#C57E2C]/20">
                  3.1 to 20.0 GT
                </span>
                <Ship className="w-4 h-4 text-[#087F5B]" />
              </div>
              <div>
                <h3 className="font-display font-black text-xl text-[#12211E]">
                  Small-Scale Commercial
                </h3>
                <div className="text-xs font-mono text-[#53665C]">Sec. 3(n)(1) RA 8550</div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-display font-black text-[#12211E]">₱799</span>
                <span className="text-xs text-[#12211E]/55 font-medium">/ mo per vessel</span>
              </div>
              <p className="text-sm text-[#12211E]/75 leading-relaxed">
                50 km radius from home port outside municipal waters, with multi-species target selection.
              </p>
              <div className="py-3 border-t border-[#DAE5E0] text-xs space-y-1">
                <span className="font-bold text-[#12211E] flex items-center gap-1">
                  <Lock className="w-3 h-3 text-[#087F5B]" />
                  <span>Daily Download Quota:</span>
                </span>
                <span className="text-[#12211E]/75 block">
                  1 locked zone / day (unlimited re-downloads of that same zone for 24 hours).
                </span>
              </div>
              <ul className="space-y-2 text-xs text-[#12211E]/80 pt-2 border-t border-[#DAE5E0]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#087F5B] shrink-0" />
                  <span>Daily 04:30 PHT morning SMS advisories</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#087F5B] shrink-0" />
                  <span>Offline chartplotter Geo-Packs (.GPX, .KML)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#087F5B] shrink-0" />
                  <span>PAGASA gale warnings & safety holds</span>
                </li>
              </ul>
            </div>
            <div className="pt-6">
              <Link
                href="/pricing#vessel-subscriptions"
                className="w-full block bg-[#F2F6F4] hover:bg-[#E2EBE6] text-[#12211E] border border-[#DAE5E0] py-3 rounded-full font-bold text-xs uppercase tracking-wider text-center transition-all"
              >
                View Small-Scale Details
              </Link>
            </div>
          </div>

          <div className="bg-[#F8FBF9] border border-[#087F5B] rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-[0_2px_12px_rgba(18,33,30,0.04)] relative">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-[#087F5B] px-3 py-1 rounded-full">
                  20.1 to 150.0 GT
                </span>
              </div>
              <div>
                <h3 className="font-display font-black text-xl text-[#12211E]">
                  Medium-Scale Commercial
                </h3>
                <div className="text-xs font-mono text-[#53665C]">Sec. 3(n)(2) RA 8550</div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-display font-black text-[#12211E]">₱2,499</span>
                <span className="text-xs text-[#12211E]/55 font-medium">/ mo per vessel</span>
              </div>
              <p className="text-sm text-[#12211E]/75 leading-relaxed">
                Permits full coverage of 1 selected Fisheries Management Area (FMA) and multi-species target selection.
              </p>
              <div className="py-3 border-t border-[#DAE5E0] text-xs space-y-1">
                <span className="font-bold text-[#12211E] flex items-center gap-1">
                  <Lock className="w-3 h-3 text-[#087F5B]" />
                  <span>Daily Download Quota:</span>
                </span>
                <span className="text-[#12211E]/75 block">
                  1 locked zone / day, unlimited re-downloads for 24h.
                </span>
              </div>
              <ul className="space-y-2 text-xs text-[#12211E]/80 pt-2 border-t border-[#DAE5E0]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#087F5B] shrink-0" />
                  <span>Full coverage of 1 designated FMA</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#087F5B] shrink-0" />
                  <span>24–72h spatial forecast Geo-Packs (.GPX, .KML, .GeoJSON)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#087F5B] shrink-0" />
                  <span>Multi-zone SST thermal front mapping</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#087F5B] shrink-0" />
                  <span>Priority harbor muster dispatch</span>
                </li>
              </ul>
            </div>
            <div className="pt-6">
              <Link
                href="/pricing#vessel-subscriptions"
                className="w-full block bg-[#087F5B] hover:bg-[#066B4C] text-white py-3 rounded-full font-bold text-xs uppercase tracking-wider text-center transition-all shadow-sm active:scale-[0.98]"
              >
                Select Medium-Scale
              </Link>
            </div>
          </div>

          <div className="bg-white border border-[#DAE5E0] rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-[0_2px_12px_rgba(18,33,30,0.04)]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#9A5B18] uppercase tracking-wider bg-[#C57E2C]/10 px-3 py-1 rounded-full border border-[#C57E2C]/20">
                  &gt;150.0 GT
                </span>
                <Ship className="w-4 h-4 text-[#087F5B]" />
              </div>
              <div>
                <h3 className="font-display font-black text-xl text-[#12211E]">
                  Large-Scale Commercial
                </h3>
                <div className="text-xs font-mono text-[#53665C]">Sec. 3(n)(3) RA 8550</div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-display font-black text-[#12211E]">₱6,199</span>
                <span className="text-xs text-[#12211E]/55 font-medium">/ mo per vessel</span>
              </div>
              <p className="text-sm text-[#12211E]/75 leading-relaxed">
                Full Philippine EEZ access, multi-species target selection, and priority support.
              </p>
              <div className="py-3 border-t border-[#DAE5E0] text-xs space-y-1">
                <span className="font-bold text-[#12211E] flex items-center gap-1">
                  <Lock className="w-3 h-3 text-[#087F5B]" />
                  <span>Daily Download Quota:</span>
                </span>
                <span className="text-[#12211E]/75 block">
                  1 locked zone / day, unlimited re-downloads for 24h.
                </span>
              </div>
              <ul className="space-y-2 text-xs text-[#12211E]/80 pt-2 border-t border-[#DAE5E0]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#087F5B] shrink-0" />
                  <span>Full nationwide Philippine EEZ coverage</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#087F5B] shrink-0" />
                  <span>Priority 24/7 dedicated support & direct API</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#087F5B] shrink-0" />
                  <span>Automated harvest reporting for BFAR compliance</span>
                </li>
              </ul>
            </div>
            <div className="pt-6">
              <Link
                href="/pricing#vessel-subscriptions"
                className="w-full block bg-[#F2F6F4] hover:bg-[#E2EBE6] text-[#12211E] border border-[#DAE5E0] py-3 rounded-full font-bold text-xs uppercase tracking-wider text-center transition-all"
              >
                View Large-Scale Details
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white/70 border border-[#DAE5E0] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xs">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#087F5B]">
              <Building2 className="w-4 h-4" />
              <span>Fleet plans and satellite sync</span>
            </div>
            <h4 className="text-lg font-display font-bold text-[#12211E]">
              Operating five or more vessels?
            </h4>
            <p className="text-sm text-[#12211E]/75 leading-relaxed">
              Explore annual fleet licenses, shared dashboard views, and offshore satellite sync. View the full options and requirements on our pricing page.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href="/pricing#fleet-enterprise"
              className="bg-[#087F5B] hover:bg-[#066B4C] text-white px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider transition-all text-center shadow-sm"
            >
              Explore Fleet Enterprise
            </Link>
            <Link
              href="/pricing#geopack-satellite"
              className="bg-white hover:bg-[#F2F6F4] text-[#12211E] border border-[#DAE5E0] px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider transition-all text-center shadow-2xs"
            >
              Satellite Sync Add-on
            </Link>
          </div>
        </div>
      </section>

      <section
        className="py-14 md:py-20 px-6 max-w-7xl mx-auto w-full border-b border-[#DAE5E0]"
      >
        <div className="max-w-3xl mb-12">
          <div className="text-xs font-semibold tracking-wide text-[#9A5B18] mb-3">
            How Parola is funded
          </div>
          <h2 className="text-2xl md:text-4xl font-display font-black text-[#12211E] tracking-tight leading-tight">
            A business model that supports coastal access
          </h2>
          <p className="text-sm md:text-base text-[#12211E]/75 leading-relaxed font-normal mt-3 max-w-2xl">
            Commercial subscriptions, sponsored municipal advisories, and spatial data licensing support the service.
          </p>
        </div>

        <div data-quiet-group className="grid grid-cols-1 md:grid-cols-3 gap-0">

          <div className="border-t border-[#CADBD1] p-6 md:p-8 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#087F5B]/10 flex items-center justify-center text-[#087F5B]">
                <Ship className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-medium tracking-wider text-[#53665C]">Pillar 01</span>
                <h3 className="font-display font-bold text-lg text-[#12211E]">
                  Commercial vessel subscriptions
                </h3>
              </div>
              <p className="text-sm text-[#12211E]/75 leading-relaxed">
                Monthly vessel subscriptions fund SMS advisories and offline chartplotter exports, with fleet plans for larger operators.
              </p>
            </div>
            <div className="pt-2">
              <Link href="/pricing#vessel-subscriptions" className="text-xs font-bold text-[#087F5B] hover:underline flex items-center gap-1">
                <span>View vessel plans</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="border-t border-[#CADBD1] p-6 md:p-8 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#C57E2C]/10 flex items-center justify-center text-[#C57E2C]">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-medium tracking-wider text-[#53665C]">Pillar 02</span>
                <h3 className="font-display font-bold text-lg text-[#12211E]">
                  Sponsored municipal access
                </h3>
              </div>
              <p className="text-sm text-[#12211E]/75 leading-relaxed">
                Free municipal access (&le;3.0 GT), with a funding model based on sponsorship, web advertising, and proposed telecom agreements.
              </p>
            </div>
            <div className="pt-2">
              <Link href="/pricing#free-tier-subsidies" className="text-xs font-bold text-[#9A5B18] hover:underline flex items-center gap-1">
                <span>View municipal access</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="border-t border-[#CADBD1] p-6 md:p-8 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#087F5B]/10 flex items-center justify-center text-[#087F5B]">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-medium tracking-wider text-[#53665C]">Pillar 03</span>
                <h3 className="font-display font-bold text-lg text-[#12211E]">
                  Spatial data licensing
                </h3>
              </div>
              <p className="text-sm text-[#12211E]/75 leading-relaxed">
                Anonymized fishing activity and environmental data for fisheries monitoring, coastal LGU planning, and marine conservation.
              </p>
            </div>
            <div className="pt-2">
              <Link href="/pricing#b2g-licensing" className="text-xs font-bold text-[#087F5B] hover:underline flex items-center gap-1">
                <span>View data licensing</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section
        className="py-14 md:py-20 px-6 max-w-7xl mx-auto w-full"
      >
        <div className="bg-[#E6F0E9] border border-[#DAE5E0] rounded-3xl p-8 md:p-14 text-[#12211E] relative overflow-hidden shadow-sm">
          <div className="max-w-3xl space-y-5 relative z-10">
            <h2 className="text-2xl md:text-4xl font-display font-black tracking-tight leading-tight">
              Ocean science within reach of municipal fisherfolk
            </h2>
            <p className="text-sm text-[#12211E]/75 font-normal leading-relaxed max-w-xl">
              Parola aims to make weather and fishing guidance easier to access through SMS, while supporting coastal coordination and more informed trip planning.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-3">
              <Link
                href="/about"
                className="bg-[#087F5B] hover:bg-[#066B4C] text-white px-8 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-[0.98] text-center"
              >
                Learn More About Parola
              </Link>
              <Link
                href="/register"
                className="bg-white text-[#12211E] hover:bg-[#F2F6F4] border border-[#DAE5E0] px-8 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-2xs active:scale-[0.98] text-center"
              >
                Register Your Vessel
              </Link>
            </div>
          </div>
        </div>
      </section>

      </main>

      <footer className="bg-[#E7EFEA] border-t border-[#DAE5E0] py-12 px-6">
        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#12211E]/70">
          <div className="flex items-center gap-3">
            <ParolaLogo iconOnly className="w-7 h-7" />
            <span className="font-display text-base font-black text-[#12211E] tracking-tight uppercase">
              Parola Fisheries System
            </span>
          </div>

          <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-6 font-semibold">
            <a href="#how-it-works" className="hover:text-[#087F5B] transition-colors cursor-pointer">
              Features
            </a>
            <Link href="/guide" className="hover:text-[#087F5B] transition-colors">
              System Guide
            </Link>
            <Link href="/pricing" className="hover:text-[#087F5B] transition-colors">
              Pricing
            </Link>
            <Link href="/about" className="hover:text-[#087F5B] transition-colors">
              About
            </Link>
            <Link href="/login" className="hover:text-[#087F5B] transition-colors">
              Log In
            </Link>
            <Link href="/register" className="hover:text-[#087F5B] transition-colors">
              Register
            </Link>
          </nav>

          <div className="text-[11px] text-[#12211E]/55">
            © {new Date().getFullYear()} Parola. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
