import { useMemo, useState } from 'react'
import { rng, gauss } from '../../lib/toy.js'
import Shell, { Seg, Slider, Spark, path } from './Shell.jsx'

const f = (x) => Math.sin(1.1 * x) * 1.2 + 0.55 * x
const NOISE = 0.3
const LO = -3, BW = 0.5, NB = 12 // the model's training range, in 12 bins
const XMIN = -4, XMAX = 8, YMIN = -3.5, YMAX = 5.5
const W = 640, H = 260
const sx = (x) => 16 + ((x - XMIN) / (XMAX - XMIN)) * (W - 32)
const sy = (y) => H - 24 - ((y - YMIN) / (YMAX - YMIN)) * (H - 40)

// Training data and the model: a piecewise-constant fit that cannot extrapolate (like a tree).
const R = rng(5)
const TRAIN = Array.from({ length: 300 }, () => { const x = gauss(R); return { x, y: f(x) + NOISE * gauss(R) } })
const bins = Array.from({ length: NB }, () => ({ s: 0, n: 0 }))
TRAIN.forEach((p) => { const i = Math.floor((p.x - LO) / BW); if (i >= 0 && i < NB) { bins[i].s += p.y; bins[i].n++ } })
const means = bins.map((b) => (b.n ? b.s / b.n : null))
for (let i = 0; i < NB; i++) if (means[i] == null) { let d = 1; while (means[i] == null) { means[i] = (means[i - d] ?? null) ?? (means[i + d] ?? null); d++ } }
const predict = (x) => means[Math.max(0, Math.min(NB - 1, Math.floor((x - LO) / BW)))]
const trainRmse = Math.sqrt(TRAIN.reduce((s, p) => s + (p.y - predict(p.x)) ** 2, 0) / TRAIN.length)

// Fixed noise so the picture moves smoothly when the slider moves.
const R2 = rng(77)
const LIVE = Array.from({ length: 500 }, () => ({ z: gauss(R2), e: gauss(R2) }))

// PSI against the training inputs, using ten bins cut at the training deciles.
const sorted = TRAIN.map((p) => p.x).sort((a, b) => a - b)
const EDGES = Array.from({ length: 9 }, (_, i) => sorted[Math.floor(((i + 1) / 10) * sorted.length)])
const binOf = (x) => { let i = 0; while (i < EDGES.length && x > EDGES[i]) i++; return i }
const refP = (() => { const c = Array(10).fill(0); sorted.forEach((x) => c[binOf(x)]++); return c.map((v) => Math.max(v, 0.5) / sorted.length) })()

function evaluate(mode, s) {
  const pts = LIVE.map(({ z, e }) => {
    const x = mode === 'data' ? z + s : z
    const truth = f(x) + (mode === 'concept' ? 0.5 * s * x : 0)
    return { x, y: truth + NOISE * e }
  })
  const rmse = Math.sqrt(pts.reduce((a, p) => a + (p.y - predict(p.x)) ** 2, 0) / pts.length)
  const c = Array(10).fill(0); pts.forEach((p) => c[binOf(p.x)]++)
  const psi = c.reduce((a, v, i) => { const q = Math.max(v, 0.5) / pts.length; return a + (q - refP[i]) * Math.log(q / refP[i]) }, 0)
  return { pts, rmse, psi }
}

const MAXS = { data: 4.5, concept: 3 }
const STEPS = Array.from({ length: 13 }, (_, i) => i)
const SWEEP = { data: STEPS.map((i) => evaluate('data', (i / 12) * MAXS.data)), concept: STEPS.map((i) => evaluate('concept', (i / 12) * MAXS.concept)) }

function caption(mode, s, rmse, psi) {
  const ratio = rmse / trainRmse
  if (s < 0.15) return 'Nothing has changed yet. Live inputs look like the training inputs, the PSI is near zero, and the model is about as accurate as it was in testing. Move the slider.'
  if (mode === 'concept') return ratio < 1.6
    ? 'The relationship between the input and the outcome is starting to change. The inputs look identical, so the PSI sees nothing, but error is already creeping up.'
    : 'The inputs look exactly as before, so PSI stays near zero and any input monitor stays quiet. Yet the model is badly wrong, because what the inputs mean has changed. Only labels, or a proxy for them, reveal this.'
  if (ratio < 1.6) return `The inputs have moved (PSI ${psi.toFixed(2)}), but the model is still fine. It saw plenty of training data in this region, so moving the inputs alone did not hurt. Drift is a warning, not proof of damage.`
  return `Now the live inputs sit where the model saw almost no training data. It cannot extrapolate, so it repeats its last guess while the real pattern keeps going. Error is ${ratio.toFixed(1)} times what it was in testing, and the PSI flagged it first.`
}

