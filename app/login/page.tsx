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
  Globe,
  AlertTriangle
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { ParolaLogo } from "../../components/ui/ParolaLogo";
import Image from "next/image";

import dynamic from "next/dynamic";

const GalunggongMascot = dynamic(() => import("../../components/ui/GalunggongMascot"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-3xl bg-white/10 animate-pulse" aria-label="Loading mascot" />
  ),
});

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
  const { isInitialized, isAuthenticated, userProfile, logout, language, changeLanguage, login } = useApp();

  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('+63 ');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  // Mascot reactive animation states
  const [isTypingEmail, setIsTypingEmail] = useState(false);
  const [isTypingPassword, setIsTypingPassword] = useState(false);
  const [triggerSuccess, setTriggerSuccess] = useState(false);
  const [triggerFailure, setTriggerFailure] = useState(false);

  // Language Dropdown open state & ref for click outside
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Background ripples state
  const [ripples, setRipples] = useState<Ripple[]>([]);

  // Tracked timeouts so pending callbacks never fire after unmount
  const timeoutsRef = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timeoutsRef.current.push(id);
  };
  useEffect(() => {
    const pending = timeoutsRef.current;
    return () => {
      pending.forEach((id) => clearTimeout(id));
      timeoutsRef.current = [];
    };
  }, []);

  // Show "already signed in" overlay instead of blindly redirecting
  const [showAlreadyIn, setShowAlreadyIn] = useState(false);

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      setShowAlreadyIn(true);
    }
  }, [isInitialized, isAuthenticated]);

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
    later(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 800);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleaned = phone.trim();
    const digitsOnly = cleaned.replace(/\D/g, '');

    if (!cleaned || digitsOnly.length < 10) {
      setTriggerFailure(true);
      setFormError('Please enter a valid mobile phone number (e.g. +63 912 345 6789).');
      later(() => setTriggerFailure(false), 1500);
      return;
    }

    if (!password) {
      setTriggerFailure(true);
      setFormError('Please enter your password.');
      later(() => setTriggerFailure(false), 1500);
      return;
    }

    setLoading(true);
    const result = await login(cleaned, password);
    setLoading(false);

    if (result.ok) {
      setTriggerSuccess(true);
      later(() => {
        router.push("/dashboard");
      }, 700);
    } else {
      setTriggerFailure(true);
      setFormError(result.error || "Sign in failed. Please check your credentials.");
      later(() => setTriggerFailure(false), 1500);
    }
  };

  const activeLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  // Already signed-in gate
  if (showAlreadyIn) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans antialiased">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />
        <div className="relative z-10 w-full max-w-sm bg-white border border-gray-100 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-8 flex flex-col items-center text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center">
            <Anchor className="w-8 h-8 text-brand-green" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Active Session</p>
            <h2 className="text-xl font-display font-black text-slate-900 uppercase tracking-tight">
              Already Signed In
            </h2>
            <p className="text-sm text-gray-500 font-medium mt-1.5 leading-snug">
              You are signed in as <span className="font-black text-slate-800">{userProfile?.phone || 'Captain'}</span>.
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-2xl transition shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            Continue to Dashboard
          </button>
          <button
            onClick={() => {
              logout();
              setShowAlreadyIn(false);
            }}
            className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-black text-xs uppercase tracking-widest py-3.5 rounded-2xl transition active:scale-95 cursor-pointer"
          >
            Sign In as Different Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleBackgroundClick}
      className="min-h-screen relative flex flex-col justify-center items-center p-4 sm:p-6 md:p-10 overflow-hidden font-sans antialiased select-none cursor-default"
    >
      {/* 1. Full-Bleed Panoramic Background Image */}
      <Image
        src="/images/auth-bg.jpeg"
        alt="Parola Lighthouse Coastline"
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 w-full h-full object-cover object-left md:object-center pointer-events-none select-none z-0"
      />

      {/* Subtle Ambient Contrast Vignette */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-black/25 via-transparent to-brand-black/35 pointer-events-none z-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-black/30 via-transparent to-black/10 pointer-events-none z-0" />

      {/* Interactive Water Ripples */}
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          className="ripple-circle z-10"
          style={{ left: ripple.x, top: ripple.y }}
        />
      ))}

      {/* Top Navigation: Back to Landing Link */}
      <div className="absolute top-6 left-6 z-30">
        <Link
          href="/"
          className="flex items-center gap-2 text-brand-black/80 hover:text-brand-black font-bold text-xs tracking-wider uppercase transition-all bg-white/90 backdrop-blur-md px-4.5 py-2.5 rounded-full border border-white/60 shadow-sm hover:shadow-md"
        >
          <ArrowLeft className="w-4 h-4 text-brand-green" />
          <span>Landing</span>
        </Link>
      </div>

      {/* Top Navigation: Floating Language Selector Pill */}
      <div className="absolute top-6 right-6 z-30" ref={dropdownRef}>
        <div className="relative">
          <button
            type="button"
            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
            aria-expanded={langDropdownOpen}
            className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/60 shadow-sm hover:shadow-md transition-all text-xs font-bold text-brand-black cursor-pointer"
          >
            <span className="text-sm leading-none">{activeLang.flag}</span>
            <span>{activeLang.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-brand-black/40" />
          </button>

          {langDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
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

      {/* 2. Galunggong Mascot Standing on the Grassy Cliff Beside the Lighthouse */}
      <div className="hidden lg:flex flex-col items-center absolute bottom-[19%] xl:bottom-[20%] 2xl:bottom-[21%] left-[28%] xl:left-[28%] 2xl:left-[28%] -translate-x-1/2 z-20 pointer-events-auto">
        <div className="w-80 h-80 xl:w-[24rem] xl:h-[24rem] 2xl:w-[28rem] 2xl:h-[28rem] relative">
          <GalunggongMascot
            isTypingEmail={isTypingEmail}
            isTypingPassword={isTypingPassword}
            triggerSuccess={triggerSuccess}
            triggerFailure={triggerFailure}
            className="w-full h-full"
          />
        </div>
        {/* Soft ground contact shadow */}
        <div className="w-52 xl:w-64 2xl:w-72 h-5 bg-brand-black/35 rounded-full blur-md -mt-3 pointer-events-none" />
      </div>

      {/* 3. Main Content Container (Positions the card on the right on desktop to showcase the scene) */}
      <div className="relative z-20 w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-end px-4 sm:px-6 lg:px-8 py-8">

        {/* Auth Card */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md xl:max-w-lg bg-white/95 backdrop-blur-xl border border-white/70 rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.22)] p-7 sm:p-9 lg:p-10 flex flex-col transition-all duration-300"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <ParolaLogo className="w-9 h-9" />
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-brand-green">
                  PAROLA
                </div>
                <div className="text-xs font-bold text-gray-500">
                  Fisheries Safe Haven
                </div>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-brand-green/10 text-brand-green font-bold text-[10px] uppercase tracking-wider rounded-full border border-brand-green/20">
              <Anchor className="w-3.5 h-3.5 animate-pulse" />
              <span>Live Radar</span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-brand-black uppercase tracking-tight mb-1.5">
            Sign In
          </h2>
          <p className="text-xs sm:text-sm text-brand-black/60 font-semibold mb-6">
            Enter your mobile credentials to access radar advisories and market prices.
          </p>

          {formError && (
            <div className="mb-5 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 text-xs font-bold animate-in fade-in zoom-in-95">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{formError}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {/* Phone Input */}
            <div className="space-y-1.5">
              <label className="block text-brand-black/70 font-extrabold text-[11px] uppercase tracking-wider ml-1">
                Mobile Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder="+63 900 000 0000"
                  value={phone}
                  onFocus={() => {
                    setIsTypingEmail(true);
                    setIsTypingPassword(false);
                  }}
                  onBlur={() => setIsTypingEmail(false)}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (!val.startsWith('+63')) {
                      val = '+63 ' + val.replace(/^\+63\s*/, '');
                    }
                    setPhone(val);
                    if (formError) setFormError('');
                  }}
                  className="w-full bg-gray-50/80 border border-gray-200/90 pl-14 pr-4 py-3.5 rounded-2xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green transition-all font-semibold"
                  required
                />
                <Smartphone className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-brand-black/40" />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="block text-brand-black/70 font-extrabold text-[11px] uppercase tracking-wider ml-1">
                Secure Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onFocus={() => {
                    setIsTypingPassword(true);
                    setIsTypingEmail(false);
                  }}
                  onBlur={() => setIsTypingPassword(false)}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (formError) setFormError('');
                  }}
                  className="w-full bg-gray-50/80 border border-gray-200/90 pl-14 pr-12 py-3.5 rounded-2xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green transition-all font-semibold"
                  required
                />
                <KeyRound className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-brand-black/40" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-black/40 hover:text-brand-black p-1.5 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-green hover:bg-brand-green/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold uppercase tracking-wider py-3.5 sm:py-4 rounded-2xl transition-all duration-150 mt-4 shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4.5 h-4.5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Account Switch Prompt */}
          <p className="mt-5 text-center text-brand-black/70 font-semibold text-xs sm:text-sm">
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

    </div>
  );
}
