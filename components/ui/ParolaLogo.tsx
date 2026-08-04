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
      <svg
        className={`${className} shrink-0`}
        viewBox="0 0 96 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Bold Capital P Stem & Loop */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 18 H48 C60 18 66 26 66 38 C66 50 60 58 48 58 H24 V82 H12 V18 Z M24 30 V46 H48 C53 46 55 43 55 38 C55 33 53 30 48 30 H24 Z"
          fill="currentColor"
          className={colorClass}
        />

        {/* Green Beacon Dot inside P loop */}
        <circle cx="39" cy="38" r="5" fill="#238838" />

        {/* 3 Radiating Green Signal Waves */}
        <path
          d="M 69 23 A 21 21 0 0 1 69 53"
          stroke="#238838"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 78 15 A 31 31 0 0 1 78 61"
          stroke="#238838"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 87 7 A 41 41 0 0 1 87 69"
          stroke="#238838"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      {!iconOnly && (
        <span className={`font-display font-[900] tracking-tight text-xl ${colorClass}`}>
          PAROLA
        </span>
      )}
    </div>
  );
};
export default ParolaLogo;