export default function Drift({ onClose }) {
  const [mode, setMode] = useState('data')
  const [s, setS] = useState(0)
  const max = MAXS[mode]
  const cur = Math.round((s / max) * 12)
  const now = useMemo(() => evaluate(mode, s), [mode, s])
  const sweep = SWEEP[mode]
  const hist = useMemo(() => {
    const c = Array(Math.round((XMAX - XMIN) / BW)).fill(0)
    now.pts.forEach((p) => { const i = Math.floor((p.x - XMIN) / BW); if (i >= 0 && i < c.length) c[i]++ })
    return c
  }, [now])
  const trainHist = useMemo(() => {
    const c = Array(Math.round((XMAX - XMIN) / BW)).fill(0)
    TRAIN.forEach((p) => { const i = Math.floor((p.x - XMIN) / BW); if (i >= 0 && i < c.length) c[i]++ })
    return c
  }, [])
  const gx = Array.from({ length: 111 }, (_, i) => XMIN + (i / 110) * (XMAX - XMIN))
  const truthNow = (x) => f(x) + (mode === 'concept' ? 0.5 * s * x : 0)
  const hMax = Math.max(...trainHist, ...hist)

  return (
    <Shell
      title="Why a model decays in production"
      intro="A model is trained on one slice of the world. Move the world and watch what the monitor sees and what the model gets wrong."
      onClose={onClose}
      note="Toy example: a model fitted to 300 training points whose inputs are centered on 0. Each dot is a fresh live customer; the model cannot see the dashed line. PSI uses ten bins cut at the training deciles."
    >
      <Seg label="Kind of change" value={mode} onChange={(m) => { setMode(m); setS(0) }} options={[{ id: 'data', label: 'The inputs move' }, { id: 'concept', label: 'The relationship changes' }]} />

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto mt-3" role="img" aria-label="Training inputs, live inputs, true pattern and model predictions">
        <line x1="16" y1={H - 24} x2={W - 16} y2={H - 24} stroke="hsl(var(--border))" />
        {trainHist.map((c, i) => <rect key={`t${i}`} x={sx(XMIN + i * BW) + 1} width={sx(XMIN + BW) - sx(XMIN) - 2} y={H - 24 - (c / hMax) * 46} height={(c / hMax) * 46} fill="hsl(var(--muted-foreground))" fillOpacity="0.28" />)}
        {hist.map((c, i) => <rect key={`l${i}`} x={sx(XMIN + i * BW) + 3} width={sx(XMIN + BW) - sx(XMIN) - 6} y={H - 24 - (c / hMax) * 46} height={(c / hMax) * 46} fill="hsl(var(--primary))" fillOpacity="0.55" />)}
        {mode === 'concept' && s > 0 && <path d={path(gx.map((x) => [sx(x), sy(f(x))]))} fill="none" stroke="hsl(var(--muted-foreground))" strokeOpacity="0.5" strokeWidth="1.5" />}
        <path d={path(gx.map((x) => [sx(x), sy(truthNow(x))]))} fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeDasharray="6 5" />
        {now.pts.slice(0, 90).map((p, i) => <circle key={i} cx={sx(p.x)} cy={sy(Math.max(YMIN, Math.min(YMAX, p.y)))} r="3" fill="hsl(var(--foreground))" fillOpacity="0.45" />)}
        <path d={path(gx.flatMap((x, i) => { const y = sy(predict(x)); return [[sx(x), i ? sy(predict(gx[i - 1])) : y], [sx(x), y]] }))} fill="none" stroke="#e11d48" strokeWidth="3" strokeLinejoin="round" />
        <text x="18" y="16" fontSize="12" fill="#e11d48">model prediction</text>
        <text x="130" y="16" fontSize="12" fill="hsl(var(--muted-foreground))">real pattern (dashed)</text>
        <text x="272" y="16" fontSize="12" fill="hsl(var(--muted-foreground))">grey bars: training inputs</text>
        <text x="440" y="16" fontSize="12" fill="hsl(var(--primary))">green bars: live inputs</text>
        {mode === 'concept' && s > 0 && <text x="18" y="32" fontSize="12" fill="hsl(var(--muted-foreground))">thin grey line: the old pattern</text>}
      </svg>

      <div className="mt-3">
        <Slider
          label={mode === 'data' ? 'How far the live inputs have moved (in training standard deviations)' : 'How much the relationship has changed'}
          value={s} min={0} max={max} step={0.05} onChange={(v) => setS(v)} display={s.toFixed(2)}
        />
      </div>

      <p className="mt-4 text-[15px] leading-relaxed min-h-[6.5rem]" aria-live="polite">{caption(mode, s, now.rmse, now.psi)}</p>

      <div className="mt-2 grid gap-5 sm:grid-cols-2">
        <Spark title="What the model gets wrong" readout={`error ${now.rmse.toFixed(2)} (testing: ${trainRmse.toFixed(2)})`} xs={STEPS} cur={cur} yMax={3.2}
          series={[{ label: 'error', values: sweep.map((r) => r.rmse), color: '#e11d48' }]} xLabel={['no change', 'far from training']} />
        <Spark title="What an input monitor sees (PSI)" readout={`PSI ${now.psi.toFixed(2)}`} xs={STEPS} cur={cur} yMax={3}
          refs={[{ v: 0.25, label: '0.25 = large shift' }]}
          series={[{ label: 'psi', values: sweep.map((r) => r.psi), color: 'hsl(var(--primary))' }]} xLabel={['no change', 'far from training']} />
      </div>
    </Shell>
  )
}
