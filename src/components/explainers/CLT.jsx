import { useEffect, useMemo, useRef, useState } from 'react'
import { rng, gauss } from '../../lib/toy.js'
import Shell, { Seg, Slider, path } from './Shell.jsx'

const POPS = {
  skewed: { label: 'Skewed (revenue per user)', draw: (r) => Math.exp(gauss(r) * 1.0) },
  whales: { label: 'A few huge spenders', draw: (r) => (r() < 0.97 ? r() * 20 : 300 + r() * 200) },
  bimodal: { label: 'Two groups', draw: (r) => (r() < 0.5 ? 2 + 0.5 * gauss(r) : 8 + 0.7 * gauss(r)) },
  flat: { label: 'Flat (uniform)', draw: (r) => r() * 10 },
}
const stats = (xs) => { const n = xs.length, m = xs.reduce((s, x) => s + x, 0) / n, v = xs.reduce((s, x) => s + (x - m) ** 2, 0) / n, sd = Math.sqrt(v); return { m, sd, skew: sd ? xs.reduce((s, x) => s + ((x - m) / sd) ** 3, 0) / n : 0 } }
const INFO = Object.fromEntries(Object.entries(POPS).map(([k, p], i) => {
  const r = rng(500 + i), xs = Array.from({ length: 20000 }, () => p.draw(r)).sort((a, b) => a - b)
  return [k, { ...stats(xs), hi: xs[Math.floor(xs.length * 0.995)], lo: xs[0], pop: xs.filter((_, j) => j % 10 === 0) }]
}))
const W = 640, H = 170, NBIN = 40
const hist = (xs, lo, hi, nb = NBIN) => { const c = Array(nb).fill(0); xs.forEach((x) => { const i = Math.floor(((x - lo) / (hi - lo)) * nb); if (i >= 0 && i < nb) c[i]++ }); return c }

function Bars({ counts: raw, color, label, height = H, lo, hi, curve, compress }) {
  const counts = compress ? raw.map(Math.sqrt) : raw
  const mx = Math.max(...counts, ...(curve ? curve : []), 1)
  const bw = (W - 32) / counts.length
  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full h-auto" role="img" aria-label={label}>
      <line x1="16" y1={height - 24} x2={W - 16} y2={height - 24} stroke="hsl(var(--border))" />
      {counts.map((c, i) => <rect key={i} x={16 + i * bw + 1} width={bw - 2} y={height - 24 - (c / mx) * (height - 36)} height={(c / mx) * (height - 36)} fill={color} fillOpacity="0.7" />)}
      {curve && <path d={path(curve.map((v, i) => [16 + (i + 0.5) * bw, height - 24 - (v / mx) * (height - 36)]))} fill="none" stroke="hsl(var(--foreground))" strokeWidth="2" strokeDasharray="5 4" />}
      <text x="16" y={height - 6} fontSize="11" fill="hsl(var(--muted-foreground))">{lo.toFixed(lo < 10 ? 1 : 0)}</text>
      <text x={W - 16} y={height - 6} fontSize="11" textAnchor="end" fill="hsl(var(--muted-foreground))">{hi.toFixed(hi < 10 ? 1 : 0)}</text>
    </svg>
  )
}

