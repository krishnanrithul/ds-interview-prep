import { useMemo, useState } from 'react'
import { rng, gauss } from '../../lib/toy.js'
import Shell, { Seg, Slider, path } from './Shell.jsx'

const T = 59
const W = 640, H = 240

function series(trend, amp, noise, seed = 12) {
  const r = rng(seed)
  return Array.from({ length: T }, (_, t) => ({ t, trend: 50 + trend * t, season: amp * Math.sin((2 * Math.PI * t) / 12), noise: noise * gauss(r) }))
    .map((p) => ({ ...p, y: p.trend + p.season + p.noise }))
}

// A flexible model that learns from the week number alone (like trees on a date feature):
// it predicts a test week from the two nearest training weeks.
const nearest = (train, t, y) => {
  const near = [...train].sort((a, b) => Math.abs(a - t) - Math.abs(b - t) || a - b).slice(0, 2)
  return near.reduce((s, i) => s + y[i], 0) / near.length
}

function randomFolds() {
  const r = rng(4)
  const idx = Array.from({ length: T }, (_, i) => i)
  for (let i = T - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]] }
  return Array.from({ length: 5 }, (_, f) => { const test = idx.filter((_, i) => i % 5 === f).sort((a, b) => a - b); const set = new Set(test); return { test, train: idx.filter((i) => !set.has(i)).sort((a, b) => a - b) } })
}
const walkFolds = () => Array.from({ length: 5 }, (_, f) => { const start = 24 + f * 7; return { train: Array.from({ length: start }, (_, i) => i), test: Array.from({ length: Math.min(7, T - start) }, (_, i) => start + i) } })
const RANDOM = randomFolds(), WALK = walkFolds()

function evaluate(folds, y) {
  return folds.map((fd) => {
    const preds = fd.test.map((t) => nearest(fd.train, t, y))
    return { ...fd, preds, mae: fd.test.reduce((s, t, i) => s + Math.abs(y[t] - preds[i]), 0) / fd.test.length }
  })
}

