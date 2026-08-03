"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Globe, 
  ArrowRight, 
  MessageSquare, 
  Compass, 
  Map as MapIcon, 
  ShieldAlert, 
  Wind, 
  Waves, 
  Thermometer, 
  Zap, 
  Check, 
  Plus, 
  Minus,
  Mail,
  Users,
  Anchor
} from "lucide-react";
import { DemoBackground } from "../components/ui/DemoBackground";
import { ParolaLogo } from "../components/ui/ParolaLogo";

export default function LandingPage() {
  const router = useRouter();
  const [liters, setLiters] = useState(20);

  return (
    <div className="min-h-screen bg-brand-offwhite text-brand-black relative z-0 scroll-smooth font-sans antialiased">
      <DemoBackground />

      {/* SECTION 1: HERO SCREEN (Navigation + Hero) */}
      <section className="min-h-screen flex flex-col justify-between w-full relative z-10">
        {/* Navigation */}
        <header className="w-full border-b border-gray-150/50 bg-white/45 backdrop-blur-md shrink-0">
          <div className="flex items-center justify-between p-4 md:px-12 max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-3">
              <ParolaLogo iconOnly className="w-9 h-9 hover:scale-105 transition-transform" />
              <span className="font-display text-2xl font-black tracking-tight text-brand-black uppercase">Parola</span>
            </div>
            
            <div className="hidden md:flex items-center gap-10 font-semibold text-xs uppercase tracking-wider text-brand-black/75">
              <a href="#how-it-works" className="hover:text-brand-green transition-all duration-200">Features & Tools</a>
            </div>

            <div className="flex items-center gap-6">
              <button className="flex items-center gap-2 text-brand-black/60 hover:text-brand-black font-semibold text-xs tracking-wider uppercase transition-colors">
                <Globe className="w-4 h-4 text-brand-green" />
                <span>EN / TL</span>
              </button>
              <Link href="/login" className="hidden sm:inline font-semibold text-xs uppercase tracking-wider text-brand-black hover:text-brand-green transition-all duration-200">Log In</Link>
              <Link href="/register" className="bg-brand-green text-white px-6 py-3 rounded-full font-semibold text-xs uppercase tracking-widest hover:bg-brand-green/90 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0">
                Register Now
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Body */}
        <div className="flex-1 flex flex-col justify-center items-center py-6 px-6 max-w-5xl mx-auto text-center relative w-full">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 bg-brand-green/10 border border-brand-green/20 text-brand-green px-5 py-2 rounded-full font-semibold text-xs uppercase tracking-widest mb-6 md:mb-8 shadow-sm">
            <Zap className="w-3.5 h-3.5 fill-brand-green" />
            <span>Free via SMS — No mobile data plan needed</span>
          </div>

          {/* Headline Display */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-black leading-[1.05] tracking-tight text-brand-black max-w-4xl">
            One tool to <span className="underline decoration-brand-green decoration-8 underline-offset-4">manage</span> hotspots and your fleet.
          </h1>

          {/* Subtitle */}
          <p className="text-sm md:text-lg text-brand-black/60 max-w-2xl mt-5 md:mt-7 leading-relaxed font-normal">
            Real-time weather, safety advisories, and fishing hotspots delivered straight to your phone. Know where the fish are before you leave port.
          </p>

          {/* CTA Buttons - Single Clean Button as Requested */}
          <div className="mt-8 md:mt-10 w-full sm:w-auto flex justify-center">
            <button 
              onClick={() => router.push("/register")}
              className="bg-brand-green text-white px-10 py-4 rounded-full font-semibold text-sm uppercase tracking-wider hover:bg-brand-green/90 transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5 w-full sm:w-auto cursor-pointer"
            >
              Start for Free
            </button>
          </div>

          {/* FLOATING DESIGN ELEMENTS: Sea & Fish circular cards with responsive positioning */}
          {/* Top Left Floating Circle */}
          <div className="hidden lg:flex absolute top-12 left-[-80px] bg-white border border-gray-150 p-4 rounded-2xl shadow-xl items-center gap-3.5 animate-bounce pointer-events-none" style={{ animationDuration: "4s" }}>
            <div className="w-11 h-11 rounded-full bg-brand-green/5 border border-brand-green/10 flex items-center justify-center text-2xl shadow-inner">
              🌊
            </div>
            <div className="text-left">
              <div className="text-[10px] font-semibold text-brand-black/45 uppercase tracking-wider">Sea Condition</div>
              <div className="text-sm font-black text-brand-green uppercase tracking-wide">Safe to Sail</div>
            </div>
          </div>

          {/* Top Right Floating Circle */}
          <div className="hidden lg:flex absolute top-20 right-[-80px] bg-white border border-gray-150 p-4 rounded-2xl shadow-xl items-center gap-3.5 animate-bounce pointer-events-none" style={{ animationDuration: "5s" }}>
            <div className="w-11 h-11 rounded-full bg-brand-green/5 border border-brand-green/10 flex items-center justify-center text-2xl shadow-inner">
              🐟
            </div>
            <div className="text-left">
              <div className="text-[10px] font-semibold text-brand-black/45 uppercase tracking-wider">Surface Hotspot</div>
              <div className="text-sm font-black text-brand-green uppercase tracking-wide">Tamban Active</div>
            </div>
          </div>

          {/* Bottom Left Floating Circle */}
          <div className="hidden lg:flex absolute bottom-16 left-[-60px] bg-white border border-gray-150 p-4 rounded-2xl shadow-xl items-center gap-3.5 animate-pulse pointer-events-none">
            <div className="w-11 h-11 rounded-full bg-brand-green/5 border border-brand-green/10 flex items-center justify-center text-2xl shadow-inner">
              🐠
            </div>
            <div className="text-left">
              <div className="text-[10px] font-semibold text-brand-black/45 uppercase tracking-wider">Demersal Hotspot</div>
              <div className="text-sm font-black text-brand-green uppercase tracking-wide">Lapu-lapu 88%</div>
            </div>
          </div>

          {/* Bottom Right Floating Circle */}
          <div className="hidden lg:flex absolute bottom-12 right-[-60px] bg-white border border-gray-150 p-4 rounded-2xl shadow-xl items-center gap-3.5 animate-pulse pointer-events-none" style={{ animationDuration: "3.5s" }}>
            <div className="w-11 h-11 rounded-full bg-brand-green/5 border border-brand-green/10 flex items-center justify-center text-2xl shadow-inner">
              ⛵
            </div>
            <div className="text-left">
              <div className="text-[10px] font-semibold text-brand-black/45 uppercase tracking-wider">My Port</div>
              <div className="text-sm font-black text-brand-green uppercase tracking-wide">Batangas Pier 1</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: FEATURES SCREEN (Grid of Tools & How It Works) */}
      <section id="how-it-works" className="py-20 px-6 max-w-7xl mx-auto w-full relative z-10">
        {/* Section Header */}
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs font-bold text-brand-green uppercase tracking-widest bg-brand-green/5 px-3 py-1 rounded-full border border-brand-green/10">Features & Tools</span>
          <h2 className="text-2xl sm:text-4xl font-display font-black text-brand-black uppercase leading-tight max-w-4xl mx-auto">
            Latest advanced technologies to ensure everything you need
          </h2>
          <p className="text-xs sm:text-sm text-brand-black/55 max-w-2xl mx-auto font-normal">
            Maximize your trip&apos;s productivity and safety with our durable, user-friendly fisherfolk portal.
          </p>
        </div>

        {/* Layout Grid with dynamic row spacing */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto w-full">
          
          {/* Card 1: Dynamic Dashboard (Small Card) */}
          <div className="bg-white/70 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-gray-150/50 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-brand-green/20 transition-all">
            <div className="space-y-3">
              <h3 className="text-xl font-display font-extrabold text-brand-black uppercase">Dynamic dashboard</h3>
              <p className="text-xs md:text-sm text-brand-black/60 leading-relaxed font-normal">
                Get an instant overview of ocean temperatures, localized safety levels, and exact coordinates of hotspots. High density, no fluff.
              </p>
            </div>

            {/* Graphical Visual Element */}
            <div className="w-full bg-brand-offwhite/90 rounded-2xl p-4 border border-gray-200 shadow-inner space-y-3.5 mt-4">
              <div className="flex justify-between items-center border-b border-gray-200/50 pb-2">
                <span className="text-[9px] font-semibold text-brand-black/45 uppercase tracking-wider">Mercedes Port</span>
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-brand-green"></span>
                  <span className="w-2 h-2 rounded-full bg-brand-green/30"></span>
                  <span className="w-2 h-2 rounded-full bg-brand-green/30"></span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-semibold text-brand-black/50 uppercase tracking-wide">
                  <span>Active Hotspots</span>
                  <span className="font-bold">8 Zones</span>
                </div>
                <div className="h-1.5 w-full bg-gray-200/80 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-green w-4/5 rounded-full"></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-semibold text-brand-black/50 uppercase tracking-wide">
                  <span>Wave Safety Limit</span>
                  <span className="font-bold">1.2m</span>
                </div>
                <div className="h-1.5 w-full bg-gray-200/80 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-green w-2/5 rounded-full"></div>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-gray-150 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <Compass className="w-3.5 h-3.5 text-brand-green" />
                  <span className="text-[9px] font-bold text-brand-black/70 uppercase">Zone 3</span>
                </div>
                <span className="text-[9px] font-bold text-brand-green uppercase tracking-wide">12km Away</span>
              </div>
            </div>

            <div className="pt-4">
              <button onClick={() => router.push("/login")} className="w-full text-center bg-brand-green text-white px-5 py-2.5 rounded-full font-semibold text-[10px] uppercase tracking-widest hover:bg-brand-green/90 transition-all cursor-pointer">
                Explore Dashboard
              </button>
            </div>
          </div>

          {/* Card 2: Cooperative Fuel Program (Small Card) */}
          <div className="bg-white/70 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-gray-150/50 flex flex-col justify-between shadow-sm hover:border-brand-green/20 transition-all">
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-2">
                <h3 className="text-xl font-display font-extrabold text-brand-black uppercase">Cooperative fuel</h3>
                <span className="text-[9px] font-bold text-brand-green uppercase bg-brand-green/5 px-2.5 py-1 rounded-full border border-brand-green/10 whitespace-nowrap shrink-0">
                  Co-Op Discount
                </span>
              </div>
              <p className="text-xs md:text-sm text-brand-black/60 leading-relaxed font-normal">
                Request fuel advances and lock in cooperative pricing directly through the portal, saving up to 15% on trip costs.
              </p>
            </div>

            {/* Compact Calculator Visual Element */}
            <div className="bg-brand-offwhite rounded-2xl border border-gray-200 shadow-inner p-4 mt-4 space-y-3.5">
              <div className="flex items-center justify-between bg-white border border-gray-150 p-1.5 rounded-full shadow-sm">
                <button 
                  onClick={() => setLiters(prev => Math.max(10, prev - 10))}
                  className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-brand-black hover:bg-gray-150 transition-all active:scale-90 text-sm font-bold border border-gray-200 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="text-center px-2">
                  <span className="text-xl font-display font-black text-brand-black">{liters}</span>
                  <span className="text-[10px] font-bold text-brand-black/45 ml-1 uppercase">Liters</span>
                </div>
                <button 
                  onClick={() => setLiters(prev => Math.min(200, prev + 10))}
                  className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-brand-black hover:bg-gray-150 transition-all active:scale-90 text-sm font-bold border border-gray-200 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Calculations breakdown in the compact view */}
              <div className="space-y-1.5 text-[10px]">
                <div className="flex justify-between font-medium text-brand-black/60">
                  <span>Standard Price</span>
                  <span>₱{(liters * 62).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-brand-green">
                  <span>Co-op Discounted</span>
                  <span>₱{(liters * 55).toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-200/50 pt-1.5 flex justify-between items-center">
                  <span className="font-bold text-brand-black uppercase">Est. Cost</span>
                  <span className="text-base font-display font-black text-brand-green">₱{(liters * 55).toLocaleString()}</span>
                </div>
              </div>

              <button 
                onClick={() => router.push("/login")}
                className="w-full bg-brand-green text-white font-bold text-[10px] uppercase tracking-widest py-2.5 rounded-full hover:bg-brand-green/90 transition-all duration-200 shadow-sm text-center cursor-pointer"
              >
                Request Advance
              </button>
            </div>
          </div>

          {/* Card 3: Smart Notifications */}
          <div className="bg-white/70 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-gray-150/50 flex flex-col justify-between shadow-sm hover:border-brand-green/20 transition-all">
            <div className="space-y-3">
              <h3 className="text-xl font-display font-extrabold text-brand-black uppercase">Smart notifications</h3>
              <p className="text-xs md:text-sm text-brand-black/60 leading-relaxed font-normal">
                Receive critical ocean alerts, safety signals, and coordinates directly to your SMS application without opening any extra web pages.
              </p>
            </div>

            <div className="bg-brand-offwhite rounded-2xl border border-gray-200 shadow-inner p-4 mt-4 space-y-2.5">
              <div className="flex justify-between items-center text-[9px] font-semibold text-brand-black/45 uppercase tracking-widest pb-1 border-b border-gray-200/50">
                <span>SMS Channel</span>
                <span className="font-bold text-brand-green">Active</span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-gray-150/55 shadow-sm flex items-start gap-2.5">
                <div className="p-1 rounded-md bg-rose-50 border border-rose-100 text-rose-500 shrink-0">
                  <ShieldAlert className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[9px] font-bold text-brand-black uppercase">Storm Signal 1</div>
                  <div className="text-[9px] text-brand-black/50 font-normal mt-0.5">Do not leave port. Heavy waves expected.</div>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-gray-150/55 shadow-sm flex items-start gap-2.5">
                <div className="p-1 rounded-md bg-brand-green/5 border border-brand-green/10 text-brand-green shrink-0">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[9px] font-bold text-brand-black uppercase">Hotspot Shifting</div>
                  <div className="text-[9px] text-brand-black/50 font-normal mt-0.5">Schools moved 5km SE of Zone 2.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: How It Works Steps (Takes full width row of 3 columns) */}
          <div className="lg:col-span-3 bg-white/70 backdrop-blur-md rounded-3xl p-8 md:p-10 border border-gray-150/50 flex flex-col lg:flex-row gap-8 items-center justify-between shadow-sm hover:border-brand-green/20 transition-all">
            <div className="space-y-3 max-w-sm">
              <h3 className="text-2xl font-display font-extrabold text-brand-black uppercase">How It Works</h3>
              <p className="text-sm text-brand-black/60 leading-relaxed font-normal">
                We designed Parola to be incredibly accessible. Connect in just three easy steps and keep sailing securely.
              </p>
            </div>

            <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { num: "1", title: "Register once", desc: "Sign up with just your mobile number." },
                { num: "2", title: "Get SMS advisories", desc: "Receive daily updates on weather and fishing hotspots." },
                { num: "3", title: "Fish smarter", desc: "Save fuel and catch more with accurate data." }
              ].map((step) => (
                <div key={step.num} className="bg-brand-offwhite/85 p-5 rounded-2xl border border-gray-200 flex flex-col gap-4 hover:bg-white transition-all shadow-sm">
                  <div className="w-9 h-9 rounded-full bg-brand-green text-white font-display font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                    {step.num}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-brand-black uppercase tracking-wide leading-tight">{step.title}</h4>
                    <p className="text-xs text-brand-black/60 font-normal mt-1.5 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 3: DARK INTEGRATIONS SCREEN (Always Connected) */}
      <section className="py-20 bg-brand-black text-white px-6 relative overflow-hidden">
        {/* Subtle grid accent inside */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6 md:space-y-8 w-full">
          <div>
            <span className="text-[10px] font-semibold text-brand-green uppercase tracking-widest bg-brand-green/15 px-4 py-1.5 rounded-full border border-brand-green/20">Always Connected</span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-black uppercase leading-tight max-w-2xl mx-auto">Don&apos;t replace. Integrate.</h2>
          <p className="text-xs sm:text-sm md:text-base text-gray-400 max-w-xl mx-auto font-normal leading-relaxed">
            We understand the hassle of replacing the long used tools in your process. That&apos;s why we integrate SMS, GPS, and standard cellular networks seamlessly.
          </p>
          
          <div className="pt-2">
            <Link href="/register" className="inline-flex items-center gap-2.5 text-brand-green hover:text-brand-green/85 font-semibold text-xs uppercase tracking-widest bg-white/5 border border-white/10 px-6 py-3 rounded-full hover:bg-white/10 transition-all duration-200">
              <span>Start Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Icons Grid representing SMS/GPS integrations */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-10 md:pt-14 max-w-4xl mx-auto">
            {[
              { name: "SMS Feed", desc: "Globe / Smart", icon: MessageSquare },
              { name: "GPS Tracking", desc: "Satellite Map", icon: Compass },
              { name: "Advisories", desc: "Real-time feed", icon: MapIcon },
              { name: "Co-op Program", desc: "Fuel Support", icon: Anchor },
              { name: "Safety Alerts", desc: "Instant updates", icon: ShieldAlert },
              { name: "Port Status", desc: "Pier updates", icon: Users }
            ].map((item, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col items-center justify-between text-center group hover:bg-white/10 hover:border-brand-green/30 transition-all duration-200">
                <div className="p-2.5 rounded-xl bg-white/10 text-brand-green group-hover:scale-105 transition-transform duration-200 shadow-sm">
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="space-y-0.5 mt-3">
                  <span className="block text-[11px] font-bold text-white/95 uppercase tracking-wide">{item.name}</span>
                  <span className="block text-[9px] text-white/45 font-normal">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: BOTTOM CTA & FOOTER */}
      <section className="bg-brand-black text-white pt-24 pb-12 px-6 relative overflow-hidden flex flex-col gap-16">
        {/* Subtle grid accent */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none"></div>

        {/* Centered CTA */}
        <div className="max-w-3xl mx-auto text-center relative z-10 space-y-8">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-black uppercase leading-tight">Discover the full scale of Parola capabilities</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <button 
              onClick={() => router.push("/register")}
              className="bg-brand-green text-white px-8 py-4 rounded-full font-semibold text-xs uppercase tracking-widest hover:bg-brand-green/90 transition-all duration-300 shadow-md cursor-pointer"
            >
              Register Now
            </button>
            <button 
              onClick={() => router.push("/login")}
              className="bg-white text-brand-black px-8 py-4 rounded-full font-semibold text-xs uppercase tracking-widest hover:bg-gray-100 transition-all duration-300 shadow-sm cursor-pointer"
            >
              Log In
            </button>
          </div>
        </div>

        {/* Footer pinned to bottom of Section 5 */}
        <footer className="border-t border-white/5 pt-8 max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-6 relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <ParolaLogo iconOnly className="w-9 h-9 hover:scale-105 transition-transform" />
            <span className="font-display text-xl font-black tracking-tight text-white uppercase">Parola</span>
          </div>
          
          <div className="flex flex-wrap gap-6 md:gap-12 text-[11px] font-semibold uppercase tracking-wider text-white/70">
            <a href="#how-it-works" className="hover:text-brand-green transition-colors duration-250">Features & Tools</a>
          </div>

          <div className="text-[10px] text-white/35 font-normal tracking-wide">
            © {new Date().getFullYear()} Parola Fisheries System. All rights reserved.
          </div>
        </footer>
      </section>

    </div>
  );
}
