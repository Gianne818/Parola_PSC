"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShieldAlert,
  Bell,
  User,
  Settings,
  Map,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
  BookOpen,
  Ship
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useTranslation } from "../../hooks/use-translation";
import { ParolaLogo } from "../ui/ParolaLogo";
import { BottomNav } from "./BottomNav";
import { getFontScaleClass } from "../../utils/fontScale";

interface AuthLayoutProps {
  children: React.ReactNode;
  fluid?: boolean;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, fluid = false }) => {
  const router = useRouter();
  const pathname = usePathname();
  const {
    isInitialized,
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

  useEffect(() => {
    // Read sidebar state on load
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  // Sync auth state
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/login");
    }
  }, [isInitialized, isAuthenticated, router]);

  if (!isInitialized) return null;
  if (!isAuthenticated) return null; // Let the redirect trigger

  const toggleSidebar = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: t("dashboard") },
    { href: "/alerts", icon: ShieldAlert, label: t("alerts") },
    { href: "/notifications", icon: Bell, label: t("notifications"), badge: true },
    { href: "/profile", icon: User, label: t("profile") },
    { href: "/settings", icon: Settings, label: t("settings") },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className={`min-h-screen flex flex-col bg-white text-gray-800 dark:text-[#F7FAF9] ${getFontScaleClass(fontScale)} transition-colors duration-300`}>
      
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 left-0 right-0 h-14 bg-brand-black border-b border-teal-950 flex items-center justify-between px-4 z-40 shadow-md">
        <div className="flex items-center gap-2">
          <div className="dark">
            <ParolaLogo className="w-7 h-7" />
          </div>
          {/* Live signal dots */}
          <span className="relative flex h-2 w-2 ml-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green"></span>
          </span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1 bg-brand-red/15 hover:bg-brand-red/25 text-brand-red border border-brand-red/20 text-[10px] font-bold uppercase tracking-wider px-3.5 h-8.5 rounded-full transition cursor-pointer"
        >
          <LogOut className="w-3 h-3" />
          <span>{t("logout")}</span>
        </button>
      </header>

      {/* Main Grid Wrapper */}
      <div className="flex-1 flex relative">
        
        {/* Desktop Left Sidebar */}
        <aside
          className={`hidden md:flex flex-col border-r border-gray-200 bg-white relative transition-all duration-300 z-35 ${
            isCollapsed ? "w-20" : "w-64"
          }`}
        >
          {/* Collapse toggle pill right edge */}
          <button
            onClick={toggleSidebar}
            className="absolute top-6 -right-3 w-6 h-6 rounded-full border border-[#00B37E] bg-white hover:bg-[#E5F7F3] flex items-center justify-center text-[#00B37E] transition shadow-sm z-40 cursor-pointer"
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>

          {/* Logo Brand Header */}
          <div className={`p-6 border-b border-gray-100 flex items-center ${isCollapsed ? "justify-center" : "justify-start"}`}>
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
                      ? "bg-[#E5F7F3] text-[#00B37E]"
                      : "text-gray-600 hover:text-[#12211E] hover:bg-gray-100/70"
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 transition-transform ${isActive ? "scale-105" : ""}`} />
                  
                  {!isCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}

                  {/* Red Badge Alert */}
                  {item.badge && unreadCount > 0 && (
                    <span className={`absolute flex items-center justify-center bg-rose-600 text-white text-[9px] font-black rounded-full border border-white ${
                      isCollapsed ? "top-2 right-2 w-4 h-4" : "right-10 px-1.5 h-4.5 min-w-4.5"
                    }`}>
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* System Resources & Information */}
            <div className="pt-3 pb-1 border-t border-gray-100 my-2">
              {!isCollapsed && (
                <div className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Resources
                </div>
              )}
              {[
                { href: "/guide", icon: BookOpen, label: "System Guide" },
                { href: "/pricing", icon: Ship, label: "Tonnage Pricing" },
                { href: "/about", icon: Sparkles, label: "About Parola" },
              ].map((res) => {
                const isActive = pathname === res.href;
                const Icon = res.icon;
                return (
                  <Link
                    key={res.href}
                    href={res.href}
                    title={isCollapsed ? res.label : undefined}
                    className={`flex items-center gap-3.5 h-10 px-4 rounded-full font-bold text-xs transition-all select-none ${
                      isActive
                        ? "bg-[#E5F7F3] text-[#00B37E]"
                        : "text-gray-500 hover:text-[#12211E] hover:bg-gray-100/70"
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5 shrink-0" />
                    {!isCollapsed && <span className="truncate">{res.label}</span>}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Bottom logout area */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={logout}
              className={`w-full flex items-center gap-3.5 h-11 px-4 rounded-full font-bold text-sm transition select-none ${
                isCollapsed
                  ? "text-red-500 hover:bg-red-50/50 justify-center"
                  : "text-red-500 hover:bg-red-50/50 justify-start"
              }`}
            >
              <LogOut className="w-5 h-5 shrink-0 text-red-500" />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        </aside>

        <main className={`flex-1 flex flex-col min-w-0 pb-16 md:pb-0 ${fluid ? "h-screen overflow-hidden bg-white" : "bg-white"}`}>
          <div className={fluid ? "flex-1 animate-fade-in flex flex-col h-full min-h-0 bg-white" : "flex-1 overflow-y-auto p-4 md:p-8 w-full animate-fade-in bg-white"}>
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
