import { FIELD, PROBE, STEP } from './config.js';

export const EVENT_NONE = 0;
export const EVENT_PORTAL = 1;
export const EVENT_CRASH = 2;
export const EVENT_LOST = 3;
export const STAR_PICKUP_RADIUS = 16;
const SAMPLE_EVERY = 6;

export function planetPosition(planet, step) {
  if (!planet.orbit) return { x: planet.x, y: planet.y };
  const angle = planet.orbit.phase + planet.orbit.speed * step * STEP;
  return { x: planet.x + Math.cos(angle) * planet.orbit.radius, y: planet.y + Math.sin(angle) * planet.orbit.radius };
}

export function createFlight(level, vx, vy) {
  return { x: level.launcher.x, y: level.launcher.y, vx, vy, steps: 0, alive: true,
    collected: new Set(), gatesPassed: 0, phase: 1, surgePassed: 0, wormholeCooldown: 0, events: [] };
}

export function accelerationAt(level, x, y, step = 0, muScale = 1) {
  let ax = 0;
  let ay = 0;
  for (const planet of level.planets) {
    const position = planetPosition(planet, step);
    const dx = position.x - x;
    const dy = position.y - y;
    const distance = Math.max(Math.hypot(dx, dy), planet.r);
    const scale = planet.mu * (planet.kind === 'singularity' ? muScale : 1) / (distance * distance * distance);
    ax += dx * scale;
    ay += dy * scale;
  }
  return { ax, ay };
}

export function stepFlight(level, flight, dt = STEP) {
  if (!flight.alive) return EVENT_NONE;
  if (flight.wormholeCooldown > 0) flight.wormholeCooldown -= 1;
  const muScale = level.surge && flight.phase === 2 ? level.surge.muScale : 1;
  const { ax, ay } = accelerationAt(level, flight.x, flight.y, flight.steps, muScale);
  flight.vx += ax * dt;
  flight.vy += ay * dt;
  flight.x += flight.vx * dt;
  flight.y += flight.vy * dt;
  flight.steps += 1;

  // Check collisions before portal capture so a planet occludes its own vicinity.
  for (const planet of level.planets) {
    const position = planetPosition(planet, flight.steps);
    if (Math.hypot(flight.x - position.x, flight.y - position.y) < planet.r + PROBE.radius * 0.6) {
      flight.alive = false;
      return EVENT_CRASH;
    }
  }
  for (const asteroid of level.asteroids || []) {
    if (Math.hypot(flight.x - asteroid.x, flight.y - asteroid.y) < asteroid.r + PROBE.radius * 0.6) {
      flight.alive = false;
      return EVENT_CRASH;
    }
  }
  for (let index = 0; index < level.stars.length; index += 1) {
    const star = level.stars[index];
    if (!flight.collected.has(index) && Math.hypot(flight.x - star.x, flight.y - star.y) <= STAR_PICKUP_RADIUS) flight.collected.add(index);
  }
  if (flight.wormholeCooldown === 0) {
    for (const wormhole of level.wormholes || []) {
      if (Math.hypot(flight.x - wormhole.x, flight.y - wormhole.y) < wormhole.r) {
        flight.x = wormhole.toX;
        flight.y = wormhole.toY;
        flight.wormholeCooldown = 36;
        flight.events.push('wormhole');
        break;
      }
    }
  }
  if (level.gates && flight.gatesPassed < level.gates.length) {
    const gate = level.gates[flight.gatesPassed];
    if (Math.hypot(flight.x - gate.x, flight.y - gate.y) < gate.r) flight.gatesPassed += 1;
  }
  if (level.surge && flight.phase === 1 && flight.gatesPassed >= level.gates.length) {
    flight.phase = 2;
    flight.events.push('surge');
  }
  if (level.surge && flight.phase === 2 && flight.surgePassed < level.surge.gates.length) {
    const gate = level.surge.gates[flight.surgePassed];
    if (Math.hypot(flight.x - gate.x, flight.y - gate.y) < gate.r) flight.surgePassed += 1;
  }
  // Portal capture is generous enough to catch the probe's centre near the glowing ring edge.
  if (flight.gatesPassed >= (level.gates ? level.gates.length : 0)
    && flight.surgePassed >= (level.surge ? level.surge.gates.length : 0)
    && Math.hypot(flight.x - level.portal.x, flight.y - level.portal.y) < level.portal.r + PROBE.radius * 0.5) {
    flight.alive = false;
    return EVENT_PORTAL;
  }
  if (flight.x < -240 || flight.x > FIELD.width + 240 || flight.y < -240 || flight.y > FIELD.height + 240) {
    flight.alive = false;
    return EVENT_LOST;
  }
  return EVENT_NONE;
}

export function simulateFlight(level, vx, vy, maxSeconds) {
  const flight = createFlight(level, vx, vy);
  const points = [{ x: flight.x, y: flight.y }];
  let outcome = EVENT_NONE;
  const maxSteps = Math.ceil(maxSeconds / STEP);
  while (flight.steps < maxSteps && flight.alive) {
    outcome = stepFlight(level, flight, STEP);
    if (flight.steps % SAMPLE_EVERY === 0 || outcome !== EVENT_NONE) points.push({ x: flight.x, y: flight.y });
  }
  return { outcome, points, collected: flight.collected, steps: flight.steps };
}
