import { useEffect, useMemo, useState } from 'react'
import { Play, Pause, RefreshCw } from 'lucide-react'
import { rng, gauss } from '../../lib/toy.js'
import Shell, { Seg, Slider, Spark, path } from './Shell.jsx'

// 400 A/A tests: both arms are identical, so every "winner" is a false alarm.
const R_EXP = 400, DAYS = 28, PER_DAY = 500, P0 = 0.1
const erfc = (x) => { const t = 1 / (1 + 0.3275911 * x); return t * Math.exp(-x * x) * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) }
const pval = (z) => erfc(Math.abs(z) / Math.SQRT2)

const SIM = (() => {
  const r = rng(2024)
  const sd = Math.sqrt(PER_DAY * P0 * (1 - P0))
  return Array.from({ length: R_EXP }, () => {
    let a = 0, b = 0
    return Array.from({ length: DAYS }, (_, d) => {
      a += Math.max(0, Math.round(PER_DAY * P0 + sd * gauss(r)))
      b += Math.max(0, Math.round(PER_DAY * P0 + sd * gauss(r)))
      const n = PER_DAY * (d + 1), pa = a / n, pb = b / n, pp = (a + b) / (2 * n)
      return pval((pb - pa) / Math.sqrt(pp * (1 - pp) * (2 / n)))
    })
  })
})()
const looksFor = (k) => Array.from({ length: k }, (_, i) => Math.round((DAYS * (i + 1)) / k) - 1)
const rateFor = (k) => { const ds = looksFor(k); return SIM.filter((p) => ds.some((d) => p[d] < 0.05)).length / R_EXP }
const RATES = Array.from({ length: DAYS }, (_, i) => rateFor(i + 1))

const MS = Array.from({ length: 40 }, (_, i) => i + 1)
const METRIC_RATE = (() => {
  const r = rng(99)
  return MS.map((m) => { let raw = 0, fix = 0; for (let t = 0; t < 600; t++) { let any = false, anyFix = false; for (let i = 0; i < m; i++) { const p = r(); if (p < 0.05) any = true; if (p < 0.05 / m) anyFix = true } if (any) raw++; if (anyFix) fix++ } return { raw: raw / 600, fix: fix / 600 } })
})()

const W = 640, H = 230
const px = (d) => 40 + (d / (DAYS - 1)) * (W - 56)
const py = (p) => H - 26 - Math.sqrt(p) * (H - 44)

function Peeking() {
  const [k, setK] = useState(1)
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    if (!playing) return
    if (k >= DAYS) { setPlaying(false); return }
    const t = setTimeout(() => setK((v) => v + 1), 700)
    return () => clearTimeout(t)
  }, [playing, k])
  const days = useMemo(() => looksFor(k), [k])
  const rate = RATES[k - 1]
  const winners = Math.round(rate * R_EXP)
  const shown = SIM.slice(0, 14)
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="p-values over time for 14 experiments with no real effect">
        <line x1="40" y1={H - 26} x2={W - 16} y2={H - 26} stroke="hsl(var(--border))" />
        {[0.05, 0.25, 0.5, 1].map((p) => <g key={p}><line x1="40" x2={W - 16} y1={py(p)} y2={py(p)} stroke="hsl(var(--border))" strokeDasharray={p === 0.05 ? '0' : '2 4'} strokeOpacity={p === 0.05 ? 0 : 1} /><text x="34" y={py(p) + 4} fontSize="11" textAnchor="end" fill="hsl(var(--muted-foreground))">{p}</text></g>)}
        <line x1="40" x2={W - 16} y1={py(0.05)} y2={py(0.05)} stroke="#e11d48" strokeWidth="1.5" />
        <text x={W - 18} y={py(0.05) - 5} fontSize="12" textAnchor="end" fill="#e11d48">p = 0.05</text>
        {shown.map((p, i) => <path key={i} d={path(p.map((v, d) => [px(d), py(v)]))} fill="none" stroke="hsl(var(--foreground))" strokeOpacity="0.22" strokeWidth="1.4" />)}
        {days.map((d) => <line key={d} x1={px(d)} x2={px(d)} y1={H - 26} y2={H - 20} stroke="hsl(var(--primary))" strokeWidth="2" />)}
        {shown.map((p, i) => { const d = days.find((dd) => p[dd] < 0.05); return d == null ? null : <circle key={i} cx={px(d)} cy={py(p[d])} r="5" fill="#e11d48" /> })}
        <text x="40" y={H - 6} fontSize="11" fill="hsl(var(--muted-foreground))">day 1</text>
        <text x={W - 16} y={H - 6} fontSize="11" textAnchor="end" fill="hsl(var(--muted-foreground))">day 28 (green ticks = days you look)</text>
      </svg>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3">
        <button onClick={() => { if (k >= DAYS) setK(1); setPlaying((p) => !p) }} className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold px-3.5 py-2 rounded-xl hover:opacity-90">
          {playing ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Look more often</>}
        </button>
      </div>
      <div className="mt-3"><Slider label="How many times you check the result (spread over 28 days)" value={k} min={1} max={DAYS} onChange={(v) => { setPlaying(false); setK(v) }} display={k === 1 ? 'once, at the end' : `${k} times`} /></div>
      <p className="mt-4 mb-4 text-[15px] leading-relaxed min-h-[6rem]" aria-live="polite">
        Every line is an experiment where the two groups are identical, so no result should count as a win. Red dots are experiments you would have stopped and shipped.
        {' '}Out of {R_EXP} such experiments, <strong>{winners} ({(rate * 100).toFixed(0)}%)</strong> would be declared winners when you check {k === 1 ? 'once' : `${k} times`}.
        {k === 1 ? ' That is the 5% you signed up for.' : rate > 0.12 ? ' Each extra look is another chance for noise to cross the line, and the error rate you accepted is no longer the error rate you have.' : ' It is already above the 5% you intended.'}
      </p>
      <Spark title="False positives against number of looks" readout={`${(rate * 100).toFixed(0)}%`} xs={RATES} cur={k - 1} yMax={0.4}
        refs={[{ v: 0.05, label: '5% intended' }]} series={[{ label: 'rate', values: RATES, color: '#e11d48' }]} W={640} H={130} xLabel={['look once', 'look every day']} />
    </div>
  )
}

