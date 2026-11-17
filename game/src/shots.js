// Deterministic solver and reproducible presentation states for screenshots.
import { LEVELS } from './config.js';
import { createFlight, simulateFlight, EVENT_PORTAL } from './physics.js';

const radians = (degrees) => degrees * Math.PI / 180;

function evaluate(level, angleDegrees, speed) {
  const dx = level.portal.x - level.launcher.x;
  const dy = level.portal.y - level.launcher.y;
  const base = Math.atan2(dy, dx);
  const angle = base + radians(angleDegrees);
  return { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
    result: simulateFlight(level, Math.cos(angle) * speed, Math.sin(angle) * speed, 12) };
}

export function findWinningLaunch(level) {
  let best = null;
  const isBetter = (candidate, current) => !current
    || candidate.result.collected.size > current.result.collected.size
    || (candidate.result.collected.size === current.result.collected.size
      && (candidate.result.steps < current.result.steps
        || (candidate.result.steps === current.result.steps && candidate.speed < current.speed)));
  // Evaluate the full deterministic grid so star pickups influence the chosen route.
  for (let angle = -80; angle <= 80; angle += 2.5) {
    for (let index = 0; index <= 20; index += 1) {
      const speed = 240 + index * 31;
      const candidate = evaluate(level, angle, speed);
      if (candidate.result.outcome === EVENT_PORTAL) {
        const scored = { ...candidate, angle, speed };
        if (isBetter(scored, best)) best = scored;
      }
    }
  }
  if (!best) return null;

  let refined = best;
  for (let angle = best.angle - 2.5; angle <= best.angle + 2.5001; angle += 0.5) {
    for (let speed = Math.max(240, best.speed - 20); speed <= Math.min(860, best.speed + 20); speed += 5) {
      const candidate = evaluate(level, angle, speed);
      if (candidate.result.outcome !== EVENT_PORTAL) continue;
      const scored = { ...candidate, angle, speed };
      if (isBetter(scored, refined)) refined = scored;
    }
  }
  return { vx: refined.vx, vy: refined.vy, outcome: refined.result.outcome,
    collected: refined.result.collected };
}

function startSolverFlight(world) {
  const level = world.level();
  const shot = findWinningLaunch(level);
  let vx;
  let vy;
  if (shot) ({ vx, vy } = shot);
  else {
    const dx = level.portal.x - level.launcher.x;
    const dy = level.portal.y - level.launcher.y;
    const length = Math.hypot(dx, dy) || 1;
    vx = dx / length * 760;
    vy = dy / length * 760;
  }
  // Screenshot setup needs an exact solver velocity; this mirrors releaseAim's public state effects.
  world.flight = createFlight(level, vx, vy);
  world.launchesLeft -= 1;
  world.phase = 'fly';
  world.aim = { active: false, vx: 0, vy: 0, preview: null };
  world.trail = [{ x: world.flight.x, y: world.flight.y }];
  world.events.push('launch');
  return simulateFlight(level, vx, vy, 12).steps;
}

export function stageShot(name, world, levelIndex = null) {
  if (name === 'start') {
    world.screen = 'title';
    world.steps += 120;
    return { screen: 'title' };
  }
  world.startGame();
  if (name === 'play') {
    const level = levelIndex !== null ? levelIndex : 6;
    if (level !== 0) world.loadLevel(level);
    world.screen = 'play';
  }
  if (name === 'end' && levelIndex !== null) {
    world.loadLevel(levelIndex);
    world.screen = 'play';
  }
  if (name === 'play') {
    const totalSteps = startSolverFlight(world);
    if (world.level().surge) {
      for (let i = 0; i < totalSteps && world.screen === 'play' && world.phase === 'fly' && world.flight.phase !== 2; i += 1) world.step();
      const target = Math.floor(Math.max(0, totalSteps - (world.flight?.steps || totalSteps)) * 0.45);
      for (let i = 0; i < target && world.screen === 'play' && world.phase === 'fly'; i += 1) world.step();
    } else {
      const target = Math.max(1, Math.floor(totalSteps * 0.58));
      for (let i = 0; i < target && world.screen === 'play' && world.phase === 'fly'; i += 1) world.step();
    }
    return { screen: 'play' };
  }
  if (name === 'end') {
    const totalSteps = startSolverFlight(world);
    for (let i = 0; i < totalSteps + 2 && world.screen === 'play'; i += 1) world.step();
    return { screen: world.screen };
  }
  if (name === 'won') {
    // Clear every system through the same solver flight and world transitions as play.
    for (let level = 0; level < LEVELS.length; level += 1) {
      const totalSteps = startSolverFlight(world);
      for (let i = 0; i < totalSteps + 2 && world.screen === 'play'; i += 1) world.step();
      if (level < LEVELS.length - 1) world.confirm();
    }
    return { screen: world.screen };
  }
  throw new RangeError(`Unknown screenshot scene: ${name}`);
}
