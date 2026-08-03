"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Fuel, Bell, User, Settings, Map } from "lucide-react";
import { useTranslation } from "../../hooks/use-translation";
import { useApp } from "../../context/AppContext";

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { language } = useApp();
  const { t } = useTranslation(language);

  const tabs = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dash" },
    { href: "/fuel", icon: Fuel, label: "Fuel" },
    { href: "/notifications", icon: Bell, label: "Alerts", badge: true },
    { href: "/profile", icon: User, label: "Profile" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  const { notifications } = useApp();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-[#12211E] border-t border-gray-100 dark:border-teal-950 flex items-center justify-around px-2 z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="relative flex flex-col items-center justify-center flex-1 h-full py-2 group select-none"
          >
            <div
              className={`flex items-center justify-center p-1.5 rounded-full transition-all ${
                isActive
                  ? "bg-brand-green/10 text-brand-green"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              <Icon className="w-5.5 h-5.5" />
            </div>
            
            {/* Unread Alerts Badge count */}
            {tab.badge && unreadCount > 0 && (
              <span className="absolute top-2 right-1/2 translate-x-3.5 bg-rose-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white dark:border-[#12211E]">
                {unreadCount}
              </span>
            )}

            <span
              className={`text-[9px] font-black tracking-wide uppercase mt-0.5 ${
                isActive ? "text-brand-green" : "text-gray-400"
              }`}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
};
export default BottomNav;
