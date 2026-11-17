// Canvas presentation for PERIHELION. All animation is derived from simulation steps.
import { FIELD, LEVELS, PALETTE, PROBE, SCORE } from './config.js';
import { createRandom } from './random.js';
import { planetPosition, simulateFlight } from './physics.js';
import { findWinningLaunch } from './shots.js';

const FONT = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const KIND_COLOURS = {
  gas: ['#b9a8ff', '#323c88'], rocky: ['#d8c4a1', '#625c5a'], ringed: ['#f3d18c', '#846037'],
  crystal: ['#a4f8ff', '#654bb2'], ember: ['#ff9955', '#281d24'], ice: ['#ffffff', '#6cb7d1'],
  repulsor: ['#ffffff', '#aaa5ed'], singularity: ['#ffb253', '#3a1110'],
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const seeded = (a, b) => createRandom((a + 1) * 7919 + (b + 1) * 104729 + 13);

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let cssWidth = 1, cssHeight = 1, dpr = 1, scale = 1, offsetX = 0, offsetY = 0;
  let decorIndex = -1, stars = [], nebulae = [], planetDetails = [], asteroidShapes = [];
  const heroCache = new Map();

  function resize() {
    const rect = canvas.getBoundingClientRect();
    cssWidth = Math.max(1, rect.width || canvas.clientWidth || 1); cssHeight = Math.max(1, rect.height || canvas.clientHeight || 1);
    dpr = Math.min(2, Math.max(1, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1));
    canvas.width = Math.round(cssWidth * dpr); canvas.height = Math.round(cssHeight * dpr);
    scale = Math.min(cssWidth / FIELD.width, cssHeight / FIELD.height);
    offsetX = (cssWidth - FIELD.width * scale) / 2; offsetY = (cssHeight - FIELD.height * scale) / 2;
  }
  resize();
  if (typeof window !== 'undefined') window.addEventListener('resize', resize);

  function seedScene(index) {
    if (decorIndex === index) return;
    decorIndex = index;
    const random = createRandom(index * 7919 + 13);
    stars = Array.from({ length: 150 }, (_, i) => ({ x: random.range(0, FIELD.width), y: random.range(0, FIELD.height), r: random.range(i < 55 ? 0.7 : 0.35, i < 55 ? 1.5 : 0.85), phase: random.range(0, 6.28), cross: i < 20, layer: i < 55 ? 0 : 1 }));
    const colours = LEVELS[index].theme.nebula;
    nebulae = Array.from({ length: 6 }, (_, i) => ({ x: random.range(0, FIELD.width), y: random.range(0, FIELD.height), r: random.range(160, 340), colour: colours[i % 2] }));
    const level = LEVELS[index];
    planetDetails = level.planets.map((p, i) => {
      const r = seeded(index, i);
      const count = p.kind === 'rocky' ? 5 : p.kind === 'crystal' ? 6 : p.kind === 'ember' ? 5 : 5;
      return { craters: Array.from({ length: count }, () => ({ x: r.range(-0.58, 0.58), y: r.range(-0.55, 0.55), s: r.range(0.08, 0.2) })),
        facets: Array.from({ length: count + 1 }, (_, j) => j * Math.PI * 2 / (count + 1) + r.range(-0.15, 0.15)),
        cracks: Array.from({ length: 5 }, () => { const a = r.range(0, Math.PI * 2), len = r.range(0.4, 0.85); return [a, a + r.range(-0.5, 0.5), a + len]; }),
        sparkles: Array.from({ length: 6 }, () => ({ x: r.range(-0.7, 0.7), y: r.range(-0.7, 0.7), phase: r.range(0, 6.28) })) };
    });
    asteroidShapes = (level.asteroids || []).map((a, i) => { const r = seeded(index, 100 + i), n = 7 + Math.floor(r.range(0, 3)); return Array.from({ length: n }, (_, j) => ({ a: j * Math.PI * 2 / n, m: r.range(0.76, 1.2) })); });
  }

  function fieldSpace() { ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY); }
  function background(world) {
    seedScene(world.levelIndex);
    const theme = world.level().theme;
    const gradient = ctx.createLinearGradient(0, 0, 0, FIELD.height);
    theme.sky.forEach((c, i) => gradient.addColorStop(i / 2, c));
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    for (const n of nebulae) {
      const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
      glow.addColorStop(0, `rgba(${n.colour},0.15)`); glow.addColorStop(0.48, `rgba(${n.colour},0.065)`); glow.addColorStop(1, `rgba(${n.colour},0)`);
      ctx.fillStyle = glow; ctx.fillRect(n.x - n.r, n.y - n.r, n.r * 2, n.r * 2);
    }
    for (const s of stars) {
      const twinkle = 0.48 + 0.4 * Math.sin(world.steps * (s.layer ? 0.021 : 0.035) + s.phase);
      const x = (s.x - world.steps * (s.layer ? 0.012 : 0.035) + FIELD.width) % FIELD.width;
      ctx.globalAlpha = twinkle * (s.layer ? 0.58 : 0.9); ctx.fillStyle = s.layer ? '#a9c7ed' : PALETTE.ice;
      ctx.beginPath(); ctx.arc(x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      if (s.cross && twinkle > 0.72) { ctx.strokeStyle = '#d8e8ff'; ctx.globalAlpha = twinkle * 0.45; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x - 3, s.y); ctx.lineTo(x + 3, s.y); ctx.moveTo(x, s.y - 3); ctx.lineTo(x, s.y + 3); ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
  }

  function planet(p, index, planetIndex, steps, heaviest) {
    const pos = planetPosition(p, index); // index is flight-local time supplied by scene.
    const d = planetDetails[planetIndex] || { craters: [], facets: [], cracks: [], sparkles: [] };
    const kind = p.kind || 'rocky', [light, dark] = KIND_COLOURS[kind] || KIND_COLOURS.rocky;
    ctx.save();
    if (p.orbit) { ctx.setLineDash([4, 8]); ctx.strokeStyle = 'rgba(220,231,255,0.22)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p.x, p.y, p.orbit.radius, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
    for (const factor of [2.3, 1.6]) { ctx.strokeStyle = `rgba(145,174,255,${factor > 2 ? 0.045 : 0.075})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(pos.x, pos.y, p.r * factor, 0, Math.PI * 2); ctx.stroke(); }
    if (heaviest) { ctx.setLineDash([5, 9]); ctx.lineDashOffset = -steps * 0.08; ctx.strokeStyle = 'rgba(111,223,220,0.16)'; ctx.beginPath(); ctx.arc(pos.x, pos.y, p.r * 1.28, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
    if (kind === 'ringed') ring(pos, p.r, steps, false);
    if (kind === 'singularity') {
      const glow = ctx.createRadialGradient(pos.x, pos.y, p.r * 0.55, pos.x, pos.y, p.r * 3.5); glow.addColorStop(0, 'rgba(255,117,35,0.27)'); glow.addColorStop(1, 'rgba(255,91,26,0)');
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(pos.x, pos.y, p.r * 3.5, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(pos.x, pos.y); ctx.rotate(steps * 0.02 + i * 1.8); ctx.strokeStyle = ['rgba(255,224,164,0.8)','rgba(255,126,49,0.7)','rgba(255,255,239,0.52)'][i]; ctx.lineWidth = i === 1 ? 3 : 1.5; ctx.beginPath(); ctx.ellipse(0, 0, p.r * (1.65 + i * 0.16), p.r * (0.48 + i * 0.05), -0.32, 0.25 + i, 2.6 + i); ctx.stroke(); ctx.restore(); }
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(pos.x, pos.y, p.r, 0, Math.PI * 2); ctx.fill();
      ctx.shadowColor = '#fff4d5'; ctx.shadowBlur = 7; ctx.strokeStyle = '#fff4dc'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(pos.x, pos.y, p.r + 2, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0;
      ctx.restore(); return;
    }
    if (kind === 'ember') { ctx.shadowColor = '#ff612e'; ctx.shadowBlur = 14; }
    const g = ctx.createRadialGradient(pos.x - p.r * 0.35, pos.y - p.r * 0.42, p.r * 0.06, pos.x, pos.y, p.r * 1.15);
    g.addColorStop(0, light); g.addColorStop(0.55, kind === 'ember' ? '#713b36' : light); g.addColorStop(1, dark);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(pos.x, pos.y, p.r, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    ctx.save(); ctx.beginPath(); ctx.arc(pos.x, pos.y, p.r, 0, Math.PI * 2); ctx.clip();
    if (kind === 'gas') {
      for (let i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? 'rgba(25,29,86,0.25)' : 'rgba(216,206,255,0.16)'; ctx.fillRect(pos.x - p.r, pos.y - p.r + i * p.r * 0.42, p.r * 2, p.r * 0.18); }
    } else if (kind === 'rocky') {
      d.craters.forEach(c => { const x = pos.x + c.x * p.r, y = pos.y + c.y * p.r, rr = c.s * p.r; ctx.fillStyle = 'rgba(35,37,42,0.3)'; ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'rgba(255,235,201,0.55)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(x, y, rr, 0.15, Math.PI - 0.15); ctx.stroke(); });
    } else if (kind === 'crystal') {
      d.facets.forEach(a => { ctx.strokeStyle = 'rgba(230,255,255,0.4)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(pos.x, pos.y); ctx.lineTo(pos.x + Math.cos(a) * p.r, pos.y + Math.sin(a) * p.r); ctx.stroke(); });
      ctx.fillStyle = 'rgba(199,137,255,0.18)'; ctx.beginPath(); ctx.moveTo(pos.x, pos.y); ctx.lineTo(pos.x - p.r * .7, pos.y - p.r * .2); ctx.lineTo(pos.x - p.r * .25, pos.y - p.r * .85); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(146,248,255,0.15)'; ctx.beginPath(); ctx.moveTo(pos.x, pos.y); ctx.lineTo(pos.x + p.r * .8, pos.y + p.r * .1); ctx.lineTo(pos.x + p.r * .35, pos.y + p.r * .8); ctx.closePath(); ctx.fill();
    } else if (kind === 'ember') {
      d.cracks.forEach((c, i) => { ctx.strokeStyle = i % 2 ? 'rgba(255,90,37,0.8)' : 'rgba(255,188,83,0.85)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(pos.x + Math.cos(c[0]) * p.r * .22, pos.y + Math.sin(c[0]) * p.r * .22); ctx.lineTo(pos.x + Math.cos(c[1]) * p.r * .48, pos.y + Math.sin(c[1]) * p.r * .48); ctx.lineTo(pos.x + Math.cos(c[2]) * p.r * .94, pos.y + Math.sin(c[2]) * p.r * .94); ctx.stroke(); });
    } else if (kind === 'ice') {
      d.sparkles.forEach(s => { const a = .3 + .7 * Math.max(0, Math.sin(steps * .09 + s.phase)); ctx.globalAlpha = a; const x = pos.x + s.x * p.r, y = pos.y + s.y * p.r; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x + 3, y); ctx.moveTo(x, y - 3); ctx.lineTo(x, y + 3); ctx.stroke(); }); ctx.globalAlpha = 1;
    }
    ctx.restore();
    if (kind === 'repulsor') for (let k = 0; k < 3; k++) { const cycle = (steps * .4 + k * 30) % 60; ctx.globalAlpha = 1 - cycle / 60; ctx.strokeStyle = '#d6d1ff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(pos.x, pos.y, p.r + cycle, 0, Math.PI * 2); ctx.stroke(); }
    if (kind === 'ringed') ring(pos, p.r, steps, true);
    ctx.strokeStyle = 'rgba(231,242,255,0.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(pos.x, pos.y, p.r + 1, Math.PI * 1.12, Math.PI * 1.82); ctx.stroke(); ctx.restore();
  }

  function ring(pos, r, steps, front) {
    ctx.save(); ctx.translate(pos.x, pos.y); ctx.rotate(-0.35); ctx.beginPath(); ctx.ellipse(0, 0, r * 1.65, r * .48, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2);
    ctx.strokeStyle = 'rgba(240,207,137,0.75)'; ctx.lineWidth = 2.2; ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, 0, r * 1.8, r * .58, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2); ctx.stroke(); ctx.restore();
  }

  function asteroids(level, steps) {
    (level.asteroids || []).forEach((a, i) => { const shape = asteroidShapes[i] || []; ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(steps * .002 + i); ctx.beginPath(); shape.forEach((v, j) => { const x = Math.cos(v.a) * a.r * v.m, y = Math.sin(v.a) * a.r * v.m; j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); ctx.fillStyle = '#766d65'; ctx.strokeStyle = 'rgba(226,207,176,.7)'; ctx.lineWidth = 1.4; ctx.fill(); ctx.stroke(); ctx.restore(); });
  }
  function wormholes(level, steps) {
    (level.wormholes || []).forEach(w => {
      ctx.save(); ctx.translate(w.x, w.y); for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, 0, w.r * (.45 + i * .24), steps * .03 + i * 2.1, steps * .03 + i * 2.1 + 4.7); ctx.strokeStyle = `rgba(181,125,255,${.85 - i * .18})`; ctx.lineWidth = 2.4 - i * .4; ctx.stroke(); } ctx.fillStyle = '#eadbff'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, 7); ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(w.toX, w.toY); ctx.strokeStyle = '#54e4d0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, w.r * .7, 0, Math.PI * 2); ctx.stroke();
      for (const y of [-5, 5]) { ctx.beginPath(); ctx.moveTo(-3, y - 4); ctx.lineTo(3, y); ctx.lineTo(-3, y + 4); ctx.stroke(); } ctx.restore();
    });
  }
  function gates(level, world, steps) {
    const passed = world.flight ? world.flight.gatesPassed : ((world.screen === 'complete' || world.screen === 'won') ? (level.gates || []).length : 0);
    (level.gates || []).forEach((g, i) => { const next = i === passed, done = i < passed; ctx.save(); ctx.globalAlpha = done ? .9 : next ? 1 : .3; ctx.strokeStyle = done ? '#54e4d0' : next ? level.theme.accent : '#fff'; ctx.lineWidth = done || next ? 2.4 : 1.5; if (next) ctx.globalAlpha *= .75 + .25 * Math.sin(steps * .05); ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2); ctx.stroke(); if (done) { ctx.fillStyle = '#54e4d0'; ctx.beginPath(); ctx.arc(g.x, g.y, 3, 0, Math.PI * 2); ctx.fill(); } ctx.globalAlpha = 1; text(String(i + 1), g.x, g.y - g.r - 12, 12, done ? '#54e4d0' : level.theme.accent, 'center', 700); ctx.restore(); });
  }

  function portal(p, steps, dim = false) {
    ctx.save(); if (dim) ctx.globalAlpha = .4;
    const pulse = 0.82 + 0.18 * Math.sin(steps * 0.04), hue = dim ? 'rgba(165,170,183' : 'rgba(73,214,202';
    if (!dim) { const glow = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, p.r * 3.2); glow.addColorStop(0, 'rgba(231,242,255,0.32)'); glow.addColorStop(.35, 'rgba(73,214,202,0.2)'); glow.addColorStop(1, 'rgba(73,214,202,0)'); ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3.2, 0, Math.PI * 2); ctx.fill(); }
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.lineWidth = i === 0 ? 3 : 1.4; ctx.strokeStyle = i === 1 && !dim ? `rgba(231,242,255,${.66 * pulse})` : `${hue},${(0.82 - i * .16) * pulse})`; ctx.arc(p.x, p.y, p.r * (.72 + i * .43), steps * (i % 2 ? -.012 : .016) + i, steps * (i % 2 ? -.012 : .016) + i + Math.PI * (1.2 + i * .18)); ctx.stroke(); }
    ctx.fillStyle = dim ? 'rgba(194,199,210,.5)' : `rgba(231,242,255,${.7 * pulse})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * .31, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  function collectible(s, index, collected, steps) {
    const pulse = .78 + .22 * Math.sin(steps * .055 + index * 1.7);
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(steps * .003 + index); ctx.globalAlpha = collected ? .2 : pulse; ctx.shadowColor = PALETTE.star; ctx.shadowBlur = collected ? 2 : 14; ctx.fillStyle = collected ? '#75819a' : PALETTE.star;
    ctx.beginPath(); ctx.moveTo(0,-9); ctx.lineTo(2.2,-2.2); ctx.lineTo(9,0); ctx.lineTo(2.2,2.2); ctx.lineTo(0,9); ctx.lineTo(-2.2,2.2); ctx.lineTo(-9,0); ctx.lineTo(-2.2,-2.2); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function launcher(p, steps) { const bob = Math.sin(steps * .06) * 2; ctx.save(); ctx.translate(p.x, p.y + bob); ctx.fillStyle = 'rgba(24,42,68,.9)'; ctx.strokeStyle = 'rgba(73,214,202,.65)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(-19,10,38,9,4); ctx.fill(); ctx.stroke(); ctx.strokeStyle = 'rgba(231,242,255,.65)'; ctx.beginPath(); ctx.moveTo(-9,9); ctx.lineTo(-4,1); ctx.lineTo(4,1); ctx.lineTo(9,9); ctx.stroke(); ctx.shadowColor = PALETTE.ice; ctx.shadowBlur = 12; ctx.fillStyle = PALETTE.ice; ctx.beginPath(); ctx.arc(0,0,PROBE.radius,0,Math.PI*2); ctx.fill(); ctx.restore(); }
  function text(str, x, y, size, colour, align = 'left', weight = 500, style = '') { ctx.font = `${style ? `${style} ` : ''}${weight} ${size}px ${FONT}`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = colour; ctx.fillText(str, x, y); }
  function roundPanel(x, y, w, h, radius = 18) { ctx.fillStyle = 'rgba(5,9,22,.82)'; ctx.strokeStyle = 'rgba(143,171,224,.23)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(x,y,w,h,radius); ctx.fill(); ctx.stroke(); }

  function hud(world) {
    const level = world.level(); ctx.fillStyle = 'rgba(5,10,24,.6)'; ctx.fillRect(0,0,FIELD.width,72);
    text(`SYSTEM ${world.levelIndex + 1}/${LEVELS.length}  —  ${level.name.toUpperCase()}`,42,30,17,PALETTE.ice,'left',650);
    if (level.twist) { ctx.save(); ctx.globalAlpha = .85; text(level.twist,43,53,10.5,level.theme.accent,'left',700); ctx.restore(); }
    text(`LAUNCHES  ${'● '.repeat(world.launchesLeft).trim()}`,720,35,14,PALETTE.teal,'center',600); text(`✦ ${world.collected.size}/${level.stars.length}`,965,35,16,PALETTE.star,'center',600); text(`SCORE  ${world.score.toLocaleString()}`,1238,35,15,PALETTE.ice,'right',600);
    if (world.phase === 'aim') text('Drag back and release to launch  ·  R restart  ·  P pause  ·  M mute',640,685,13,'rgba(213,225,246,.68)','center');
  }
  function burst(world, s, i) { const at = world.collectedSteps?.[i]; if (at === undefined) return; const elapsed = world.steps - at; if (elapsed < 0 || elapsed >= 42) return; const p = elapsed / 42, r = 6 + p * 30; ctx.save(); ctx.globalAlpha = 1 - p; ctx.strokeStyle = '#ffe5a4'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(s.x,s.y,r,0,Math.PI*2); ctx.stroke(); for (let k=0;k<6;k++){const a=k*Math.PI/3;ctx.beginPath();ctx.moveTo(s.x+Math.cos(a)*(r+3),s.y+Math.sin(a)*(r+3));ctx.lineTo(s.x+Math.cos(a)*(r+9),s.y+Math.sin(a)*(r+9));ctx.stroke();} ctx.restore(); }
  function scene(world) {
    const level = world.level(), flightStep = world.phase === 'fly' && world.flight ? world.flight.steps : 0;
    const heavy = level.planets.reduce((best,q,j)=>q.mu>level.planets[best].mu?j:best,0);
    level.planets.forEach((p,i)=>planet(p,flightStep,i,world.steps,i===heavy));
    asteroids(level,world.steps); wormholes(level,world.steps); gates(level,world,world.steps);
    level.stars.forEach((s,i)=>{collectible(s,i,world.collected.has(i),world.steps);burst(world,s,i);});
    const gp = world.flight ? world.flight.gatesPassed : ((world.screen==='complete'||world.screen==='won') ? (level.gates||[]).length : 0);
    portal(level.portal,world.steps,(level.gates||[]).length>gp);
    if(world.phase==='aim') launcher(level.launcher,world.steps);
    if(world.phase==='fly'&&world.flight){const trail=world.trail;if(trail.length>1){ctx.save();ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();trail.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.strokeStyle=level.theme.accent;ctx.globalAlpha=.1;ctx.lineWidth=5.5;ctx.stroke();ctx.globalAlpha=.32;ctx.lineWidth=2.6;ctx.stroke();ctx.globalAlpha=.75;ctx.strokeStyle='#f4f8ff';ctx.lineWidth=1.2;ctx.stroke();ctx.restore();} ctx.shadowColor=PALETTE.ice;ctx.shadowBlur=25;ctx.fillStyle=PALETTE.ice;ctx.beginPath();ctx.arc(world.flight.x,world.flight.y,PROBE.radius,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.beginPath();ctx.arc(world.flight.x,world.flight.y,PROBE.radius+3,0,Math.PI*2);ctx.strokeStyle='rgba(231,242,255,.26)';ctx.lineWidth=1;ctx.stroke();}
    if(world.phase==='aim'&&world.aim.active){const speed=Math.hypot(world.aim.vx,world.aim.vy),angle=Math.atan2(world.aim.vy,world.aim.vx);ctx.strokeStyle='rgba(73,214,202,.72)';ctx.lineWidth=2;ctx.setLineDash([6,7]);ctx.beginPath();ctx.moveTo(level.launcher.x,level.launcher.y);ctx.lineTo(level.launcher.x-world.aim.vx/2.4,level.launcher.y-world.aim.vy/2.4);ctx.stroke();ctx.setLineDash([]);if(world.aim.preview)world.aim.preview.forEach((q,i)=>{ctx.globalAlpha=.65*(1-i/world.aim.preview.length);ctx.fillStyle=PALETTE.teal;ctx.beginPath();ctx.arc(q.x,q.y,2.6,0,Math.PI*2);ctx.fill();});ctx.globalAlpha=1;const ratio=clamp((speed-PROBE.minSpeed)/(PROBE.maxSpeed-PROBE.minSpeed),0,1);ctx.strokeStyle='rgba(231,242,255,.25)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(level.launcher.x,level.launcher.y,26,angle-2.2,angle+2.2);ctx.stroke();ctx.strokeStyle=PALETTE.star;ctx.beginPath();ctx.arc(level.launcher.x,level.launcher.y,26,angle-2.2,angle-2.2+ratio*4.4);ctx.stroke();}
    if(world.screen==='play'&&world.steps-world.levelStartStep<420){const elapsed=world.steps-world.levelStartStep,a=Math.min(1,elapsed/30,(420-elapsed)/90);ctx.save();ctx.globalAlpha=clamp(a,0,1)*.88;ctx.font=`500 13px ${FONT}`;const contentWidth=Math.max(ctx.measureText(level.caption).width,ctx.measureText(level.log).width+64);const w=Math.min(1180,contentWidth+32);ctx.fillStyle='rgba(5,9,22,.68)';ctx.beginPath();ctx.roundRect(640-w/2,592,w,56,16);ctx.fill();text(level.caption,640,610,13,'#e8e6f3','center');text('VESPER',640-w/2+18,633,9,level.theme.accent,'left',750);text(level.log,640-w/2+70,633,12,'#d7deed','left',500,'italic');ctx.restore();}
  }
  function hero(level) { if(!heroCache.has(0)){const shot=findWinningLaunch(LEVELS[0]);const result=shot?simulateFlight(LEVELS[0],shot.vx,shot.vy,12):null;heroCache.set(0,result?.points||[]);}return heroCache.get(0); }
  function scoreRows(world, level, y) { const n=world.collected.size, completion=SCORE.complete, stars=SCORE.star*n, bonus=SCORE.launchBonus*world.launchesLeft; const rows=[['Completion',`+${completion}`],['Stars',`${n} × ${SCORE.star}  +${stars}`],['Launch bonus',`+${bonus}`]]; rows.forEach((row,i)=>{const yy=y+i*29;text(row[0],455,yy,14,PALETTE.muted,'left');text(row[1],825,yy,14,PALETTE.ice,'right',600);ctx.strokeStyle='rgba(183,198,224,.16)';ctx.beginPath();ctx.moveTo(455,yy+14);ctx.lineTo(825,yy+14);ctx.stroke();});text('TOTAL',455,y+96,16,PALETTE.ice,'left',750);text(world.score.toLocaleString(),825,y+96,17,PALETTE.star,'right',750); }
  function overlay(world,best) {
    const screen=world.screen;if(screen==='play'){hud(world);return;}
    if(screen==='title'){
      ctx.fillStyle='rgba(3,6,17,.32)';ctx.fillRect(0,0,FIELD.width,FIELD.height);
      const points=hero(LEVELS[0]);if(points.length>1){ctx.save();ctx.setLineDash([2,9]);ctx.lineDashOffset=-world.steps*.08;ctx.strokeStyle=world.level().theme.accent;ctx.globalAlpha=.72;ctx.lineWidth=2.2;ctx.shadowColor=world.level().theme.accent;ctx.shadowBlur=8;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.restore();}
      ctx.save();ctx.shadowColor='#ffcf72';ctx.shadowBlur=18;ctx.font=`800 74px ${FONT}`;ctx.textAlign='center';ctx.textBaseline='middle';const grad=ctx.createLinearGradient(370,0,910,0);grad.addColorStop(0,'#ffd16b');grad.addColorStop(.48,'#fff0c8');grad.addColorStop(1,'#b9efff');ctx.fillStyle=grad;ctx.fillText('PERIHELION',640,205);ctx.restore();text('BEND GRAVITY. SLING THE LOST PROBE HOME.',640,276,16,world.level().theme.accent,'center',700);text('VESPER is lost. VORATH is hungry. Bend gravity — bring her home.',640,307,14,PALETTE.muted,'center',500,'italic');text('Drag to aim  ·  release to fly  ·  reach the portal  ·  collect stars',640,365,16,PALETTE.ice,'center');if(best>0)text(`BEST SCORE  ${best.toLocaleString()}`,640,420,16,PALETTE.teal,'center',650);text('Click or press Enter to begin',640,510,16,PALETTE.ice,'center',600);return;
    }
    ctx.fillStyle='rgba(3,6,17,.66)';ctx.fillRect(0,0,FIELD.width,FIELD.height);
    if(screen==='paused'){roundPanel(425,275,430,170);text('PAUSED',640,350,42,PALETTE.ice,'center',700);text('P or Escape to resume',640,400,15,PALETTE.muted,'center');return;}
    const panel=screen==='lost'?{x:355,y:180,w:570,h:360}:{x:355,y:155,w:570,h:425};roundPanel(panel.x,panel.y,panel.w,panel.h,22);
    if(screen==='complete'){const level=world.level();text('SYSTEM CLEARED',640,205,32,PALETTE.teal,'center',750);text(level.caption,640,239,14,PALETTE.muted,'center',500,'italic');text('STARS',640,274,14,PALETTE.muted,'center',600);level.stars.forEach((_,i)=>{const x=640+(i-(level.stars.length-1)/2)*28;ctx.save();ctx.translate(x,303);ctx.beginPath();for(let k=0;k<10;k++){const r=k%2?5:11,a=-Math.PI/2+k*Math.PI/5;k?ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r):ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fillStyle=world.collected.has(i)?PALETTE.star:'rgba(255,201,107,.12)';ctx.strokeStyle=world.collected.has(i)?PALETTE.star:'rgba(255,201,107,.45)';ctx.fill();ctx.stroke();ctx.restore();});scoreRows(world,level,339);text('VESPER',640,458,9,level.theme.accent,'center',750);text(`“${level.clearLog}”`,640,477,13,PALETTE.ice,'center',500,'italic');text('Enter — next system',640,543,15,PALETTE.ice,'center');}
    else if(screen==='lost'){text('SIGNAL LOST',640,280,38,PALETTE.danger,'center',750);text('The probe is gone, but the route remains.',640,350,16,PALETTE.ice,'center');text('Enter — retry system',640,435,16,PALETTE.ice,'center');}
    else if(screen==='won'){text('HOME AT LAST',640,195,36,PALETTE.star,'center',750);text('The probe passed VORATH and found the way home.',640,231,14,PALETTE.muted,'center',500,'italic');text('FINAL SCORE',640,267,13,PALETTE.muted,'center',600);scoreRows(world,world.level(),300);text('VESPER',640,451,9,world.level().theme.accent,'center',750);text(`“${world.level().clearLog}”`,640,470,13,PALETTE.ice,'center',500,'italic');text(`BEST  ${best.toLocaleString()}`,640,526,14,PALETTE.muted,'center');text('Enter — play again',640,555,15,PALETTE.ice,'center');}
  }
  return {
    draw(world,best=0){const rect=canvas.getBoundingClientRect();if(Math.abs(rect.width-cssWidth)>.5||Math.abs(rect.height-cssHeight)>.5)resize();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);fieldSpace();background(world);scene(world);overlay(world,best);ctx.setTransform(1,0,0,1,0,0);},
    toField(clientX,clientY){const rect=canvas.getBoundingClientRect();return{x:(clientX-rect.left-offsetX)/scale,y:(clientY-rect.top-offsetY)/scale};},
  };
}
