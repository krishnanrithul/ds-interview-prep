import { gridXs, rmse, X_MAX } from './toy.js'

// Least-squares polynomial fit in a Chebyshev basis (stable up to high degrees), with a tiny ridge.
const basis = (x, degree) => {
  const t = (x / X_MAX) * 2 - 1
  const b = [1, t]
  for (let k = 2; k <= degree; k++) b.push(2 * t * b[k - 1] - b[k - 2])
  return b.slice(0, degree + 1)
}

function solve(A, b) {
  const n = b.length
  const M = A.map((row, i) => [...row, b[i]])
  for (let c = 0; c < n; c++) {
    let p = c
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r
    ;[M[c], M[p]] = [M[p], M[c]]
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / M[c][c]
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]
    }
  }
  const w = Array(n).fill(0)
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n]
    for (let k = r + 1; k < n; k++) s -= M[r][k] * w[k]
    w[r] = s / M[r][r]
  }
  return w
}

export function fitPoly(points, degree, ridge = 1e-3) {
  const rows = points.map((p) => basis(p.x, degree))
  const m = degree + 1
  const A = Array.from({ length: m }, (_, i) => Array.from({ length: m }, (_, j) => rows.reduce((s, r) => s + r[i] * r[j], 0) + (i === j ? ridge : 0)))
  const b = Array.from({ length: m }, (_, i) => rows.reduce((s, r, k) => s + r[i] * points[k].y, 0))
  const w = solve(A, b)
  return (x) => basis(x, degree).reduce((s, v, i) => s + v * w[i], 0)
}

// For each degree: the fitted curve on `train`, curves fitted to other samples (to show variance),
// and training and validation error averaged over `train` plus every sample in `others`,
// so the bias-variance pattern is not an accident of one dataset.
export function biasVariance(train, valid, others, maxDegree) {
  const grid = gridXs()
  const all = [train, ...others]
  const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length
  const rows = []
  for (let d = 1; d <= maxDegree; d++) {
    const fits = all.map((s) => fitPoly(s, d))
    rows.push({
      degree: d,
      curve: grid.map(fits[0]),
      others: fits.slice(1, 9).map((f) => grid.map(f)),
      avgTrain: mean(all.map((s, i) => rmse(s.map((p) => p.y - fits[i](p.x))))),
      avgValid: mean(fits.map((f) => rmse(valid.map((p) => p.y - f(p.x))))),
    })
  }
  const best = rows.reduce((b, r) => (r.avgValid < b.avgValid ? r : b)).degree
  return { rows, best }
}
