import type { Metadata } from "next";
import Link from "next/link";
import {
  Radio,
  Ship,
  Compass,
  Waves,
  CheckCircle2
} from "lucide-react";
import { ParolaLogo } from "@/components/ui/ParolaLogo";

export const metadata: Metadata = {
  title: "About | Parola",
  description:
    "Parola mission and SMS-first operational architecture for Philippine municipal fisherfolk safety.",
};

export default function AboutPage() {
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
            <Link href="/pricing" className="hover:text-[#00B37E] transition-colors">
              Pricing
            </Link>
            <Link href="/about" className="text-[#00B37E] font-black border-b-2 border-[#00B37E] pb-1">
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

      {/* Page Hero */}
      <section className="pt-12 md:pt-16 pb-12 px-6 max-w-7xl mx-auto w-full border-b border-[#DAE5E0]">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#C57E2C]/10 border border-[#C57E2C]/25 text-[#9A5B18] text-[11px] font-bold uppercase tracking-wider mb-4 shadow-2xs">
            <Compass className="w-3.5 h-3.5 text-[#C57E2C]" />
            <span>Mission & Operational Architecture</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-display font-black tracking-tight text-[#12211E] leading-[1.08] mb-4">
            Empowering Philippine municipal fisherfolk through SMS-first intelligence
          </h1>

          <p className="text-base text-[#12211E]/75 leading-relaxed max-w-2xl font-normal">
            Parola bridges advanced satellite oceanography and front-line coastal reality, delivering critical weather safety bulletins and predictive fish hotspot alerts without internet dependencies.
          </p>
        </div>
      </section>

      {/* Section 1: Core Mission (Crisp white section backdrop) */}
      <section className="py-14 md:py-20 px-6 max-w-7xl mx-auto w-full border-b border-[#DAE5E0]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-5">
            <div className="text-xs font-bold uppercase tracking-wider text-[#9A5B18] bg-[#C57E2C]/10 border border-[#C57E2C]/25 px-3 py-1 rounded-full inline-block">
              Our Purpose
            </div>
            <h2 className="text-2xl md:text-4xl font-display font-black text-[#12211E] tracking-tight leading-tight">
              Safety at sea should never depend on expensive smartphone data
            </h2>
            <p className="text-sm md:text-base text-[#12211E]/75 leading-relaxed">
              In the Philippines, municipal fisherfolk represent the bedrock of coastal food security yet face persistent economic vulnerability. When unpredictable squalls strike offshore, lack of real-time marine warning often turns routine fishing expeditions into maritime tragedies.
            </p>
            <p className="text-sm text-[#12211E]/75 leading-relaxed">
              Parola exists to eliminate guesswork by transforming ocean satellite models into straightforward, actionable text advisories delivered directly to standard mobile phones before boats depart the harbor.
            </p>
          </div>

          <div className="lg:col-span-6 bg-white border border-[#DAE5E0] rounded-3xl p-6 md:p-8 space-y-4 shadow-[0_4px_24px_rgba(18,33,30,0.05)]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#12211E]">
              Core Objectives
            </h3>
            <div className="space-y-3">
              {[
                {
                  title: "Zero Preventable Maritime Casualties",
                  desc: "Automated departure holds prevent small bancas from launching into hazardous seas during gale warnings."
                },
                {
                  title: "Optimized Voyage and Scouting Efficiency",
                  desc: "Satellite SST and chlorophyll thermal fronts guide fishers directly to productive pelagic feeding grounds."
                },
                {
                  title: "Equitable Access Across Coastal Communities",
                  desc: "Guaranteed compatibility with all 2G GSM cellular networks and standard alphanumeric keypad phones."
                }
              ].map((item, idx) => (
                <div key={idx} className="bg-[#F2F6F4] p-4 rounded-2xl border border-[#DAE5E0] space-y-1">
                  <div className="text-xs font-bold text-[#12211E] flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00B37E]" />
                    <span>{item.title}</span>
                  </div>
                  <div className="text-xs text-[#12211E]/70 leading-relaxed pl-5.5">
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Why SMS-First (Tinted mist backdrop with elevated white cards) */}
      <section className="py-14 md:py-20 px-6 max-w-7xl mx-auto w-full border-b border-[#DAE5E0]">
        <div className="max-w-3xl mb-12">
          <h2 className="text-2xl md:text-4xl font-display font-black text-[#12211E] tracking-tight leading-tight">
            Why SMS-first architecture matters at sea
          </h2>
          <p className="text-sm md:text-base text-[#12211E]/75 leading-relaxed font-normal mt-3 max-w-2xl">
            Modern mobile web applications assume high-speed 4G and 5G connectivity that dissolves just a few kilometers offshore.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#DAE5E0] rounded-3xl p-6 md:p-8 space-y-3 shadow-[0_2px_12px_rgba(18,33,30,0.04)]">
            <div className="w-10 h-10 rounded-xl bg-[#F2F6F4] border border-[#DAE5E0] flex items-center justify-center text-[#00B37E] shadow-2xs">
              <Radio className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-lg text-[#12211E]">
              Beyond Mobile Data Range
            </h3>
            <p className="text-xs text-[#12211E]/75 leading-relaxed">
              Cellular data packets degrade rapidly offshore, but standard 2G SMS GSM signals penetrate through coastal microwave relays and low-band towers, reaching vessels deep in municipal fishing waters.
            </p>
          </div>

          <div className="bg-white border border-[#DAE5E0] rounded-3xl p-6 md:p-8 space-y-3 shadow-[0_2px_12px_rgba(18,33,30,0.04)]">
            <div className="w-10 h-10 rounded-xl bg-[#F2F6F4] border border-[#DAE5E0] flex items-center justify-center text-[#00B37E] shadow-2xs">
              <Ship className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-lg text-[#12211E]">
              No Smartphone Barrier
            </h3>
            <p className="text-xs text-[#12211E]/75 leading-relaxed">
              Requiring smartphone data plans or app store downloads creates barriers for municipal fishers. Parola operates seamlessly on standard physical keypad phones that fishers already own and carry.
            </p>
          </div>

          <div className="bg-white border border-[#DAE5E0] rounded-3xl p-6 md:p-8 space-y-3 shadow-[0_2px_12px_rgba(18,33,30,0.04)]">
            <div className="w-10 h-10 rounded-xl bg-[#F2F6F4] border border-[#DAE5E0] flex items-center justify-center text-[#00B37E] shadow-2xs">
              <Waves className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-lg text-[#12211E]">
              Instant Two-Way Query
            </h3>
            <p className="text-xs text-[#12211E]/75 leading-relaxed">
              Fishers can text simple keywords like ADVISORY or STATUS at any time to receive immediate localized harbor clearance, weather parameters, and pelagic hotspot coordinates.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Relevance to BFAR and Maritime Safety (Crisp white foundation) */}
      <section className="py-14 md:py-20 px-6 max-w-7xl mx-auto w-full border-b border-[#DAE5E0]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-5">
            <div className="text-xs font-bold uppercase tracking-wider text-[#00B37E]">
              Institutional Alignment
            </div>
            <h2 className="text-2xl md:text-4xl font-display font-black text-[#12211E] tracking-tight leading-tight">
              Strengthening BFAR and port safety workflows
            </h2>
            <p className="text-sm md:text-base text-[#12211E]/75 leading-relaxed">
              Parola is engineered to complement the operational mandates of the Bureau of Fisheries and Aquatic Resources (BFAR), the Philippine Coast Guard, and local municipal agriculture offices.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#00B37E] shrink-0 mt-0.5" />
                <span className="text-xs text-[#12211E]/80 leading-relaxed">
                  <strong>Municipal Vessel Registry Integration:</strong> Pairs vessel identification numbers directly with designated home landing sites to support official muster accountability.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#00B37E] shrink-0 mt-0.5" />
                <span className="text-xs text-[#12211E]/80 leading-relaxed">
                  <strong>Automated Gale Warning Broadcasts:</strong> Bridges DOST-PAGASA marine weather forecasts directly to small motorized bancas before hazardous wave swells manifest.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#00B37E] shrink-0 mt-0.5" />
                <span className="text-xs text-[#12211E]/80 leading-relaxed">
                  <strong>Sustainable Catch Monitoring:</strong> Aggregated harvest feedback telemetry provides municipal fisheries officers with empirical landing data for sustainable stock management.
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-white border border-[#DAE5E0] rounded-3xl p-6 md:p-8 space-y-5 shadow-[0_4px_24px_rgba(18,33,30,0.05)]">
            <div className="text-xs font-bold uppercase tracking-wider text-[#12211E]">
              Key Partner Standards Monitored
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#F2F6F4] p-4 rounded-2xl border border-[#DAE5E0]">
                <div className="text-[10px] font-bold text-[#12211E]/55 uppercase tracking-wider">
                  Wave Advisory Gate
                </div>
                <div className="text-lg font-black font-display text-[#12211E] mt-1">
                  Hs &gt; 1.5m
                </div>
                <div className="text-[10px] text-[#00B37E] font-bold mt-0.5">
                  Small craft hold limit
                </div>
              </div>

              <div className="bg-[#F2F6F4] p-4 rounded-2xl border border-[#DAE5E0]">
                <div className="text-[10px] font-bold text-[#12211E]/55 uppercase tracking-wider">
                  Storm Signal Action
                </div>
                <div className="text-lg font-black font-display text-[#12211E] mt-1">
                  Signal 1+
                </div>
                <div className="text-[10px] text-rose-600 font-bold mt-0.5">
                  Zero departure order
                </div>
              </div>

              <div className="bg-[#F2F6F4] p-4 rounded-2xl border border-[#DAE5E0]">
                <div className="text-[10px] font-bold text-[#12211E]/55 uppercase tracking-wider">
                  Primary Coverage
                </div>
                <div className="text-lg font-black font-display text-[#12211E] mt-1">
                  Municipal Waters
                </div>
                <div className="text-[10px] text-[#9A5B18] font-bold mt-0.5">
                  0 to 15km offshore
                </div>
              </div>

              <div className="bg-[#F2F6F4] p-4 rounded-2xl border border-[#DAE5E0]">
                <div className="text-[10px] font-bold text-[#12211E]/55 uppercase tracking-wider">
                  Emergency Channel
                </div>
                <div className="text-lg font-black font-display text-[#12211E] mt-1">
                  VHF Ch 16
                </div>
                <div className="text-[10px] text-[#12211E]/65 font-semibold mt-0.5">
                  Coast guard hailing
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section (Rich maritime gradient container) */}
      <section className="py-14 md:py-20 px-6 max-w-7xl mx-auto w-full">
        <div className="bg-gradient-to-br from-[#E4F2EC] via-[#EBF5F0] to-[#F2F6F4] border border-[#DAE5E0] rounded-3xl p-8 md:p-14 text-[#12211E] flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
          <div className="space-y-3 max-w-xl">
            <h2 className="text-2xl md:text-3xl font-display font-black tracking-tight">
              Ready to connect your vessel or fishing cooperative?
            </h2>
            <p className="text-xs md:text-sm text-[#12211E]/75 leading-relaxed font-normal">
              Register your boat in minutes to start receiving daily morning weather advisories, storm holds, and active pelagic fish feeding coordinates.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            <Link
              href="/register"
              className="bg-[#00B37E] hover:bg-[#00B37E]/90 text-white px-8 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-[0.98] text-center"
            >
              Register Vessel
            </Link>
            <Link
              href="/guide"
              className="bg-white hover:bg-[#F2F6F4] text-[#12211E] border border-[#DAE5E0] px-8 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-2xs active:scale-[0.98] text-center"
            >
              Explore System Guide
            </Link>
          </div>
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
            <Link href="/pricing" className="hover:text-[#00B37E] transition-colors">
              Pricing
            </Link>
            <Link href="/about" className="text-[#00B37E] transition-colors">
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
