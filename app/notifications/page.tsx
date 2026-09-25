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
  Sliders,
  MapPin,
  ChevronRight,
  CloudRain,
  Fish,
  Sparkles,
  ThumbsUp,
  Meh,
  ThumbsDown,
  ShieldAlert
} from "lucide-react";

export default function NotificationsPage() {
  const {
    notifications,
    markNotificationRead,
    purgeNotifications,
    simulateNotification,
    showToast,
    language
  } = useApp();

  const [evaluatedAlerts, setEvaluatedAlerts] = useState<Record<string, string>>({});
  const { t } = useTranslation(language);

  // Local state for UI controls
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"All" | "Unread" | "Weather" | "Survey" | "Evaluation">("All");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Controlled 5-pill counts
  const filterCounts = useMemo(() => {
    const counts = {
      All: notifications.length,
      Unread: unreadCount,
      Weather: 0,
      Survey: 0,
      Evaluation: 0
    };

    notifications.forEach((n) => {
      const typeStr = (n.type || "").toLowerCase();
      if (typeStr.includes("weather")) {
        counts.Weather += 1;
      } else if (typeStr.includes("survey")) {
        counts.Survey += 1;
      } else if (typeStr.includes("evaluation")) {
        counts.Evaluation += 1;
      }
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

        const typeStr = (alert.type || "").toLowerCase();
        if (selectedFilter === "All") return true;
        if (selectedFilter === "Unread") return !alert.read;
        if (selectedFilter === "Weather") return typeStr.includes("weather");
        if (selectedFilter === "Survey") return typeStr.includes("survey");
        if (selectedFilter === "Evaluation") return typeStr.includes("evaluation");
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
      });
  }, [notifications, searchQuery, selectedFilter, sortOrder, language]);

  // Unified Category Icon Renderer matching Parola palette
  const renderCategoryIcon = (type: string) => {
    const lower = type?.toLowerCase() || "";
    if (lower.includes("weather")) {
      return (
        <div className="p-3 bg-emerald-50 rounded-2xl shrink-0 text-[#00B37E] border border-emerald-100">
          <CloudRain className="w-5 h-5" />
        </div>
      );
    }
    if (lower.includes("survey")) {
      return (
        <div className="p-3 bg-[#12211E]/5 rounded-2xl shrink-0 text-[#12211E]/70 border border-[#DAE5E0]">
          <Fish className="w-5 h-5" />
        </div>
      );
    }
    if (lower.includes("evaluation")) {
      return (
        <div className="p-3 bg-[#C57E2C]/10 rounded-2xl shrink-0 text-[#9A5B18] border border-[#C57E2C]/25">
          <Sparkles className="w-5 h-5" />
        </div>
      );
    }
    return (
      <div className="p-3 bg-emerald-50 rounded-2xl shrink-0 text-[#00B37E] border border-emerald-100">
        <Bell className="w-5 h-5" />
      </div>
    );
  };

  const filterTabs: Array<"All" | "Unread" | "Weather" | "Survey" | "Evaluation"> = [
    "All",
    "Unread",
    "Weather",
    "Survey",
    "Evaluation"
  ];

  return (
    <AuthLayout>
      {/* Background Atmosphere: Subtle Maritime Dot Grid & Ambient Beacon Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-[#F2F6F4]">
        <div
          className="absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage: "radial-gradient(#12211E 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[480px] bg-gradient-to-b from-[#00B37E]/10 via-[#00B37E]/3 to-transparent blur-[130px] rounded-full" />
        <div className="absolute top-[35%] right-[-80px] w-[450px] h-[450px] bg-[#C57E2C]/5 blur-[110px] rounded-full" />
      </div>

      <div className="space-y-6 pb-20 pt-2 max-w-5xl mx-auto selection:bg-[#00B37E]/20 selection:text-[#12211E]">

        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#DAE5E0] pb-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C57E2C]/10 border border-[#C57E2C]/25 text-[#9A5B18] text-[11px] font-bold uppercase tracking-wider shadow-2xs">
              <Bell className="w-3.5 h-3.5 text-[#C57E2C]" />
              <span>Operational Dispatch Log</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight text-[#12211E]">
                Notifications History
              </h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#00B37E] text-white shadow-2xs">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm font-normal text-[#12211E]/75 max-w-2xl">
              Review real-time coastal hazard warnings, vessel advisories, and advisory catch evaluations.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              type="button"
              onClick={simulateNotification}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-emerald-200 bg-emerald-50/80 text-[#00B37E] hover:bg-emerald-100 text-xs font-bold transition shadow-2xs cursor-pointer active:scale-[0.98]"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Simulate Alert</span>
            </button>

            <button
              type="button"
              onClick={() => notifications.forEach((n) => markNotificationRead(n.id))}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#DAE5E0] bg-white hover:bg-[#EAF1ED] text-[#12211E] text-xs font-bold transition shadow-2xs cursor-pointer active:scale-[0.98]"
            >
              <Check className="w-3.5 h-3.5 text-[#00B37E]" />
              <span>Mark All Read</span>
            </button>

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={purgeNotifications}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#DAE5E0] bg-white hover:bg-rose-50 text-[#12211E]/75 hover:text-rose-600 text-xs font-bold transition shadow-2xs cursor-pointer active:scale-[0.98]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Purge</span>
              </button>
            )}

            <Link
              href="/alerts"
              title="Alert Configuration"
              className="p-2 rounded-full border border-[#DAE5E0] bg-white hover:bg-[#EAF1ED] text-[#12211E]/75 hover:text-[#00B37E] transition shadow-2xs"
            >
              <Sliders className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Search Bar & Sort Dropdown */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#12211E]/40" />
            <input
              type="text"
              placeholder="Search notifications and advisories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-[#DAE5E0] bg-white text-[#12211E] placeholder-[#12211E]/40 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00B37E] shadow-2xs transition"
            />
          </div>

          <div className="flex items-center gap-2 border border-[#DAE5E0] rounded-full px-3.5 py-2 bg-white shadow-2xs shrink-0 self-end sm:self-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#12211E]/55">Sort:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
              className="bg-transparent text-xs font-bold text-[#12211E] focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* 5 Standard Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filterTabs.map((filterKey) => {
            const isActive = selectedFilter === filterKey;
            const count = filterCounts[filterKey];
            return (
              <button
                key={filterKey}
                onClick={() => setSelectedFilter(filterKey)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? "bg-[#00B37E] text-white shadow-2xs"
                    : "bg-white border border-[#DAE5E0] text-[#12211E]/70 hover:text-[#12211E] hover:bg-[#EAF1ED]"
                }`}
              >
                <span>{filterKey}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? "bg-white/25 text-white"
                      : "bg-[#F2F6F4] text-[#12211E]/70 border border-[#DAE5E0]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="bg-white border border-[#DAE5E0] rounded-3xl p-10 sm:p-12 text-center space-y-3 shadow-sm max-w-md mx-auto">
            <div className="w-14 h-14 rounded-full bg-[#F2F6F4] border border-[#DAE5E0] text-[#12211E]/40 flex items-center justify-center mx-auto">
              <Bell className="w-7 h-7" />
            </div>
            <h3 className="font-display font-black text-lg text-[#12211E]">
              No active updates
            </h3>
            <p className="text-xs text-[#12211E]/65 leading-relaxed">
              No notifications match your search or filter selection.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((alert) => {
              const titleText = alert.title[language] || alert.title["en"];
              const messageText = alert.message[language] || alert.message["en"];
              const isSurvey = alert.type?.toLowerCase().includes("survey");
              const isEvaluation = alert.type?.toLowerCase().includes("evaluation");

              return (
                <div
                  key={alert.id}
                  onClick={() => markNotificationRead(alert.id)}
                  className={`group relative bg-white border rounded-3xl p-4.5 sm:p-5 transition-all duration-200 text-left flex items-start justify-between gap-4 cursor-pointer shadow-sm hover:shadow-md overflow-hidden ${
                    !alert.read
                      ? "border-[#DAE5E0]"
                      : "border-[#DAE5E0]/70 opacity-90"
                  }`}
                >
                  {/* Clean left unread indicator bar */}
                  {!alert.read && (
                    <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#00B37E]" />
                  )}

                  <div className="flex items-start gap-3.5 flex-1 pl-1">
                    {/* Category Icon */}
                    {renderCategoryIcon(alert.type)}

                    <div className="space-y-1 flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        {!alert.read && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                            New
                          </span>
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#12211E]/50">
                          {alert.type || "System"}
                        </span>
                      </div>

                      <h3 className="font-display font-black text-base sm:text-lg text-[#12211E] leading-snug">
                        {titleText}
                      </h3>

                      <p className="text-xs font-normal text-[#12211E]/75 leading-relaxed max-w-3xl pt-0.5">
                        {messageText}
                      </p>

                      <div className="pt-2 flex items-center gap-1.5 text-[#12211E]/55 text-xs font-medium">
                        <MapPin className="w-3.5 h-3.5 text-[#00B37E] shrink-0" />
                        <span className="text-[11px]">
                          {alert.location || "General Coastal Area"}
                        </span>
                      </div>

                      {/* Interactive Evaluation Rating Widget */}
                      {isEvaluation && (
                        <div
                          className="pt-3 border-t border-[#DAE5E0] mt-2 space-y-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-[10px] font-bold text-[#12211E]/60 uppercase tracking-wider block">
                            Rate catch accuracy for today ({new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}):
                          </span>
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                setEvaluatedAlerts((prev) => ({ ...prev, [alert.id]: "High" }));
                                markNotificationRead(alert.id);
                                showToast("Evaluation logged: High accuracy rating recorded!", "success");
                              }}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#00B37E] rounded-full text-xs font-bold uppercase flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>High Accuracy</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEvaluatedAlerts((prev) => ({ ...prev, [alert.id]: "Medium" }));
                                markNotificationRead(alert.id);
                                showToast("Evaluation logged: Medium accuracy rating recorded!", "success");
                              }}
                              className="px-3 py-1.5 bg-[#C57E2C]/10 hover:bg-[#C57E2C]/20 border border-[#C57E2C]/25 text-[#9A5B18] rounded-full text-xs font-bold uppercase flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                            >
                              <Meh className="w-3.5 h-3.5" />
                              <span>Medium</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEvaluatedAlerts((prev) => ({ ...prev, [alert.id]: "Low" }));
                                markNotificationRead(alert.id);
                                showToast("Evaluation logged: Low accuracy rating recorded.", "info");
                              }}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-full text-xs font-bold uppercase flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                              <span>Low</span>
                            </button>
                          </div>
                          {evaluatedAlerts[alert.id] && (
                            <div className="text-[11px] font-bold text-[#00B37E] uppercase pt-0.5">
                              Evaluation recorded: {evaluatedAlerts[alert.id]} Accuracy
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timestamp & Link */}
                  <div className="flex flex-col justify-between items-end shrink-0 self-stretch min-h-[70px]">
                    <span className="text-[11px] font-medium text-[#12211E]/40">
                      {alert.timestamp}
                    </span>

                    <button
                      type="button"
                      className="mt-auto inline-flex items-center gap-0.5 text-[11px] font-bold uppercase tracking-wider text-[#00B37E] group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>{isSurvey ? "Action Required" : "Open"}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
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