/** Deterministic LCG. Used instead of Math.random for initial render so SSR and hydration produce the same markup. */
export const makeRng = (seed: number) => {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};
