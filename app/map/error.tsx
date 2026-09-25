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
    <div className="min-h-[60vh] flex items-center justify-center bg-white p-6">
      <div className="w-full max-w-md rounded-3xl border border-[#DAE5E0] bg-[#F2F6F4] p-8 text-center space-y-4">
        <h2 className="font-display font-black text-lg text-[#12211E]">
          Map redirect failed
        </h2>
        <p className="text-xs text-[#12211E]/70 leading-relaxed">
          The chart view lives on the dashboard now. Try again to continue.
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
