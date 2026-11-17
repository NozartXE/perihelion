// Canvas presentation for PERIHELION. All animation is derived from simulation steps.
import { FIELD, LEVELS, PALETTE, PROBE, SCORE } from './config.js';
import { createRandom } from './random.js';

const FONT = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const PLANET_COLOURS = [['#91a0ec', '#273161'], ['#65d8ce', '#164b59'], ['#efad80', '#6b354c'], ['#c49cff', '#392d71']];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let cssWidth = 1, cssHeight = 1, dpr = 1, scale = 1, offsetX = 0, offsetY = 0;
  let decorIndex = -1, stars = [], nebulae = [];

  function resize() {
    const rect = canvas.getBoundingClientRect();
    cssWidth = Math.max(1, rect.width || canvas.clientWidth || 1);
    cssHeight = Math.max(1, rect.height || canvas.clientHeight || 1);
    dpr = Math.min(2, Math.max(1, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1));
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    scale = Math.min(cssWidth / FIELD.width, cssHeight / FIELD.height);
    offsetX = (cssWidth - FIELD.width * scale) / 2;
    offsetY = (cssHeight - FIELD.height * scale) / 2;
  }
  resize();
  if (typeof window !== 'undefined') window.addEventListener('resize', resize);

  function seedScene(index) {
    if (decorIndex === index) return;
    decorIndex = index;
    const random = createRandom(index * 7919 + 13);
    stars = Array.from({ length: 150 }, (_, i) => ({ x: random.range(0, FIELD.width), y: random.range(0, FIELD.height), r: random.range(i < 55 ? 0.7 : 0.35, i < 55 ? 1.5 : 0.85), phase: random.range(0, 6.28), cross: i < 20, layer: i < 55 ? 0 : 1 }));
    nebulae = Array.from({ length: 5 }, (_, i) => ({ x: random.range(0, FIELD.width), y: random.range(0, FIELD.height), r: random.range(130, 290), colour: i % 2 ? '73,98,207' : '44,190,175' }));
  }

  function fieldSpace() {
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);
  }

  function background(world) {
    ctx.fillStyle = PALETTE.space; ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    const gradient = ctx.createLinearGradient(0, 0, 0, FIELD.height);
    gradient.addColorStop(0, PALETTE.indigo); gradient.addColorStop(0.54, PALETTE.space); gradient.addColorStop(1, '#091b27');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    seedScene(world.levelIndex);
    for (const n of nebulae) {
      const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
      glow.addColorStop(0, `rgba(${n.colour},0.075)`); glow.addColorStop(1, `rgba(${n.colour},0)`);
      ctx.fillStyle = glow; ctx.fillRect(n.x - n.r, n.y - n.r, n.r * 2, n.r * 2);
    }
    for (const s of stars) {
      const twinkle = 0.48 + 0.4 * Math.sin(world.steps * (s.layer ? 0.021 : 0.035) + s.phase);
      const x = (s.x - world.steps * (s.layer ? 0.012 : 0.035) + FIELD.width) % FIELD.width;
      ctx.globalAlpha = twinkle * (s.layer ? 0.58 : 0.9);
      ctx.fillStyle = s.layer ? '#a9c7ed' : PALETTE.ice;
      ctx.beginPath(); ctx.arc(x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      if (s.cross && twinkle > 0.72) { ctx.strokeStyle = '#d8e8ff'; ctx.globalAlpha = twinkle * 0.45; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x - 3, s.y); ctx.lineTo(x + 3, s.y); ctx.moveTo(x, s.y - 3); ctx.lineTo(x, s.y + 3); ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
  }

  function planet(p, index, steps, heaviest) {
    ctx.save();
    for (const factor of [2.3, 1.6]) {
      ctx.strokeStyle = `rgba(145,174,255,${factor > 2 ? 0.05 : 0.085})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * factor, 0, Math.PI * 2); ctx.stroke();
    }
    if (heaviest) { ctx.setLineDash([5, 9]); ctx.lineDashOffset = -steps * 0.08; ctx.strokeStyle = 'rgba(111,223,220,0.16)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 1.28, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
    const [light, dark] = PLANET_COLOURS[index % PLANET_COLOURS.length];
    const g = ctx.createRadialGradient(p.x - p.r * 0.35, p.y - p.r * 0.42, p.r * 0.06, p.x, p.y, p.r * 1.15);
    g.addColorStop(0, light); g.addColorStop(0.55, PALETTE.planet); g.addColorStop(1, dark);
    ctx.shadowColor = light; ctx.shadowBlur = 20; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(231,242,255,0.55)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 1, Math.PI * 1.12, Math.PI * 1.82); ctx.stroke();
    ctx.restore();
  }

  function portal(p, steps) {
    const pulse = 0.82 + 0.18 * Math.sin(steps * 0.04);
    const glow = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, p.r * 3.2);
    glow.addColorStop(0, 'rgba(231,242,255,0.32)'); glow.addColorStop(0.35, 'rgba(73,214,202,0.2)'); glow.addColorStop(1, 'rgba(73,214,202,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3.2, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.lineWidth = i === 0 ? 3 : 1.4; ctx.strokeStyle = i === 1 ? `rgba(231,242,255,${0.66 * pulse})` : `rgba(73,214,202,${(0.82 - i * 0.16) * pulse})`;
      ctx.arc(p.x, p.y, p.r * (0.72 + i * 0.43), steps * (i % 2 ? -0.012 : 0.016) + i, steps * (i % 2 ? -0.012 : 0.016) + i + Math.PI * (1.2 + i * 0.18)); ctx.stroke();
    }
    ctx.fillStyle = `rgba(231,242,255,${0.7 * pulse})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.31, 0, Math.PI * 2); ctx.fill();
  }

  function collectible(s, index, collected, steps) {
    const pulse = 0.78 + 0.22 * Math.sin(steps * 0.055 + index * 1.7);
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(steps * 0.003 + index);
    ctx.globalAlpha = collected ? 0.2 : pulse;
    ctx.shadowColor = PALETTE.star; ctx.shadowBlur = collected ? 2 : 14;
    ctx.fillStyle = collected ? '#75819a' : PALETTE.star;
    ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(2.2, -2.2); ctx.lineTo(9, 0); ctx.lineTo(2.2, 2.2); ctx.lineTo(0, 9); ctx.lineTo(-2.2, 2.2); ctx.lineTo(-9, 0); ctx.lineTo(-2.2, -2.2); ctx.closePath(); ctx.fill(); ctx.restore();
  }

  function launcher(p, steps) {
    const bob = Math.sin(steps * 0.06) * 2;
    ctx.save(); ctx.translate(p.x, p.y + bob);
    ctx.fillStyle = 'rgba(24,42,68,0.9)'; ctx.strokeStyle = 'rgba(73,214,202,0.65)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(-19, 10, 38, 9, 4); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(231,242,255,0.65)'; ctx.beginPath(); ctx.moveTo(-9, 9); ctx.lineTo(-4, 1); ctx.lineTo(4, 1); ctx.lineTo(9, 9); ctx.stroke();
    ctx.shadowColor = PALETTE.ice; ctx.shadowBlur = 12; ctx.fillStyle = PALETTE.ice; ctx.beginPath(); ctx.arc(0, 0, PROBE.radius, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  function text(str, x, y, size, colour, align = 'left', weight = 500) { ctx.font = `${weight} ${size}px ${FONT}`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = colour; ctx.fillText(str, x, y); }
  function roundPanel(x, y, w, h, radius = 18) { ctx.fillStyle = 'rgba(5,9,22,0.82)'; ctx.strokeStyle = 'rgba(143,171,224,0.23)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill(); ctx.stroke(); }

  function hud(world) {
    const level = world.level();
    ctx.fillStyle = 'rgba(5,10,24,0.6)'; ctx.fillRect(0, 0, FIELD.width, 72);
    text(`SYSTEM ${world.levelIndex + 1}/${LEVELS.length}  —  ${level.name.toUpperCase()}`, 42, 35, 17, PALETTE.ice, 'left', 650);
    text(`LAUNCHES  ${'● '.repeat(world.launchesLeft).trim()}`, 720, 35, 14, PALETTE.teal, 'center', 600);
    text(`✦ ${world.collected.size}/${level.stars.length}`, 965, 35, 16, PALETTE.star, 'center', 600);
    text(`SCORE  ${world.score.toLocaleString()}`, 1238, 35, 15, PALETTE.ice, 'right', 600);
    if (world.phase === 'aim') text('Drag back and release to launch  ·  R restart  ·  P pause  ·  M mute', 640, 685, 13, 'rgba(213,225,246,0.68)', 'center');
  }

  function scene(world) {
    const level = world.level();
    level.planets.forEach((p, i) => planet(p, i, world.steps, i === level.planets.reduce((best, q, j) => q.mu > level.planets[best].mu ? j : best, 0)));
    level.stars.forEach((s, i) => collectible(s, i, world.collected.has(i), world.steps));
    portal(level.portal, world.steps);
    if (world.phase === 'aim') launcher(level.launcher, world.steps);
    if (world.phase === 'fly' && world.flight) {
      const trail = world.trail;
      for (let i = 1; i < trail.length; i++) { const a = i / trail.length; ctx.globalAlpha = a * 0.6; ctx.strokeStyle = PALETTE.teal; ctx.lineWidth = 1 + a * 2; ctx.beginPath(); ctx.moveTo(trail[i - 1].x, trail[i - 1].y); ctx.lineTo(trail[i].x, trail[i].y); ctx.stroke(); }
      ctx.globalAlpha = 1; ctx.shadowColor = PALETTE.ice; ctx.shadowBlur = 20; ctx.fillStyle = PALETTE.ice; ctx.beginPath(); ctx.arc(world.flight.x, world.flight.y, PROBE.radius, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    }
    if (world.phase === 'aim' && world.aim.active) {
      const speed = Math.hypot(world.aim.vx, world.aim.vy);
      const angle = Math.atan2(world.aim.vy, world.aim.vx);
      ctx.strokeStyle = 'rgba(73,214,202,0.72)'; ctx.lineWidth = 2; ctx.setLineDash([6, 7]); ctx.beginPath(); ctx.moveTo(level.launcher.x, level.launcher.y); ctx.lineTo(level.launcher.x - world.aim.vx / 2.4, level.launcher.y - world.aim.vy / 2.4); ctx.stroke(); ctx.setLineDash([]);
      if (world.aim.preview) world.aim.preview.forEach((q, i) => { ctx.globalAlpha = 0.65 * (1 - i / world.aim.preview.length); ctx.fillStyle = PALETTE.teal; ctx.beginPath(); ctx.arc(q.x, q.y, 2.6, 0, Math.PI * 2); ctx.fill(); });
      ctx.globalAlpha = 1;
      const ratio = clamp((speed - PROBE.minSpeed) / (PROBE.maxSpeed - PROBE.minSpeed), 0, 1);
      ctx.strokeStyle = 'rgba(231,242,255,0.25)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(level.launcher.x, level.launcher.y, 26, angle - 2.2, angle + 2.2); ctx.stroke();
      ctx.strokeStyle = PALETTE.star; ctx.beginPath(); ctx.arc(level.launcher.x, level.launcher.y, 26, angle - 2.2, angle - 2.2 + ratio * 4.4); ctx.stroke();
    }
  }

  function overlay(world, best) {
    const screen = world.screen;
    if (screen === 'play') { hud(world); return; }
    ctx.fillStyle = 'rgba(3,6,17,0.66)'; ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    if (screen === 'paused') { roundPanel(425, 275, 430, 170); text('PAUSED', 640, 350, 42, PALETTE.ice, 'center', 700); text('P or Escape to resume', 640, 400, 15, PALETTE.muted, 'center'); return; }
    const panel = screen === 'title' ? { x: 280, y: 150, w: 720, h: 420 } : { x: 355, y: 180, w: 570, h: 360 };
    roundPanel(panel.x, panel.y, panel.w, panel.h, 22);
    if (screen === 'title') {
      ctx.save(); ctx.font = `800 58px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const title = 'PERIHELION'; const widths = [...title].map((ch) => ctx.measureText(ch).width + 5); const fullWidth = widths.reduce((a, b) => a + b, 0) - 5;
      let cursor = 640 - fullWidth / 2;
      for (let i = 0; i < title.length; i++) { const ch = title[i]; const w = widths[i] - 5; const gradient = ctx.createLinearGradient(cursor, 0, cursor + w, 0); gradient.addColorStop(0, PALETTE.star); gradient.addColorStop(1, PALETTE.ice); ctx.fillStyle = gradient; ctx.fillText(ch, cursor + w / 2, 238); cursor += widths[i]; }
      ctx.restore(); text('BEND GRAVITY. SLING THE LOST PROBE HOME.', 640, 290, 16, PALETTE.star, 'center', 650);
      text('Drag to aim  ·  release to fly  ·  reach the portal  ·  collect stars', 640, 364, 16, PALETTE.ice, 'center');
      if (best > 0) text(`BEST SCORE  ${best.toLocaleString()}`, 640, 420, 16, PALETTE.teal, 'center', 650);
      text('Click or press Enter to begin', 640, 510, 16, PALETTE.ice, 'center', 600);
    } else if (screen === 'complete') {
      text('SYSTEM CLEARED', 640, 245, 34, PALETTE.teal, 'center', 750);
      text(`STARS  ${world.collected.size}/${world.level().stars.length}`, 640, 306, 17, PALETTE.star, 'center', 600);
      text(`TOTAL SCORE  ${world.score.toLocaleString()}`, 640, 352, 16, PALETTE.ice, 'center', 600);
      text(`Completion +${SCORE.complete}  ·  Stars +${SCORE.star * world.collected.size}  ·  Launch bonus +${SCORE.launchBonus * world.launchesLeft}`, 640, 395, 13, PALETTE.muted, 'center');
      text('Enter — next system', 640, 470, 16, PALETTE.ice, 'center');
    } else if (screen === 'lost') {
      text('SIGNAL LOST', 640, 280, 38, PALETTE.danger, 'center', 750); text('The probe is gone, but the route remains.', 640, 350, 16, PALETTE.ice, 'center'); text('Enter — retry system', 640, 435, 16, PALETTE.ice, 'center');
    } else if (screen === 'won') {
      text('HOME AT LAST', 640, 255, 38, PALETTE.star, 'center', 750); text('The probe reached Perihelion.', 640, 315, 16, PALETTE.ice, 'center'); text(`FINAL SCORE  ${world.score.toLocaleString()}`, 640, 370, 18, PALETTE.teal, 'center', 650); text(`BEST  ${best.toLocaleString()}`, 640, 410, 15, PALETTE.muted, 'center'); text('Enter — play again', 640, 475, 16, PALETTE.ice, 'center');
    }
  }

  return {
    draw(world, best = 0) {
      // Recheck CSS dimensions on every frame so layout changes need no observer dependency.
      const rect = canvas.getBoundingClientRect();
      if (Math.abs(rect.width - cssWidth) > 0.5 || Math.abs(rect.height - cssHeight) > 0.5) resize();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
      fieldSpace(); background(world); scene(world); overlay(world, best);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    },
    toField(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      return { x: (clientX - rect.left - offsetX) / scale, y: (clientY - rect.top - offsetY) / scale };
    },
  };
}
