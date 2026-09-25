"use client";

import { useEffect } from "react";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="rounded-3xl border border-[#DAE5E0] bg-white p-8 text-center space-y-4 shadow-sm">
        <h2 className="font-display font-black text-lg text-[#12211E]">
          Alerts hub failed to load
        </h2>
        <p className="text-xs text-[#12211E]/70 leading-relaxed max-w-md mx-auto">
          Safety thresholds and SMS dispatch previews could not be rendered.
          Try again to restore the marine safety configuration.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          className="px-6 py-2.5 rounded-full bg-[#00B37E] hover:bg-[#00B37E]/90 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm active:scale-[0.98] cursor-pointer"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
