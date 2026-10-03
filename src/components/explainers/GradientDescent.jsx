import { useEffect, useMemo, useState } from 'react'
import { Play, Pause } from 'lucide-react'
import { rng, gauss } from '../../lib/toy.js'
import Shell, { Seg, Slider, Spark } from './Shell.jsx'

// Loss = 0.5 * (w1^2 + h * w2^2): the shape of a two-weight linear regression.
// h = 1 when features share a scale; h = 15 when one feature is on a much larger scale.
const START = [-2.2, 1.7]
const STEPS = 60
const W = 640, H = 320
const RX = 3, RY = 2.2
const sx = (x) => W / 2 + (x / RX) * (W / 2 - 16)
const sy = (y) => H / 2 - (y / RY) * (H / 2 - 14)
const loss = (w, h) => 0.5 * (w[0] ** 2 + h * w[1] ** 2)

function run(h, lr, noisy) {
  const r = rng(4)
  let w = [...START]
  const pts = [w], losses = [loss(w, h)]
  for (let i = 0; i < STEPS; i++) {
    const g = [w[0], h * w[1]]
    const n = noisy ? [gauss(r) * 0.6, gauss(r) * 0.6] : [0, 0]
    w = [w[0] - lr * (g[0] + n[0]), w[1] - lr * (g[1] + n[1])]
    pts.push(w); losses.push(loss(w, h))
  }
  return { pts, losses }
}

