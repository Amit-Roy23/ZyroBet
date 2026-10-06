// DO NOT EDIT - GENERATED FROM shared/engines/prng.ts
/**
 * Seeded pseudo-random number generator using Mulberry32.
 * Deterministic across platforms and engines (Node, Browser, Hermes, Deno).
 */
export interface PRNG {
  next(): number;
  nextInt(max: number): number;
  shuffle<T>(arr: T[]): T[];
}

export function mulberry32(seed: number): PRNG {
  let a = seed >>> 0;

  return {
    /**
     * Returns a float in [0, 1)
     */
    next(): number {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },

    /**
     * Returns an integer in [0, max - 1] (or 0 if max <= 0)
     */
    nextInt(max: number): number {
      if (max <= 0) return 0;
      return Math.floor(this.next() * max);
    },

    /**
     * Non-destructive Fisher-Yates shuffle using this seeded PRNG.
     */
    shuffle<T>(arr: T[]): T[] {
      const result = [...arr];
      for (let i = result.length - 1; i > 0; i--) {
        const j = this.nextInt(i + 1);
        const temp = result[i];
        result[i] = result[j];
        result[j] = temp;
      }
      return result;
    },
  };
}
