import { useEffect, useMemo, useState } from 'react'
import { Plus, Play, Pause, RotateCcw, X } from 'lucide-react'
import { sample, gridXs, X_MAX } from '../../lib/toy.js'
import { boost } from '../../lib/boost.js'
import { useTween } from '../../hooks/useTween.js'

const TRAIN = sample(40, 7)
const VALID = sample(80, 99)
const GX = gridXs()
const MAX = 40
const W = 640, H = 270, EH = 180
const sx = (x) => 34 + (x / X_MAX) * (W - 50)
const sy = (y) => H - 22 - ((y + 3) / 8.6) * (H - 40)
const ex = (k) => 34 + (k / MAX) * (W - 50)
const ey = (e) => EH - 24 - (e / 1.8) * (EH - 38)
const line = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('')

function caption(k, best) {
  if (k === 0) return 'Start with the simplest model: predict the average everywhere. The gray lines are the residuals, how far each dot is from the prediction.'
  if (k === 1) return 'Fit a small tree to those residuals and add a fraction of it, set by the learning rate. The line moves toward the dots and the gray lines shrink.'
  if (k < best - 2) return 'Each new tree goes after what is still wrong. Training error and validation error both keep falling.'
  if (k <= best + 2) return 'Around here validation error stops improving. Early stopping would halt training about now.'
  return 'Training error keeps falling but validation error has turned upward: the trees are now fitting noise in the training data. A great training score does not promise a great score on new data.'
}

export default function Boosting({ onClose }) {
  const [eta, setEta] = useState(0.4)
  const [k, setK] = useState(0)
  const [playing, setPlaying] = useState(false)
  const model = useMemo(() => boost(TRAIN, VALID, { eta, rounds: MAX }), [eta])

  useEffect(() => {
    if (!playing) return
    if (k >= MAX) { setPlaying(false); return }
    const t = setTimeout(() => setK((v) => v + 1), 600)
    return () => clearTimeout(t)
  }, [playing, k])

  const curve = useTween(model.grid[k])
  const pred = useTween(model.train[k])
  const path = line(curve.map((y, i) => [sx(GX[i]), sy(y)]))
  const trainLine = line(model.trainErr.map((e, i) => [ex(i), ey(e)]))
  const validLine = line(model.validErr.map((e, i) => [ex(i), ey(e)]))

  return (
    <section className="anim-msg rounded-2xl border border-border bg-card p-4 sm:p-5" aria-label="How XGBoost builds its prediction">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-serif text-xl font-semibold">How XGBoost builds its prediction</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Each dot is a past observation. The line is the model's prediction. Add trees one at a time and watch it improve.</p>
        </div>
        <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"><X className="w-4 h-4" /></button>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`Scatter of 40 training points with the model's prediction after ${k} trees`}>
        <line x1="34" y1={H - 22} x2={W - 16} y2={H - 22} stroke="hsl(var(--border))" />
        {TRAIN.map((p, i) => (
          <line key={`r${i}`} x1={sx(p.x)} x2={sx(p.x)} y1={sy(p.y)} y2={sy(pred[i])} stroke="hsl(var(--muted-foreground))" strokeOpacity="0.45" strokeWidth="1.5" />
        ))}
        {TRAIN.map((p, i) => <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r="4" fill="hsl(var(--foreground))" fillOpacity="0.85" />)}
        <path d={path} fill="none" stroke="hsl(var(--primary))" strokeWidth="3.5" strokeLinejoin="round" />
      </svg>

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <button onClick={() => { setPlaying(false); setK((v) => Math.min(MAX, v + 1)) }} disabled={k >= MAX} className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold px-3.5 py-2 rounded-xl hover:opacity-90 disabled:opacity-40">
          <Plus className="w-4 h-4" /> Add a tree
        </button>
        <button onClick={() => { if (k >= MAX) setK(0); setPlaying((p) => !p) }} className="inline-flex items-center gap-1.5 border border-border text-sm font-semibold px-3.5 py-2 rounded-xl hover:bg-muted">
          {playing ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Play</>}
        </button>
        <button onClick={() => { setPlaying(false); setK(0) }} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground px-2 py-2">
          <RotateCcw className="w-4 h-4" /> Reset
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 mt-4 text-sm">
        <label className="block">
          <span className="flex justify-between mb-1"><span>Trees added</span><span className="tabular-nums font-medium">{k}</span></span>
          <input type="range" min="0" max={MAX} value={k} onChange={(e) => { setPlaying(false); setK(+e.target.value) }} className="w-full accent-primary" />
        </label>
        <label className="block">
          <span className="flex justify-between mb-1"><span>Learning rate</span><span className="tabular-nums font-medium">{eta.toFixed(2)}</span></span>
          <input type="range" min="0.05" max="1" step="0.05" value={eta} onChange={(e) => setEta(+e.target.value)} className="w-full accent-primary" />
        </label>
      </div>

      <p className="mt-4 text-[15px] leading-relaxed min-h-[3.5rem]" aria-live="polite">{caption(k, model.best)}</p>

      <div className="mt-2">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="font-semibold">Error as trees are added</span>
          <span className="tabular-nums text-muted-foreground">
            training {model.trainErr[k].toFixed(2)}, validation {model.validErr[k].toFixed(2)}
          </span>
        </div>
        <svg viewBox={`0 0 ${W} ${EH}`} className="w-full h-auto" role="img" aria-label="Training and validation error against number of trees">
          <line x1="34" y1={EH - 24} x2={W - 16} y2={EH - 24} stroke="hsl(var(--border))" />
          <line x1={ex(model.best)} x2={ex(model.best)} y1="8" y2={EH - 24} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeOpacity="0.6" />
          <text x={ex(model.best) + 6} y="18" fontSize="12" fill="hsl(var(--muted-foreground))">lowest validation error</text>
          <path d={trainLine} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" />
          <path d={validLine} fill="none" stroke="#e11d48" strokeWidth="2.5" />
          <line x1={ex(k)} x2={ex(k)} y1="8" y2={EH - 24} stroke="hsl(var(--foreground))" strokeOpacity="0.5" />
          <circle cx={ex(k)} cy={ey(model.trainErr[k])} r="4.5" fill="hsl(var(--primary))" />
          <circle cx={ex(k)} cy={ey(model.validErr[k])} r="4.5" fill="#e11d48" />
          <text x={W - 18} y={ey(model.trainErr[MAX]) + 20} fontSize="12" textAnchor="end" fill="hsl(var(--primary))">training</text>
          <text x={W - 18} y={ey(model.validErr[MAX]) - 8} fontSize="12" textAnchor="end" fill="#e11d48">validation</text>
          <text x="34" y={EH - 6} fontSize="12" fill="hsl(var(--muted-foreground))">0 trees</text>
          <text x={W - 16} y={EH - 6} fontSize="12" textAnchor="end" fill="hsl(var(--muted-foreground))">{MAX} trees</text>
        </svg>
      </div>

      <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
        A simplified model on 40 made-up points: depth-2 trees fitted to squared error, using XGBoost's split-gain and leaf formulas with regularization λ = 1. The real library adds more, including gradient and curvature information for other loss functions, column sampling and fast split finding.
      </p>
    </section>
  )
}
