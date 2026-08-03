"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  Eye, 
  EyeOff, 
  Globe, 
  ArrowLeft, 
  Smartphone, 
  KeyRound, 
  Anchor, 
  Check, 
  ChevronDown,
  LogIn
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { DemoBackground } from "../../components/ui/DemoBackground";
import { ParolaLogo } from "../../components/ui/ParolaLogo";

interface Ripple {
  id: number;
  x: number;
  y: number;
}

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'tl', name: 'Tagalog', flag: '🇵🇭' },
  { code: 'ceb', name: 'Cebuano', flag: '🇵🇭' },
  { code: 'hil', name: 'Hiligaynon', flag: '🇵🇭' }
] as const;

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, language, changeLanguage, login } = useApp();
  
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('+63 ');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Language Dropdown open state
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  // Background ripples state
  const [ripples, setRipples] = useState<Ripple[]>([]);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  // Handle click on background to spawn water ripple
  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Avoid spawning ripples when clicking interactive elements
    if ((e.target as HTMLElement).closest('button, input, a, select')) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newRipple: Ripple = {
      id: Date.now() + Math.random(),
      x,
      y
    };
    setRipples(prev => [...prev, newRipple]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 800);
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !password) return;
    setLoading(true);

    setTimeout(() => {
      // Standard login check
      const ok = login(phone.trim(), password);
      setLoading(false);
      if (ok) {
        router.push("/dashboard");
      }
    }, 1000);
  };

  const activeLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  return (
    <div 
      onClick={handleBackgroundClick}
      className="min-h-screen bg-brand-offwhite flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden font-sans antialiased select-none cursor-default"
    >
      {/* Interactive Water Ripples */}
      {ripples.map(ripple => (
        <div 
          key={ripple.id}
          className="ripple-circle"
          style={{ left: ripple.x, top: ripple.y }}
        />
      ))}

      {/* Green Grid Background */}
      <DemoBackground />

      {/* Back to Landing Link */}
      <div className="absolute top-6 left-6 z-20">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-brand-black/60 hover:text-brand-black font-bold text-xs tracking-wider uppercase transition-all bg-white/85 backdrop-blur-md px-4.5 py-2.5 rounded-full border border-gray-200/80 shadow-sm hover:shadow-md"
        >
          <ArrowLeft className="w-4 h-4 text-brand-green" />
          <span>Landing</span>
        </Link>
      </div>

      {/* Top-Right Floating Language Selector Pill */}
      <div className="absolute top-6 right-6 z-30">
        <div className="relative">
          <button 
            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
            className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-full border border-gray-200 shadow-sm hover:shadow-md transition-all text-xs font-bold text-brand-black cursor-pointer"
          >
            <span className="text-sm leading-none">{activeLang.flag}</span>
            <span>{activeLang.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-brand-black/40" />
          </button>

          {langDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden py-1.5 z-50">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => {
                    changeLanguage(lang.code);
                    setLangDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-left hover:bg-gray-50 transition-colors cursor-pointer ${
                    language === lang.code ? 'text-brand-green bg-brand-green/5' : 'text-brand-black/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base leading-none">{lang.flag}</span>
                    <span>{lang.name}</span>
                  </div>
                  {language === lang.code && <Check className="w-4 h-4 text-brand-green stroke-[2.5]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Page Header (Above the Card) */}
      <div className="flex flex-col items-center text-center max-w-xl w-full mb-6 relative z-10">
        <div className="flex items-center gap-2 px-3 py-1 bg-brand-green/10 text-brand-green font-bold text-[10px] uppercase tracking-widest rounded-full mb-3 border border-brand-green/15">
          <Anchor className="w-3.5 h-3.5 animate-pulse" />
          <span>PAROLA SATELLITE SYSTEM</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-black text-brand-black uppercase tracking-tight leading-none mb-2">
          Fisherman Portal
        </h1>
        <p className="text-xs text-brand-black/50 font-bold max-w-sm">
          Sailing coordinates, safety advisories, and shared diesel pools.
        </p>
      </div>

      {/* Main split-card with elegant shadow */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-white/95 backdrop-blur-md rounded-3xl shadow-[0_30px_70px_-15px_rgba(0,0,0,0.15)] flex flex-col md:flex-row overflow-hidden relative z-10 transition-all duration-300"
      >
        
        {/* LEFT COMPONENT: The Interactive Login Form */}
        <div className="w-full md:w-[55%] p-8 md:p-10 lg:p-12 flex flex-col justify-center">
          <div className="w-full max-w-md mx-auto">
            
            <div className="mb-6 flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-150/40 w-max">
              <ParolaLogo iconOnly className="w-6 h-6 shadow-sm hover:scale-105 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-black/50">MUNICIPAL PORT BASE</span>
            </div>

            <h2 className="text-2xl font-display font-extrabold text-brand-black uppercase tracking-tight mb-6">
              Sign In
            </h2>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              
              {/* Phone Input with prefilled country code */}
              <div className="space-y-1.5">
                <label className="block text-brand-black/50 font-black text-[10px] uppercase tracking-wider ml-1">
                  Mobile Phone Number
                </label>
                <div className="relative">
                  <input 
                    type="tel" 
                    inputMode="tel"
                    placeholder="+63 900 000 0000"
                    value={phone}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (!val.startsWith('+63')) {
                        val = '+63 ' + val.replace(/^\+63\s*/, '');
                      }
                      setPhone(val);
                    }}
                    className="w-full bg-gray-50/60 border border-gray-200 pl-14 pr-6 py-3.5 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all font-semibold"
                    required
                  />
                  <Smartphone className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-brand-black/30" />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="block text-brand-black/50 font-black text-[10px] uppercase tracking-wider ml-1">
                  Secure Password
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50/60 border border-gray-200 pl-14 pr-14 py-3.5 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all font-semibold"
                    required
                  />
                  <KeyRound className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-brand-black/30" />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-black/50 hover:text-brand-black p-2 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* CTA Primary with active scale-down press effect */}
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-brand-green hover:bg-brand-green/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-widest py-4 rounded-2xl transition-all duration-150 mt-6 shadow-md hover:shadow-lg active:scale-[0.97] cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* Switch Mode */}
            <p className="mt-6 text-center text-brand-black/60 font-semibold text-xs">
              Don&apos;t have an account?{" "}
              <Link 
                href="/register" 
                className="text-brand-green hover:underline font-black uppercase tracking-wider ml-1"
              >
                Register
              </Link>
            </p>

          </div>
        </div>

        {/* RIGHT COMPONENT: Illustration */}
        <div className="hidden md:block md:w-[45%] relative self-stretch">
          <Image 
            src="https://picsum.photos/seed/fishing_boat_hero_1784737256028/600/900" 
            alt="Parola Maritime Security" 
            fill
            sizes="40vw"
            priority
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-black/80 via-brand-black/30 to-transparent"></div>
          <div className="absolute bottom-8 left-8 right-8 text-white space-y-2 pointer-events-none">
            <span className="text-[9px] font-black tracking-widest text-brand-green bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 uppercase">Philippine Coastal Safety</span>
            <h3 className="text-xl font-display font-black uppercase">Guard the Horizon</h3>
            <p className="text-[11px] text-white/70 leading-relaxed font-semibold">Join thousands of municipal fishermen receiving automated PAGASA satellite safety reports and joint fuel pricing.</p>
          </div>
        </div>

      </div>

    </div>
  );
}
