import { useState } from 'react'
import { rng, gauss } from '../../lib/toy.js'
import Shell, { Seg, Slider } from './Shell.jsx'

const r = rng(12)
const RAW = Array.from({ length: 90 }, () => {
  const a = gauss(r) * 2.1, b = gauss(r) * 0.65, t = (35 * Math.PI) / 180
  return [5 + a * Math.cos(t) - b * Math.sin(t), 5 + a * Math.sin(t) + b * Math.cos(t)]
})
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length
const mx = mean(RAW.map((p) => p[0])), my = mean(RAW.map((p) => p[1]))
const C = RAW.map(([x, y]) => [x - mx, y - my])
const cov = (A, B) => mean(A.map((v, i) => v * B[i]))
const xs = C.map((p) => p[0]), ys = C.map((p) => p[1])
const sxx = cov(xs, xs), syy = cov(ys, ys), sxy = cov(xs, ys)
const TOTAL = sxx + syy
const kept = (deg) => { const t = (deg * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t); return c * c * sxx + 2 * c * s * sxy + s * s * syy }
const PC1 = ((0.5 * Math.atan2(2 * sxy, sxx - syy)) * 180) / Math.PI

// Two features in very different units, moderately correlated.
const r2 = rng(5)
const PEOPLE = Array.from({ length: 200 }, () => { const e = gauss(r2), a = gauss(r2); return [60000 + 20000 * (0.6 * e + 0.8 * gauss(r2)), 8 + 5 * (0.5 * e + 0.87 * a)] })
function pc1(rows) {
  const a = rows.map((p) => p[0]), b = rows.map((p) => p[1])
  const ma = mean(a), mb = mean(b)
  const A = a.map((v) => v - ma), B = b.map((v) => v - mb)
  const saa = cov(A, A), sbb = cov(B, B), sab = cov(A, B)
  const t = 0.5 * Math.atan2(2 * sab, saa - sbb)
  const vec = [Math.cos(t), Math.sin(t)]
  const lam = (saa + sbb) / 2 + Math.sqrt(((saa - sbb) / 2) ** 2 + sab ** 2)
  return { vec, share: lam / (saa + sbb) }
}
const std = (rows) => { const cols = [0, 1].map((j) => rows.map((p) => p[j])); const m = cols.map(mean), s = cols.map((c, j) => Math.sqrt(mean(c.map((v) => (v - m[j]) ** 2)))); return rows.map((p) => p.map((v, j) => (v - m[j]) / s[j])) }
const RAWPC = pc1(PEOPLE), STDPC = pc1(std(PEOPLE))

const W = 640, H = 340
const sx = (x) => 20 + (x / 10) * (W - 40), sy = (y) => H - 20 - (y / 10) * (H - 40)

export default function PCA({ onClose }) {
  const [view, setView] = useState('project')
  const [deg, setDeg] = useState(110)
  const t = (deg * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t)
  const k = kept(deg), share = k / TOTAL, bestShare = kept(PC1) / TOTAL
  const proj = C.map(([x, y]) => { const d = x * c + y * s; return [mx + d * c, my + d * s] })
  const L = 6

  return (
    <Shell title="Principal component analysis" intro="Compress two features into one by projecting every point onto a line. Rotate the line and see how much of the spread survives."
      onClose={onClose}
      note="Toy data with a fixed seed. 'Spread kept' is the variance of the projected points as a share of the total variance; the first principal component is the direction that keeps the most.">
      <div className="mb-3"><Seg label="View" value={view} onChange={setView} options={[{ id: 'project', label: 'Pick the line' }, { id: 'scale', label: 'Why scale first' }]} /></div>
      {view === 'project' ? (
        <>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded-xl bg-muted/40" role="img" aria-label="Points projected onto a rotating line">
            <line x1={sx(mx - L * c)} y1={sy(my - L * s)} x2={sx(mx + L * c)} y2={sy(my + L * s)} stroke="hsl(var(--primary))" strokeWidth="3" />
            {RAW.map((p, i) => <line key={i} x1={sx(p[0])} y1={sy(p[1])} x2={sx(proj[i][0])} y2={sy(proj[i][1])} stroke="#e11d48" strokeOpacity="0.45" strokeWidth="1.2" />)}
            {RAW.map((p, i) => <circle key={i} cx={sx(p[0])} cy={sy(p[1])} r="3.6" fill="hsl(var(--foreground))" fillOpacity="0.75" />)}
            {proj.map((p, i) => <circle key={i} cx={sx(p[0])} cy={sy(p[1])} r="3" fill="hsl(var(--primary))" />)}
          </svg>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 items-end">
            <Slider label="Angle of the line" value={deg} min={0} max={179} onChange={setDeg} display={`${deg} degrees`} />
            <button onClick={() => setDeg(Math.round((PC1 + 180) % 180))} className="justify-self-start border border-border text-sm font-medium px-3 py-2 rounded-xl hover:bg-muted">Snap to the first component</button>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-sm mb-1"><span className="font-semibold">Spread kept</span><span className="tabular-nums text-muted-foreground">{(share * 100).toFixed(0)}% (best possible {(bestShare * 100).toFixed(0)}%)</span></div>
            <div className="h-3 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${share * 100}%`, transition: 'width 150ms' }} /></div>
          </div>
          <p className="mt-3 text-[15px] leading-relaxed min-h-[5.5rem]" aria-live="polite">
            {Math.abs(share - bestShare) < 0.01
              ? `This line keeps the most spread, ${(share * 100).toFixed(0)}%, so it also has the smallest total red distance from the points. That is the first principal component. Keeping one number per row instead of two loses only the remaining ${(100 - share * 100).toFixed(0)}%.`
              : `This line keeps ${(share * 100).toFixed(0)}% of the spread. The red segments are what is thrown away. Turn the line until the segments are as short as possible: the spread kept goes up exactly as they shrink, because the two always add up to the total.`}
          </p>
        </>
      ) : (
        <>
          <p className="text-[15px] leading-relaxed mb-3">200 people with two features: yearly income in dollars and years of experience. They are moderately correlated. Below is how much each feature contributes to the first component.</p>
          {[['Without scaling', RAWPC], ['After standardizing each feature', STDPC]].map(([label, pcr]) => (
            <div key={label} className="mb-4">
              <div className="flex justify-between text-sm font-semibold mb-1"><span>{label}</span><span className="tabular-nums text-muted-foreground">first component explains {(pcr.share * 100).toFixed(0)}%</span></div>
              {['Income (dollars)', 'Experience (years)'].map((n, j) => (
                <div key={n} className="flex items-center gap-2 text-sm mb-1">
                  <span className="w-40 shrink-0 text-muted-foreground">{n}</span>
                  <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${Math.abs(pcr.vec[j]) * 100}%` }} /></div>
                  <span className="w-12 text-right tabular-nums">{Math.abs(pcr.vec[j]).toFixed(2)}</span>
                </div>
              ))}
            </div>
          ))}
          <p className="text-[15px] leading-relaxed">PCA looks for the direction of greatest variance, and variance depends on units. Dollars vary by tens of thousands and years by a few, so without scaling the first component is simply the income column and the share it "explains" is nearly 100%. After standardizing, both features count and the picture changes.</p>
        </>
      )}
    </Shell>
  )
}