function Splits() {
  const [mode, setMode] = useState('random')
  const [fold, setFold] = useState(1)
  const data = useMemo(() => series(0.35, 6, 1.6), [])
  const y = data.map((p) => p.y)
  const res = useMemo(() => ({ random: evaluate(RANDOM, y), walk: evaluate(WALK, y) }), [y])
  const avg = (rs) => rs.reduce((s, r) => s + r.mae, 0) / rs.length
  const cur = res[mode][fold - 1]
  const sx = (t) => 30 + (t / (T - 1)) * (W - 46)
  const [lo, hi] = [Math.min(...y) - 3, Math.max(...y) + 3]
  const sy = (v) => H - 26 - ((v - lo) / (hi - lo)) * (H - 44)
  const trainSet = new Set(cur.train), testSet = new Set(cur.test)
  const caption = mode === 'random'
    ? 'Random folds scatter the test weeks among the training weeks, so each test week has training weeks on both sides, one just before and one just after. The model effectively reads the answer off its neighbors. The error looks wonderful, and it is not what you will get next month.'
    : 'Walk-forward folds train only on the past and test on the weeks that follow, exactly as in production. The model has to predict beyond anything it has seen, so it misses the trend and the seasonal swing. This larger error is the honest one.'
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Seg label="Split method" value={mode} onChange={setMode} options={[{ id: 'random', label: 'Random folds' }, { id: 'walk', label: 'Walk-forward' }]} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto mt-3" role="img" aria-label="A weekly series split into training and test weeks">
        <line x1="30" y1={H - 26} x2={W - 16} y2={H - 26} stroke="hsl(var(--border))" />
        <path d={path(data.map((p) => [sx(p.t), sy(p.y)]))} fill="none" stroke="hsl(var(--muted-foreground))" strokeOpacity="0.45" strokeWidth="1.5" />
        {data.map((p) => trainSet.has(p.t) && <circle key={p.t} cx={sx(p.t)} cy={sy(p.y)} r="3.4" fill="hsl(var(--primary))" />)}
        {cur.test.map((t, i) => <g key={t}><line x1={sx(t)} x2={sx(t)} y1={sy(y[t])} y2={sy(cur.preds[i])} stroke="#e11d48" strokeOpacity="0.6" /><circle cx={sx(t)} cy={sy(y[t])} r="4.5" fill="none" stroke="hsl(var(--foreground))" strokeWidth="2" /><path d={`M${sx(t) - 4} ${sy(cur.preds[i]) - 4}l8 8m0 -8l-8 8`} stroke="#e11d48" strokeWidth="2" /></g>)}
        <text x="30" y={H - 8} fontSize="11" fill="hsl(var(--muted-foreground))">week 1</text>
        <text x={W - 16} y={H - 8} fontSize="11" textAnchor="end" fill="hsl(var(--muted-foreground))">week 59</text>
        <text x="32" y="14" fontSize="12" fill="hsl(var(--primary))">green dots: training weeks</text>
        <text x="190" y="14" fontSize="12" fill="hsl(var(--foreground))">rings: test weeks</text>
        <text x="290" y="14" fontSize="12" fill="#e11d48">red crosses: predictions</text>
      </svg>
      <div className="flex gap-px mt-2" aria-hidden="true">
        {data.map((p) => <div key={p.t} className={`h-3 flex-1 ${testSet.has(p.t) ? 'bg-marker' : trainSet.has(p.t) ? 'bg-primary' : 'bg-muted'}`} />)}
      </div>
      <div className="mt-3"><Slider label="Fold" value={fold} min={1} max={5} onChange={setFold} /></div>
      <p className="mt-4 text-[15px] leading-relaxed min-h-[6.5rem]" aria-live="polite">{caption}</p>
      <div className="grid grid-cols-2 gap-3">
        {[['random', 'Random folds', 'what the validation report says'], ['walk', 'Walk-forward', 'closer to what production will see']].map(([id, label, sub]) => (
          <div key={id} className={`rounded-xl border p-3 ${mode === id ? 'border-foreground' : 'border-border'}`}>
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-2xl font-serif tabular-nums">{avg(res[id]).toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">average error across 5 folds, {sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function Pieces() {
  const [trend, setTrend] = useState(0.35)
  const [amp, setAmp] = useState(6)
  const [noise, setNoise] = useState(1.6)
  const [pieces, setPieces] = useState(true)
  const data = useMemo(() => series(trend, amp, noise, 31), [trend, amp, noise])
  const N = 48, HZ = 12
  const train = data.slice(0, N)
  // Fit: straight-line trend by least squares, then the average leftover by position in the 12-week cycle.
  const fit = useMemo(() => {
    const n = train.length, mx = (n - 1) / 2, my = train.reduce((s, p) => s + p.y, 0) / n
    const b = train.reduce((s, p) => s + (p.t - mx) * (p.y - my), 0) / train.reduce((s, p) => s + (p.t - mx) ** 2, 0)
    const a = my - b * mx
    const seas = Array.from({ length: 12 }, (_, k) => { const v = train.filter((p) => p.t % 12 === k).map((p) => p.y - (a + b * p.t)); return v.reduce((s, x) => s + x, 0) / v.length })
    const f = (t) => a + b * t + seas[t % 12]
    const sd = Math.sqrt(train.reduce((s, p) => s + (p.y - f(p.t)) ** 2, 0) / (n - 2))
    return { f, sd, a, b, seas }
  }, [train])
  const sx = (t) => 30 + (t / (N + HZ - 1)) * (W - 46)
  const all = [...data.slice(0, N + HZ).map((p) => p.y), ...Array.from({ length: N + HZ }, (_, t) => fit.f(t))]
  const lo = Math.min(...all) - 8, hi = Math.max(...all) + 8
  const sy = (v) => H - 26 - ((v - lo) / (hi - lo)) * (H - 44)
  const fc = Array.from({ length: HZ }, (_, h) => ({ t: N + h, v: fit.f(N + h), band: 1.64 * fit.sd * Math.sqrt(1 + (h + 1) / 24) }))
  const mini = (vals, color, label) => {
    const l = Math.min(...vals), h2 = Math.max(...vals), MH = 70
    const mx = (i) => 30 + (i / (vals.length - 1)) * (W - 46), my = (v) => MH - 12 - ((v - l) / (h2 - l || 1)) * (MH - 24)
    return <div key={label}><p className="text-xs text-muted-foreground">{label}</p><svg viewBox={`0 0 ${W} ${MH}`} className="w-full h-auto" role="img" aria-label={label}><path d={path(vals.map((v, i) => [mx(i), my(v)]))} fill="none" stroke={color} strokeWidth="2" /></svg></div>
  }
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="A series with a fitted trend and seasonal pattern and a 12-week forecast">
        <line x1="30" y1={H - 26} x2={W - 16} y2={H - 26} stroke="hsl(var(--border))" />
        <rect x={sx(N - 0.5)} y="4" width={sx(N + HZ - 1) - sx(N - 0.5) + 6} height={H - 30} fill="hsl(var(--muted))" fillOpacity="0.6" />
        <path d={path(fc.map((p) => [sx(p.t), sy(p.v + p.band)]).concat(fc.map((p) => [sx(p.t), sy(p.v - p.band)]).reverse())) + 'Z'} fill="hsl(var(--primary))" fillOpacity="0.18" />
        <path d={path(data.slice(0, N + HZ).map((p) => [sx(p.t), sy(p.y)]))} fill="none" stroke="hsl(var(--muted-foreground))" strokeOpacity="0.5" strokeWidth="1.5" />
        {train.map((p) => <circle key={p.t} cx={sx(p.t)} cy={sy(p.y)} r="3" fill="hsl(var(--foreground))" fillOpacity="0.8" />)}
        <path d={path(Array.from({ length: N + HZ }, (_, t) => [sx(t), sy(fit.f(t))]))} fill="none" stroke="hsl(var(--primary))" strokeWidth="3" />
        <text x="34" y="16" fontSize="12" fill="hsl(var(--muted-foreground))">dots: history</text>
        <text x="120" y="16" fontSize="12" fill="hsl(var(--primary))">line: trend + seasonality</text>
        <text x={W - 16} y="16" fontSize="12" textAnchor="end" fill="hsl(var(--muted-foreground))">shaded: next 12 weeks, with an uncertainty band</text>
      </svg>
      <div className="grid gap-3 sm:grid-cols-3 mt-3">
        <Slider label="Trend per week" value={trend} min={0} max={0.8} step={0.05} onChange={setTrend} display={trend.toFixed(2)} />
        <Slider label="Seasonal swing" value={amp} min={0} max={12} step={0.5} onChange={setAmp} />
        <Slider label="Noise" value={noise} min={0} max={6} step={0.2} onChange={setNoise} display={noise.toFixed(1)} />
      </div>
      <label className="inline-flex items-center gap-2 text-sm cursor-pointer mt-3">
        <input type="checkbox" checked={pieces} onChange={(e) => setPieces(e.target.checked)} className="w-4 h-4 accent-primary" /> Show the three pieces separately
      </label>
      {pieces && <div className="mt-2 grid gap-1">{[mini(data.map((p) => p.trend), 'hsl(var(--foreground))', 'Trend: the slow drift up or down'), mini(data.map((p) => p.season), 'hsl(var(--primary))', 'Seasonality: the repeating 12-week cycle'), mini(data.map((p) => p.noise), '#e11d48', 'Noise: what no model can predict')]}</div>}
      <p className="mt-3 text-[15px] leading-relaxed" aria-live="polite">
        {noise >= 4 ? 'With this much noise the band is wide and no model can promise a precise number. The honest forecast is a range.' : amp >= 8 && trend < 0.15 ? 'Mostly seasonality: the best forecast repeats the cycle, and ignoring seasonality would be the biggest mistake.' : trend >= 0.5 ? 'A strong trend dominates. A model that cannot extrapolate (such as trees on raw level) will stall at the last value it saw.' : 'Every series is some mix of these three. Splitting a series into pieces is how you decide what to model and what to leave as an uncertainty band.'}
        {' '}The band widens with the forecast horizon, which is illustrative here.
      </p>
    </div>
  )
}

export default function TimeSplit({ onClose }) {
  const [tab, setTab] = useState('split')
  return (
    <Shell
      title="Validating a model on a time series"
      intro="Time has a direction. Validation has to respect it."
      onClose={onClose}
      note={tab === 'split'
        ? 'Toy example: 59 weekly values built from a trend, a 12-week cycle and noise. The model predicts a week from its two nearest training weeks, standing in for a flexible model that learns from a date feature.'
        : 'Toy example: the line is a straight trend plus the average leftover at each point of the 12-week cycle, fitted on the first 48 weeks. The widening band is illustrative.'}
    >
      <Seg label="View" value={tab} onChange={setTab} options={[{ id: 'split', label: 'Random vs walk-forward' }, { id: 'pieces', label: 'Trend, seasonality, noise' }]} />
      <div className="mt-4">{tab === 'split' ? <Splits /> : <Pieces />}</div>
    </Shell>
  )
}
