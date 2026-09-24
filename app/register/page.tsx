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
  ShieldCheck,
  X,
  RefreshCw,
  UserPlus,
  AlertTriangle
} from "lucide-react";
import { useApp, getLocalRegisteredUsers } from "../../context/AppContext";
import { ParolaLogo } from "../../components/ui/ParolaLogo";

import dynamic from "next/dynamic";

const GalunggongMascot = dynamic(() => import("../../components/ui/GalunggongMascot"), {
  ssr: false,
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

export default function RegisterPage() {
  const router = useRouter();
  const { isInitialized, isAuthenticated, userProfile, logout, language, changeLanguage, register, showToast } = useApp();

  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('+63 ');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  // Mascot reactive animation states
  const [isTypingEmail, setIsTypingEmail] = useState(false);
  const [isTypingPassword, setIsTypingPassword] = useState(false);
  const [triggerSuccess, setTriggerSuccess] = useState(false);
  const [triggerFailure, setTriggerFailure] = useState(false);

  // Language Dropdown open state
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);


  // Background ripples state
  const [ripples, setRipples] = useState<Ripple[]>([]);

  // OTP Modal open state
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''));
  const [otpError, setOtpError] = useState('');
  const [countdown, setCountdown] = useState(60);



  // Show "already signed in" overlay instead of blindly redirecting —
  // lets the user choose to go to dashboard or register a new account.
  const [showAlreadyIn, setShowAlreadyIn] = useState(false);

  // If already authenticated, show overlay (don't auto-redirect)
  useEffect(() => {
    const justRegistered = typeof window !== "undefined" ? sessionStorage.getItem('just-registered') === 'true' : false;
    if (isInitialized && isAuthenticated && !justRegistered) {
      setShowAlreadyIn(true);
    }
  }, [isInitialized, isAuthenticated]);

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

  // Countdown timer for OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpModalOpen && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpModalOpen, countdown]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    setFormError('');

    const cleaned = phone.trim();
    const digitsOnly = cleaned.replace(/\D/g, '');

    if (!cleaned || digitsOnly.length < 10) {
      const msg = "Please enter a valid mobile phone number (e.g. +63 912 345 6789).";
      setTriggerFailure(true);
      setFormError(msg);
      setTimeout(() => setTriggerFailure(false), 1500);
      return;
    }

    if (!password || password.length < 6) {
      const msg = "Password must be at least 6 characters long.";
      setTriggerFailure(true);
      setFormError(msg);
      setTimeout(() => setTriggerFailure(false), 1500);
      return;
    }

    setIsChecking(true);

    // Check if phone number is already registered in backend database
    try {
      const checkRes = await fetch(`/api/users/by-phone?phone_number=${encodeURIComponent(cleaned)}`).catch(() => null);
      setIsChecking(false);

      if (checkRes && checkRes.ok) {
        const data = await checkRes.json().catch(() => null);
        if (data && (data.id || data.phone_number)) {
          const errorMsg = "An account with this phone number already exists. Please sign in instead.";
          setTriggerFailure(true);
          setFormError(errorMsg);
          setTimeout(() => setTriggerFailure(false), 1500);
          return;
        }
      }
    } catch (err) {
      setIsChecking(false);
      console.warn("User existence check warning:", err);
    }

    localStorage.setItem('profile-phone', cleaned);

    // For registration, open the Verification Modal
    setTriggerSuccess(true);
    setOtpDigits(Array(6).fill(''));
    setOtpError('');
    setCountdown(60);
    setOtpModalOpen(true);
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value && !/^\d+$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    setOtpError('');

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyOtp = async (e?: React.SyntheticEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    const enteredOtp = otpDigits.join('');

    if (enteredOtp.length < 6) {
      setTriggerFailure(true);
      setOtpError('Please enter all 6 digits.');
      setTimeout(() => setTriggerFailure(false), 1500);
      return;
    }

    if (enteredOtp !== '482910' && enteredOtp !== '123456') {
      setTriggerFailure(true);
      setOtpError('Incorrect verification code. Please enter 482910.');
      setTimeout(() => setTriggerFailure(false), 1500);
      return;
    }

    try {
      const result = await register({
        phone: phone.trim(),
        vesselName: phone.trim(),
        licenseNo: `FL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      }, password);

      if (result.ok) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem('just-registered', 'true');
        }
        setTriggerSuccess(true);
        setOtpModalOpen(false);
        router.push("/onboarding");
      } else {
        setTriggerFailure(true);
        setOtpError(result.error || "Registration failed. Please try again.");
        setTimeout(() => setTriggerFailure(false), 1500);
      }
    } catch (err: any) {
      setTriggerFailure(true);
      setOtpError(err?.message || "Registration failed. Please try again.");
      setTimeout(() => setTriggerFailure(false), 1500);
    }
  };

  const handleResendOtp = () => {
    if (countdown > 0) return;
    setCountdown(60);
    setOtpDigits(Array(6).fill(''));
    setOtpError('');
  };

  const activeLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  // Already signed-in gate — shown as overlay instead of instant redirect
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
            <UserPlus className="w-4 h-4" />
            Continue to Dashboard
          </button>
          <button
            onClick={() => {
              logout();
              setShowAlreadyIn(false);
            }}
            className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-black text-xs uppercase tracking-widest py-3.5 rounded-2xl transition active:scale-95 cursor-pointer"
          >
            Register a New Account
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/auth-bg.jpeg"
        alt="Parola Lighthouse Coastline"
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
      <div className="absolute top-6 right-6 z-30">
        <div className="relative">
          <button
            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
            className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/60 shadow-sm hover:shadow-md transition-all text-xs font-bold text-brand-black cursor-pointer"
          >
            <span className="text-sm leading-none">{activeLang.flag}</span>
            <span>{activeLang.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-brand-black/40" />
          </button>

          {langDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden py-1.5 z-50">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
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

        {/* Register Card */}
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
                  Cooperative Registration
                </div>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-brand-green/10 text-brand-green font-bold text-[10px] uppercase tracking-wider rounded-full border border-brand-green/20">
              <Anchor className="w-3.5 h-3.5" />
              <span>Co-op Portal</span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-brand-black uppercase tracking-tight mb-1.5">
            Register Account
          </h2>
          <p className="text-xs sm:text-sm text-brand-black/60 font-semibold mb-6">
            Access high-yield fish hotspots and automated marine safety alerts.
          </p>

          {formError && (
            <div className="mb-5 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 text-xs font-bold animate-in fade-in zoom-in-95">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{formError}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {/* Phone Input with prefilled country code */}
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
                  placeholder="•••••••• (min 6 chars)"
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

            {/* Language Selection Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-brand-black/70 font-extrabold text-[11px] uppercase tracking-wider ml-1">
                System Translation Profile
              </label>
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => {
                    const code = e.target.value as typeof language;
                    changeLanguage(code);
                  }}
                  className="w-full bg-gray-50/80 border border-gray-200/90 pl-14 pr-10 py-3.5 rounded-2xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green transition-all font-bold appearance-none cursor-pointer text-brand-black"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
                <Globe className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-brand-black/40 pointer-events-none" />
                <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-brand-black/40 pointer-events-none" />
              </div>
            </div>

            {/* CTA Primary */}
            <button
              type="submit"
              disabled={isChecking}
              className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-bold uppercase tracking-wider py-3.5 sm:py-4 rounded-2xl transition-all duration-150 mt-4 shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-50"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                  <span>Verifying Phone...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4.5 h-4.5" />
                  <span>Register & Verify</span>
                </>
              )}
            </button>
          </form>

          {/* Switch Mode */}
          <p className="mt-5 text-center text-brand-black/70 font-semibold text-xs sm:text-sm">
            Already registered?{" "}
            <Link
              href="/login"
              className="text-brand-green hover:underline font-black uppercase tracking-wider ml-1"
            >
              Sign In
            </Link>
          </p>
        </div>

      </div>


      {/* OTP VERIFICATION MODAL */}
      {otpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/65 backdrop-blur-sm">
          <div className="bg-brand-black text-white rounded-[2rem] w-full max-w-lg border border-white/10 shadow-2xl overflow-hidden animate-in fade-in duration-200">

            {/* Modal Header */}
            <div className="px-7 py-5 bg-white/5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-brand-green/20 text-brand-green flex items-center justify-center border border-brand-green/30">
                  <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-display font-black uppercase tracking-tight text-base">Security Pin Required</h3>
                  <p className="text-xs font-bold text-white/50 uppercase tracking-widest mt-0.5">Dual-Factor Verification</p>
                </div>
              </div>
              <button
                onClick={() => setOtpModalOpen(false)}
                className="text-white/50 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-7 space-y-6">

              {/* SMS Broadcast Simulation Banner */}
              <div className="bg-brand-green/10 border border-brand-green/25 rounded-2xl p-4 flex flex-col items-center text-center">
                <span className="text-xs font-black text-brand-green uppercase tracking-widest leading-none mb-1.5">SIMULATED SATELLITE BROADCAST</span>
                <p className="text-base font-black text-white tracking-wide">
                  &ldquo;Your Parola verification code is <span className="text-brand-green font-display text-lg tracking-widest underline decoration-2 decoration-brand-green/40">482910</span>&rdquo;
                </p>
              </div>

              <div className="space-y-2.5">
                <label className="block text-white/60 font-black text-xs uppercase tracking-widest text-center">
                  Monospace 6-Digit Code
                </label>

                {/* Monospace centered OTP inputs */}
                <div className="grid grid-cols-6 gap-2.5 max-w-sm mx-auto">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-input-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, idx)}
                      onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                      className="w-full h-14 bg-white/5 border border-white/10 rounded-xl text-center text-xl font-black text-white focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all font-mono"
                      required
                    />
                  ))}
                </div>

                {otpError && (
                  <p className="text-center text-xs font-bold text-brand-red mt-2">{otpError}</p>
                )}
              </div>

              {/* Confirm Action */}
              <button
                onClick={handleVerifyOtp}
                className="w-full bg-brand-green text-white font-black text-sm uppercase tracking-widest py-4 rounded-xl hover:bg-brand-green/90 transition-all cursor-pointer text-center shadow-lg hover:shadow-xl"
              >
                Confirm Verification Code
              </button>

              {/* Resend actions */}
              <div className="flex justify-between items-center text-xs text-white/50 font-bold border-t border-white/10 pt-4">
                <button
                  onClick={handleResendOtp}
                  disabled={countdown > 0}
                  className={`flex items-center gap-1.5 uppercase tracking-wider transition-colors ${countdown > 0 ? 'text-white/20 cursor-not-allowed' : 'text-brand-green hover:text-brand-green/90 cursor-pointer'
                    }`}
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Resend SMS Code</span>
                </button>
                <span>
                  {countdown > 0 ? `RESEND IN ${countdown}S` : 'READY TO RESEND'}
                </span>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}