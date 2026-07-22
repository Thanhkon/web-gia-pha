declare module 'lunar-javascript' {
  export interface LunarDate {
    getYear(): number;
    getMonth(): number;
    getDay(): number;
  }

  export interface SolarDate {
    getLunar(): LunarDate;
  }

  export const Solar: {
    fromYmd(year: number, month: number, day: number): SolarDate;
  };

  const lunarJavascript: {
    Solar: typeof Solar;
  };

  export default lunarJavascript;
}

