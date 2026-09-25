"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProfileRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/settings#profile");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F2F6F4] flex items-center justify-center p-4">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 border-2 border-[#00B37E] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-[#12211E]/70 uppercase tracking-wider">
          Redirecting to Settings...
        </p>
      </div>
    </div>
  );
}