function ManyMetrics() {
  const [m, setM] = useState(20)
  const [seed, setSeed] = useState(1)
  const [fix, setFix] = useState(false)
  const alpha = fix ? 0.05 / m : 0.05
  const ps = useMemo(() => { const r = rng(seed * 7919 + m); return Array.from({ length: m }, () => r()) }, [m, seed])
  const hits = ps.filter((p) => p < alpha).length
  const sim = METRIC_RATE[m - 1]
  const rate = fix ? sim.fix : sim.raw
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3">Each square is one metric in an experiment where nothing changed. Its p-value is just a random number between 0 and 1.</p>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(3.1rem, 1fr))' }}>
        {ps.map((p, i) => (
          <div key={i} className={`rounded-lg py-2 text-center text-xs tabular-nums transition-colors ${p < alpha ? 'bg-[#e11d48] text-white font-semibold' : 'bg-muted text-muted-foreground'}`}>{p.toFixed(2)}</div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3">
        <button onClick={() => setSeed((s) => s + 1)} className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold px-3.5 py-2 rounded-xl hover:opacity-90"><RefreshCw className="w-4 h-4" /> Run another experiment</button>
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={fix} onChange={(e) => setFix(e.target.checked)} className="w-4 h-4 accent-primary" />
          Require p below 0.05 divided by the number of metrics ({(0.05 / m).toFixed(4)})
        </label>
      </div>
      <div className="mt-3"><Slider label="Number of metrics you track" value={m} min={1} max={40} onChange={setM} /></div>
      <p className="mt-4 mb-4 text-[15px] leading-relaxed min-h-[5rem]" aria-live="polite">
        This experiment: <strong>{hits}</strong> of {m} metrics {hits === 1 ? 'looks' : 'look'} significant even though nothing changed.
        Across 600 such experiments, <strong>{(rate * 100).toFixed(0)}%</strong> had at least one false alarm.
        {!fix && m > 1 && ` The arithmetic is 1 - 0.95^${m} = ${((1 - 0.95 ** m) * 100).toFixed(0)}%.`}
        {fix ? ' The stricter bar keeps the chance of any false alarm near 5%, at the cost of missing smaller real effects.' : m >= 10 ? ' Finding one significant metric out of this many is expected, not evidence.' : ''}
      </p>
      <Spark title="Chance of at least one false alarm" readout={`${(rate * 100).toFixed(0)}% at ${m} metrics`} xs={MS} cur={m - 1} yMax={1}
        refs={[{ v: 0.05, label: '5%' }]} series={[{ label: 'raw', values: METRIC_RATE.map((r) => r.raw), color: '#e11d48' }, { label: 'fixed', values: METRIC_RATE.map((r) => r.fix), color: 'hsl(var(--primary))' }]} W={640} H={130} xLabel={['1 metric', '40 metrics']} />
      <p className="text-xs text-muted-foreground mt-1">Red: normal threshold. Green: threshold divided by the number of metrics.</p>
    </div>
  )
}

export default function FalsePositives({ onClose }) {
  const [tab, setTab] = useState('peek')
  return (
    <Shell
      title="When p < 0.05 fools you"
      intro="Two ways an experiment with no real effect still produces a winner."
      onClose={onClose}
      note={`Simulated: ${R_EXP} experiments per setting, ${PER_DAY} users per arm per day, a 10% baseline rate, both arms identical.`}
    >
      <Seg label="Scenario" value={tab} onChange={setTab} options={[{ id: 'peek', label: 'Checking early' }, { id: 'many', label: 'Tracking many metrics' }]} />
      <div className="mt-4">{tab === 'peek' ? <Peeking /> : <ManyMetrics />}</div>
    </Shell>
  )
}
