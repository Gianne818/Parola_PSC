import React from "react";

interface ParolaLogoProps {
  className?: string;
  iconOnly?: boolean;
}

export const ParolaLogo: React.FC<ParolaLogoProps> = ({ className = "h-8 w-8", iconOnly = false }) => {
  return (
    <div className="flex items-center gap-2 select-none">
      <svg
        className={`${className} text-[#00B37E] shrink-0`}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Radiating Signal Waves (Modern Beacon) */}
        <circle cx="4" cy="12" r="2.2" fill="currentColor" />
        <path
          d="M 9 6 A 7.5 7.5 0 0 1 9 18"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 14 2.5 A 12.5 12.5 0 0 1 14 21.5"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      {!iconOnly && (
        <span className="font-display font-[900] tracking-tight text-xl text-[#12211E] dark:text-[#F7FAF9]">
          PAROLA
        </span>
      )}
    </div>
  );
};
export default ParolaLogo;
