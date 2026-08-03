import React from "react";

interface Tier {
  name: string;
  volume: number;
  discount: number;
}

interface TierProgressBarProps {
  currentVolume: number;
  targetVolume: number;
  tiers?: Tier[];
}

const DEFAULT_TIERS: Tier[] = [
  { name: "Bronze", volume: 1000, discount: 1.5 },
  { name: "Silver", volume: 2500, discount: 2.5 },
  { name: "Gold", volume: 4000, discount: 3.5 },
  { name: "Max Bulk", volume: 6000, discount: 4.5 }
];

export const TierProgressBar: React.FC<TierProgressBarProps> = ({
  currentVolume,
  targetVolume,
  tiers = DEFAULT_TIERS
}) => {
  const percentage = Math.min(100, (currentVolume / targetVolume) * 100);

  return (
    <div className="w-full space-y-5 my-3 py-1">
      {/* Progress Bar Container */}
      <div className="relative w-full h-4 bg-[#E2E8F0] dark:bg-zinc-800 rounded-full">
        {/* Fill */}
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-brand-green rounded-full transition-all duration-500 ease-out shadow-sm"
          style={{ width: `${percentage}%` }}
        />

        {/* Tier Tick Markers */}
        {tiers.map((tier, idx) => {
          const tierPercent = (tier.volume / targetVolume) * 100;
          const isAchieved = currentVolume >= tier.volume;

          if (tierPercent > 100) return null;

          return (
            <div
              key={idx}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
              style={{ left: `${tierPercent}%` }}
            >
              {/* Dot */}
              <div
                className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-300 ${
                  isAchieved
                    ? "bg-brand-green border-white dark:border-zinc-900 scale-110 shadow"
                    : "bg-white dark:bg-zinc-850 border-gray-300"
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Tier Details Row */}
      <div className="grid grid-cols-4 gap-1 pt-1 text-center">
        {tiers.map((tier, idx) => {
          const isAchieved = currentVolume >= tier.volume;
          return (
            <div key={idx} className="flex flex-col items-center space-y-1">
              <span
                className={`text-[11px] font-black tracking-wider uppercase ${
                  isAchieved ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"
                }`}
              >
                {tier.name}
              </span>
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                {tier.volume.toLocaleString()}L
              </span>
              <span className="text-[10px] font-bold text-brand-green bg-brand-green/10 px-1.5 py-0.5 rounded-full border border-brand-green/20">
                -₱{tier.discount.toFixed(2)}/L
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default TierProgressBar;
