// Browser boot and the single fixed-step animation loop.
import { BEST_KEY, LEVELS, STEP } from './config.js';
import { createWorld } from './world.js';
import { createRenderer } from './render.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const parsedSeed = Number(params.get('seed'));
const seed = params.has('seed') && Number.isFinite(parsedSeed) ? Math.trunc(parsedSeed) : Math.floor(Math.random() * 4294967296);
const shot = params.get('shot');
const parsedLevel = Number(params.get('level'));
const level = params.has('level') && Number.isFinite(parsedLevel) && Number.isInteger(parsedLevel)
  ? Math.max(0, Math.min(LEVELS.length - 1, parsedLevel)) : null;
const canvas = document.querySelector('#game');
const status = document.querySelector('#status');
const world = createWorld(seed);
const renderer = createRenderer(canvas);
const audio = createAudio();
let best = 0;
try { best = Math.max(0, Number(localStorage.getItem(BEST_KEY)) || 0); } catch (_) { /* storage can be disabled */ }

function updateStatus() {
  const label = world.screen.toUpperCase();
  status.textContent = `${label} — score ${world.score}`;
}
let previousScreen = world.screen;

function playEvents(events) {
  for (const event of events) {
    if (event === 'launch') audio.launch();
    else if (event === 'star') audio.star();
    else if (event === 'crash' || event === 'lost') audio.crash();
    else if (event === 'portal') audio.portal();
    else if (event === 'wormhole') audio.portal();
    else if (event === 'win') audio.win();
    else if (event === 'click') audio.click();
  }
}

function saveBestIfEnded() {
  if (world.screen !== 'won' && world.screen !== 'lost') return;
  if (world.score > best) {
    best = world.score;
    try { localStorage.setItem(BEST_KEY, String(best)); } catch (_) { /* storage can be disabled */ }
  }
}

if (shot === 'start' || shot === 'play' || shot === 'end') {
  stageShot(shot, world, level);
  previousScreen = world.screen;
  updateStatus();
  renderer.draw(world, best);
  requestAnimationFrame(() => {
    renderer.draw(world, best);
    requestAnimationFrame(() => { renderer.draw(world, best); window.__shotReady = true; });
  });
} else {
  const input = createInput(canvas, world, renderer, audio);
  let last = 0;
  let accumulator = 0;
  const MAX_FRAME = 0.25;
  function frame(timestamp) {
    const now = timestamp / 1000;
    if (document.hidden) {
      // Discard hidden time so returning to the tab never simulates a long catch-up.
      last = now;
      accumulator = 0;
      renderer.draw(world, best);
      requestAnimationFrame(frame);
      return;
    }
    if (last === 0) last = now;
    accumulator += Math.min(MAX_FRAME, Math.max(0, now - last));
    last = now;
    while (accumulator >= STEP) {
      world.step();
      accumulator -= STEP;
      playEvents(world.drainEvents());
      saveBestIfEnded();
      if (world.screen !== previousScreen) { previousScreen = world.screen; updateStatus(); }
    }
    renderer.draw(world, best);
    requestAnimationFrame(frame);
  }
  updateStatus();
  requestAnimationFrame(frame);
  // Keep a disposal hook available for embedding and hot reload environments.
  window.__perihelionDispose = () => input.dispose();
}
