/**
 * Seeded PRNG (mulberry32). The state is a single 32-bit integer stored in the
 * game state, so a mission replays identically given the same seed and the
 * same sequence of commander actions — which is what makes the engine testable.
 */
export class Rng {
  state: number;
  constructor(state: number) {
    this.state = state >>> 0;
  }
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  /** Weighted pick; returns undefined for an empty list. */
  pickWeighted<T>(items: T[], weight: (t: T) => number): T | undefined {
    const total = items.reduce((s, i) => s + Math.max(0, weight(i)), 0);
    if (total <= 0) return undefined;
    let r = this.next() * total;
    for (const i of items) {
      r -= Math.max(0, weight(i));
      if (r < 0) return i;
    }
    return items[items.length - 1];
  }
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}
