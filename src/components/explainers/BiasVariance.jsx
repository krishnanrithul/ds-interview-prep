import { useEffect, useMemo, useState } from 'react'
import { Play, Pause, X } from 'lucide-react'
import { sample, gridXs, truth, X_MAX, SIGMA } from '../../lib/toy.js'
import { biasVariance } from '../../lib/polyfit.js'
import { useTween } from '../../hooks/useTween.js'

const TRAIN = sample(18, 3)
const VALID = sample(300, 11)
const OTHERS = Array.from({ length: 24 }, (_, i) => sample(18, 100 + i))
const GX = gridXs()
const MAXD = 12
const W = 640, H = 270, EH = 140
const sx = (x) => 34 + (x / X_MAX) * (W - 50)
const sy = (y) => H - 22 - ((y + 3) / 8.6) * (H - 40)
const dx = (d) => 44 + ((d - 1) / (MAXD - 1)) * (W - 70)
const ey = (e) => EH - 30 - (Math.min(e, 2.6) / 2.6) * (EH - 44)
const line = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('')

function caption(d, best) {
  if (d < best - 0) return 'Too simple. The curve cannot bend enough to follow the pattern, so it is wrong on the training points and on new data alike. That consistent miss is bias. Collecting more data would not fix it.'
  if (d <= best + 1) return 'Close to the best balance. The curve follows the pattern without chasing every dot, and it behaves much the same on other samples.'
  return 'Too flexible. The curve twists to hit individual dots, so training error is tiny but validation error is high. Turn on the other samples: the curve changes wildly from one to the next. That sensitivity is variance.'
}

export default function BiasVariance({ onClose }) {
  const [degree, setDegree] = useState(1)
  const [others, setOthers] = useState(false)
  const [playing, setPlaying] = useState(false)
  const { rows, best } = useMemo(() => biasVariance(TRAIN, VALID, OTHERS, MAXD), [])
  const row = rows[degree - 1]

  useEffect(() => {
    if (!playing) return
    if (degree >= MAXD) { setPlaying(false); return }
    const t = setTimeout(() => setDegree((v) => v + 1), 900)
    return () => clearTimeout(t)
  }, [playing, degree])

  const target = useMemo(() => [...row.curve, ...row.others.flat()], [row])
  const tw = useTween(target, 500)
  const n = GX.length
  const mainPath = line(tw.slice(0, n).map((y, i) => [sx(GX[i]), sy(y)]))
  const otherPaths = row.others.map((_, j) => line(tw.slice(n * (j + 1), n * (j + 2)).map((y, i) => [sx(GX[i]), sy(y)])))
  const truthPath = line(GX.map((x) => [sx(x), sy(truth(x))]))

  return (
    <section className="anim-msg rounded-2xl border border-border bg-card p-4 sm:p-5" aria-label="The bias-variance tradeoff">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-serif text-xl font-semibold">The bias-variance tradeoff</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Fit the same 18 dots with a more and more flexible curve. The dashed line is the real pattern, which the model does not get to see.</p>
        </div>
        <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"><X className="w-4 h-4" /></button>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`Polynomial of degree ${degree} fitted to 18 points`}>
        <defs><clipPath id="bv-clip"><rect x="34" y="4" width={W - 50} height={H - 26} /></clipPath></defs>
        <line x1="34" y1={H - 22} x2={W - 16} y2={H - 22} stroke="hsl(var(--border))" />
        <g clipPath="url(#bv-clip)">
          <path d={truthPath} fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeDasharray="6 5" />
          {others && otherPaths.map((d, i) => <path key={i} d={d} fill="none" stroke="hsl(var(--foreground))" strokeOpacity="0.22" strokeWidth="1.5" />)}
          <path d={mainPath} fill="none" stroke="hsl(var(--primary))" strokeWidth="3.5" strokeLinejoin="round" />
        </g>
        {TRAIN.map((p, i) => <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r="4.5" fill="hsl(var(--foreground))" fillOpacity="0.85" />)}
      </svg>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3">
        <button onClick={() => { if (degree >= MAXD) setDegree(1); setPlaying((p) => !p) }} className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold px-3.5 py-2 rounded-xl hover:opacity-90">
          {playing ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Sweep complexity</>}
        </button>
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={others} onChange={(e) => setOthers(e.target.checked)} className="w-4 h-4 accent-primary" />
          Show the fit on 8 other samples
        </label>
      </div>

      <label className="block mt-4 text-sm">
        <span className="flex justify-between mb-1"><span>Model complexity (polynomial degree)</span><span className="tabular-nums font-medium">{degree}</span></span>
        <input type="range" min="1" max={MAXD} value={degree} onChange={(e) => { setPlaying(false); setDegree(+e.target.value) }} className="w-full accent-primary" />
      </label>

      <p className="mt-4 text-[15px] leading-relaxed min-h-[5.5rem]" aria-live="polite">{caption(degree, best)}</p>

      <div className="mt-2">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="font-semibold">Typical error at each complexity</span>
          <span className="tabular-nums text-muted-foreground">training {row.avgTrain.toFixed(2)}, validation {row.avgValid.toFixed(2)}</span>
        </div>
        <svg viewBox={`0 0 ${W} ${EH}`} className="w-full h-auto" role="img" aria-label="Training and validation error against model complexity">
          <line x1="34" y1={EH - 30} x2={W - 16} y2={EH - 30} stroke="hsl(var(--border))" />
          <line x1="34" x2={W - 16} y1={ey(SIGMA)} y2={ey(SIGMA)} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeOpacity="0.6" />
          <text x={W - 18} y={ey(SIGMA) - 5} fontSize="12" textAnchor="end" fill="hsl(var(--muted-foreground))">noise nobody can predict</text>
          <path d={line(rows.map((r) => [dx(r.degree), ey(r.avgTrain)]))} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" />
          <path d={line(rows.map((r) => [dx(r.degree), ey(r.avgValid)]))} fill="none" stroke="#e11d48" strokeWidth="2.5" />
          <line x1={dx(degree)} x2={dx(degree)} y1="6" y2={EH - 30} stroke="hsl(var(--foreground))" strokeOpacity="0.5" />
          <circle cx={dx(degree)} cy={ey(row.avgTrain)} r="4.5" fill="hsl(var(--primary))" />
          <circle cx={dx(degree)} cy={ey(row.avgValid)} r="4.5" fill="#e11d48" />
          <text x="34" y="14" fontSize="12" fill="hsl(var(--primary))">training</text>
          <text x="90" y="14" fontSize="12" fill="#e11d48">validation</text>
          <text x="34" y={EH - 8} fontSize="12" fill="hsl(var(--muted-foreground))">simpler: high bias</text>
          <text x={W - 16} y={EH - 8} fontSize="12" textAnchor="end" fill="hsl(var(--muted-foreground))">more flexible: high variance</text>
        </svg>
      </div>

      <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
        Toy example: polynomials fitted to 18 made-up points. The error chart is averaged over 25 different training samples, so the pattern does not depend on one lucky dataset. Validation error is measured on 300 fresh points and is clipped at the top of the chart.
      </p>
    </section>
  )
}
