// Small deterministic toy data shared by the interactive explainers.
// The same seed always gives the same points, so the animations are reproducible.
export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function gauss(r) {
  let u = 0
  while (u === 0) u = r()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r())
}

export const X_MAX = 10
export const SIGMA = 0.45 // the noise we can never predict
export const truth = (x) => Math.sin(x * 0.9) * 2 + 0.25 * x

export function sample(n, seed) {
  const r = rng(seed)
  return Array.from({ length: n }, () => r() * X_MAX)
    .sort((a, b) => a - b)
    .map((x) => ({ x, y: truth(x) + SIGMA * gauss(r) }))
}

export const gridXs = (n = 120) => Array.from({ length: n }, (_, i) => (i / (n - 1)) * X_MAX)
export const rmse = (errs) => Math.sqrt(errs.reduce((s, e) => s + e * e, 0) / errs.length)
