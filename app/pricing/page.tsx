import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  Ship,
  HelpCircle,
  ArrowRight
} from "lucide-react";
import { ParolaLogo } from "@/components/ui/ParolaLogo";

export const metadata: Metadata = {
  title: "Pricing | Parola",
  description:
    "Predictable marine advisory pricing tiered by Philippine vessel gross tonnage classification.",
};

export default function PricingPage() {
  const tiers = [
    {
      name: "Small-Scale",
      tonnage: "3.1 to 20.0 GT",
      price: "₱799",
      targetVessels: "Motorized bancas, municipal handline fishers, and nearshore coastal craft",
      popular: false,
      features: [
        "Daily 04:30 PHT morning SMS marine dispatch",
        "Municipal port registration pairing (home pier binding)",
        "Automated PAGASA gale warnings and wave hazard holds",
        "Two-way SMS query syntax (ADVISORY, STATUS, HOTSPOT)",
        "Standard small craft wave threshold alert (Hs > 1.5m)",
        "Emergency co-op and VHF Channel 16 muster link"
      ]
    },
    {
      name: "Medium-Scale",
      tonnage: "20.1 to 150.0 GT",
      price: "₱2,499",
      targetVessels: "Commercial ring-netters, purse seiners, and multi-day island fishing vessels",
      popular: true,
      features: [
        "Everything included in the Small-Scale tier",
        "Multi-zone sea surface temperature thermal front mapping",
        "Automated pelagic chlorophyll and schooling zone alerts",
        "Two-way SMS catch feedback logging loop access",
        "Priority harbor muster dispatch for active fleet offshore",
        "Multi-handset cooperative group broadcast capabilities"
      ]
    },
    {
      name: "Large-Scale",
      tonnage: ">150.0 GT",
      price: "₱6,199",
      targetVessels: "Distant-water longliners, commercial motherships, and fleet aggregators",
      popular: false,
      features: [
        "Everything included in the Medium-Scale tier",
        "Full Philippine Exclusive Economic Zone (EEZ) satellite feed",
        "Direct cooperative management API and port marshal feeds",
        "Automated harvest telemetry reporting for BFAR compliance",
        "Dedicated satellite SMS gateway redundancy integration",
        "Multi-vessel cooperative administration console"
      ]
    }
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
        <div className="absolute top-[40%] left-[-100px] w-[500px] h-[500px] bg-[#C57E2C]/5 blur-[120px] rounded-full" />
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
            <Link href="/guide" className="hover:text-[#00B37E] transition-colors">
              System Guide
            </Link>
            <Link href="/pricing" className="text-[#00B37E] font-black border-b-2 border-[#00B37E] pb-1">
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

      {/* Main Hero */}
      <section className="pt-12 md:pt-16 pb-12 px-6 max-w-7xl mx-auto w-full border-b border-[#DAE5E0]">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#C57E2C]/10 border border-[#C57E2C]/25 text-[#9A5B18] text-[11px] font-bold uppercase tracking-wider mb-4 shadow-2xs">
            <Ship className="w-3.5 h-3.5 text-[#C57E2C]" />
            <span>Vessel Gross Tonnage Classification</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-display font-black tracking-tight text-[#12211E] leading-[1.08] mb-3">
            Predictable marine advisory pricing for every vessel class
          </h1>

          <p className="text-base text-[#12211E]/75 leading-relaxed max-w-2xl font-normal">
            Tiered according to official Philippine vessel gross tonnage (GT) categories to support municipal bancas, medium fishing vessels, and commercial offshore fleets.
          </p>
        </div>
      </section>

      {/* Pricing Cards Grid (Elevated white cards against tinted mist canvas) */}
      <section className="py-12 md:py-16 px-6 max-w-7xl mx-auto w-full border-b border-[#DAE5E0]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-3xl p-6 md:p-8 flex flex-col justify-between transition-all ${
                tier.popular
                  ? "bg-white border-2 border-[#00B37E] shadow-[0_8px_30px_rgba(0,179,126,0.12)] relative"
                  : "bg-white border border-[#DAE5E0] shadow-[0_2px_12px_rgba(18,33,30,0.04)] hover:border-[#12211E]/20"
              }`}
            >
              <div className="space-y-5">
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
                  {tier.popular && (
                    <span className="text-[10px] font-bold text-[#9A5B18] bg-[#C57E2C]/10 border border-[#C57E2C]/25 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Most Common Class
                    </span>
                  )}
                </div>

                <div>
                  <h2 className="text-2xl font-display font-black text-[#12211E]">
                    {tier.name}
                  </h2>
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="text-4xl font-display font-black text-[#12211E]">
                      {tier.price}
                    </span>
                    <span className="text-xs text-[#12211E]/60 font-medium">
                      per vessel
                    </span>
                  </div>
                  <p className="text-xs text-[#12211E]/75 leading-relaxed mt-2.5">
                    {tier.targetVessels}
                  </p>
                </div>

                <div className="border-t border-[#DAE5E0] pt-4 space-y-2.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#12211E]/60">
                    Included Telemetry & Features
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

              <div className="pt-8">
                <Link
                  href="/register"
                  className={`w-full block py-3.5 rounded-full font-bold text-xs uppercase tracking-wider text-center transition-all ${
                    tier.popular
                      ? "bg-[#00B37E] hover:bg-[#00B37E]/90 text-white shadow-md active:scale-[0.98]"
                      : "bg-[#F2F6F4] hover:bg-[#E2EBE6] text-[#12211E] border border-[#DAE5E0] active:scale-[0.98]"
                  }`}
                >
                  Select {tier.name} Tier
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cadence Notice & Open Question Clarification */}
      <section className="py-12 px-6 max-w-7xl mx-auto w-full">
        <div className="bg-white border border-[#DAE5E0] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-[0_2px_12px_rgba(18,33,30,0.04)]">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#C57E2C]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#12211E]">
                Billing Cadence Policy Notice
              </span>
            </div>
            <p className="text-xs text-[#12211E]/75 leading-relaxed">
              Final billing intervals (monthly, seasonal fishing cycle, or annual cooperative license) are currently being finalized in consultation with municipal fisherfolk associations and coastal co-op federations. Exact payment schedules will be confirmed upon cooperative enrollment.
            </p>
          </div>

          <Link
            href="/about"
            className="shrink-0 bg-[#F2F6F4] hover:bg-[#E2EBE6] text-[#12211E] border border-[#DAE5E0] px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider transition-all text-center flex items-center gap-2"
          >
            <span>Learn More About Parola</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#00B37E]" />
          </Link>
        </div>
      </section>

      {/* Footer (Grounded coastal tone, zero em-dashes) */}
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
