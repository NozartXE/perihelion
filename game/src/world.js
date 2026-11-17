// DOM-free rule state for PERIHELION. Rendering and controls consume this API.
import { LEVELS, PROBE, SCORE, STEP } from './config.js';
import { createFlight, simulateFlight, stepFlight, EVENT_PORTAL, EVENT_CRASH, EVENT_LOST } from './physics.js';

export const AIM_SCALE = 2.4;

export function createWorld(seed = 0) {
  const world = {
    screen: 'title', levelIndex: 0, score: 0, launchesLeft: 0,
    collected: new Set(), flight: null, phase: 'aim',
    aim: { active: false, vx: 0, vy: 0, preview: null }, trail: [], events: [], steps: 0, muted: false,
    seed,
    level() { return LEVELS[this.levelIndex]; },
    startGame() {
      this.score = 0;
      this.levelIndex = 0;
      this.loadLevel(0);
      this.screen = 'play';
    },
    loadLevel(index) {
      this.levelIndex = index;
      const level = this.level();
      this.launchesLeft = level.launches;
      this.collected = new Set();
      this.collectedSteps = {};
      this.levelStartStep = this.steps;
      this.flight = null;
      this.phase = 'aim';
      this.aim = { active: false, vx: 0, vy: 0, preview: null };
      this.trail = [];
    },
    beginAim(x, y) {
      if (this.screen !== 'play' || this.phase !== 'aim') return false;
      this.aim.active = true;
      return this.updateAim(x, y);
    },
    updateAim(x, y) {
      if (this.screen !== 'play' || this.phase !== 'aim' || !this.aim.active) return false;
      const launcher = this.level().launcher;
      let vx = (launcher.x - x) * AIM_SCALE;
      let vy = (launcher.y - y) * AIM_SCALE;
      const speed = Math.hypot(vx, vy);
      if (speed > PROBE.maxSpeed) {
        const scale = PROBE.maxSpeed / speed;
        vx *= scale;
        vy *= scale;
      }
      this.aim.vx = vx;
      this.aim.vy = vy;
      if (Math.hypot(vx, vy) < PROBE.minSpeed) {
        this.aim.preview = null;
        return false;
      }
      this.aim.preview = simulateFlight(this.level(), vx, vy, 6).points;
      return true;
    },
    releaseAim() {
      if (this.screen !== 'play' || this.phase !== 'aim' || !this.aim.active || !this.aim.preview) {
        this.cancelAim();
        return false;
      }
      this.flight = createFlight(this.level(), this.aim.vx, this.aim.vy);
      this.launchesLeft -= 1;
      this.phase = 'fly';
      this.aim = { active: false, vx: 0, vy: 0, preview: null };
      this.trail = [{ x: this.flight.x, y: this.flight.y }];
      this.events.push('launch');
      return true;
    },
    cancelAim() { this.aim = { active: false, vx: 0, vy: 0, preview: null }; },
    step() {
      this.steps += 1;
      if (this.screen !== 'play' || this.phase !== 'fly' || !this.flight) return;
      const outcome = stepFlight(this.level(), this.flight, STEP);
      for (const event of this.flight.events) this.events.push(event);
      this.flight.events = [];
      this.trail.push({ x: this.flight.x, y: this.flight.y });
      if (this.trail.length > 90) this.trail.shift();
      for (const star of this.flight.collected) {
        if (!this.collected.has(star)) {
          this.collected.add(star);
          this.collectedSteps[star] = this.steps;
          this.events.push('star');
        }
      }
      if (outcome === EVENT_PORTAL) {
        this.score += SCORE.complete + SCORE.star * this.collected.size + SCORE.launchBonus * this.launchesLeft;
        if (this.levelIndex === LEVELS.length - 1) this.screen = 'won';
        else this.screen = 'complete';
        this.phase = 'aim';
        this.events.push(this.screen === 'won' ? 'win' : 'portal');
      } else if (outcome === EVENT_CRASH || outcome === EVENT_LOST) {
        this.events.push(outcome === EVENT_CRASH ? 'crash' : 'lost');
        this.flight = null;
        this.trail = [];
        if (this.launchesLeft > 0) this.phase = 'aim';
        else this.screen = 'lost';
      }
    },
    confirm() {
      if (this.screen === 'title') this.startGame();
      else if (this.screen === 'complete') {
        this.loadLevel(this.levelIndex + 1);
        this.screen = 'play';
      } else if (this.screen === 'lost') {
        this.loadLevel(this.levelIndex);
        this.screen = 'play';
      } else if (this.screen === 'won') this.startGame();
      else return false;
      this.events.push('click');
      return true;
    },
    togglePause() {
      if (this.screen === 'play') this.screen = 'paused';
      else if (this.screen === 'paused') this.screen = 'play';
      else return false;
      return true;
    },
    restartLevel() {
      if (!['play', 'paused', 'lost'].includes(this.screen)) return false;
      this.loadLevel(this.levelIndex);
      this.screen = 'play';
      return true;
    },
    drainEvents() {
      const pending = this.events;
      this.events = [];
      return pending;
    },
  };
  return world;
}
