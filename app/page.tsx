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

  // Local outbound-message examples; internal keys also drive the existing animation.
  const [selectedCommand, setSelectedCommand] = useState<"ADVISORY" | "HOTSPOT" | "STATUS">("ADVISORY");

  // Interactive Safety Hold Threshold Simulator
  const [simulateGale, setSimulateGale] = useState<boolean>(false);
  const root = useLandingMotion(selectedCommand, simulateGale);

  const smsResponses: Record<"ADVISORY" | "HOTSPOT" | "STATUS", { query: string; response: string }> = {
    ADVISORY: {
      query: "Routine day",
      response: "PAROLA SAMPLE: Selected routine day for Mercedes. Example waves 0.8m, wind 9kts ENE. Check current official warnings. Not current guidance."
    },
    HOTSPOT: {
      query: "Area guidance",
      response: "PAROLA SAMPLE: Fishing-area guidance would include the area, prediction date and available data. No live target or catch probability is provided by this demo."
    },
    STATUS: {
      query: "Critical alert",
      response: "PAROLA SAMPLE: Applicable critical alerts are planned for any day, including days without routine advisories. Follow current official warnings and port instructions."
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
              Create Account
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
              Marine guidance, with planned <span data-sms-word className={styles.smsWord}>SMS<span data-sms-underline aria-hidden="true" className={styles.smsUnderline} /></span> advisories.
            </h1>

            <p data-hero-copy className="text-base md:text-lg text-[#12211E]/75 leading-relaxed font-normal max-w-xl">
              Explore marine weather and fishing-area guidance for Philippine coastal communities. Automatic selected-day SMS is planned; the portal currently offers manual weather requests.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/register"
                className="bg-[#087F5B] hover:bg-[#066B4C] text-white px-8 py-4 rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-[0.98] text-center"
              >
              Create Your Account
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
              <Link href="/pricing#municipal-access">Standard municipal access is free; eligibility details await review.</Link>
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
            Built for the coast. Designed for a basic phone.
          </h2>
          <p className="text-sm md:text-base text-[#12211E]/75 leading-relaxed font-normal mt-3 max-w-2xl">
            Reading a delivered SMS needs no mobile data. Registration, portal use and future voluntary reporting need internet access. Try the local examples below.
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
                Planned routine advisories cover up to five selected weekdays; critical alerts are separate and may arrive any day. Scheduling is not yet available. Delivery needs an enabled service and cellular signal and is not guaranteed.
              </p>
            </div>

            <div className="mt-6 pt-5 border-t border-[#DAE5E0] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#12211E]/70">
                <span className="font-semibold">Explore outbound SMS examples</span>
                <span>Local demo · nothing is sent</span>
              </div>

              <div role="group" aria-label="Outbound SMS examples" className="flex flex-wrap gap-2">
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
                    {smsResponses[cmd].query}
                  </button>
                ))}
              </div>

              <div aria-hidden="true" className={styles.dispatchTrack}>
                <span className={styles.dispatchLine} />
                <MessageSquare data-message-packet className={styles.messagePacket} />
              </div>
              <div className={`${styles.smsConsole} text-xs font-mono space-y-3 bg-[#12211E] text-white p-4 rounded-xl`}>
                <div className="text-[#C4D8CE]">Sample message: {smsResponses[selectedCommand].query}</div>
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
                      <span><strong className="block">Sample departure hold</strong>This local example displays a warning. No notification is sent.</span>
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
                Sea temperature and chlorophyll can support fishing-area models. Species support and data quality need validation; a displayed score is not a verified catch probability or a guarantee of catch or fuel savings.
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
            From home port to available guidance
          </h2>
          <p className="text-sm md:text-base text-[#12211E]/75 leading-relaxed font-normal mt-3 max-w-2xl">
            Create an account, set your home port and review available portal guidance. Selected-day advisories and structured voluntary trip reports remain planned.
          </p>
        </div>

        <div data-workflow className={styles.workflow}>
        <span aria-hidden="true" className={styles.workflowRail}><span data-workflow-line /></span>
        <ol className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: "Step 01",
              title: "Home-port setup",
              desc: "Create an account and set your home-port reference. This does not verify vessel registration or enroll you in automatic SMS.",
              icon: Anchor,
              href: "/onboarding"
            },
            {
              step: "Step 02",
              title: "SMS advisories",
              desc: "Review the portal advisory and request a weather SMS manually when enabled. Automatic selected-day scheduling is planned.",
              icon: MessageSquare,
              href: "/guide"
            },
            {
              step: "Step 03",
              title: "Voluntary reports (planned)",
              desc: "Structured trip reports, including zero catch, are planned for the portal or authorized assistance. Reporting will be optional and need internet access.",
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
            Standard municipal access is free. Commercial prices and tonnage bands below are proposals, subject to verification and eligibility review; creating an account does not activate a paid plan or grant fishing permission.
          </p>
        </div>

        <div className={styles.municipalAccess}>
          <div>
            <h3>Municipal access, without a subscription.</h3>
            <p>Start with your mobile number and home port. Manual SMS requests depend on service availability; automatic scheduling is planned.</p>
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
                <div className="text-xs font-mono text-[#53665C]">Proposed class — eligibility review pending</div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-display font-black text-[#12211E]">₱799</span>
                <span className="text-xs text-[#12211E]/55 font-medium">/ mo per vessel</span>
              </div>
              <p className="text-sm text-[#12211E]/75 leading-relaxed">
                Proposed scope: within 50 km of home port outside municipal waters. Coverage and permission checks are pending.
              </p>
              <div className="py-3 border-t border-[#DAE5E0] text-xs space-y-1">
                <span className="font-bold text-[#12211E] flex items-center gap-1">
                  <Lock className="w-3 h-3 text-[#087F5B]" />
                  <span>Proposed zone allowance:</span>
                </span>
                <span className="text-[#12211E]/75 block">
                  One zone per cycle is proposed; reset and re-download rules await agreement. Demo downloads do not enforce an entitlement.
                </span>
              </div>
              <ul className="space-y-2 text-xs text-[#12211E]/80 pt-2 border-t border-[#DAE5E0]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#087F5B] shrink-0" />
                  <span>Selected-day routine SMS planned; timing pending</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#087F5B] shrink-0" />
                  <span>Sample .GPX and .KML exports; device imports unverified</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#087F5B] shrink-0" />
                  <span>Any-day critical alerts planned; official warnings remain essential</span>
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
                <div className="text-xs font-mono text-[#53665C]">Proposed class — eligibility review pending</div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-display font-black text-[#12211E]">₱2,499</span>
                <span className="text-xs text-[#12211E]/55 font-medium">/ mo per vessel</span>
              </div>
              <p className="text-sm text-[#12211E]/75 leading-relaxed">
                Proposed scope: one selected Fisheries Management Area (FMA). Full coverage and access are not established.
              </p>
              <div className="py-3 border-t border-[#DAE5E0] text-xs space-y-1">
                <span className="font-bold text-[#12211E] flex items-center gap-1">
                  <Lock className="w-3 h-3 text-[#087F5B]" />
                  <span>Proposed zone allowance:</span>
                </span>
                <span className="text-[#12211E]/75 block">
                  Zone cycle and re-download policy pending; demo only.
                </span>
              </div>
              <ul className="space-y-2 text-xs text-[#12211E]/80 pt-2 border-t border-[#DAE5E0]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#087F5B] shrink-0" />
                  <span>Selected FMA coverage subject to validation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#087F5B] shrink-0" />
                  <span>24–72h forecast export options are demonstrations</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#087F5B] shrink-0" />
                  <span>Multi-zone thermal front mapping planned</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#087F5B] shrink-0" />
                  <span>Harbor dispatch integration planned</span>
                </li>
              </ul>
            </div>
            <div className="pt-6">
              <Link
                href="/pricing#vessel-subscriptions"
                className="w-full block bg-[#087F5B] hover:bg-[#066B4C] text-white py-3 rounded-full font-bold text-xs uppercase tracking-wider text-center transition-all shadow-sm active:scale-[0.98]"
              >
                View Medium-Scale Proposal
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
                <div className="text-xs font-mono text-[#53665C]">Proposed class — eligibility review pending</div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-display font-black text-[#12211E]">₱6,199</span>
                <span className="text-xs text-[#12211E]/55 font-medium">/ mo per vessel</span>
              </div>
              <p className="text-sm text-[#12211E]/75 leading-relaxed">
                Proposed EEZ scope, species selection and support. No unrestricted fishing access or verified nationwide coverage is established.
              </p>
              <div className="py-3 border-t border-[#DAE5E0] text-xs space-y-1">
                <span className="font-bold text-[#12211E] flex items-center gap-1">
                  <Lock className="w-3 h-3 text-[#087F5B]" />
                  <span>Proposed zone allowance:</span>
                </span>
                <span className="text-[#12211E]/75 block">
                  Zone cycle and re-download policy pending; demo only.
                </span>
              </div>
              <ul className="space-y-2 text-xs text-[#12211E]/80 pt-2 border-t border-[#DAE5E0]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#087F5B] shrink-0" />
                  <span>Nationwide EEZ coverage proposed; validation pending</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#087F5B] shrink-0" />
                  <span>Dedicated support and API integration planned</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#087F5B] shrink-0" />
                  <span>Harvest reporting planned; no compliance certification</span>
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
              Fleet licensing, shared views and satellite sync are roadmap proposals. Contracts, working integrations and device support have not been established.
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
              Satellite Sync Proposal
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
            Proposed commercial subscriptions, eligible sponsored advisories and reviewed data licensing form the funding plan. Revenue and partner agreements are not established by this demo.
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
                Proposed monthly subscriptions would support SMS advisories and validated exports. Subscription activation and fleet agreements remain pending.
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
                Institutional data products are planned, subject to consent, privacy review and validated aggregation. No institutional feed or contract is established here.
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
                Create Your Account
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
