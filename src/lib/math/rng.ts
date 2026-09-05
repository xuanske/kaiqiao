export type Rng = {
  int: (min: number, max: number) => number;
  pick: <T>(xs: readonly T[]) => T;
  chance: (p: number) => boolean;
  shuffle: <T>(xs: readonly T[]) => T[];
};

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => {
    const lo = Math.ceil(Math.min(min, max));
    const hi = Math.floor(Math.max(min, max));
    return lo + Math.floor(next() * (hi - lo + 1));
  };
  const pick = <T,>(xs: readonly T[]): T => {
    if (!xs.length) throw new Error("empty pick");
    return xs[int(0, xs.length - 1)] as T;
  };
  const chance = (p: number) => next() < p;
  const shuffle = <T,>(xs: readonly T[]): T[] => {
    const out = xs.slice();
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = int(0, i);
      const tmp = out[i] as T;
      out[i] = out[j] as T;
      out[j] = tmp;
    }
    return out;
  };
  return { int, pick, chance, shuffle };
}

export function randomRng(): Rng {
  return mulberry32((Math.random() * 0xffffffff) >>> 0);
}
