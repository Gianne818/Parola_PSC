"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { AuthLayout } from "../../components/layouts/AuthLayout";
import { useApp } from "../../context/AppContext";
import { useTranslation } from "../../hooks/use-translation";
import {
  Bell,
  Trash2,
  Check,
  Search,
  Zap,
  RotateCw,
  Sliders,
  MapPin,
  ChevronRight,
  CloudRain,
  Fish,
  Fuel
} from "lucide-react";

export default function NotificationsPage() {
  const {
    notifications,
    markNotificationRead,
    purgeNotifications,
    simulateNotification,
    language
  } = useApp();

  const { t } = useTranslation(language);

  // Local state for UI controls
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Calculate dynamic pill counts
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: notifications.length,
      Unread: unreadCount,
    };

    notifications.forEach((n) => {
      const typeKey = n.type ? n.type.charAt(0).toUpperCase() + n.type.slice(1) : "Other";
      counts[typeKey] = (counts[typeKey] || 0) + 1;
    });

    return counts;
  }, [notifications, unreadCount]);

  // Filter and sort list based on state
  const filteredNotifications = useMemo(() => {
    return notifications
      .filter((alert) => {
        const titleText = (alert.title[language] || alert.title["en"] || "").toLowerCase();
        const messageText = (alert.message[language] || alert.message["en"] || "").toLowerCase();
        const query = searchQuery.toLowerCase();

        const matchesSearch = titleText.includes(query) || messageText.includes(query);
        if (!matchesSearch) return false;

        if (selectedFilter === "All") return true;
        if (selectedFilter === "Unread") return !alert.read;
        return alert.type?.toLowerCase() === selectedFilter.toLowerCase();
      })
      .sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
      });
  }, [notifications, searchQuery, selectedFilter, sortOrder, language]);

  // Category Icon Renderer matched with the design
  const renderCategoryIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "weather":
        return (
          <div className="p-3.5 bg-purple-50 rounded-2xl shrink-0 text-purple-500">
            <CloudRain className="w-5 h-5" />
          </div>
        );
      case "surveys":
      case "survey":
        return (
          <div className="p-3.5 bg-sky-50 rounded-2xl shrink-0 text-sky-500">
            <Fish className="w-5 h-5" />
          </div>
        );
      case "fuel":
      case "fuel pools":
        return (
          <div className="p-3.5 bg-rose-50 rounded-2xl shrink-0 text-rose-500">
            <Fuel className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="p-3.5 bg-emerald-50 rounded-2xl shrink-0 text-emerald-600">
            <Bell className="w-5 h-5" />
          </div>
        );
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6 md:space-y-8 pb-12 pt-2 max-w-5xl mx-auto">

          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-emerald-50 rounded-2xl text-[#00B074]">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="font-display font-black text-2xl md:text-3xl tracking-tight text-slate-900">
                    NOTIFICATIONS HISTORY
                  </h1>
                  {unreadCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FF4D6D] text-white">
                      {unreadCount} UNREAD
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-gray-400 mt-0.5">
                  View past weather warnings, fuel pool milestone alerts, and community reports.
                </p>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
              <button
                onClick={simulateNotification}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-emerald-100 bg-emerald-50/50 text-[#00B074] hover:bg-emerald-100/60 text-xs font-bold transition cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Simulate Alert</span>
              </button>

              <button
                onClick={() => notifications.forEach((n) => markNotificationRead(n.id))}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold transition cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 text-[#00B074]" />
                <span>Mark Read</span>
              </button>

              {notifications.length > 0 && (
                <button
                  onClick={purgeNotifications}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 hover:bg-rose-50 text-gray-600 hover:text-rose-600 text-xs font-bold transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Purge</span>
                </button>
              )}

              <Link
                href="/alerts"
                title="Alert Configuration"
                className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-[#00B074] transition"
              >
                <Sliders className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Search Bar & Sort Menu */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search updates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-300 bg-white text-slate-800 placeholder-gray-400 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00B074] transition"
              />
            </div>

            <div className="flex items-center gap-2 border border-gray-300 rounded-full px-3.5 py-2 bg-white shrink-0 self-end sm:self-auto">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">SORT</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {Object.entries(filterCounts).map(([filterKey, count]) => {
              const isActive = selectedFilter === filterKey;
              return (
                <button
                  key={filterKey}
                  onClick={() => setSelectedFilter(filterKey)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${isActive
                      ? "bg-[#00B074] text-white shadow-sm"
                      : "bg-gray-100 hover:bg-gray-200/80 text-slate-600"
                    }`}
                >
                  <span>{filterKey}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${isActive
                        ? "bg-emerald-700/60 text-white"
                        : "bg-gray-200 text-gray-500"
                      }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Notifications Card List */}
          {filteredNotifications.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-[2rem] p-12 text-center space-y-3 shadow-md">
              <div className="w-16 h-16 rounded-full bg-slate-50 text-gray-300 flex items-center justify-center mx-auto">
                <Bell className="w-8 h-8" />
              </div>
              <h3 className="font-display font-black text-lg text-slate-800">
                No active updates
              </h3>
              <p className="text-xs text-gray-400 font-semibold max-w-xs mx-auto leading-relaxed">
                No notifications match your search or filter selection.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredNotifications.map((alert) => {
                const titleText = alert.title[language] || alert.title["en"];
                const messageText = alert.message[language] || alert.message["en"];
                const isSurvey = alert.type?.toLowerCase().includes("survey");

                return (
                  <div
                    key={alert.id}
                    onClick={() => markNotificationRead(alert.id)}
                    className={`group relative bg-white border rounded-3xl p-5 md:p-6 transition-all duration-300 text-left flex items-start justify-between gap-4 cursor-pointer shadow-md hover:shadow-lg ${!alert.read
                        ? "border-[#00B074]/30"
                        : "border-gray-100"
                      }`}
                  >
                    <div className="flex items-start gap-4 flex-1">
                      {/* Icon Container */}
                      {renderCategoryIcon(alert.type)}

                      <div className="space-y-1 flex-1 pr-2">
                        <div className="flex items-center gap-2">
                          {!alert.read && (
                            <span className="w-2 h-2 rounded-full bg-[#FF4D6D] shrink-0" />
                          )}
                          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                            {alert.type || "SYSTEM"}
                          </span>
                        </div>

                        <h3 className="font-display font-black text-base md:text-lg text-slate-900">
                          {titleText}
                        </h3>

                        <p className="text-xs font-semibold text-gray-500 leading-relaxed max-w-3xl pt-0.5">
                          {messageText}
                        </p>

                        <div className="pt-3 flex items-center gap-1.5 text-gray-400 text-xs font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="text-gray-400 text-[11px] font-bold">
                            {alert.location || "General Coastal Area"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Timestamp & CTA Link */}
                    <div className="flex flex-col justify-between items-end shrink-0 self-stretch min-h-[80px]">
                      <span className="text-[11px] font-bold text-gray-300">
                        {alert.timestamp}
                      </span>

                      <button className="mt-auto inline-flex items-center gap-0.5 text-[11px] font-black uppercase tracking-wider text-[#00B074] hover:text-emerald-600 transition">
                        <span>{isSurvey ? "ACTION REQUIRED" : "OPEN"}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
    </AuthLayout>
  );
}