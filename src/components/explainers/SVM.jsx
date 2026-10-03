import { useMemo, useState } from 'react'
import { rng, gauss } from '../../lib/toy.js'
import Shell, { Seg, Slider } from './Shell.jsx'

const W = 640, H = 330
const sx = (x) => 14 + (x / 10) * (W - 28)
const sy = (y) => H - 14 - (y / 10) * (H - 28)

function blobs(outlier) {
  const r = rng(31)
  const pts = []
  for (let i = 0; i < 28; i++) pts.push({ x: 3 + 1.0 * gauss(r), y: 3.4 + 1.0 * gauss(r), c: -1 })
  for (let i = 0; i < 28; i++) pts.push({ x: 7 + 1.0 * gauss(r), y: 6.6 + 1.0 * gauss(r), c: 1 })
  if (outlier) pts.push({ x: 7.2, y: 2.6, c: -1 })
  return pts
}

// Linear SVM by sub-gradient descent on: lambda/2 |w|^2 + mean hinge loss, with lambda = 1 / (C n).
function train(pts, C) {
  const n = pts.length, lam = 1 / (C * n)
  let w = [0, 0], b = 0
  for (let t = 1; t <= 6000; t++) {
    const lr = 1 / Math.sqrt(t) * 0.6
    let gw = [lam * w[0], lam * w[1]], gb = 0
    for (const p of pts) {
      const x = p.x - 5, y = p.y - 5
      if (p.c * (w[0] * x + w[1] * y + b) < 1) { gw[0] -= (p.c * x) / n; gw[1] -= (p.c * y) / n; gb -= p.c / n }
    }
    w = [w[0] - lr * gw[0], w[1] - lr * gw[1]]; b -= lr * gb
  }
  return { w, b }
}

const CS = [0.01, 0.03, 0.1, 0.3, 1, 3, 10, 100, 1000]

// Kernel view: an inner disc versus an outer ring cannot be split by a line, but can by distance from the centre.
const rr = rng(14)
const RING = Array.from({ length: 120 }, () => {
  const inner = rr() < 0.5
  const rad = inner ? Math.abs(gauss(rr)) * 0.9 : 2.8 + rr() * 1.8
  const a = rr() * Math.PI * 2
  return { x: 5 + rad * Math.cos(a), y: 5 + rad * Math.sin(a), c: inner ? 1 : -1 }
})
const linAcc = (() => { let best = 0; for (let k = 0; k < 360; k += 2) { const t = (k * Math.PI) / 180; const s = RING.map((p) => (p.x - 5) * Math.cos(t) + (p.y - 5) * Math.sin(t)); for (const th of s) { const a = RING.filter((p, i) => (s[i] > th ? 1 : -1) === p.c).length / RING.length; best = Math.max(best, a, 1 - a) } } return best })()
const r2 = RING.map((p) => (p.x - 5) ** 2 + (p.y - 5) ** 2)
const thr = (() => { let best = [0, 0]; for (const th of r2) { const a = RING.filter((p, i) => (r2[i] < th ? 1 : -1) === p.c).length / RING.length; if (a > best[0]) best = [a, th] } return best })()

