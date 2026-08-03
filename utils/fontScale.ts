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
      return "13px";
    case -1:
      return "14px";
    case 1:
      return "17px";
    case 2:
      return "18px";
    case 3:
      return "20px";
    case 4:
      return "23px";
    case 0:
    default:
      return "16px";
  }
};
