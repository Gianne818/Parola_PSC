import React from "react";

export const DemoBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Soft warm neutral backdrop */}
      <div className="absolute inset-0 bg-[#F7FAF9] dark:bg-[#12211E]/95 transition-colors duration-300" />
      
      {/* Decorative maritime ocean mesh grid */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05] bg-[linear-gradient(to_right,#12211E_1px,transparent_1px),linear-gradient(to_bottom,#12211E_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      
      {/* Concentric ambient light beacon representing the lighthouse sweep */}
      <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[80%] rounded-full bg-gradient-to-br from-[#10B981]/5 via-[#00B37E]/2 to-transparent blur-[120px] dark:from-[#10B981]/10 dark:via-transparent dark:to-transparent" />
      
      {/* Subtle depth rings */}
      <div className="absolute top-[20%] left-[80%] w-[400px] h-[400px] rounded-full border border-[#12211E]/5 dark:border-white/5 stroke-dasharray-[4_8]" />
      <div className="absolute top-[30%] left-[75%] w-[600px] h-[600px] rounded-full border border-[#12211E]/5 dark:border-white/5 stroke-dasharray-[4_8]" />
    </div>
  );
};
export default DemoBackground;
