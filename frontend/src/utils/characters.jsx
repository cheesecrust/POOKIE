// LV1
export const LV1 = { id: "lv1_base", name: "pookiepookie", level: 1 };

// LV2 (색상 3갈래)
export const LV2 = [
  { id: "lv2_red",    name: "redpookie",    color: "red",    level: 2 },
  { id: "lv2_green",  name: "greenpookie",  color: "green",  level: 2 },
  { id: "lv2_yellow", name: "yellowpookie", color: "yellow", level: 2 },
];

// LV3 (각 색상 3종)
export const LV3_BY_COLOR = {
  red: [
    { id: "r1", name: "strawberrypudding", level: 3 },
    { id: "r2", name: "blueberrypudding",  level: 3 }, 
    { id: "r3", name: "buldakpudding",     level: 3 },
  ],
  green: [
    { id: "g1", name: "greenteapudding", level: 3 },
    { id: "g2", name: "melonpudding",    level: 3 },
    { id: "g3", name: "chocopudding",    level: 3 },
  ],
  yellow: [
    { id: "y1", name: "milkpudding",    level: 3 },
    { id: "y2", name: "creampudding",   level: 3 },
    { id: "y3", name: "caramelpudding", level: 3 },
  ],
};