export default function CLT({ onClose }) {
  const [pop, setPop] = useState('skewed')
  const [n, setN] = useState(5)
  const [zoom, setZoom] = useState(true)
  const [means, setMeans] = useState([])
  const rngRef = useRef(rng(1))
  const timer = useRef(0)
  const info = INFO[pop]
  const draw = (count) => { const r = rngRef.current, d = POPS[pop].draw; return Array.from({ length: count }, () => { let s = 0; for (let i = 0; i < n; i++) s += d(r); return s / n }) }
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

  useEffect(() => { clearInterval(timer.current); rngRef.current = rng(pop.length * 97 + n); setMeans(draw(300)) }, [pop, n])
  useEffect(() => () => clearInterval(timer.current), [])

  const addMany = () => {
    clearInterval(timer.current)
    if (reduce) { setMeans((m) => [...m, ...draw(1000)].slice(-4000)); return }
    let k = 0
    timer.current = setInterval(() => { setMeans((m) => [...m, ...draw(100)].slice(-4000)); if (++k >= 10) clearInterval(timer.current) }, 90)
  }
  const se = info.sd / Math.sqrt(n)
  const [lo, hi] = zoom ? [Math.max(info.lo, info.m - 3.6 * se), info.m + 3.6 * se] : [0, info.hi]
  const popHist = useMemo(() => hist(info.pop, 0, info.hi), [info])
  const mHist = useMemo(() => hist(means, lo, hi), [means, lo, hi])
  const bw = (hi - lo) / NBIN
  const curve = useMemo(() => Array.from({ length: NBIN }, (_, i) => { const x = lo + (i + 0.5) * bw; return means.length * bw * Math.exp(-0.5 * ((x - info.m) / se) ** 2) / (se * Math.sqrt(2 * Math.PI)) }), [lo, bw, means.length, se, info])
  const ms = means.length ? stats(means) : { m: 0, sd: 0, skew: 0 }
  const caption = n === 1
    ? 'With one value per sample, the average of a sample is just a single draw, so the bottom chart copies the population above, skew and all.'
    : ms.skew > 0.6
      ? `Averages of ${n} are already less extreme than single values, but the shape is still lopsided (skewness ${ms.skew.toFixed(1)}). A long tail means a much bigger sample is needed before the bell shape appears. This is why a few extreme values can undermine a test that looks fine on paper.`
      : `Averages of ${n} values cluster in a bell shape around the true mean, even though the population above is nothing like a bell. The dashed curve is the normal shape the theory predicts, and the bars sit close to it.`
  return (
    <Shell
      title="Why averages behave"
      intro="Take many samples, average each one, and look at how those averages are spread."
      onClose={onClose}
      note="Each bar counts how many sample averages landed in that range. The dashed curve is a normal distribution with the population mean and a spread of sigma divided by the square root of n."
    >
      <div className="flex flex-wrap gap-3 items-center">
        <Seg label="Population" value={pop} onChange={setPop} options={Object.entries(POPS).map(([id, p]) => ({ id, label: p.label }))} />
      </div>
      <p className="text-sm font-semibold mt-4 mb-1">The population: every individual value</p>
      <Bars counts={popHist} color="hsl(var(--muted-foreground))" label={`Distribution of the population: ${POPS[pop].label}`} height={120} lo={0} hi={info.hi} compress />
      <p className="text-xs text-muted-foreground -mt-1">Bar heights are compressed so rare large values stay visible.</p>
      <div className="mt-3"><Slider label="Sample size n" value={n} min={1} max={200} onChange={setN} /></div>
      <p className="text-sm font-semibold mt-4 mb-1">{means.length.toLocaleString()} sample averages</p>
      <Bars counts={mHist} color="hsl(var(--primary))" label="Histogram of sample averages with a normal curve" lo={lo} hi={hi} curve={curve} />
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3">
        <button onClick={addMany} className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold px-3.5 py-2 rounded-xl hover:opacity-90">Draw 1,000 more samples</button>
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={zoom} onChange={(e) => setZoom(e.target.checked)} className="w-4 h-4 accent-primary" /> Zoom in on the averages
        </label>
      </div>
      <p className="mt-4 text-[15px] leading-relaxed min-h-[6rem]" aria-live="polite">{caption}</p>
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-xl border border-border p-3"><p className="text-xs text-muted-foreground">Spread of the averages</p><p className="font-serif text-xl tabular-nums">{ms.sd.toFixed(2)}</p><p className="text-xs text-muted-foreground">theory: {se.toFixed(2)}</p></div>
        <div className="rounded-xl border border-border p-3"><p className="text-xs text-muted-foreground">Spread of individuals</p><p className="font-serif text-xl tabular-nums">{info.sd.toFixed(2)}</p><p className="text-xs text-muted-foreground">n = {n} cuts it by {Math.sqrt(n).toFixed(1)}x</p></div>
        <div className="rounded-xl border border-border p-3"><p className="text-xs text-muted-foreground">Skewness of the averages</p><p className="font-serif text-xl tabular-nums">{ms.skew.toFixed(2)}</p><p className="text-xs text-muted-foreground">population: {info.skew.toFixed(2)}</p></div>
      </div>
    </Shell>
  )
}
