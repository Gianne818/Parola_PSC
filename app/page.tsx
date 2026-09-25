"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MessageSquare,
  Compass,
  ShieldAlert,
  Radio,
  ArrowRight,
  Fish,
  Anchor,
  Globe,
  CheckCircle2,
  Ship,
  Waves,
  Navigation,
  Sparkles,
  ExternalLink,
  Download,
  Lock,
  Building2,
  Satellite,
  PhoneCall,
  Layers,
  ShieldCheck,
  BarChart3
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { ParolaLogo } from "@/components/ui/ParolaLogo";
import { useApp } from "@/context/AppContext";

export default function LandingPage() {
  const reduceMotion = useReducedMotion();
  const { language, changeLanguage } = useApp();

  // Interactive 2-Way SMS Command Engine Simulation
  const [selectedCommand, setSelectedCommand] = useState<"ADVISORY" | "HOTSPOT" | "STATUS">("ADVISORY");

  // Interactive Safety Hold Threshold Simulator
  const [simulateGale, setSimulateGale] = useState<boolean>(false);

  const toggleLanguage = () => {
    changeLanguage(language === "en" ? "tl" : "en");
  };

  const smsResponses: Record<"ADVISORY" | "HOTSPOT" | "STATUS", { query: string; response: string }> = {
    ADVISORY: {
      query: "ADVISORY",
      response: "PAROLA (Mercedes): Waves 0.8m, wind 9kts ENE. Zone 3 active for Tamban. Return harbor by 17:00 PHT.\nLigtas pumalaot hatid ng Petron"
    },
    HOTSPOT: {
      query: "HOTSPOT",
      response: "PAROLA: Zone 3 (14.128°N, 123.084°E) active. 12km ENE offshore. SST 28.2°C thermal front. Tamban prob 84%.\nLigtas pumalaot hatid ng Petron"
    },
    STATUS: {
      query: "STATUS",
      response: "PAROLA: F/B Sto. Niño [PH-CN-2026-081]. Home Port: Mercedes. Departure clearance: ACTIVE.\nLigtas pumalaot hatid ng Petron"
    }
  };


  return (
    <div className="min-h-screen bg-[#F2F6F4] text-[#12211E] relative z-0 scroll-smooth font-sans antialiased overflow-x-hidden selection:bg-[#00B37E]/20 selection:text-[#12211E]">
      {/* Background Atmosphere: Coastal Ambient Depth */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 bg-[#F2F6F4]">
        {/* Subtle Maritime Coordinates Grid */}
        <div
          className="absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage: "radial-gradient(#12211E 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}
        />
        {/* Radial Coastal Beacon Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[520px] bg-gradient-to-b from-[#00B37E]/10 via-[#00B37E]/3 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-[35%] right-[-100px] w-[500px] h-[500px] bg-[#C57E2C]/5 blur-[120px] rounded-full" />
      </div>

      {/* HEADER / NAVIGATION (Single line, strictly capped at 68px height) */}
      <header className="sticky top-0 w-full border-b border-[#DAE5E0] bg-[#F2F6F4]/90 backdrop-blur-md z-40">
        <div className="flex items-center justify-between h-[68px] px-6 md:px-12 max-w-7xl mx-auto w-full">
          <Link href="/" className="flex items-center gap-3 group">
            <ParolaLogo iconOnly className="w-8 h-8 group-hover:scale-105 transition-transform" />
            <span className="font-display text-xl font-black tracking-tight text-[#12211E] uppercase">
              Parola
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-[#12211E]/75">
            <a href="#how-it-works" className="hover:text-[#00B37E] transition-colors cursor-pointer">
              Features
            </a>
            <Link href="/guide" className="hover:text-[#00B37E] transition-colors">
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
            {/* Functional Language Toggle Button */}
            <button
              onClick={toggleLanguage}
              title={`Switch language to ${language === "en" ? "Tagalog" : "English"}`}
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border border-[#DAE5E0] bg-white hover:bg-[#EAF1ED] transition-all cursor-pointer shadow-2xs text-[#12211E]/75"
            >
              <Globe className="w-3.5 h-3.5 text-[#00B37E]" />
              <span>{language === "en" ? "EN / TL" : "TL / EN"}</span>
            </button>

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

      {/* SECTION 1: ASYMMETRIC SPLIT HERO */}
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="pt-8 md:pt-14 pb-16 px-6 max-w-7xl mx-auto w-full border-b border-[#DAE5E0]"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Focused Maritime Value Prop */}
          <div className="lg:col-span-6 space-y-6">
            {/* Single Eyebrow with Beacon Amber accent */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#C57E2C]/10 border border-[#C57E2C]/25 text-[#9A5B18] text-[11px] font-bold uppercase tracking-wider shadow-2xs">
              <Radio className="w-3 h-3 text-[#C57E2C]" />
              <span>2G SMS & Satellite Telemetry</span>
            </div>

            {/* Headline: strictly 2 lines on desktop */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight text-[#12211E] leading-[1.05]">
              Philippine maritime safety and fish hotspots via SMS.
            </h1>

            {/* Subtext: strictly <= 20 words and <= 4 lines */}
            <p className="text-base md:text-lg text-[#12211E]/75 leading-relaxed font-normal max-w-xl">
              Real-time weather advisories, oceanographic hotspots, and automated port safety holds delivered straight to standard mobile phones.
            </p>

            {/* CTAs: 1 primary + 1 secondary */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/register"
                className="bg-[#00B37E] hover:bg-[#00B37E]/90 text-white px-8 py-4 rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg active:scale-[0.98] text-center"
              >
                Register Your Vessel
              </Link>
              <Link
                href="/guide"
                className="bg-white hover:bg-[#EAF1ED] text-[#12211E] border border-[#DAE5E0] px-8 py-4 rounded-full font-bold text-xs uppercase tracking-wider transition-all text-center flex items-center justify-center gap-2 shadow-2xs"
              >
                <span>Explore System Guide</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#00B37E]" />
              </Link>
            </div>
          </div>

          {/* Right Column: Parola Platform Laptop Mockup */}
          <div className="lg:col-span-6 flex items-center justify-center">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-xl lg:max-w-2xl group"
            >
              {/* Soft ambient back-glow behind laptop mockup */}
              <div className="absolute inset-0 bg-[#00B37E]/12 blur-3xl rounded-full -z-10 transform scale-90 group-hover:scale-100 transition-transform duration-700" />
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-4/5 h-8 bg-[#12211E]/10 blur-xl rounded-full -z-10" />

              <Image
                src="/images/hero-image.png"
                alt="Parola Platform Maritime Dashboard Laptop Mockup"
                width={1200}
                height={800}
                priority
                className="w-full h-auto object-contain drop-shadow-[0_20px_40px_rgba(18,33,30,0.14)] transition-transform duration-500 group-hover:scale-[1.015]"
              />
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* SECTION 2: SMS-FIRST MARITIME RESILIENCE BENTO (With simple scroll reveal) */}
      <motion.section
        id="how-it-works"
        initial={reduceMotion ? false : { opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="py-20 px-6 max-w-7xl mx-auto w-full border-b border-[#DAE5E0]"
      >
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <h2 className="text-2xl md:text-4xl font-display font-black text-[#12211E] tracking-tight leading-tight">
            Engineered for real-world coastal conditions
          </h2>
          <p className="text-sm md:text-base text-[#12211E]/75 leading-relaxed font-normal mt-3 max-w-2xl">
            Critical marine safety telemetry, catch feedback loops, and satellite hotspot models delivered without smartphone data dependencies.
          </p>
        </div>

        {/* Bento Grid: 3 diverse cells with elevated contrast and interactive controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Cell 1: 2G SMS Protocol Engine */}
          <div className="lg:col-span-7 bg-white border border-[#DAE5E0] rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-[0_2px_16px_rgba(18,33,30,0.04)]">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#00B37E]/10 flex items-center justify-center text-[#00B37E]">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-display font-extrabold text-[#12211E]">
                Zero-data 2G GSM cellular resilience
              </h3>
              <p className="text-xs md:text-sm text-[#12211E]/75 leading-relaxed font-normal max-w-lg">
                Works on basic keypad phones and remote coastal towers where mobile data drops. Fishermen receive scheduled morning dispatches and can text on-demand commands anytime.
              </p>
            </div>

            {/* Fully Functional Interactive 2-Way Query Console */}
            <div className="mt-6 bg-[#F2F6F4] border border-[#DAE5E0] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-[10px] text-[#12211E]/55 font-bold uppercase pb-1 border-b border-[#DAE5E0]">
                <span>Interactive 2-Way Command Simulator</span>
                <span className="text-[#00B37E] font-bold">Simulate Command</span>
              </div>

              {/* Functional Command Switcher Buttons */}
              <div className="flex gap-2">
                {(["ADVISORY", "HOTSPOT", "STATUS"] as const).map((cmd) => (
                  <button
                    key={cmd}
                    onClick={() => setSelectedCommand(cmd)}
                    className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                      selectedCommand === cmd
                        ? "bg-[#00B37E] text-white shadow-xs"
                        : "bg-white text-[#12211E]/70 hover:bg-[#E2EBE6] border border-[#DAE5E0]"
                    }`}
                  >
                    {cmd}
                  </button>
                ))}
              </div>

              {/* Simulated Live Response Display */}
              <div className="text-xs font-mono space-y-1.5 bg-[#12211E] text-white p-3 rounded-xl shadow-inner">
                <div className="text-gray-400">&gt; YOU: {smsResponses[selectedCommand].query}</div>
                <div className="text-[#00B37E] leading-relaxed">
                  &lt; {smsResponses[selectedCommand].response}
                </div>
              </div>
            </div>
          </div>

          {/* Cell 2: Automated Municipal Safety Hold */}
          <div className="lg:col-span-5 bg-white border border-[#DAE5E0] rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-[0_2px_16px_rgba(18,33,30,0.04)]">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-display font-extrabold text-[#12211E]">
                Automated municipal safety hold
              </h3>
              <p className="text-xs md:text-sm text-[#12211E]/75 leading-relaxed font-normal">
                Whenever wave heights exceed 1.5 meters or PAGASA issues a gale advisory, Parola immediately triggers a departure hold notification to protect small craft.
              </p>
            </div>

            {/* Interactive Threshold Gate Simulator */}
            <div className="mt-6 bg-[#F2F6F4] border border-[#DAE5E0] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#12211E]">Threshold Gate Status</span>
                <button
                  onClick={() => setSimulateGale(!simulateGale)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                    simulateGale
                      ? "bg-rose-100 border-rose-300 text-rose-700"
                      : "bg-[#00B37E]/10 border-[#00B37E]/25 text-[#00B37E]"
                  }`}
                >
                  {simulateGale ? "Hs > 1.5m Alert" : "Hs 0.8m Normal"}
                </button>
              </div>

              <div
                className={`p-2.5 rounded-xl text-xs transition-colors ${
                  simulateGale
                    ? "bg-rose-50 border border-rose-200 text-rose-800"
                    : "bg-white border border-[#DAE5E0] text-[#12211E]/75"
                }`}
              >
                {simulateGale ? (
                  <span className="font-bold flex items-center gap-1.5 text-rose-700">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    Departure Hold Enforced. Gale warnings active.
                  </span>
                ) : (
                  <span>Clear harbor clearance. Safe to sail across municipal grounds.</span>
                )}
              </div>

              <Link
                href="/alerts"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00B37E] hover:underline"
              >
                <span>Inspect full safety hold protocol</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Cell 3: Satellite SST & Pelagic Hotspots (Full Width with soft ocean gradient) */}
          <div className="lg:col-span-12 bg-gradient-to-r from-[#E5F1EB] to-[#F0F6F3] border border-[#DAE5E0] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_2px_16px_rgba(18,33,30,0.03)]">
            <div className="space-y-2.5 max-w-xl">
              <div className="w-10 h-10 rounded-xl bg-[#00B37E]/10 flex items-center justify-center text-[#00B37E]">
                <Fish className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-display font-extrabold text-[#12211E]">
                Satellite sea surface temperature and hotspot models
              </h3>
              <p className="text-xs md:text-sm text-[#12211E]/75 leading-relaxed font-normal">
                Identifies thermal upwelling fronts and chlorophyll zones where pelagic species like Tamban, Galunggong, and Tuna feed, shortening time spent searching offshore.
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
                className="bg-[#00B37E] hover:bg-[#00B37E]/90 text-white px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider transition-all text-center shadow-sm"
              >
                View Tonnage Pricing
              </Link>
            </div>
          </div>
        </div>
      </motion.section>

      {/* SECTION 3: FOUR CORE PILLARS WALKTHROUGH PREVIEW (Scroll reveal on cards) */}
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="py-20 px-6 max-w-7xl mx-auto w-full border-b border-[#DAE5E0]"
      >
        <div className="max-w-3xl mb-12">
          <h2 className="text-2xl md:text-4xl font-display font-black text-[#12211E] tracking-tight leading-tight">
            Connecting the complete coastal fisheries workflow
          </h2>
          <p className="text-sm md:text-base text-[#12211E]/75 leading-relaxed font-normal mt-3 max-w-2xl">
            From vessel registration at the municipal dock to daily SMS marine bulletins and catch reports, Parola connects the entire fisheries workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[
            {
              step: "Step 01",
              title: "SMS Advisories",
              desc: "Daily 04:30 PHT marine weather, wave heights, and hotspot telemetry sent directly over 2G cellular SMS.",
              icon: MessageSquare,
              href: "/guide"
            },
            {
              step: "Step 02",
              title: "Port Registration",
              desc: "Register vessel once with home pier to calibrate local coastal bulletins and emergency search contacts.",
              icon: Anchor,
              href: "/onboarding"
            },
            {
              step: "Step 03",
              title: "Catch Feedback",
              desc: "Simple SMS harvest reports calibrate shared ocean predictive models while safeguarding secret fishing marks.",
              icon: Fish,
              href: "/dashboard"
            },
            {
              step: "Step 04",
              title: "Safety Holds",
              desc: "Automated departure holds trigger during gale warnings or extreme wave swells to protect lives at sea.",
              icon: ShieldAlert,
              href: "/alerts"
            }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href={item.href}
                className="bg-white p-6 rounded-2xl border border-[#DAE5E0] flex flex-col justify-between hover:border-[#00B37E]/40 hover:-translate-y-1 hover:shadow-md transition-all shadow-[0_2px_12px_rgba(18,33,30,0.04)] h-full block group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-[#F2F6F4] border border-[#DAE5E0] text-[#00B37E] flex items-center justify-center shadow-2xs group-hover:bg-[#00B37E] group-hover:text-white transition-colors">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-[#9A5B18] bg-[#C57E2C]/10 border border-[#C57E2C]/20 px-2 py-0.5 rounded-full">
                      {item.step}
                    </span>
                  </div>
                  <h4 className="font-display font-bold text-base text-[#12211E] group-hover:text-[#00B37E] transition-colors flex items-center gap-1.5">
                    <span>{item.title}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h4>
                  <p className="text-xs text-[#12211E]/70 leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/guide"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00B37E] hover:underline"
          >
            <span>Read the interactive step-by-step guide</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </motion.section>

      {/* SECTION 4: VESSEL TONNAGE PRICING PREVIEW (Scroll reveal on cards) */}
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="py-20 px-6 max-w-7xl mx-auto w-full border-b border-[#DAE5E0]"
      >
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C57E2C]/10 border border-[#C57E2C]/25 text-[#9A5B18] text-[11px] font-bold uppercase tracking-wider mb-3 shadow-2xs">
            <Ship className="w-3.5 h-3.5 text-[#C57E2C]" />
            <span>Republic Act No. 8550 as amended by RA 10654 · Section 3(n)</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-display font-black text-[#12211E] tracking-tight leading-tight">
            Enterprise B2B SaaS subscriptions by vessel gross tonnage
          </h2>
          <p className="text-sm md:text-base text-[#12211E]/75 leading-relaxed font-normal mt-3 max-w-2xl">
            Single-vessel recurring software subscriptions and chartplotter Geo-Packs scaled to official Philippine commercial vessel classes, with quota-managed zone downloads.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tier 1: Small-Scale Commercial */}
          <div className="bg-white border border-[#DAE5E0] rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-[0_2px_12px_rgba(18,33,30,0.04)]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#9A5B18] uppercase tracking-wider bg-[#C57E2C]/10 px-3 py-1 rounded-full border border-[#C57E2C]/20">
                  3.1 to 20.0 GT
                </span>
                <Ship className="w-4 h-4 text-[#00B37E]" />
              </div>
              <div>
                <h3 className="font-display font-black text-xl text-[#12211E]">
                  Small-Scale Commercial
                </h3>
                <div className="text-[10px] font-mono text-gray-400">Sec. 3(n)(1) RA 8550</div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-display font-black text-[#12211E]">₱799</span>
                <span className="text-xs text-[#12211E]/55 font-medium">/ mo per vessel</span>
              </div>
              <p className="text-xs text-[#12211E]/75 leading-relaxed">
                50 km radius from home port outside municipal waters, with multi-species target selection.
              </p>
              <div className="bg-[#F2F6F4] p-3 rounded-xl border border-[#DAE5E0] text-[11px] space-y-1">
                <span className="font-bold text-[#12211E] flex items-center gap-1">
                  <Lock className="w-3 h-3 text-[#00B37E]" />
                  <span>Daily Download Quota:</span>
                </span>
                <span className="text-[#12211E]/75 block">
                  1 locked zone / day (unlimited re-downloads of that same zone for 24 hours).
                </span>
              </div>
              <ul className="space-y-2 text-xs text-[#12211E]/80 pt-2 border-t border-[#DAE5E0]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00B37E] shrink-0" />
                  <span>Daily 04:30 PHT morning SMS advisories</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00B37E] shrink-0" />
                  <span>Offline chartplotter Geo-Packs (.GPX, .KML)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00B37E] shrink-0" />
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

          {/* Tier 2: Medium-Scale Commercial (Featured Elevated Card) */}
          <div className="bg-white border-2 border-[#00B37E] rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-[0_8px_30px_rgba(0,179,126,0.12)] relative">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-[#00B37E] px-3 py-1 rounded-full">
                  20.1 to 150.0 GT
                </span>
                <span className="text-[10px] font-bold text-[#9A5B18] bg-[#C57E2C]/10 border border-[#C57E2C]/25 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Recommended
                </span>
              </div>
              <div>
                <h3 className="font-display font-black text-xl text-[#12211E]">
                  Medium-Scale Commercial
                </h3>
                <div className="text-[10px] font-mono text-gray-400">Sec. 3(n)(2) RA 8550</div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-display font-black text-[#12211E]">₱2,499</span>
                <span className="text-xs text-[#12211E]/55 font-medium">/ mo per vessel</span>
              </div>
              <p className="text-xs text-[#12211E]/75 leading-relaxed">
                Permits full coverage of 1 selected Fisheries Management Area (FMA) and multi-species target selection.
              </p>
              <div className="bg-[#F2F6F4] p-3 rounded-xl border border-[#DAE5E0] text-[11px] space-y-1">
                <span className="font-bold text-[#12211E] flex items-center gap-1">
                  <Lock className="w-3 h-3 text-[#00B37E]" />
                  <span>Daily Download Quota:</span>
                </span>
                <span className="text-[#12211E]/75 block">
                  1 locked zone / day, unlimited re-downloads for 24h.
                </span>
              </div>
              <ul className="space-y-2 text-xs text-[#12211E]/80 pt-2 border-t border-[#DAE5E0]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00B37E] shrink-0" />
                  <span>Full coverage of 1 designated FMA</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00B37E] shrink-0" />
                  <span>24–72h spatial forecast Geo-Packs (.GPX, .KML, .GeoJSON)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00B37E] shrink-0" />
                  <span>Multi-zone SST thermal front mapping</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00B37E] shrink-0" />
                  <span>Priority harbor muster dispatch</span>
                </li>
              </ul>
            </div>
            <div className="pt-6">
              <Link
                href="/pricing#vessel-subscriptions"
                className="w-full block bg-[#00B37E] hover:bg-[#00B37E]/90 text-white py-3 rounded-full font-bold text-xs uppercase tracking-wider text-center transition-all shadow-sm active:scale-[0.98]"
              >
                Select Medium-Scale
              </Link>
            </div>
          </div>

          {/* Tier 3: Large-Scale Commercial */}
          <div className="bg-white border border-[#DAE5E0] rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-[0_2px_12px_rgba(18,33,30,0.04)]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#9A5B18] uppercase tracking-wider bg-[#C57E2C]/10 px-3 py-1 rounded-full border border-[#C57E2C]/20">
                  &gt;150.0 GT
                </span>
                <Ship className="w-4 h-4 text-[#00B37E]" />
              </div>
              <div>
                <h3 className="font-display font-black text-xl text-[#12211E]">
                  Large-Scale Commercial
                </h3>
                <div className="text-[10px] font-mono text-gray-400">Sec. 3(n)(3) RA 8550</div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-display font-black text-[#12211E]">₱6,199</span>
                <span className="text-xs text-[#12211E]/55 font-medium">/ mo per vessel</span>
              </div>
              <p className="text-xs text-[#12211E]/75 leading-relaxed">
                Full Philippine EEZ access, multi-species target selection, and priority support.
              </p>
              <div className="bg-[#F2F6F4] p-3 rounded-xl border border-[#DAE5E0] text-[11px] space-y-1">
                <span className="font-bold text-[#12211E] flex items-center gap-1">
                  <Lock className="w-3 h-3 text-[#00B37E]" />
                  <span>Daily Download Quota:</span>
                </span>
                <span className="text-[#12211E]/75 block">
                  1 locked zone / day, unlimited re-downloads for 24h.
                </span>
              </div>
              <ul className="space-y-2 text-xs text-[#12211E]/80 pt-2 border-t border-[#DAE5E0]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00B37E] shrink-0" />
                  <span>Full nationwide Philippine EEZ coverage</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00B37E] shrink-0" />
                  <span>Priority 24/7 dedicated support & direct API</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00B37E] shrink-0" />
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

        {/* Custom Fleet Enterprise & Satellite Add-on Callout */}
        <div className="mt-8 bg-gradient-to-r from-white via-[#F8FBFA] to-[#EBF5F0] border border-[#DAE5E0] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xs">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00B37E]">
              <Building2 className="w-4 h-4" />
              <span>Custom Fleet Enterprise Contracts & Satellite Sync</span>
            </div>
            <h4 className="text-lg font-display font-bold text-[#12211E]">
              Operating 5+ commercial vessels or requiring offshore satellite refresh?
            </h4>
            <p className="text-xs text-[#12211E]/75 leading-relaxed">
              Discounted annual licenses for commercial operators with 5+ vessels featuring central fleet dashboard views, multi-zone downloads, and low-bandwidth satellite sync (Starlink, Iridium, Inmarsat) at just ~1.8 KB per refresh.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href="/pricing#fleet-enterprise"
              className="bg-[#00B37E] hover:bg-[#00B37E]/90 text-white px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider transition-all text-center shadow-sm"
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
      </motion.section>

      {/* SECTION 5: THREE-PILLAR SUSTAINABLE BUSINESS MODEL SHOWCASE */}
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="py-20 px-6 max-w-7xl mx-auto w-full border-b border-[#DAE5E0]"
      >
        <div className="max-w-3xl mb-12">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#00B37E] bg-[#00B37E]/10 border border-[#00B37E]/20 px-3 py-0.5 rounded-full inline-block mb-2">
            Sustainable Economic Architecture
          </div>
          <h2 className="text-2xl md:text-4xl font-display font-black text-[#12211E] tracking-tight leading-tight">
            A three-pillar business model built for maritime scale
          </h2>
          <p className="text-sm md:text-base text-[#12211E]/75 leading-relaxed font-normal mt-3 max-w-2xl">
            How Parola pairs commercial enterprise subscriptions with non-intrusive municipal subsidies and government spatial data licensing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1: Enterprise B2B SaaS */}
          <div className="bg-white border border-[#DAE5E0] rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-[0_2px_12px_rgba(18,33,30,0.04)]">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#00B37E]/10 flex items-center justify-center text-[#00B37E]">
                <Ship className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pillar 01</span>
                <h3 className="font-display font-bold text-lg text-[#12211E]">
                  Enterprise B2B SaaS & Offline Exports
                </h3>
              </div>
              <p className="text-xs text-[#12211E]/75 leading-relaxed">
                Recurring single-vessel subscriptions aligned with RA 8550 Section 3(n) commercial classes (₱799 to ₱6,199/month), 24–72h chartplotter Geo-Packs (.GPX, .KML, .GeoJSON), custom fleet licenses, and compressed satellite sync.
              </p>
            </div>
            <div className="pt-4 border-t border-[#DAE5E0]">
              <Link href="/pricing#vessel-subscriptions" className="text-xs font-bold text-[#00B37E] hover:underline flex items-center gap-1">
                <span>View SaaS Tiers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Pillar 2: Non-Intrusive Free-Tier Monetization */}
          <div className="bg-white border border-[#DAE5E0] rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-[0_2px_12px_rgba(18,33,30,0.04)]">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#C57E2C]/10 flex items-center justify-center text-[#C57E2C]">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pillar 02</span>
                <h3 className="font-display font-bold text-lg text-[#12211E]">
                  Non-Intrusive Free-Tier Subsidies
                </h3>
              </div>
              <p className="text-xs text-[#12211E]/75 leading-relaxed">
                Zero-cost municipal dispatches for small bancas (&le;3.0 GT) subsidized through sponsored SMS footers (&ldquo;Ligtas pumalaot hatid ng [Brand]&rdquo;), generic programmatic web display ads, and telco zero-rating partnerships (reducing SMS costs to &lt;₱0.08).
              </p>
            </div>
            <div className="pt-4 border-t border-[#DAE5E0]">
              <Link href="/pricing#free-tier-subsidies" className="text-xs font-bold text-[#C57E2C] hover:underline flex items-center gap-1">
                <span>Inspect Subsidies</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Pillar 3: B2G & ESG Spatial Data Licensing */}
          <div className="bg-white border border-[#DAE5E0] rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-[0_2px_12px_rgba(18,33,30,0.04)]">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#00B37E]/10 flex items-center justify-center text-[#00B37E]">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pillar 03</span>
                <h3 className="font-display font-bold text-lg text-[#12211E]">
                  B2G & ESG Spatial Data Licensing
                </h3>
              </div>
              <p className="text-xs text-[#12211E]/75 leading-relaxed">
                Anonymized fishing effort aggregations, fleet mobility heatmaps, and environmental density correlations licensed to BFAR (FMA monitoring), Coastal LGUs (Bantay-Dagat patrol dispatch), and Marine Conservation Foundations (MPA delineation).
              </p>
            </div>
            <div className="pt-4 border-t border-[#DAE5E0]">
              <Link href="/pricing#b2g-licensing" className="text-xs font-bold text-[#00B37E] hover:underline flex items-center gap-1">
                <span>View B2G Feeds</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </motion.section>


      {/* SECTION 5: INSTITUTIONAL MISSION CALLOUT (With scroll reveal) */}
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="py-20 px-6 max-w-7xl mx-auto w-full"
      >
        <div className="bg-gradient-to-br from-[#E4F2EC] via-[#EBF5F0] to-[#F2F6F4] border border-[#DAE5E0] rounded-3xl p-8 md:p-14 text-[#12211E] relative overflow-hidden shadow-sm">
          <div className="max-w-3xl space-y-5 relative z-10">
            <h2 className="text-2xl md:text-4xl font-display font-black tracking-tight leading-tight">
              Democratizing ocean science for municipal fisherfolk
            </h2>
            <p className="text-xs md:text-sm text-[#12211E]/75 font-normal leading-relaxed max-w-xl">
              Parola is purpose-built to reduce preventable maritime fatalities, cut search times at sea, and support sustainable fisheries management aligned with BFAR and municipal port workflows.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-3">
              <Link
                href="/about"
                className="bg-[#00B37E] hover:bg-[#00B37E]/90 text-white px-8 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-[0.98] text-center"
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
      </motion.section>

      {/* FOOTER (Grounded coastal tone, zero em-dashes) */}
      <footer className="bg-[#E7EFEA] border-t border-[#DAE5E0] py-12 px-6">
        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#12211E]/70">
          <div className="flex items-center gap-3">
            <ParolaLogo iconOnly className="w-7 h-7" />
            <span className="font-display text-base font-black text-[#12211E] tracking-tight uppercase">
              Parola Fisheries System
            </span>
          </div>

          <nav className="flex flex-wrap items-center gap-6 font-semibold">
            <a href="#how-it-works" className="hover:text-[#00B37E] transition-colors cursor-pointer">
              Features
            </a>
            <Link href="/guide" className="hover:text-[#00B37E] transition-colors">
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
    </div>
  );
}