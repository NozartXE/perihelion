// DOM input adapter. The world remains the sole owner of game rules.
export function createInput(canvas, world, renderer, audio) {
  const point = (event) => renderer.toField(event.clientX, event.clientY);
  const onPointerDown = (event) => {
    event.preventDefault();
    audio.unlock();
    if (world.screen === 'paused') { world.togglePause(); return; }
    if (world.screen !== 'play') { world.confirm(); return; }
    if (world.phase === 'aim') {
      try { canvas.setPointerCapture(event.pointerId); } catch (_) { /* capture may be unavailable */ }
      const p = point(event); world.beginAim(p.x, p.y);
    }
  };
  const onPointerMove = (event) => {
    if (world.screen !== 'play' || world.phase !== 'aim' || !world.aim.active) return;
    const p = point(event); world.updateAim(p.x, p.y);
  };
  const onPointerUp = () => { if (world.aim.active) world.releaseAim(); };
  const onPointerCancel = () => { if (world.aim.active) world.cancelAim(); };
  const onKeyDown = (event) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
    if (event.code === 'Enter' || event.code === 'Space') { audio.unlock(); if (world.aim.active) return; world.confirm(); }
    else if (event.code === 'KeyR' && ['play', 'paused', 'lost'].includes(world.screen)) world.restartLevel();
    else if (event.code === 'KeyP' || event.code === 'Escape') world.togglePause();
    else if (event.code === 'KeyM') { world.muted = !world.muted; audio.setMuted(world.muted); }
  };
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerCancel);
  window.addEventListener('keydown', onKeyDown);
  return { dispose() {
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointercancel', onPointerCancel);
    window.removeEventListener('keydown', onKeyDown);
  } };
}
