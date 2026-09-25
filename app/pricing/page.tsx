"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Ship,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Radio,
  FileText,
  Sparkles,
  Download,
  Lock,
  Satellite,
  Building2,
  Layers,
  MapPin,
  ExternalLink,
  MessageSquare,
  BarChart3,
  Shield,
  PhoneCall,
  Check,
  ChevronRight,
  Info
} from "lucide-react";
import { ParolaLogo } from "@/components/ui/ParolaLogo";
import { OfflineGeoPackModal } from "@/components/ui/OfflineGeoPackModal";
import { GenericWebDisplayAd } from "@/components/ui/GenericWebDisplayAd";

export default function PricingPage() {
  const [isGeoPackModalOpen, setIsGeoPackModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"subscriptions" | "fleet" | "geopack" | "subsidies" | "b2g">("subscriptions");

  // Single-Vessel Subscriptions aligned strictly to Section 3(n) of RA 8550 as amended by RA 10654
  const singleVesselTiers = [
    {
      id: "small-scale",
      name: "Small-Scale Commercial",
      tonnage: "3.1 to 20.0 GT",
      legalCitation: "Sec. 3(n)(1) RA 8550 / RA 10654",
      price: "₱799",
      billingCadence: "/ month per vessel",
      targetVessels: "Commercial small-craft bancas, motorized handline fishers, and nearshore coastal crews.",
      scopeDescription: "Restricted query selection to a 50 km radius from registered home port outside municipal waters.",
      quotaDescription: "1 locked zone download per day with unlimited re-downloads of that same zone for 24 hours.",
      popular: false,
      badgeText: "Small Commercial Class",
      features: [
        "Restricted to 50 km radius from home port outside municipal waters",
        "Multi-species target selection (Pelagic & Demersal models)",
        "Daily quota: 1 locked zone per day (unlimited re-downloads for 24h)",
        "Offline chartplotter Geo-Packs (.GPX, .KML, .GeoJSON)",
        "Daily 04:30 PHT morning SMS marine advisory dispatch",
        "Two-way SMS query syntax (ADVISORY, STATUS, HOTSPOT)",
        "Automated PAGASA gale warnings and wave hazard holds (Hs > 1.5m)",
        "Emergency co-op and VHF Channel 16 muster link"
      ]
    },
    {
      id: "medium-scale",
      name: "Medium-Scale Commercial",
      tonnage: "20.1 to 150.0 GT",
      legalCitation: "Sec. 3(n)(2) RA 8550 / RA 10654",
      price: "₱2,499",
      billingCadence: "/ month per vessel",
      targetVessels: "Commercial ring-netters, purse seiners, and multi-day pelagic island fishing vessels.",
      scopeDescription: "Permits full coverage of 1 selected Fisheries Management Area (FMA 1 through FMA 12).",
      quotaDescription: "1 locked zone per day, unlimited re-downloads for 24 hours.",
      popular: true,
      badgeText: "Most Common Commercial Class",
      features: [
        "Full coverage of 1 selected Fisheries Management Area (FMA)",
        "Multi-species target selection (Tamban, Galunggong, Skipjack, Tuna)",
        "Daily quota: 1 locked zone per day (unlimited re-downloads for 24h)",
        "Pre-departure 24–72 hour spatial forecast bundles (.GPX, .KML, .GeoJSON)",
        "Multi-zone sea surface temperature (SST) thermal front vector maps",
        "Automated pelagic chlorophyll and schooling zone alerts",
        "Two-way SMS catch feedback logging loop access",
        "Priority harbor muster dispatch for active fleet offshore"
      ]
    },
    {
      id: "large-scale",
      name: "Large-Scale Commercial",
      tonnage: ">150.0 GT",
      legalCitation: "Sec. 3(n)(3) RA 8550 / RA 10654",
      price: "₱6,199",
      billingCadence: "/ month per vessel",
      targetVessels: "Distant-water longliners, commercial motherships, and industrial fleet aggregators.",
      scopeDescription: "Unrestricted nationwide Philippine Exclusive Economic Zone (EEZ) access.",
      quotaDescription: "1 locked zone per day, unlimited re-downloads for 24 hours.",
      popular: false,
      badgeText: "Industrial & Distant Water",
      features: [
        "Full Philippine Exclusive Economic Zone (EEZ) satellite access",
        "Multi-species target selection across all pelagic families",
        "Daily quota: 1 locked zone per day (unlimited re-downloads for 24h)",
        "High-density 24–72h spatial forecast packages (.GPX, .KML, .GeoJSON)",
        "Priority 24/7 dedicated support & direct API integration",
        "Automated harvest telemetry reporting for BFAR compliance",
        "Dedicated satellite SMS gateway redundancy integration",
        "Harbor master and port marshal dispatch telemetry feed"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#F2F6F4] text-[#12211E] font-sans antialiased overflow-x-hidden selection:bg-[#00B37E]/20 selection:text-[#12211E]">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 bg-[#F2F6F4]">
        <div
          className="absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage: "radial-gradient(#12211E 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}
        />
        <div className="absolute top-0 right-1/4 w-[640px] h-[360px] bg-[#00B37E]/8 blur-[130px] rounded-full" />
        <div className="absolute top-[40%] left-[-100px] w-[500px] h-[500px] bg-[#C57E2C]/5 blur-[120px] rounded-full" />
      </div>

      {/* Header Navigation */}
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
            <Link href="/guide" className="hover:text-[#00B37E] transition-colors">
              System Guide
            </Link>
            <Link href="/pricing" className="text-[#00B37E] font-black border-b-2 border-[#00B37E] pb-1">
              Pricing & SaaS
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

      {/* Main Hero: Statutory Classification & Business Model Overview */}
      <section className="pt-12 md:pt-16 pb-12 px-6 max-w-7xl mx-auto w-full border-b border-[#DAE5E0]">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#C57E2C]/10 border border-[#C57E2C]/25 text-[#9A5B18] text-[11px] font-bold uppercase tracking-wider mb-4 shadow-2xs">
            <Ship className="w-3.5 h-3.5 text-[#C57E2C]" />
            <span>Republic Act No. 8550 as amended by RA 10654 · Section 3(n)</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-display font-black tracking-tight text-[#12211E] leading-[1.08] mb-4">
            Enterprise B2B SaaS subscriptions and offline marine intelligence
          </h1>

          <p className="text-sm sm:text-base text-[#12211E]/75 leading-relaxed max-w-3xl font-normal">
            Predictable recurring SaaS subscriptions, chartplotter Geo-Packs, and compressed satellite sync engineered for Philippine commercial fishing vessels, accompanied by non-intrusive municipal subsidies and B2G spatial intelligence licensing.
          </p>

          {/* Quick Jump Pills for Business Model Pillars */}
          <div className="flex flex-wrap gap-2 pt-6">
            <a
              href="#vessel-subscriptions"
              className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-white border border-[#DAE5E0] text-[#12211E]/80 hover:border-[#00B37E] hover:text-[#00B37E] transition-all shadow-2xs"
            >
              1. Commercial SaaS Tiers
            </a>
            <a
              href="#fleet-enterprise"
              className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-white border border-[#DAE5E0] text-[#12211E]/80 hover:border-[#00B37E] hover:text-[#00B37E] transition-all shadow-2xs"
            >
              2. Fleet Enterprise (5+ Vessels)
            </a>
            <a
              href="#geopack-satellite"
              className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-white border border-[#DAE5E0] text-[#12211E]/80 hover:border-[#00B37E] hover:text-[#00B37E] transition-all shadow-2xs"
            >
              3. Offline Geo-Packs & Sat-Sync
            </a>
            <a
              href="#free-tier-subsidies"
              className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-white border border-[#DAE5E0] text-[#12211E]/80 hover:border-[#00B37E] hover:text-[#00B37E] transition-all shadow-2xs"
            >
              4. Free-Tier Subsidies
            </a>
            <a
              href="#b2g-licensing"
              className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-white border border-[#DAE5E0] text-[#12211E]/80 hover:border-[#00B37E] hover:text-[#00B37E] transition-all shadow-2xs"
            >
              5. B2G Spatial Data Licensing
            </a>
          </div>
        </div>
      </section>

      {/* PILLAR 1A: SINGLE-VESSEL RECURRING SAAS TIERS */}
      <section id="vessel-subscriptions" className="py-14 md:py-20 px-6 max-w-7xl mx-auto w-full border-b border-[#DAE5E0]">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="max-w-2xl">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#00B37E] bg-[#00B37E]/10 border border-[#00B37E]/20 px-3 py-0.5 rounded-full inline-block mb-2">
              Pillar 1 · Single-Vessel Recurring SaaS
            </div>
            <h2 className="text-2xl md:text-4xl font-display font-black text-[#12211E] tracking-tight leading-tight">
              Single-vessel subscriptions by commercial tonnage
            </h2>
            <p className="text-xs md:text-sm text-[#12211E]/75 leading-relaxed font-normal mt-2">
              Strictly aligned to the three commercial vessel classes under Section 3(n) of the Philippine Fisheries Code (RA 8550 as amended by RA 10654).
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs bg-white border border-[#DAE5E0] p-1.5 rounded-2xl shadow-2xs">
            <span className="px-3 py-1 font-bold text-[#00B37E] bg-[#00B37E]/10 rounded-xl">
              Monthly Single-Vessel License
            </span>
            <span className="px-3 py-1 text-gray-500 font-medium hidden sm:inline">
              Daily Zone Quota Included
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {singleVesselTiers.map((tier) => (
            <div
              key={tier.id}
              className={`rounded-3xl p-6 md:p-8 flex flex-col justify-between transition-all ${
                tier.popular
                  ? "bg-white border-2 border-[#00B37E] shadow-[0_8px_30px_rgba(0,179,126,0.12)] relative"
                  : "bg-white border border-[#DAE5E0] shadow-[0_2px_12px_rgba(18,33,30,0.04)] hover:border-[#12211E]/20"
              }`}
            >
              <div className="space-y-5">
                {/* Header Badges */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                      tier.popular
                        ? "bg-[#00B37E] text-white"
                        : "bg-[#C57E2C]/10 text-[#9A5B18] border border-[#C57E2C]/20"
                    }`}
                  >
                    {tier.tonnage}
                  </span>
                  <span className="text-[10px] font-bold text-[#12211E]/60 bg-[#F2F6F4] px-2.5 py-0.5 rounded-full border border-[#DAE5E0]">
                    {tier.badgeText}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl md:text-2xl font-display font-black text-[#12211E]">
                    {tier.name}
                  </h3>
                  <div className="text-[10px] font-mono text-gray-400 mt-0.5">
                    {tier.legalCitation}
                  </div>

                  <div className="flex items-baseline gap-1.5 mt-3">
                    <span className="text-4xl font-display font-black text-[#12211E]">
                      {tier.price}
                    </span>
                    <span className="text-xs text-[#12211E]/60 font-medium">
                      {tier.billingCadence}
                    </span>
                  </div>

                  <p className="text-xs text-[#12211E]/75 leading-relaxed mt-2.5">
                    {tier.targetVessels}
                  </p>
                </div>

                {/* Scope & Daily Quota Box */}
                <div className="bg-[#F2F6F4] border border-[#DAE5E0] rounded-2xl p-3.5 space-y-2 text-xs">
                  <div>
                    <span className="font-bold text-[#12211E] block text-[11px] uppercase tracking-wider">
                      Geographic Scope:
                    </span>
                    <span className="text-[#12211E]/80">{tier.scopeDescription}</span>
                  </div>
                  <div className="pt-1.5 border-t border-[#DAE5E0]/70">
                    <span className="font-bold text-[#00B37E] block text-[11px] uppercase tracking-wider flex items-center gap-1">
                      <Lock className="w-3 h-3 text-[#00B37E]" />
                      <span>Download Quota:</span>
                    </span>
                    <span className="text-[#12211E]/80">{tier.quotaDescription}</span>
                  </div>
                </div>

                {/* Included Features List */}
                <div className="border-t border-[#DAE5E0] pt-4 space-y-2.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#12211E]/60">
                    Full Commercial Entitlements
                  </div>
                  <ul className="space-y-2.5">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-[#12211E]/80">
                        <CheckCircle2 className="w-4 h-4 text-[#00B37E] shrink-0 mt-0.5" />
                        <span className="leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-8 space-y-2">
                <Link
                  href="/register"
                  className={`w-full block py-3.5 rounded-full font-bold text-xs uppercase tracking-wider text-center transition-all ${
                    tier.popular
                      ? "bg-[#00B37E] hover:bg-[#00B37E]/90 text-white shadow-md active:scale-[0.98]"
                      : "bg-[#F2F6F4] hover:bg-[#E2EBE6] text-[#12211E] border border-[#DAE5E0] active:scale-[0.98]"
                  }`}
                >
                  Subscribe {tier.name}
                </Link>
                <button
                  onClick={() => setIsGeoPackModalOpen(true)}
                  className="w-full text-center text-[11px] font-semibold text-[#00B37E] hover:underline flex items-center justify-center gap-1 py-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Test Chartplotter Geo-Pack Export</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PILLAR 1B: CUSTOM FLEET ENTERPRISE CONTRACTS */}
      <section id="fleet-enterprise" className="py-14 md:py-20 px-6 max-w-7xl mx-auto w-full border-b border-[#DAE5E0]">
        <div className="bg-gradient-to-br from-white via-[#F8FBFA] to-[#EBF5F0] border-2 border-[#00B37E]/40 rounded-3xl p-8 md:p-12 shadow-[0_4px_24px_rgba(0,179,126,0.08)] relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00B37E]/10 border border-[#00B37E]/25 text-[#00B37E] text-[11px] font-bold uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5" />
                <span>Custom Fleet Enterprise Contracts</span>
              </div>

              <h2 className="text-2xl md:text-4xl font-display font-black text-[#12211E] tracking-tight leading-tight">
                Discounted annual licenses for operators with 5+ commercial vessels
              </h2>

              <p className="text-sm text-[#12211E]/75 leading-relaxed font-normal">
                Large fleet aggregators, fishing corporations, and regional cooperatives require consolidated operational visibility. Parola Enterprise provides centralized fleet dashboard oversight, simultaneous multi-zone unlocks, and tailored enterprise terms.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  "Discounted annual volume licensing",
                  "Central fleet dashboard & live coordinate views",
                  "Multi-zone simultaneous downloads & unlocks",
                  "Direct API feeds into company dispatch consoles",
                  "Dedicated fleet account manager & 24/7 SLA",
                  "Consolidated billing & crew access credentials"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-[#12211E]/80">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00B37E] shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 bg-white border border-[#DAE5E0] rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-base font-display font-bold text-[#12211E]">
                Request Custom Fleet Proposal
              </h3>
              <p className="text-xs text-[#12211E]/70 leading-relaxed">
                Connect directly with our maritime commercial specialists to structure an annual fleet agreement tailored to your vessel gross tonnages and operational FMAs.
              </p>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[#F2F6F4] rounded-xl border border-[#DAE5E0] flex items-center justify-between">
                  <span className="font-semibold text-gray-600">Minimum Fleet Threshold:</span>
                  <span className="font-bold text-[#12211E]">5+ Commercial Vessels</span>
                </div>
                <div className="p-3 bg-[#F2F6F4] rounded-xl border border-[#DAE5E0] flex items-center justify-between">
                  <span className="font-semibold text-gray-600">Contract Format:</span>
                  <span className="font-bold text-[#00B37E]">Annual Corporate License</span>
                </div>
              </div>

              <Link
                href="/about"
                className="w-full block bg-[#00B37E] hover:bg-[#00B37E]/90 text-white py-3 rounded-full font-bold text-xs uppercase tracking-wider text-center transition-all shadow-sm active:scale-[0.98]"
              >
                Contact Fleet Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* PILLAR 1C & 1D: OFFLINE GEO-PACKS & LOW-BANDWIDTH SATELLITE SYNC */}
      <section id="geopack-satellite" className="py-14 md:py-20 px-6 max-w-7xl mx-auto w-full border-b border-[#DAE5E0]">
        <div className="max-w-3xl mb-12">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#00B37E] bg-[#00B37E]/10 border border-[#00B37E]/20 px-3 py-0.5 rounded-full inline-block mb-2">
            Pillar 1 · Offline Deliveries & Satellite Architecture
          </div>
          <h2 className="text-2xl md:text-4xl font-display font-black text-[#12211E] tracking-tight leading-tight">
            Offline Geo-Pack deliveries and low-bandwidth satellite sync
          </h2>
          <p className="text-sm md:text-base text-[#12211E]/75 leading-relaxed font-normal mt-3 max-w-2xl">
            Commercial vessels spend days outside cellular reach. Parola bridges the connectivity gap with native chartplotter file exports and ultra-compressed mid-voyage satellite byte-streams.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Card 1: Offline Geo-Pack Deliveries */}
          <div className="bg-white border border-[#DAE5E0] rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-[0_2px_12px_rgba(18,33,30,0.04)]">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#00B37E]/10 flex items-center justify-center text-[#00B37E]">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-display font-black text-[#12211E]">
                  Offline Geo-Pack Deliveries
                </h3>
                <p className="text-xs text-[#00B37E] font-bold uppercase tracking-wider mt-0.5">
                  Pre-departure chartplotter downloads (.GPX, .KML, .GeoJSON)
                </p>
              </div>

              <p className="text-xs text-[#12211E]/75 leading-relaxed">
                Prior to departing port, captains download 24–72 hour spatial forecast bundles containing sea surface temperature fronts, thermocline contours, and pelagic hotspot coordinates directly to an SD card or USB flash drive for onboard chartplotters (Garmin, Furuno, Simrad, Raymarine, Lowrance).
              </p>

              <div className="bg-[#F2F6F4] border border-[#DAE5E0] rounded-2xl p-4 space-y-2 text-xs">
                <div className="font-bold text-[#12211E] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#00B37E]" />
                  <span>Daily Quota & Unlock Rules</span>
                </div>
                <p className="text-[#12211E]/75 leading-relaxed">
                  Each single-vessel subscription is entitled to unlock <strong>1 forecast zone per 24-hour cycle</strong>. Once unlocked, that zone&apos;s files can be downloaded continuously across all formats without consuming additional quota.
                </p>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={() => setIsGeoPackModalOpen(true)}
                className="w-full bg-[#00B37E] hover:bg-[#00B37E]/90 text-white py-3.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Launch Interactive Geo-Pack Exporter</span>
              </button>
            </div>
          </div>

          {/* Card 2: Low-Bandwidth Satellite Sync Add-on */}
          <div className="bg-white border border-[#DAE5E0] rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-[0_2px_12px_rgba(18,33,30,0.04)]">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#C57E2C]/10 flex items-center justify-center text-[#C57E2C]">
                <Satellite className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-display font-black text-[#12211E]">
                  Low-Bandwidth Satellite Sync Add-on
                </h3>
                <p className="text-xs text-[#9A5B18] font-bold uppercase tracking-wider mt-0.5">
                  Mid-voyage hotspot refreshes over Starlink, Iridium, & Inmarsat
                </p>
              </div>

              <p className="text-xs text-[#12211E]/75 leading-relaxed">
                When weather and pelagic feeding zones shift during multi-day expeditions offshore, Parola delivers mid-voyage hotspot refreshes using a proprietary compressed binary byte-stream payload engineered to minimize satellite airtime charges.
              </p>

              {/* Data Efficiency Comparison */}
              <div className="bg-[#F2F6F4] border border-[#DAE5E0] rounded-2xl p-4 space-y-2 text-xs">
                <div className="font-bold text-[#12211E] flex items-center justify-between">
                  <span>Satellite Transmission Efficiency</span>
                  <span className="text-[#00B37E] font-bold text-[11px]">99.9% Payload Reduction</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-500">Standard Web Map / API Stream:</span>
                    <span className="font-mono font-bold text-rose-600">~15.0 - 25.0 MB</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded-xl border border-[#00B37E]/30">
                    <span className="font-bold text-[#12211E]">Parola Binary Byte-Stream:</span>
                    <span className="font-mono font-bold text-[#00B37E]">~1.8 KB per refresh</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link
                href="/about"
                className="w-full block bg-[#F2F6F4] hover:bg-[#E2EBE6] text-[#12211E] border border-[#DAE5E0] py-3.5 rounded-full font-bold text-xs uppercase tracking-wider text-center transition-all"
              >
                Inquire About Satellite Integration
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* PILLAR 2: NON-INTRUSIVE FREE-TIER MONETIZATION & SUBSIDIES */}
      <section id="free-tier-subsidies" className="py-14 md:py-20 px-6 max-w-7xl mx-auto w-full border-b border-[#DAE5E0]">
        <div className="max-w-3xl mb-12">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#00B37E] bg-[#00B37E]/10 border border-[#00B37E]/20 px-3 py-0.5 rounded-full inline-block mb-2">
            Pillar 2 · Non-Intrusive Free-Tier Monetization & Subsidies
          </div>
          <h2 className="text-2xl md:text-4xl font-display font-black text-[#12211E] tracking-tight leading-tight">
            How artisanal municipal fishers receive free access
          </h2>
          <p className="text-sm md:text-base text-[#12211E]/75 leading-relaxed font-normal mt-3 max-w-2xl">
            Artisanal motorized bancas under 3.0 GT never pay a centavo. Free-tier operations are sustainably funded through three non-intrusive revenue and subsidy mechanisms.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Mechanism 1: Sponsored SMS Footers */}
          <div className="bg-white border border-[#DAE5E0] rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-[0_2px_12px_rgba(18,33,30,0.04)]">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#00B37E]/10 flex items-center justify-center text-[#00B37E]">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-[#12211E]">
                Sponsored SMS Footers
              </h3>
              <p className="text-xs text-[#12211E]/75 leading-relaxed">
                Daily municipal SMS advisories feature a single, non-intrusive sponsor acknowledgment on the final line (e.g. <em>&ldquo;Ligtas pumalaot hatid ng [Brand]&rdquo;</em> — max 20–25 characters). Partnering with corporate sponsors generates recurring sponsorship revenue without degrading user experience or crowding out navigation coordinates.
              </p>

              <div className="bg-[#12211E] text-white p-3 rounded-xl font-mono text-[11px] space-y-1">
                <div className="text-gray-400">PAROLA (Mercedes): Waves 0.8m, wind 9kts. Zone 3 active.</div>
                <div className="text-[#00B37E] font-bold">Ligtas pumalaot hatid ng Petron</div>
              </div>
            </div>
          </div>

          {/* Mechanism 2: Standard Generic Web Display Ads */}
          <div className="bg-white border border-[#DAE5E0] rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-[0_2px_12px_rgba(18,33,30,0.04)]">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#00B37E]/10 flex items-center justify-center text-[#00B37E]">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-[#12211E]">
                Standard Generic Web Display Ads
              </h3>
              <p className="text-xs text-[#12211E]/75 leading-relaxed">
                The localized web portal integrates non-intrusive programmatic banner ads (similar to standard digital news sites) to earn passive display ad revenue from visiting users without requiring dedicated ad sales overhead.
              </p>

              {/* Live Programmatic Ad Component Preview */}
              <GenericWebDisplayAd slotId="pricing-preview-ad" className="text-left" />
            </div>
          </div>

          {/* Mechanism 3: Telco Zero-Rating & CSR Gateway Offsets */}
          <div className="bg-white border border-[#DAE5E0] rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-[0_2px_12px_rgba(18,33,30,0.04)]">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#00B37E]/10 flex items-center justify-center text-[#00B37E]">
                <PhoneCall className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-[#12211E]">
                Telco Zero-Rating & CSR Offsets
              </h3>
              <p className="text-xs text-[#12211E]/75 leading-relaxed">
                Strategic partnerships with major Philippine telecommunications providers (Globe Telecom, Smart Communications) under their Digital Inclusion and ESG/SDG initiatives. Under these agreements, outbound advisory SMS batches receive zero-rated or bulk non-profit gateway rates (reducing SMS transmission costs from ₱0.40 to &lt;₱0.08 per message).
              </p>

              <div className="bg-[#F2F6F4] p-3 rounded-xl border border-[#DAE5E0] text-xs space-y-1">
                <div className="flex justify-between font-medium">
                  <span className="text-gray-500">Commercial SMS Rate:</span>
                  <span className="line-through text-gray-400">₱0.40 / msg</span>
                </div>
                <div className="flex justify-between font-bold text-[#00B37E]">
                  <span>CSR Subsidized Gateway:</span>
                  <span>&lt;₱0.08 / msg</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PILLAR 3: B2G & ESG SPATIAL DATA LICENSING */}
      <section id="b2g-licensing" className="py-14 md:py-20 px-6 max-w-7xl mx-auto w-full border-b border-[#DAE5E0]">
        <div className="max-w-3xl mb-12">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#00B37E] bg-[#00B37E]/10 border border-[#00B37E]/20 px-3 py-0.5 rounded-full inline-block mb-2">
            Pillar 3 · B2G & ESG Spatial Data Licensing
          </div>
          <h2 className="text-2xl md:text-4xl font-display font-black text-[#12211E] tracking-tight leading-tight">
            Regulatory and sustainability intelligence licensing
          </h2>
          <p className="text-sm md:text-base text-[#12211E]/75 leading-relaxed font-normal mt-3 max-w-2xl">
            Anonymized, macro-level fishing effort aggregations, fleet mobility heatmaps, and environmental density correlations are packaged into quarterly spatial intelligence reports and API feeds licensed to regulatory and institutional partners.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Institutional Partner 1: BFAR */}
          <div className="bg-white border border-[#DAE5E0] rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-[0_2px_12px_rgba(18,33,30,0.04)]">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#00B37E]/10 flex items-center justify-center text-[#00B37E]">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-[#12211E]">
                BFAR National & Regional Offices
              </h3>
              <p className="text-xs text-[#12211E]/75 leading-relaxed">
                Licensed for Fisheries Management Area (FMA) monitoring, closed-season compliance tracking, and stock replenishment research. Provides empirical data to support scientific catch quotas and sustainable fisheries governance.
              </p>
            </div>
            <div className="pt-4 border-t border-[#DAE5E0]">
              <span className="text-[10px] font-bold text-[#00B37E] uppercase tracking-wider">
                FMA Compliance · Stock Replenishment
              </span>
            </div>
          </div>

          {/* Institutional Partner 2: Coastal LGUs */}
          <div className="bg-white border border-[#DAE5E0] rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-[0_2px_12px_rgba(18,33,30,0.04)]">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#00B37E]/10 flex items-center justify-center text-[#00B37E]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-[#12211E]">
                Coastal LGUs & Municipalities
              </h3>
              <p className="text-xs text-[#12211E]/75 leading-relaxed">
                Licensed to Municipal Agriculture Offices (MAO) and Coastal Resource Management (CRM) units for municipal coastal zoning, resource assessment, and local bantay-dagat patrol dispatch coordination.
              </p>
            </div>
            <div className="pt-4 border-t border-[#DAE5E0]">
              <span className="text-[10px] font-bold text-[#00B37E] uppercase tracking-wider">
                Zoning · Bantay-Dagat Dispatch
              </span>
            </div>
          </div>

          {/* Institutional Partner 3: Marine Conservation Foundations */}
          <div className="bg-white border border-[#DAE5E0] rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-[0_2px_12px_rgba(18,33,30,0.04)]">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#00B37E]/10 flex items-center justify-center text-[#00B37E]">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-[#12211E]">
                Marine Conservation Foundations
              </h3>
              <p className="text-xs text-[#12211E]/75 leading-relaxed">
                Licensed to research institutes and international NGOs for science-backed Marine Protected Area (MPA) delineation, pelagic migratory corridor modeling, and ocean climate resilience tracking.
              </p>
            </div>
            <div className="pt-4 border-t border-[#DAE5E0]">
              <span className="text-[10px] font-bold text-[#00B37E] uppercase tracking-wider">
                MPA Delineation · ESG Spatial Feeds
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Cadence & Policy FAQ Notice */}
      <section className="py-14 px-6 max-w-7xl mx-auto w-full">
        <div className="bg-white border border-[#DAE5E0] rounded-3xl p-6 md:p-10 shadow-[0_2px_12px_rgba(18,33,30,0.04)] space-y-6">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#C57E2C]" />
            <h3 className="text-lg font-display font-bold text-[#12211E]">
              Business Model & Statutory Compliance Clarifications
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-[#12211E]/80">
            <div className="space-y-2">
              <h4 className="font-bold text-[#12211E]">
                How does the 1-zone daily quota work for single-vessel subscribers?
              </h4>
              <p className="leading-relaxed text-[#12211E]/70">
                Each single-vessel subscription is entitled to unlock 1 forecast zone per 24-hour cycle. Once unlocked, all spatial forecast formats (.GPX, .KML, .GeoJSON) and resolution horizons (24h, 48h, 72h) for that zone can be downloaded continuously without consuming additional quota.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-[#12211E]">
                How are the vessel gross tonnage classes defined?
              </h4>
              <p className="leading-relaxed text-[#12211E]/70">
                Vessel classes adhere strictly to Section 3(n) of the Philippine Fisheries Code (RA 8550 as amended by RA 10654): Small-scale commercial (3.1 to 20.0 GT), Medium-scale commercial (20.1 to 150.0 GT), and Large-scale commercial (&gt;150.0 GT). Municipal craft (&le;3.0 GT) receive 100% free subsidized access.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-[#12211E]">
                What is the Low-Bandwidth Satellite Sync Add-on?
              </h4>
              <p className="leading-relaxed text-[#12211E]/70">
                It uses a proprietary binary byte-stream payload allowing mid-voyage hotspot refreshes over Starlink, Iridium Go!, or Inmarsat at minimal satellite transmission costs (~1.8 KB per refresh compared to 15–25 MB for raw web maps).
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-[#12211E]">
                How does corporate sponsorship maintain user trust?
              </h4>
              <p className="leading-relaxed text-[#12211E]/70">
                Sponsored SMS footers are strictly limited to a single non-intrusive sponsor acknowledgment on the final line (max 20–25 characters). Weather alerts, wave heights, and emergency navigation coordinates always maintain absolute priority.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#E7EFEA] border-t border-[#DAE5E0] py-12 px-6">
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
            <Link href="/guide" className="hover:text-[#00B37E] transition-colors">
              System Guide
            </Link>
            <Link href="/pricing" className="text-[#00B37E] transition-colors">
              Pricing & SaaS
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
            © {new Date().getFullYear()} Parola. RA 8550 Commercial SaaS Architecture.
          </div>
        </div>
      </footer>

      {/* Offline Geo-Pack Download Modal */}
      <OfflineGeoPackModal
        isOpen={isGeoPackModalOpen}
        onClose={() => setIsGeoPackModalOpen(false)}
      />
    </div>
  );
}
