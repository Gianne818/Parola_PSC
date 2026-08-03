"use client";

import React, { useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const ToastContainer: React.FC = () => {
  const { toast, hideToast } = useApp();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        hideToast();
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toast, hideToast]);

  return (
    <AnimatePresence>
      {toast && (
        <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-55 max-w-sm w-full p-4 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-xl bg-white dark:bg-[#12211E] ${
              toast.type === "success"
                ? "border-emerald-100 dark:border-emerald-950/50"
                : toast.type === "error"
                ? "border-rose-100 dark:border-rose-950/50"
                : "border-teal-100 dark:border-teal-950/50"
            }`}
          >
            {/* Icon */}
            <div className="shrink-0 mt-0.5">
              {toast.type === "success" && (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              )}
              {toast.type === "error" && (
                <AlertCircle className="w-5 h-5 text-rose-500" />
              )}
              {toast.type === "info" && (
                <Info className="w-5 h-5 text-[#10B981]" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1">
              <p className="text-xs font-bold leading-relaxed text-gray-800 dark:text-[#F7FAF9]">
                {toast.message}
              </p>
            </div>

            {/* Dismiss button */}
            <button
              onClick={hideToast}
              className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-full transition"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
export default ToastContainer;