export default function GradientDescent({ onClose }) {
  const [scaled, setScaled] = useState('unscaled')
  const [lr, setLr] = useState(0.1)
  const [noisy, setNoisy] = useState(false)
  const [step, setStep] = useState(STEPS)
  const [playing, setPlaying] = useState(false)
  const h = scaled === 'scaled' ? 1 : 15
  const { pts, losses } = useMemo(() => run(h, lr, noisy), [h, lr, noisy])

  useEffect(() => { setStep(0); setPlaying(true) }, [h, lr, noisy])
  useEffect(() => {
    if (!playing) return
    if (step >= STEPS) { setPlaying(false); return }
    const t = setTimeout(() => setStep((v) => v + 1), 70)
    return () => clearTimeout(t)
  }, [playing, step])

  const levels = [0.15, 0.6, 1.4, 2.6, 4]
  const final = losses[STEPS], first = losses[0]
  const cap = 2 / h
  const stepsTo = (ls) => { const i = ls.findIndex((v) => v < 0.01 * ls[0]); return i < 0 ? null : i }
  const n = stepsTo(run(h, lr, false).losses)
  const fast = stepsTo(run(1, 0.9, false).losses)
  let caption
  if (lr >= cap || !(final < first * 4)) caption = `The steps overshoot the valley and get larger each time, so the loss climbs instead of falling. For this shape the learning rate has to stay below ${cap.toFixed(2)}.`
  else {
    const reach = n === null ? 'It does not get within 1% of the starting loss in 60 steps.' : `It gets within 1% of the starting loss after ${n} step${n === 1 ? '' : 's'}.`
    if (noisy) caption = 'Each step uses a noisy estimate of the gradient, as with small batches of rows. The path wobbles and then jitters around the bottom instead of stopping. A smaller learning rate shrinks the jitter but slows the approach.'
    else if (scaled === 'unscaled') caption = `${lr * h > 1 ? 'Each step overshoots across the steep side of the valley, so the path zigzags while it moves slowly along the flat floor. ' : ''}${reach} The steep direction caps the learning rate below ${cap.toFixed(2)}, and that cap is also what keeps progress along the flat direction slow. Switch to scaled features: the cap rises to 2.00 and the same problem takes ${fast} step${fast === 1 ? '' : 's'} at a rate of 0.9.`
    else caption = `${reach} ${lr < 0.5 ? 'With features on the same scale the safe limit is 2.00, so try raising the learning rate toward 0.9.' : 'The valley is round, so the steps head straight for the bottom and a large rate is safe.'}`
  }

  const cur = Math.min(step, STEPS)
  const trail = pts.slice(0, cur + 1)
  const clip = (p) => [Math.max(-RX * 1.4, Math.min(RX * 1.4, p[0])), Math.max(-RY * 1.4, Math.min(RY * 1.4, p[1]))]
  const dPath = trail.map((p, i) => { const q = clip(p); return `${i ? 'L' : 'M'}${sx(q[0]).toFixed(1)} ${sy(q[1]).toFixed(1)}` }).join('')
  const head = clip(pts[cur])

  return (
    <Shell title="Gradient descent and the learning rate" intro="Two weights, one loss. Each step moves downhill by the learning rate times the slope. The rings are lines of equal loss; the bottom is the best fit."
      onClose={onClose}
      note="A toy loss with the shape of a two-weight linear regression. 'Features on different scales' makes the valley 15 times steeper in one direction. The noisy option adds random error to each gradient, imitating mini-batches.">
      <div className="flex flex-wrap gap-3 mb-3 items-center">
        <Seg label="Feature scales" value={scaled} onChange={setScaled} options={[{ id: 'unscaled', label: 'Features on different scales' }, { id: 'scaled', label: 'Features scaled' }]} />
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={noisy} onChange={(e) => setNoisy(e.target.checked)} className="w-4 h-4 accent-primary" /> Noisy gradient (mini-batch)
        </label>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded-xl bg-muted/40" role="img" aria-label="Contour plot with the path of gradient descent">
        <defs><clipPath id="gd-clip"><rect x="0" y="0" width={W} height={H} rx="12" /></clipPath></defs>
        <g clipPath="url(#gd-clip)">
          {levels.map((c) => <ellipse key={c} cx={sx(0)} cy={sy(0)} rx={(Math.sqrt(2 * c) / RX) * (W / 2 - 16)} ry={(Math.sqrt((2 * c) / h) / RY) * (H / 2 - 14)} fill="none" stroke="hsl(var(--foreground))" strokeOpacity="0.2" strokeWidth="1.5" />)}
          <path d={dPath} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinejoin="round" />
          {trail.map((p, i) => { const q = clip(p); return <circle key={i} cx={sx(q[0])} cy={sy(q[1])} r="2.8" fill="hsl(var(--primary))" /> })}
          <circle cx={sx(START[0])} cy={sy(START[1])} r="6" fill="none" stroke="hsl(var(--foreground))" strokeWidth="2" />
          <circle cx={sx(head[0])} cy={sy(head[1])} r="6.5" fill="hsl(var(--primary))" stroke="hsl(var(--card))" strokeWidth="2" />
          <circle cx={sx(0)} cy={sy(0)} r="4" fill="#e11d48" />
          <text x={sx(0) + 8} y={sy(0) - 8} fontSize="12" fill="#e11d48">best fit</text>
          <text x={sx(START[0]) + 10} y={sy(START[1]) - 8} fontSize="12" fill="hsl(var(--muted-foreground))">start</text>
        </g>
      </svg>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Slider label="Learning rate" value={lr} min={0.01} max={1} step={0.01} onChange={setLr} display={lr.toFixed(2)} />
        <div className="flex items-center gap-3">
          <button onClick={() => { if (step >= STEPS) setStep(0); setPlaying((p) => !p) }} className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold px-3.5 py-2 rounded-xl hover:opacity-90">
            {playing ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Replay</>}
          </button>
          <span className="text-sm tabular-nums text-muted-foreground">Step {cur} of {STEPS}, {losses[cur] > 999 ? 'loss has blown up' : `loss ${losses[cur].toFixed(2)}`}</span>
        </div>
      </div>

      <p className="mt-4 mb-4 text-[15px] leading-relaxed min-h-[5.5rem]" aria-live="polite">{caption}</p>

      <Spark title="Loss at each step" readout={`start ${first.toFixed(1)}`} series={[{ values: losses.map((v) => Math.min(v, first * 3)), color: 'hsl(var(--primary))', label: 'loss' }]}
        xs={losses} cur={cur} yMax={first * 3} xLabel={['step 0', `step ${STEPS}`]} />
    </Shell>
  )
}
