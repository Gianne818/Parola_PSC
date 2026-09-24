"use client";

import React from "react";

interface ParolaLogoProps {
  className?: string;
  iconOnly?: boolean;
  colorClass?: string;
}

export const ParolaLogo: React.FC<ParolaLogoProps> = ({
  className = "h-8 w-8",
  iconOnly = false,
  colorClass = "text-black"
}) => {
  return (
    <div className="flex items-center gap-2.5 select-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/parola-logo.jpeg"
        alt="Parola Logo"
        className={`${className} rounded-lg object-cover shrink-0`}
      />
      {!iconOnly && (
        <span className={`font-display font-[900] tracking-tight text-xl ${colorClass}`}>
          PAROLA
        </span>
      )}
    </div>
  );
};
export default ParolaLogo;
