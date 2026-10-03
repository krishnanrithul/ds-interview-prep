import { useMemo, useState } from 'react'
import Shell, { Seg, path } from './Shell.jsx'
import { rng } from '../../lib/toy.js'

// Beta-binomial updating for a conversion rate.
const lgamma = (x) => { const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5]; let y = x, t = x + 5.5; t -= (x + 0.5) * Math.log(t); let s = 1.000000000190015; for (const v of c) s += v / ++y; return -t + Math.log((2.5066282746310005 * s) / x) }
const pdf = (x, a, b) => (x <= 0 || x >= 1 ? 0 : Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + (a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x)))
const PRIORS = { flat: { a: 1, b: 1, label: 'No opinion (flat)' }, sceptic: { a: 20, b: 180, label: 'Past launches suggest about 10%' }, wrong: { a: 40, b: 160, label: 'Confident it is about 20%' } }
const TRUE_RATE = 0.12, BASE = 0.1
const XS = Array.from({ length: 301 }, (_, i) => (i / 300) * 0.4)
const W = 640, H = 240
const px = (x) => 16 + (x / 0.4) * (W - 32)

function quantile(a, b, q) { let lo = 0, hi = 1; for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; let c = 0; const n = 600; for (let k = 0; k < n; k++) c += pdf(((k + 0.5) / n) * mid, a, b) * (mid / n); if (c < q) lo = mid; else hi = mid } return (lo + hi) / 2 }
function probAbove(a, b, t) { const n = 800; let c = 0; for (let k = 0; k < n; k++) c += pdf(t + ((k + 0.5) / n) * (1 - t), a, b) * ((1 - t) / n); return c }

export default function Bayes({ onClose }) {
  const [pk, setPk] = useState('flat')
  const [conv, setConv] = useState(0)
  const [visits, setVisits] = useState(0)
  const [seed, setSeed] = useState(3)
  const pr = PRIORS[pk]
  const a = pr.a + conv, b = pr.b + (visits - conv)
  const post = useMemo(() => XS.map((x) => pdf(x, a, b)), [a, b])
  const prior = useMemo(() => XS.map((x) => pdf(x, pr.a, pr.b)), [pr])
  const yMax = Math.max(...post, ...prior) * 1.1
  const py = (v) => H - 26 - (v / yMax) * (H - 40)
  const lo = useMemo(() => quantile(a, b, 0.025), [a, b]), hi = useMemo(() => quantile(a, b, 0.975), [a, b])
  const above = useMemo(() => probAbove(a, b, BASE), [a, b])
  const mean = a / (a + b)

  const add = (n) => { const r = rng(seed * 997); let c = 0; for (let i = 0; i < n; i++) if (r() < TRUE_RATE) c++; setConv((v) => v + c); setVisits((v) => v + n); setSeed((s) => s + 1) }
  const reset = () => { setConv(0); setVisits(0); setSeed(3) }

  return (
    <Shell title="Bayesian updating" intro={`A new page might convert better than the 10% baseline. Start with a belief, feed in visitors, and watch the belief move. Behind the scenes the true rate is ${(TRUE_RATE * 100).toFixed(0)}%.`}
      onClose={onClose}
      note="Beta prior and binomial data, so the update is exact: add the conversions to one parameter and the non-conversions to the other. Visitors are simulated from a hidden true rate with a fixed seed. The interval is a 95% credible interval.">
      <div className="mb-3"><Seg label="Starting belief" value={pk} onChange={(v) => { setPk(v); reset() }} options={Object.entries(PRIORS).map(([id, p]) => ({ id, label: p.label }))} /></div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded-xl bg-muted/40" role="img" aria-label="Prior and posterior distributions of the conversion rate">
        <rect x={px(lo)} y="6" width={Math.max(px(hi) - px(lo), 1)} height={H - 32} fill="hsl(var(--primary))" fillOpacity="0.12" />
        <line x1={px(BASE)} x2={px(BASE)} y1="6" y2={H - 26} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />
        <text x={px(BASE) + 5} y="18" fontSize="12" fill="hsl(var(--muted-foreground))">10% baseline</text>
        <path d={path(XS.map((x, i) => [px(x), py(prior[i])]))} fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeDasharray="5 4" />
        <path d={path(XS.map((x, i) => [px(x), py(post[i])]))} fill="none" stroke="hsl(var(--primary))" strokeWidth="3.5" />
        <line x1="16" x2={W - 16} y1={H - 26} y2={H - 26} stroke="hsl(var(--border))" />
        {[0, 0.1, 0.2, 0.3, 0.4].map((t) => <text key={t} x={px(t)} y={H - 8} fontSize="12" textAnchor="middle" fill="hsl(var(--muted-foreground))">{Math.round(t * 100)}%</text>)}
      </svg>
      <div className="flex flex-wrap gap-2 mt-3">
        {[10, 100, 1000].map((n) => <button key={n} onClick={() => add(n)} className="bg-primary text-primary-foreground text-sm font-semibold px-3.5 py-2 rounded-xl hover:opacity-90">Add {n} visitors</button>)}
        <button onClick={reset} className="border border-border text-sm font-medium px-3 py-2 rounded-xl hover:bg-muted">Start over</button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3 mt-3 text-sm">
        <div className="rounded-xl border border-border p-3"><div className="text-muted-foreground">Data so far</div><div className="tabular-nums text-lg font-semibold">{conv} of {visits}</div></div>
        <div className="rounded-xl border border-border p-3"><div className="text-muted-foreground">Best estimate, 95% interval</div><div className="tabular-nums text-lg font-semibold">{(mean * 100).toFixed(1)}%, {(lo * 100).toFixed(1)} to {(hi * 100).toFixed(1)}%</div></div>
        <div className="rounded-xl border border-border p-3"><div className="text-muted-foreground">Chance the rate beats 10%</div><div className="tabular-nums text-lg font-semibold">{(above * 100).toFixed(0)}%</div></div>
      </div>
      <p className="mt-3 text-[15px] leading-relaxed min-h-[5.5rem]" aria-live="polite">
        {visits === 0 ? 'No data yet, so the belief is just the starting belief. Add visitors.'
          : visits < 100 ? 'With little data the answer leans on the starting belief. A flat start swings with every conversion; a confident start barely moves.'
            : pk === 'wrong' && visits < 2000 ? 'A confident prior in the wrong place resists the data: the curve is still pulled toward 20%. Keep adding visitors and the data gradually wins, but it takes much more evidence than from a flat start.'
              : 'With plenty of data the starting belief matters less and the curves from different starts converge. The interval narrows roughly with the square root of the number of visitors.'}
      </p>
    </Shell>
  )
}
