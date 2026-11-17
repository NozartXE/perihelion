import { FIELD, PROBE, STEP } from './config.js';

export const EVENT_NONE = 0;
export const EVENT_PORTAL = 1;
export const EVENT_CRASH = 2;
export const EVENT_LOST = 3;
export const STAR_PICKUP_RADIUS = 16;
const SAMPLE_EVERY = 6;

export function createFlight(level, vx, vy) {
  return { x: level.launcher.x, y: level.launcher.y, vx, vy, steps: 0, alive: true, collected: new Set() };
}

export function accelerationAt(level, x, y) {
  let ax = 0;
  let ay = 0;
  for (const planet of level.planets) {
    const dx = planet.x - x;
    const dy = planet.y - y;
    const distance = Math.max(Math.hypot(dx, dy), planet.r);
    const scale = planet.mu / (distance * distance * distance);
    ax += dx * scale;
    ay += dy * scale;
  }
  return { ax, ay };
}

export function stepFlight(level, flight, dt = STEP) {
  if (!flight.alive) return EVENT_NONE;
  const { ax, ay } = accelerationAt(level, flight.x, flight.y);
  flight.vx += ax * dt;
  flight.vy += ay * dt;
  flight.x += flight.vx * dt;
  flight.y += flight.vy * dt;
  flight.steps += 1;

  // Check collisions before portal capture so a planet occludes its own vicinity.
  for (const planet of level.planets) {
    if (Math.hypot(flight.x - planet.x, flight.y - planet.y) < planet.r + PROBE.radius * 0.6) {
      flight.alive = false;
      return EVENT_CRASH;
    }
  }
  for (let index = 0; index < level.stars.length; index += 1) {
    const star = level.stars[index];
    if (!flight.collected.has(index) && Math.hypot(flight.x - star.x, flight.y - star.y) <= STAR_PICKUP_RADIUS) flight.collected.add(index);
  }
  // Portal capture is generous enough to catch the probe's centre near the glowing ring edge.
  if (Math.hypot(flight.x - level.portal.x, flight.y - level.portal.y) < level.portal.r + PROBE.radius * 0.5) {
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
