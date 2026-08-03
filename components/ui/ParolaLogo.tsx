import React from "react";

interface ParolaLogoProps {
  className?: string;
  iconOnly?: boolean;
}

export const ParolaLogo: React.FC<ParolaLogoProps> = ({ className = "h-8 w-8", iconOnly = false }) => {
  return (
    <div className="flex items-center gap-2 select-none">
      <svg
        className={`${className} text-[#10B981] fill-current shrink-0`}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Radiating Light Beacons */}
        <path
          d="M 50 40 L 10 20 L 10 35 Z"
          fill="#10B981"
          opacity="0.2"
          className="animate-pulse"
        />
        <path
          d="M 50 40 L 90 20 L 90 35 Z"
          fill="#10B981"
          opacity="0.2"
          className="animate-pulse"
        />
        
        {/* Radiating Circles */}
        <circle cx="50" cy="40" r="12" fill="none" stroke="#10B981" strokeWidth="1.5" opacity="0.4" className="animate-ping [animation-duration:3s]" />
        
        {/* Outer Circular frame */}
        <circle cx="50" cy="50" r="46" fill="none" stroke="#12211E" strokeWidth="4" opacity="0.1" />
        <circle cx="50" cy="50" r="46" fill="none" stroke="#10B981" strokeWidth="2" strokeDasharray="6 4" opacity="0.5" />

        {/* Central Lighthouse Tower */}
        {/* Foundation/Base */}
        <path d="M 32 85 L 68 85 L 64 72 L 36 72 Z" fill="#12211E" />
        {/* Lower deck strip */}
        <rect x="34" y="72" width="32" height="4" fill="#10B981" />
        {/* Tower shaft */}
        <path d="M 38 72 L 42 45 L 58 45 L 62 72 Z" fill="#12211E" />
        {/* Window in the shaft */}
        <rect x="47" y="55" width="6" height="10" rx="3" fill="#FFFFFF" />

        {/* Lamp Deck */}
        <rect x="36" y="41" width="28" height="4" fill="#12211E" />
        {/* Glowing Lamp */}
        <rect x="42" y="31" width="16" height="10" rx="1" fill="#FFFBEB" stroke="#12211E" strokeWidth="2" />
        <circle cx="50" cy="36" r="4" fill="#FBBF24" className="animate-pulse" />

        {/* Dome Cap */}
        <path d="M 40 31 C 40 22, 60 22, 60 31 Z" fill="#12211E" />
        {/* Dome tip */}
        <line x1="50" y1="21" x2="50" y2="15" stroke="#12211E" strokeWidth="3" />
        <circle cx="50" cy="14" r="2" fill="#10B981" />
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
