import { useMemo, useState } from 'react'
import { rng, gauss } from '../../lib/toy.js'
import Shell, { Seg, Slider, Spark, path } from './Shell.jsx'

// 8 features; only the first 3 matter, and feature 4 is a noisy copy of feature 1.
const P = 8
const TRUE = [3, -2, 1.5, 0, 0, 0, 0, 0]
const NAMES = ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4', 'Feature 5', 'Feature 6', 'Feature 7', 'Feature 8']
const GRID = Array.from({ length: 41 }, (_, i) => 4 * Math.pow(0.005 / 4, i / 40)) // 4 down to 0.005

function make(n, seed) {
  const r = rng(seed)
  const X = [], y = []
  for (let i = 0; i < n; i++) {
    const x = Array.from({ length: P }, () => gauss(r))
    x[3] = x[0] + 0.3 * gauss(r)
    X.push(x)
    y.push(x.reduce((s, v, j) => s + v * TRUE[j], 0) + 2 * gauss(r))
  }
  return { X, y }
}
const TR = make(40, 17), VA = make(400, 99)
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length
const mu = Array.from({ length: P }, (_, j) => mean(TR.X.map((r) => r[j])))
const sd = Array.from({ length: P }, (_, j) => Math.sqrt(mean(TR.X.map((r) => (r[j] - mu[j]) ** 2))))
const ym = mean(TR.y)
const Z = TR.X.map((r) => r.map((v, j) => (v - mu[j]) / sd[j]))
const yc = TR.y.map((v) => v - ym)
const n = Z.length

function ridge(lam) {
  const A = Array.from({ length: P }, (_, a) => Array.from({ length: P }, (_, b) => Z.reduce((s, r) => s + r[a] * r[b], 0) / n + (a === b ? lam : 0)))
  const c = Array.from({ length: P }, (_, a) => Z.reduce((s, r, i) => s + r[a] * yc[i], 0) / n)
  for (let i = 0; i < P; i++) {
    let m = i; for (let k = i + 1; k < P; k++) if (Math.abs(A[k][i]) > Math.abs(A[m][i])) m = k
    ;[A[i], A[m]] = [A[m], A[i]]; ;[c[i], c[m]] = [c[m], c[i]]
    for (let k = i + 1; k < P; k++) { const f = A[k][i] / A[i][i]; for (let j = i; j < P; j++) A[k][j] -= f * A[i][j]; c[k] -= f * c[i] }
  }
  const b = new Array(P).fill(0)
  for (let i = P - 1; i >= 0; i--) b[i] = (c[i] - A[i].slice(i + 1).reduce((s, v, j) => s + v * b[i + 1 + j], 0)) / A[i][i]
  return b
}
const soft = (v, t) => Math.sign(v) * Math.max(Math.abs(v) - t, 0)
function lasso(lam) {
  const b = new Array(P).fill(0)
  for (let it = 0; it < 300; it++) {
    for (let j = 0; j < P; j++) {
      let rho = 0
      for (let i = 0; i < n; i++) { let pred = 0; for (let k = 0; k < P; k++) if (k !== j) pred += Z[i][k] * b[k]; rho += Z[i][j] * (yc[i] - pred) }
      b[j] = soft(rho / n, lam)
    }
  }
  return b
}
const vErr = (b) => Math.sqrt(mean(VA.X.map((r, i) => (r.reduce((s, v, j) => s + ((v - mu[j]) / sd[j]) * b[j], 0) + ym - VA.y[i]) ** 2)))
const PATHS = { l2: GRID.map(ridge), l1: GRID.map(lasso) }
const ERRS = { l2: PATHS.l2.map(vErr), l1: PATHS.l1.map(vErr) }
// Convert standardized coefficients back to the original feature scale for comparison with TRUE.
const orig = (b) => b.map((v, j) => v / sd[j])

