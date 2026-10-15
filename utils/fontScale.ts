export const fontScales: Record<number, number> = {
  [-2]: 80,
  [-1]: 90,
  [0]: 100,
  [1]: 105,
  [2]: 110,
  [3]: 120,
  [4]: 130
};

export const getFontScaleClass = (scale: number): string => {
  switch (scale) {
    case -2:
      return "text-[80%] leading-relaxed";
    case -1:
      return "text-[90%] leading-relaxed";
    case 1:
      return "text-[105%] leading-relaxed";
    case 2:
      return "text-[110%] leading-relaxed";
    case 3:
      return "text-[120%] leading-relaxed";
    case 4:
      return "text-[130%] leading-relaxed";
    case 0:
    default:
      return "text-[100%] leading-relaxed";
  }
};

export const getBaseFontSize = (scale: number): string => {
  switch (scale) {
    case -2:
      return "0.8125rem";
    case -1:
      return "0.875rem";
    case 1:
      return "1.0625rem";
    case 2:
      return "1.125rem";
    case 3:
      return "1.25rem";
    case 4:
      return "1.4375rem";
    case 0:
    default:
      return "1rem";
  }
};
