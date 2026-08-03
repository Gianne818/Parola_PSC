"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Fuel,
  Bell,
  User,
  Settings,
  Map,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useTranslation } from "../../hooks/use-translation";
import { ParolaLogo } from "../ui/ParolaLogo";
import { BottomNav } from "./BottomNav";
import { getFontScaleClass } from "../../utils/fontScale";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const {
    isAuthenticated,
    logout,
    language,
    fontScale,
    notifications,
    theme,
    toggleTheme
  } = useApp();
  
  const { t } = useTranslation(language);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsMounted(true);
      // Read sidebar state on load
      const saved = localStorage.getItem("sidebar-collapsed");
      if (saved) {
        setIsCollapsed(saved === "true");
      }
    }, 0);
  }, []);

  // Sync auth state
  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      router.push("/login");
    }
  }, [isMounted, isAuthenticated, router]);

  if (!isMounted) return null;
  if (!isAuthenticated) return null; // Let the redirect trigger

  const toggleSidebar = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: t("dashboard") },
    { href: "/map", icon: Map, label: "Map View" },
    { href: "/fuel", icon: Fuel, label: t("fuel") },
    { href: "/notifications", icon: Bell, label: t("alerts"), badge: true },
    { href: "/profile", icon: User, label: t("profile") },
    { href: "/settings", icon: Settings, label: t("settings") },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className={`min-h-screen flex flex-col bg-[#F7FAF9] dark:bg-[#12211E]/95 text-gray-800 dark:text-[#F7FAF9] ${getFontScaleClass(fontScale)} transition-colors duration-300`}>
      
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 left-0 right-0 h-14 bg-white dark:bg-[#12211E] border-b border-gray-100 dark:border-teal-950 flex items-center justify-between px-4 z-40 shadow-sm">
        <ParolaLogo className="w-7 h-7" />
        <button
          onClick={logout}
          className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 border border-rose-100 dark:border-rose-900/30 text-[10px] font-black uppercase tracking-wider px-3 h-8 rounded-full transition"
        >
          <LogOut className="w-3 h-3" />
          <span>{t("logout")}</span>
        </button>
      </header>

      {/* Main Grid Wrapper */}
      <div className="flex-1 flex relative">
        
        {/* Desktop Left Sidebar */}
        <aside
          className={`hidden md:flex flex-col border-r border-gray-100 dark:border-teal-950 bg-white dark:bg-[#12211E] relative transition-all duration-300 z-35 ${
            isCollapsed ? "w-20" : "w-64"
          }`}
        >
          {/* Collapse toggle pill right edge */}
          <button
            onClick={toggleSidebar}
            className="absolute top-6 -right-3 w-6 h-6 rounded-full border border-gray-200 dark:border-teal-900 bg-white dark:bg-[#12211E] hover:bg-gray-50 dark:hover:bg-teal-950 flex items-center justify-center text-gray-400 hover:text-gray-600 transition shadow-sm z-40 cursor-pointer"
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>

          {/* Logo Brand Header */}
          <div className={`p-6 border-b border-gray-100 dark:border-teal-950 flex items-center ${isCollapsed ? "justify-center" : "justify-start"}`}>
            <ParolaLogo className="w-8 h-8" iconOnly={isCollapsed} />
          </div>

          {/* Navigation Links Area */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center gap-3.5 h-11 px-4 rounded-full font-bold text-sm transition-all select-none relative group ${
                    isActive
                      ? "bg-brand-green/15 text-brand-green dark:bg-brand-green/20"
                      : "text-gray-600 hover:text-[#12211E] dark:text-gray-300 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-teal-950/40"
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 transition-transform ${isActive ? "scale-105" : ""}`} />
                  
                  {!isCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}

                  {/* Active navigation glow line */}
                  {isActive && !isCollapsed && (
                    <span className="absolute right-4 w-1.5 h-1.5 rounded-full bg-brand-green" />
                  )}

                  {/* Red Badge Alert */}
                  {item.badge && unreadCount > 0 && (
                    <span className={`absolute flex items-center justify-center bg-rose-600 text-white text-[9px] font-black rounded-full border border-white dark:border-[#12211E] ${
                      isCollapsed ? "top-2 right-2 w-4 h-4" : "right-10 px-1.5 h-4.5 min-w-4.5"
                    }`}>
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom logout area */}
          <div className="p-4 border-t border-gray-100 dark:border-teal-950 space-y-2">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 h-11 px-4 rounded-full font-bold text-sm text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-teal-950/40 transition select-none"
            >
              <span className="w-5 text-center">{theme === "light" ? "🌙" : "☀️"}</span>
              {!isCollapsed && <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>}
            </button>

            <button
              onClick={logout}
              className={`w-full flex items-center gap-3.5 h-11 px-4 rounded-full font-bold text-sm transition select-none ${
                isCollapsed
                  ? "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 justify-center"
                  : "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/25 justify-start"
              }`}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span>{t("logout")}</span>}
            </button>
          </div>
        </aside>

        {/* Content Panel Area */}
        <main className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
          <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl w-full mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Fixed Mobile Bottom Nav */}
      <BottomNav />
    </div>
  );
};
export default AuthLayout;