const W = 640, BH = 250
export default function Regularization({ onClose }) {
  const [kind, setKind] = useState('l1')
  const [idx, setIdx] = useState(12) // index into GRID (large lambda at 0)
  const b = useMemo(() => orig(PATHS[kind][idx]), [kind, idx])
  const lam = GRID[idx]
  const errs = ERRS[kind]
  const best = errs.indexOf(Math.min(...errs))
  const zeros = b.filter((v) => Math.abs(v) < 1e-6).length
  const maxC = 3.6
  const rowH = 24
  const px = (i) => 16 + (i / (GRID.length - 1)) * (W - 32)
  const py = (v) => BH / 2 - (v / maxC) * (BH / 2 - 14)

  const caption = kind === 'l1'
    ? `At this strength ${zeros} of 8 coefficients are exactly zero. The L1 penalty pushes weak or redundant features all the way to zero, which is why lasso doubles as feature selection. Notice that it tends to keep one of two near-duplicate features (1 and 4) and drop the other.`
    : 'No coefficient reaches exactly zero. The L2 penalty shrinks every coefficient toward zero in proportion to its size, and splits the weight between near-duplicate features (1 and 4) instead of choosing one.'

  return (
    <Shell title="Regularization: L1 versus L2" intro="Eight features, 40 training rows, only three real signals. Raise the penalty and watch the coefficients shrink. The tick on each bar marks the true coefficient."
      onClose={onClose}
      note="Linear regression on standardized features, solved exactly (ridge) or by coordinate descent (lasso). Validation error is measured on 400 fresh rows. Toy data with a fixed seed; the best penalty depends on the sample.">
      <div className="flex flex-wrap gap-3 mb-3">
        <Seg label="Penalty" value={kind} onChange={setKind} options={[{ id: 'l1', label: 'L1 (lasso)' }, { id: 'l2', label: 'L2 (ridge)' }]} />
      </div>

      <svg viewBox={`0 0 ${W} ${rowH * P + 12}`} className="w-full h-auto" role="img" aria-label="Coefficient sizes at the chosen penalty">
        <line x1={W / 2} x2={W / 2} y1="0" y2={rowH * P + 4} stroke="hsl(var(--border))" />
        {b.map((v, j) => {
          const w = (Math.abs(v) / maxC) * (W / 2 - 110)
          const x0 = W / 2
          return (
            <g key={j} transform={`translate(0 ${j * rowH + 4})`}>
              <text x="8" y="14" fontSize="12" fill="hsl(var(--muted-foreground))">{NAMES[j]}</text>
              <rect x={v >= 0 ? x0 : x0 - w} y="3" width={Math.max(w, 0)} height="14" rx="3" fill={TRUE[j] !== 0 ? 'hsl(var(--primary))' : '#94a3b8'} style={{ transition: 'all 200ms' }} />
              <line x1={x0 + (TRUE[j] / maxC) * (W / 2 - 110)} x2={x0 + (TRUE[j] / maxC) * (W / 2 - 110)} y1="0" y2="20" stroke="#e11d48" strokeWidth="2.5" />
              <text x={W - 8} y="14" fontSize="12" textAnchor="end" className="tabular-nums" fill="hsl(var(--foreground))">{Math.abs(v) < 1e-6 ? '0' : v.toFixed(2)}</text>
            </g>
          )
        })}
      </svg>

      <div className="mt-3">
        <Slider label="Penalty strength (lambda)" value={GRID.length - 1 - idx} min={0} max={GRID.length - 1} onChange={(v) => setIdx(GRID.length - 1 - v)} display={lam.toFixed(3)} />
      </div>
      <p className="mt-3 text-[15px] leading-relaxed min-h-[5.5rem]" aria-live="polite">{caption}</p>

      <div className="grid gap-4 sm:grid-cols-2 mt-2">
        <div>
          <div className="text-sm font-semibold mb-1">Coefficients as the penalty grows</div>
          <svg viewBox={`0 0 ${W / 2 + 40} ${BH / 1.4}`} className="w-full h-auto" role="img" aria-label="Coefficient paths">
            <g transform="scale(0.55 0.7)">
              <line x1="16" x2={W - 16} y1={BH / 2} y2={BH / 2} stroke="hsl(var(--border))" />
              {PATHS[kind][0].map((_, j) => (
                <path key={j} d={path(GRID.map((_, i) => [px(i), py(orig(PATHS[kind][i])[j])]))} fill="none" stroke={TRUE[j] !== 0 ? 'hsl(var(--primary))' : '#94a3b8'} strokeWidth="3" />
              ))}
              <line x1={px(idx)} x2={px(idx)} y1="6" y2={BH - 6} stroke="hsl(var(--foreground))" strokeOpacity="0.5" />
            </g>
          </svg>
          <p className="text-xs text-muted-foreground mt-1">Left: strong penalty. Right: almost none. Green lines are the real signals.</p>
        </div>
        <Spark title="Validation error" readout={`now ${errs[idx].toFixed(2)}, best ${errs[best].toFixed(2)}`}
          series={[{ values: errs, color: 'hsl(var(--primary))', label: 'validation' }]} xs={GRID} cur={idx} yMax={Math.max(...errs) * 1.05}
          xLabel={['strong penalty', 'weak penalty']} />
      </div>
    </Shell>
  )
}
