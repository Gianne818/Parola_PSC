"use client";

import React from "react";
import { AuthLayout } from "../../components/layouts/AuthLayout";
import { useApp } from "../../context/AppContext";
import { useTranslation } from "../../hooks/use-translation";
import { Bell, BellRing, Check, Info, MessageSquare, Trash2 } from "lucide-react";

export default function NotificationsPage() {
  const {
    notifications,
    markNotificationRead,
    purgeNotifications,
    language
  } = useApp();

  const { t } = useTranslation(language);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AuthLayout>
      <div className="space-y-6 md:space-y-8 max-w-4xl mx-auto pb-12">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-teal-950 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
              Emergency Broadcasts
            </span>
            <h2 className="font-display font-[900] text-3xl text-slate-900 dark:text-[#F7FAF9] mt-0.5 flex items-center gap-2">
              <Bell className="w-7 h-7 text-brand-green" />
              Alert Log
            </h2>
          </div>

          {notifications.length > 0 && (
            <button
              onClick={purgeNotifications}
              className="flex items-center gap-1.5 px-4 h-10 rounded-full border border-rose-100 dark:border-rose-950 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-black uppercase tracking-wider transition"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Log</span>
            </button>
          )}
        </div>

        {/* List */}
        {notifications.length === 0 ? (
          <div className="bg-white dark:bg-[#12211E] border border-gray-100 dark:border-teal-950 rounded-[2rem] p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-teal-950/30 text-gray-300 dark:text-teal-900 flex items-center justify-center mx-auto">
              <Bell className="w-8 h-8" />
            </div>
            <h3 className="font-display font-black text-lg text-slate-800 dark:text-gray-100">
              No active alerts
            </h3>
            <p className="text-xs text-gray-400 font-bold max-w-xs mx-auto leading-relaxed">
              Coastal waters are clear. Emergency satellite channels will broadcast real-time telemetry warning updates here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-gray-400">
                Displaying {notifications.length} alerts ({unreadCount} unread)
              </span>
              <span className="text-[10px] font-black uppercase text-brand-green">
                PAGASA Coastal Net
              </span>
            </div>

            <div className="space-y-3.5">
              {notifications.map((alert) => {
                const titleText = alert.title[language] || alert.title["en"];
                const messageText = alert.message[language] || alert.message["en"];

                return (
                  <div
                    key={alert.id}
                    onClick={() => markNotificationRead(alert.id)}
                    className={`group relative bg-white dark:bg-[#12211E] border rounded-3xl p-5 md:p-6 transition-all duration-300 text-left flex items-start gap-4 cursor-pointer hover:shadow-sm ${
                      !alert.read
                        ? "border-brand-green dark:border-brand-green shadow-inner"
                        : "border-gray-100 dark:border-teal-950"
                    }`}
                  >
                    {/* Unread circle glow */}
                    {!alert.read && (
                      <span className="absolute top-6 right-6 w-2 h-2 rounded-full bg-brand-green animate-ping" />
                    )}

                    {/* Icon indicator based on priority */}
                    <div
                      className={`p-3 rounded-2xl shrink-0 ${
                        alert.priority === "high"
                          ? "bg-rose-50 text-rose-500 dark:bg-rose-950/20"
                          : alert.priority === "medium"
                          ? "bg-amber-50 text-amber-500 dark:bg-amber-950/20"
                          : "bg-brand-green/10 text-brand-green dark:bg-brand-green/20"
                      }`}
                    >
                      {alert.priority === "high" ? (
                        <BellRing className="w-5.5 h-5.5 animate-bounce" />
                      ) : (
                        <Bell className="w-5.5 h-5.5" />
                      )}
                    </div>

                    <div className="flex-1 space-y-1 pr-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                          {alert.type} Alert
                        </span>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span className="text-[10px] font-black uppercase text-brand-green">
                          {alert.location || "Coastal"}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span className="text-[10px] text-gray-400 font-bold">{alert.timestamp}</span>
                      </div>

                      <h4 className={`font-display font-black text-lg text-slate-900 dark:text-[#F7FAF9] ${!alert.read ? "text-brand-green" : ""}`}>
                        {titleText}
                      </h4>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-300 leading-relaxed pt-1">
                        {messageText}
                      </p>

                      {/* Read acknowledgement button */}
                      {!alert.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markNotificationRead(alert.id);
                          }}
                          className="mt-3 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-brand-green bg-brand-green/10 dark:bg-brand-green/20 px-2.5 py-1 rounded-full border border-brand-green/20 dark:border-emerald-950 hover:bg-brand-green/15 transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Acknowledge Read</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
