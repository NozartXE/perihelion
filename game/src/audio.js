// Small synthesized sound palette. Audio is created only after an explicit unlock.
export function createAudio() {
  let context = null;
  let master = null;
  let muted = false;
  let noise = null;

  function unlock() {
    if (context || typeof window === 'undefined' || typeof window.AudioContext !== 'function') return;
    try {
      context = new window.AudioContext();
      master = context.createGain();
      master.gain.value = 0.15;
      master.connect(context.destination);
      // Fixed LCG noise keeps the effect reproducible and avoids Math.random.
      noise = context.createBuffer(1, Math.ceil(context.sampleRate * 0.3), context.sampleRate);
      const data = noise.getChannelData(0);
      let state = 0x51f15e;
      for (let i = 0; i < data.length; i += 1) {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        data[i] = (state / 0x80000000) - 1;
      }
      if (context.state === 'suspended') context.resume().catch(() => {});
    } catch (_) {
      context = null;
      master = null;
      noise = null;
    }
  }

  function tone(freq, type, start, duration, endFreq = freq, gain = 0.8) {
    if (!context || muted) return;
    const now = context.currentTime + start;
    const osc = context.createOscillator();
    const amp = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(1, freq), now);
    if (endFreq !== freq) osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), now + duration);
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.exponentialRampToValueAtTime(gain, now + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(amp);
    amp.connect(master);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  function noiseBurst(duration) {
    if (!context || muted || !noise) return;
    const now = context.currentTime;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const amp = context.createGain();
    source.buffer = noise;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1500, now);
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.exponentialRampToValueAtTime(0.9, now + 0.008);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter);
    filter.connect(amp);
    amp.connect(master);
    source.start(now);
    source.stop(now + duration + 0.01);
  }

  return {
    unlock,
    setMuted(value) { muted = Boolean(value); },
    isMuted() { return muted; },
    launch() { tone(300, 'sawtooth', 0, 0.25, 90); },
    star() {
      tone(1320, 'sine', 0, 0.06, 1320);
      tone(1760, 'sine', 0.06, 0.06, 1760);
    },
    crash() { noiseBurst(0.3); tone(70, 'sine', 0, 0.3, 48); },
    surge() { tone(90, 'sawtooth', 0, 0.8, 420, 0.65); noiseBurst(0.55); },
    portal() {
      tone(660, 'sine', 0, 0.13);
      tone(880, 'sine', 0.11, 0.13);
      tone(1320, 'sine', 0.22, 0.13);
    },
    click() { tone(1200, 'square', 0, 0.04, 1200, 0.45); },
    win() {
      [660, 880, 1100, 1320].forEach((frequency, index) => tone(frequency, 'sine', index * 0.09, 0.16));
    },
  };
}