export default function SVM({ onClose }) {
  const [view, setView] = useState('margin')
  const [ci, setCi] = useState(4)
  const [outlier, setOutlier] = useState(false)
  const pts = useMemo(() => blobs(outlier), [outlier])
  const C = CS[ci]
  const { w, b } = useMemo(() => train(pts, C), [pts, C])
  const norm = Math.hypot(w[0], w[1]) || 1e-9
  const score = (p) => w[0] * (p.x - 5) + w[1] * (p.y - 5) + b
  const sv = pts.filter((p) => p.c * score(p) <= 1.0001)
  const errs = pts.filter((p) => p.c * score(p) <= 0).length
  const margin = 2 / norm
  // line: w.(x-5, y-5) + b = k  -> endpoints across the plot
  const lineAt = (k) => {
    const ends = []
    for (const x of [0, 10]) { const y = (k - b - w[0] * (x - 5)) / (w[1] || 1e-9) + 5; ends.push([x, y]) }
    return ends
  }
  const L0 = lineAt(0), Lp = lineAt(1), Lm = lineAt(-1)
  const seg = (L, st, extra = {}) => <line x1={sx(L[0][0])} y1={sy(L[0][1])} x2={sx(L[1][0])} y2={sy(L[1][1])} stroke={st} {...extra} />

  return (
    <Shell title="Support vector machines" intro="A linear SVM picks the boundary with the widest empty street between the classes. Only the points on the edge of the street matter."
      onClose={onClose}
      note="The margin view trains a linear SVM here by gradient descent on the hinge loss; C is the usual penalty on violations. The kernel view compares the best possible straight cut with a cut on distance from the centre, the idea behind the RBF kernel.">
      <div className="mb-3"><Seg label="View" value={view} onChange={setView} options={[{ id: 'margin', label: 'Margin and C' }, { id: 'kernel', label: 'When a line is not enough' }]} /></div>
      {view === 'margin' ? (
        <>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded-xl bg-muted/40 overflow-hidden" role="img" aria-label="Linear SVM boundary and margin">
            {seg(Lp, 'hsl(var(--foreground))', { strokeOpacity: 0.35, strokeDasharray: '6 5', strokeWidth: 1.5 })}
            {seg(Lm, 'hsl(var(--foreground))', { strokeOpacity: 0.35, strokeDasharray: '6 5', strokeWidth: 1.5 })}
            {seg(L0, 'hsl(var(--primary))', { strokeWidth: 3 })}
            {pts.map((p, i) => <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r="5" fill={p.c > 0 ? '#0f766e' : '#e11d48'} stroke={sv.includes(p) ? 'hsl(var(--foreground))' : 'hsl(var(--card))'} strokeWidth={sv.includes(p) ? 2.5 : 1.5} />)}
          </svg>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 items-end">
            <Slider label="C (how much a misplaced point costs)" value={ci} min={0} max={CS.length - 1} onChange={setCi} display={String(C)} />
            <label className="inline-flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={outlier} onChange={(e) => setOutlier(e.target.checked)} className="w-4 h-4 accent-primary" /> Add one stray point inside the other class</label>
          </div>
          <p className="mt-3 text-sm tabular-nums text-muted-foreground">Street width {margin.toFixed(2)}, support vectors (outlined) {sv.length}, training mistakes {errs}</p>
          <p className="mt-2 text-[15px] leading-relaxed min-h-[5.5rem]" aria-live="polite">
            {C <= 0.3 ? 'Small C: violations are cheap, so the street is wide and many points sit on or inside it. The boundary is smooth and ignores individual stray points.'
              : C >= 100 ? 'Large C: every misplaced point is expensive, so the boundary bends its street narrower to get them right. With a stray point present it swings toward it. This is how an SVM overfits.'
                : 'In the middle: a reasonably wide street with few mistakes. Only the outlined points define the boundary; delete any other point and nothing moves.'}
          </p>
        </>
      ) : (
        <>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded-xl bg-muted/40" role="img" aria-label="Inner disc and outer ring">
            {RING.map((p, i) => <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r="4.5" fill={p.c > 0 ? '#0f766e' : '#e11d48'} />)}
            <circle cx={sx(5)} cy={sy(5)} r={Math.sqrt(thr[1]) * ((W - 28) / 10)} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeDasharray="6 5" />
          </svg>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
            <div className="rounded-xl border border-border p-3"><div className="font-semibold">Best straight line</div><div className="text-2xl tabular-nums mt-1">{(linAcc * 100).toFixed(0)}%</div><div className="text-muted-foreground">Any line leaves both classes on both sides.</div></div>
            <div className="rounded-xl border border-border p-3"><div className="font-semibold">Cut on distance from centre</div><div className="text-2xl tabular-nums mt-1">{(thr[0] * 100).toFixed(0)}%</div><div className="text-muted-foreground">One extra feature, distance squared, makes the classes separable by a single threshold (the dashed circle).</div></div>
          </div>
          <p className="mt-3 text-[15px] leading-relaxed">A kernel does this implicitly: it measures similarity between points as if they had been lifted into a space with extra features like distance from the centre, and fits a straight margin there. Back in the original plot that margin appears as a curve.</p>
        </>
      )}
    </Shell>
  )
}
