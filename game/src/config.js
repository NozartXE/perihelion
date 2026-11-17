// Shared rules and authored system layouts for PERIHELION.
export const FIELD = { width: 1280, height: 720 };
export const STEP = 1 / 120;
export const PROBE = { radius: 7, maxSpeed: 880, minSpeed: 120 };
export const SCORE = { complete: 250, star: 150, launchBonus: 50 };
export const BEST_KEY = 'perihelion-best';
export const PALETTE = {
  space: '#070b18', indigo: '#222a57', teal: '#49d6ca', star: '#ffc96b',
  danger: '#ff6f79', ice: '#e7f2ff', muted: '#8393b8', planet: '#7583c7',
};

export const LEVELS = [
  { name: 'The Cradle', launcher: { x: 112, y: 370 }, portal: { x: 1150, y: 350, r: 27 }, launches: 5,
    planets: [{ x: 610, y: 465, r: 38, mu: 3200000 }], stars: [{ x: 330, y: 352 }, { x: 760, y: 322 }, { x: 990, y: 365 }] },
  { name: 'Twin Pull', launcher: { x: 100, y: 580 }, portal: { x: 1170, y: 160, r: 26 }, launches: 5,
    planets: [{ x: 410, y: 420, r: 43, mu: 5200000 }, { x: 830, y: 300, r: 48, mu: 6100000 }], stars: [{ x: 250, y: 495 }, { x: 625, y: 350 }, { x: 1040, y: 205 }] },
  { name: 'The Scales', launcher: { x: 105, y: 610 }, portal: { x: 1145, y: 92, r: 24 }, launches: 4,
    planets: [{ x: 445, y: 390, r: 56, mu: 9500000 }, { x: 800, y: 250, r: 34, mu: 3700000 }], stars: [{ x: 260, y: 470 }, { x: 560, y: 290 }, { x: 770, y: 155 }, { x: 1010, y: 125 }] },
  { name: 'Crosscurrents', launcher: { x: 100, y: 355 }, portal: { x: 1170, y: 360, r: 24 }, launches: 4,
    planets: [{ x: 420, y: 220, r: 42, mu: 4900000 }, { x: 665, y: 480, r: 50, mu: 6800000 }, { x: 900, y: 235, r: 40, mu: 5200000 }], stars: [{ x: 250, y: 300 }, { x: 535, y: 345 }, { x: 785, y: 335 }, { x: 1050, y: 325 }] },
  { name: 'The Anvil', launcher: { x: 105, y: 360 }, portal: { x: 1110, y: 360, r: 25 }, launches: 4,
    planets: [{ x: 675, y: 360, r: 63, mu: 13800000 }], stars: [{ x: 300, y: 335 }, { x: 520, y: 250 }, { x: 830, y: 265 }, { x: 1010, y: 340 }] },
  { name: 'The Corridor', launcher: { x: 100, y: 635 }, portal: { x: 1175, y: 90, r: 23 }, launches: 4,
    planets: [{ x: 350, y: 500, r: 38, mu: 4800000 }, { x: 570, y: 390, r: 42, mu: 6000000 }, { x: 790, y: 270, r: 40, mu: 5700000 }, { x: 1000, y: 155, r: 34, mu: 4300000 }], stars: [{ x: 230, y: 555 }, { x: 465, y: 420 }, { x: 675, y: 211 }, { x: 900, y: 205 }, { x: 1090, y: 120 }] },
  { name: 'The Maw', launcher: { x: 105, y: 350 }, portal: { x: 820, y: 350, r: 18 }, launches: 3,
    planets: [{ x: 585, y: 425, r: 64, mu: 14000000 }, { x: 900, y: 170, r: 30, mu: 3300000 }], stars: [{ x: 260, y: 335 }, { x: 400, y: 260 }, { x: 450, y: 460 }, { x: 675, y: 300 }, { x: 730, y: 485 }] },
  { name: 'Perihelion', launcher: { x: 70, y: 650 }, portal: { x: 1205, y: 65, r: 22 }, launches: 4,
    planets: [{ x: 330, y: 510, r: 40, mu: 5100000 }, { x: 590, y: 370, r: 55, mu: 9800000 }, { x: 850, y: 235, r: 46, mu: 7500000 }, { x: 1050, y: 115, r: 34, mu: 4500000 }], stars: [{ x: 200, y: 565 }, { x: 372, y: 407 }, { x: 753, y: 301 }, { x: 950, y: 185 }, { x: 1120, y: 95 }] },
];
