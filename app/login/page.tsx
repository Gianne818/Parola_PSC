"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Smartphone,
  KeyRound,
  Anchor,
  Check,
  ChevronDown,
  LogIn,
  Globe
} from "lucide-react";
import { useApp } from "../../context/AppContext";
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
  const { isInitialized, isAuthenticated, language, changeLanguage, login } = useApp();

  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('+63 ');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Language Dropdown open state & ref for click outside
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Background ripples state
  const [ripples, setRipples] = useState<Ripple[]>([]);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isInitialized, isAuthenticated, router]);

  // Handle outside click to close language dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle click on background to spawn water ripple
  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
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
      className="min-h-screen bg-white flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden font-sans antialiased select-none cursor-default"
    >
      {/* Interactive Water Ripples */}
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          className="ripple-circle"
          style={{ left: ripple.x, top: ripple.y }}
        />
      ))}

      {/* Subtle Light Grid Overlay (Replaces Dark DemoBackground) */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />

      {/* Back to Landing Link */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="flex items-center gap-2 text-brand-black/60 hover:text-brand-black font-bold text-xs tracking-wider uppercase transition-all bg-white px-4.5 py-2.5 rounded-full border border-gray-200 shadow-sm hover:shadow-md"
        >
          <ArrowLeft className="w-4 h-4 text-brand-green" />
          <span>Landing</span>
        </Link>
      </div>

      {/* Top-Right Floating Language Selector Pill */}
      <div className="absolute top-6 right-6 z-30" ref={dropdownRef}>
        <div className="relative">
          <button
            type="button"
            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
            aria-expanded={langDropdownOpen}
            className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-full border border-gray-200 shadow-sm hover:shadow-md transition-all text-xs font-bold text-brand-black cursor-pointer"
          >
            <span className="text-sm leading-none">{activeLang.flag}</span>
            <span>{activeLang.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-brand-black/40" />
          </button>

          {langDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    changeLanguage(lang.code);
                    setLangDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-left hover:bg-gray-50 transition-colors cursor-pointer ${language === lang.code ? 'text-brand-green bg-brand-green/5' : 'text-brand-black/80'
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

      {/* Page Header (Above Card) */}
      <div className="flex flex-col items-center text-center max-w-2xl w-full mb-6 relative z-10">
        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-brand-green/10 text-brand-green font-bold text-xs uppercase tracking-widest rounded-full mb-3 border border-brand-green/15">
          <Anchor className="w-4 h-4 animate-pulse" />
          <span>PAROLA SATELLITE SYSTEM</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-display font-black text-brand-black uppercase tracking-tight leading-none mb-2">
          Fisherman Portal
        </h1>
        <p className="text-sm text-brand-black/60 font-semibold max-w-md">
          Sailing coordinates, safety advisories, and shared diesel pools.
        </p>
      </div>

      {/* Main Elevated White Card with Soft Drop Shadow */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl bg-white border border-gray-100 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] flex flex-col md:flex-row overflow-hidden relative z-10 transition-all duration-300"
      >

        {/* LEFT PANEL: Interactive Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-14 flex flex-col justify-center bg-white">
          <div className="w-full max-w-lg mx-auto">

            <div className="mb-6 flex items-center gap-2 bg-gray-50 px-3.5 py-1.5 rounded-full border border-gray-150/45 w-max">
              <ParolaLogo iconOnly className="w-6 h-6 shadow-sm hover:scale-105 transition-transform" />
              <span className="text-xs font-black uppercase tracking-widest text-brand-black/50">MUNICIPAL PORT BASE</span>
            </div>

            <h2 className="text-3xl font-display font-extrabold text-brand-black uppercase tracking-tight mb-6">
              Sign In
            </h2>

            <form onSubmit={handleAuthSubmit} className="space-y-5">

              {/* Phone Input */}
              <div className="space-y-2">
                <label className="block text-brand-black/60 font-extrabold text-xs uppercase tracking-wider ml-1">
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
                    className="w-full bg-gray-50 border border-gray-200 pl-14 pr-6 py-4 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green transition-all font-semibold"
                    required
                  />
                  <Smartphone className="w-5.5 h-5.5 absolute left-5 top-1/2 -translate-y-1/2 text-brand-black/35" />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="block text-brand-black/60 font-extrabold text-xs uppercase tracking-wider ml-1">
                  Secure Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 pl-14 pr-14 py-4 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green transition-all font-semibold"
                    required
                  />
                  <KeyRound className="w-5.5 h-5.5 absolute left-5 top-1/2 -translate-y-1/2 text-brand-black/35" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-black/50 hover:text-brand-black p-2 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Primary Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-green hover:bg-brand-green/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold uppercase tracking-wider py-4 rounded-2xl transition-all duration-150 mt-6 shadow-md hover:shadow-lg active:scale-[0.97] cursor-pointer flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* Account Switch Prompt */}
            <p className="mt-6 text-center text-brand-black/70 font-semibold text-sm">
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

        {/* RIGHT PANEL: Hero Illustration / Dark Brand Showcase */}
        <div className="hidden md:flex md:w-1/2 bg-brand-black text-white p-8 lg:p-12 flex-col justify-between relative overflow-hidden self-stretch">
          {/* Ambient Glow Effects */}
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-brand-green/20 rounded-full blur-[80px] pointer-events-none z-0" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-brand-green/10 rounded-full blur-[80px] pointer-events-none z-0" />

          <div className="relative z-10 flex flex-col items-center text-center mt-8 space-y-4">
            <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-brand-green/10 border border-brand-green/20 shadow-inner">
              <div className="absolute w-20 h-20 rounded-full border border-brand-green/25 animate-radar-ping" />
              <div className="absolute w-16 h-16 rounded-full border border-brand-green/45 animate-pulse" />
              <Globe className="w-10 h-10 text-brand-green relative z-10" />
            </div>

            <div className="bg-brand-green/10 border border-brand-green/20 text-brand-green px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase">
              Philippine Coastal Safety
            </div>
          </div>

          <div className="relative z-10 space-y-4">
            <h3 className="text-3xl font-display font-black tracking-tight text-white uppercase leading-tight">
              Guard the Horizon
            </h3>
            <p className="text-sm text-white/80 leading-relaxed font-medium">
              Join thousands of municipal fishermen receiving automated PAGASA satellite safety reports and joint fuel pricing.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}