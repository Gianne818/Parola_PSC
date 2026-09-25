"use client";

import Link from "next/link";
import { AuthLayout } from "../../components/layouts/AuthLayout";
import {
  BookOpen,
  Ship,
  Sparkles,
  ArrowRight,
  Waves,
  Wind,
  Radio,
  Anchor,
} from "lucide-react";

const CARDS = [
  {
    href: "/resources/guide",
    icon: BookOpen,
    eyebrow: "9 practical lessons",
    title: "System Guide",
    desc: "Step-by-step walkthroughs from vessel registration to reading SMS advisories, tracking hotspots, and responding to safety holds.",
  },
  {
    href: "/resources/pricing",
    icon: Ship,
    eyebrow: "RA 8550 · Sec. 3(n)",
    title: "Tonnage Pricing",
    desc: "Single-vessel subscriptions by commercial tonnage class, daily zone quotas, fleet enterprise terms, and free-tier subsidies.",
  },
  {
    href: "/resources/about",
    icon: Sparkles,
    eyebrow: "Mission & architecture",
    title: "About Parola",
    desc: "Why SMS-first architecture matters at sea, core safety objectives, and alignment with BFAR and port safety workflows.",
  },
];

const QUICK_REF = [
  { icon: Waves, label: "Wave hold gate", value: "Hs > 1.5m" },
  { icon: Wind, label: "Wind caution", value: "< 20 kts safe" },
  { icon: Radio, label: "Emergency channel", value: "VHF Ch 16" },
  { icon: Anchor, label: "Advisory dispatch", value: "04:30 PHT" },
];

export default function ResourcesHubPage() {
  return (
    <AuthLayout>
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00B37E]/10 border border-[#00B37E]/25 text-[#00B37E] text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            <span>In-App Resources</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-[#12211E]">
            Resources
          </h1>
          <p className="text-sm text-[#12211E]/70 leading-relaxed max-w-2xl">
            Operational references you can open without leaving the app: the system guide,
            tonnage pricing, and the Parola mission brief.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="bg-white border border-[#DAE5E0] rounded-3xl p-6 flex flex-col justify-between gap-5 hover:border-[#00B37E]/50 hover:-translate-y-0.5 hover:shadow-md transition-all shadow-sm group"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#00B37E]/10 flex items-center justify-center text-[#00B37E]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#9A5B18]">
                      {card.eyebrow}
                    </div>
                    <h2 className="font-display font-extrabold text-lg text-[#12211E] group-hover:text-[#00B37E] transition-colors">
                      {card.title}
                    </h2>
                  </div>
                  <p className="text-xs text-[#12211E]/70 leading-relaxed">{card.desc}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00B37E]">
                  <span>Open</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            );
          })}
        </div>

        <div className="bg-white border border-[#DAE5E0] rounded-3xl p-5 md:p-6 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#12211E] mb-4">
            At-Sea Quick Reference
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {QUICK_REF.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="bg-[#F2F6F4] border border-[#DAE5E0] rounded-2xl p-3.5 space-y-1"
                >
                  <Icon className="w-4 h-4 text-[#00B37E]" />
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#12211E]/55">
                    {item.label}
                  </div>
                  <div className="text-sm font-display font-black text-[#12211E]">
                    {item.value}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
