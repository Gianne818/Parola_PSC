"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Globe, MessageSquareWarning } from "lucide-react";
import { ParolaLogo } from "../ui/ParolaLogo";
import { useApp } from "../../context/AppContext";
import { useTranslation } from "../../hooks/use-translation";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { isAuthenticated, logout, language, changeLanguage, theme, toggleTheme } = useApp();
  const { t } = useTranslation(language);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const languages = [
    { code: "en", label: "English 🇺🇸" },
    { code: "tl", label: "Tagalog 🇵🇭" },
    { code: "ceb", label: "Cebuano 🇵🇭" },
    { code: "hil", label: "Hiligaynon 🇵🇭" },
  ] as const;

  return (
    <header className="sticky top-0 left-0 right-0 h-16 bg-white/45 dark:bg-[#12211E]/45 backdrop-blur-md border-b border-gray-100 dark:border-teal-950 z-40 transition-colors">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-4 md:px-8">
        <Link href="/" className="hover:opacity-90 transition">
          <ParolaLogo className="w-8 h-8" />
        </Link>

        {/* Action items */}
        <div className="flex items-center gap-4">
          {/* Quick Language Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-teal-900 bg-white dark:bg-[#12211E] hover:bg-gray-50 dark:hover:bg-teal-950 text-xs font-bold transition select-none text-gray-700 dark:text-gray-200"
            >
              <Globe className="w-4 h-4 text-brand-green" />
              <span className="uppercase">{language}</span>
            </button>

            {langDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setLangDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-[#12211E] border border-gray-100 dark:border-teal-950 rounded-2xl shadow-xl py-2 z-20 overflow-hidden animate-fade-in">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        changeLanguage(lang.code);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors hover:bg-gray-50 dark:hover:bg-teal-950 flex items-center justify-between ${
                        language === lang.code
                          ? "text-brand-green bg-brand-green/5"
                          : "text-gray-700 dark:text-gray-200"
                      }`}
                    >
                      <span>{lang.label}</span>
                      {language === lang.code && (
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-green" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Theme switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full border border-gray-200 dark:border-teal-900 bg-white dark:bg-[#12211E] hover:bg-gray-50 dark:hover:bg-teal-950 text-gray-500 dark:text-gray-200 transition text-xs"
            aria-label="Toggle theme"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>

          {/* Navigation links or CTA depending on Authentication status */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="hidden md:inline-flex items-center justify-center bg-brand-green hover:bg-brand-green/90 text-white text-xs font-black uppercase tracking-wider px-5 h-10 rounded-full transition shadow-sm"
              >
                Go to Dashboard
              </Link>
              <button
                onClick={logout}
                className="flex items-center justify-center gap-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 border border-rose-100 dark:border-rose-900/30 text-xs font-bold px-3 py-1.5 rounded-full transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t("logout")}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-gray-700 dark:text-gray-200 hover:text-brand-green dark:hover:text-brand-green text-xs font-black uppercase tracking-wider px-3 py-2 transition"
              >
                {t("login")}
              </Link>
              <Link
                href="/register"
                className="bg-brand-green hover:bg-brand-green/90 text-white text-xs font-black uppercase tracking-widest px-5 h-10 rounded-full transition flex items-center justify-center shadow-md active:scale-95"
              >
                {t("register")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
export default Navbar;
