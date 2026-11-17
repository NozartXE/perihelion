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
  { name: 'The Cradle', caption: 'A gentle well, a quiet sky. Learn the bend.', log: 'VESPER, survey probe: awake, lost, and making excellent time.', clearLog: 'First world behind me. I can still call that progress.', twist: '',
    theme: { sky: ['#111633', '#20264b', '#080d20'], nebula: ['74,76,166', '45,115,139'], accent: '#a9b7ff' },
    launcher: { x: 112, y: 370 }, portal: { x: 1150, y: 350, r: 27 }, launches: 5,
    planets: [{ x: 610, y: 465, r: 38, mu: 3200000, kind: 'rocky' }], stars: [{ x: 330, y: 352 }, { x: 760, y: 322 }, { x: 990, y: 365 }] },
  { name: 'Twin Pull', caption: 'The second world will not sit still — watch its orbit, time your bend.', log: 'Two worlds tug at my path. I am learning to bend.', clearLog: 'A moving target. I moved with it. Noted.', twist: 'ORBITING WORLD',
    theme: { sky: ['#082b35', '#0d3d48', '#06151f'], nebula: ['36,137,145', '24,83,112'], accent: '#58e0d1' },
    launcher: { x: 100, y: 580 }, portal: { x: 1170, y: 160, r: 26 }, launches: 5,
    planets: [{ x: 410, y: 420, r: 43, mu: 5200000, kind: 'gas' }, { x: 830 - 55 * Math.cos(0.9), y: 300 - 55 * Math.sin(0.9), r: 48, mu: 6100000, kind: 'ringed', orbit: { radius: 55, speed: 0.22, phase: 0.9 } }], stars: [{ x: 250, y: 495 }, { x: 625, y: 350 }, { x: 1040, y: 205 }] },
  { name: 'The Scales', caption: 'Dead rock drifts between the wells. Thread the belt.', log: 'The rocks keep their counsel. I will keep my course.', clearLog: 'Threaded the belt. My confidence remains mostly intact.', twist: 'ASTEROID BELT',
    theme: { sky: ['#241b43', '#352652', '#100e24'], nebula: ['128,80,171', '65,57,133'], accent: '#d5a5ff' },
    launcher: { x: 105, y: 610 }, portal: { x: 1145, y: 92, r: 24 }, launches: 4,
    planets: [{ x: 445, y: 390, r: 56, mu: 9500000, kind: 'rocky' }, { x: 800, y: 250, r: 34, mu: 3700000, kind: 'ice' }], asteroids: [{ x: 625, y: 435, r: 15 }, { x: 672, y: 398, r: 11 }, { x: 655, y: 478, r: 10 }], stars: [{ x: 260, y: 470 }, { x: 560, y: 290 }, { x: 770, y: 155 }, { x: 1010, y: 125 }] },
  { name: 'Crosscurrents', caption: 'The pale world pushes. Fly the current backwards.', log: 'A world pushes back. Good. I was getting comfortable.', clearLog: 'Turned the shove into a road. I may be getting good at this.', twist: 'REPULSOR',
    theme: { sky: ['#321b1a', '#4b2822', '#170e13'], nebula: ['166,72,48', '112,47,65'], accent: '#ff9a68' },
    launcher: { x: 100, y: 355 }, portal: { x: 1170, y: 360, r: 24 }, launches: 4,
    planets: [{ x: 420, y: 220, r: 42, mu: 4900000, kind: 'ember' }, { x: 665, y: 480, r: 50, mu: 6800000, kind: 'gas' }, { x: 900, y: 235, r: 40, mu: -5200000, kind: 'repulsor' }], stars: [{ x: 250, y: 300 }, { x: 535, y: 345 }, { x: 785, y: 335 }, { x: 1050, y: 325 }] },
  { name: 'The Anvil', caption: 'Too heavy to round? The rift offers a shorter road.', log: 'There is a hole in the map. I intend to use it.', clearLog: 'Shortcut taken. My original route can sulk in peace.', twist: 'WORMHOLE',
    theme: { sky: ['#102919', '#1c3b2b', '#081710'], nebula: ['53,122,71', '35,83,89'], accent: '#9de27c' },
    launcher: { x: 105, y: 360 }, portal: { x: 1110, y: 360, r: 25 }, launches: 4,
    planets: [{ x: 675, y: 360, r: 63, mu: 13800000, kind: 'ember' }], wormholes: [{ x: 330, y: 520, r: 20, toX: 955, toY: 205 }], stars: [{ x: 300, y: 335 }, { x: 520, y: 250 }, { x: 830, y: 265 }, { x: 1010, y: 340 }] },
  { name: 'The Corridor', caption: 'Three gates, in order — only then will the portal open.', log: 'Three gates, one road. I have stopped asking the road nicely.', clearLog: 'All three gates. The way home is starting to look real.', twist: 'ORDERED GATES',
    theme: { sky: ['#102b2a', '#1c4540', '#09191d'], nebula: ['55,141,116', '33,91,121'], accent: '#81e5bc' },
    launcher: { x: 100, y: 635 }, portal: { x: 1175, y: 90, r: 23 }, launches: 4,
    planets: [{ x: 350, y: 500, r: 38, mu: 4800000, kind: 'rocky' }, { x: 570, y: 390, r: 42, mu: 6000000, kind: 'gas' }, { x: 790, y: 270, r: 40, mu: 5700000, kind: 'crystal' }, { x: 1000, y: 155, r: 34, mu: 4300000, kind: 'ice' }], gates: [{ x: 364, y: 399, r: 30 }, { x: 627, y: 243, r: 30 }, { x: 914, y: 133, r: 30 }], stars: [{ x: 230, y: 555 }, { x: 465, y: 420 }, { x: 675, y: 211 }, { x: 900, y: 205 }, { x: 1090, y: 120 }] },
  { name: 'The Maw', caption: 'VORATH, the Hollow Star: it eats light and bends every road home.', log: 'VORATH is ahead. I can feel the light leaving the map.', clearLog: 'Past VORATH. I have never missed a star this much.', twist: 'VORATH · SINGULARITY',
    theme: { sky: ['#100c12', '#211315', '#030306'], nebula: ['190,77,28', '95,28,24'], accent: '#ff7438' },
    launcher: { x: 105, y: 350 }, portal: { x: 820, y: 350, r: 18 }, launches: 3,
    planets: [{ x: 585, y: 425, r: 30, mu: 24000000, kind: 'singularity' }, { x: 900 - 34 * Math.cos(2.1), y: 170 - 34 * Math.sin(2.1), r: 30, mu: 3300000, kind: 'ice', orbit: { radius: 34, speed: 0.3, phase: 2.1 } }], stars: [{ x: 260, y: 335 }, { x: 400, y: 260 }, { x: 450, y: 460 }, { x: 675, y: 300 }, { x: 730, y: 485 }] },
  { name: 'Perihelion', caption: 'A late-game convergence: bend every lesson into one road through the dark.', log: 'VORATH between me and home. I am done being afraid of roads.', clearLog: 'Past the convergence. The last road is still ahead, but now I know how to fly it.', twist: 'ALL SYSTEMS',
    theme: { sky: ['#49351b', '#765321', '#211b17'], nebula: ['196,133,44', '129,76,39'], accent: '#ffd16b' },
    launcher: { x: 70, y: 650 }, portal: { x: 1205, y: 65, r: 22 }, launches: 4,
    planets: [{ x: 330, y: 510, r: 40, mu: 5100000, kind: 'rocky' }, { x: 590 - 44 * Math.cos(1.6), y: 370 - 44 * Math.sin(1.6), r: 55, mu: 9800000, kind: 'gas', orbit: { radius: 44, speed: 0.18, phase: 1.6 } }, { x: 850, y: 235, r: 46, mu: 7500000, kind: 'ringed' }, { x: 1050, y: 115, r: 34, mu: 4500000, kind: 'crystal' }], gates: [{ x: 200, y: 565, r: 25 }, { x: 372, y: 407, r: 25 }], wormholes: [{ x: 200, y: 565, r: 18, toX: 372, toY: 407 }], stars: [{ x: 200, y: 565 }, { x: 372, y: 407 }, { x: 753, y: 301 }, { x: 950, y: 185 }, { x: 1120, y: 95 }] },
  { name: 'The Gauntlet', caption: 'Repulsor, rift, and stone belt: three old lessons in one narrow passage.', log: 'Everything I learned is waiting in this passage. I will need all of it.', clearLog: 'Through the whole gauntlet. VESPER still has a few tricks left.', twist: 'GAUNTLET',
    theme: { sky: ['#241326', '#46202b', '#0c0a19'], nebula: ['158,73,77', '92,42,113'], accent: '#ffad70' },
    launcher: { x: 100, y: 600 }, portal: { x: 1165, y: 120, r: 23 }, launches: 4,
    planets: [{ x: 390, y: 465, r: 42, mu: 6500000, kind: 'rocky' }, { x: 690, y: 330, r: 44, mu: -2000000, kind: 'repulsor' }, { x: 940, y: 250, r: 36, mu: 4200000, kind: 'ice' }],
    wormholes: [{ x: 505, y: 335, r: 20, toX: 765, toY: 190 }], asteroids: [{ x: 825, y: 340, r: 13 }, { x: 865, y: 307, r: 10 }, { x: 900, y: 360, r: 12 }],
    stars: [{ x: 218, y: 456 }, { x: 388, y: 330 }, { x: 572, y: 272 }, { x: 899, y: 140 }] },
  { name: 'VORATH', caption: 'The last road home runs through the Hollow Star. Fly it, and go home.', log: 'VORATH is all that remains. I am afraid, and I am going anyway.', clearLog: 'I am going home. VESPER, signing off beneath a real sky.', twist: 'VORATH · THE HOLLOW STAR',
    theme: { sky: ['#100b0a', '#32170d', '#030304'], nebula: ['204,85,20', '112,35,11'], accent: '#ffb43d' },
    launcher: { x: 100, y: 370 }, portal: { x: 1165, y: 110, r: 22 }, launches: 3,
    planets: [{ x: 620, y: 360, r: 28, mu: 16000000, kind: 'singularity' }, { x: 870 - 48 * Math.cos(1.8), y: 180 - 48 * Math.sin(1.8), r: 34, mu: 3900000, kind: 'ringed', orbit: { radius: 48, speed: 0.2, phase: 1.8 } }],
    gates: [{ x: 410, y: 240, r: 30 }, { x: 770, y: 135, r: 30 }, { x: 1125, y: 110, r: 30 }],
    stars: [{ x: 255, y: 335 }, { x: 410, y: 240 }, { x: 770, y: 135 }, { x: 1030, y: 120 }, { x: 1125, y: 110 }] },
];
