"use client";

import React from "react";
import Image from "next/image";

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
      <Image
        src="/images/parola-logo.jpeg"
        alt="Parola Logo"
        width={64}
        height={64}
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
