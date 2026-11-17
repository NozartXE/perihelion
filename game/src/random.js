// Small deterministic Mulberry32 stream; the mutable state stays inside the closure.
export function createRandom(seed) {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range(min, max) { return min + (max - min) * next(); },
    int(min, max) { return Math.floor(this.range(min, max + 1)); },
  };
}
