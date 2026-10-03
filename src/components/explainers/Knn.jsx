import { useMemo, useState } from 'react'
import { rng, gauss } from '../../lib/toy.js'
import Shell, { Seg, Slider, Spark } from './Shell.jsx'

// The class depends on the vertical feature only; the horizontal feature is unrelated noise.
function make(n, seed) {
  const r = rng(seed)
  return Array.from({ length: n }, () => {
    const x = r() * 10, y = r() * 10
    return { x, y, c: y + 2.4 * gauss(r) > 5 ? 1 : 0 }
  })
}
const TRAIN = make(120, 4), TEST = make(400, 15)
const KS = Array.from({ length: 20 }, (_, i) => i * 2 + 1) // 1,3,...,39

function vote(train, k, x, y, s) {
  const d = train.map((p) => ({ d: ((p.x - x) * s) ** 2 + (p.y - y) ** 2, c: p.c })).sort((a, b) => a.d - b.d)
  let pos = 0
  for (let i = 0; i < k; i++) pos += d[i].c
  return pos / k
}
const accOf = (data, k, s, train) => data.filter((p) => (vote(train, k, p.x, p.y, s) >= 0.5 ? 1 : 0) === p.c).length / data.length
const CURVES = {
  1: { tr: KS.map((k) => accOf(TRAIN, k, 1, TRAIN)), te: KS.map((k) => accOf(TEST, k, 1, TRAIN)) },
  10: { tr: KS.map((k) => accOf(TRAIN, k, 10, TRAIN)), te: KS.map((k) => accOf(TEST, k, 10, TRAIN)) },
}
const W = 640, H = 300, GX = 40, GY = 22

export default function Knn({ onClose }) {
  const [ki, setKi] = useState(5)
  const [scale, setScale] = useState('1')
  const s = +scale, k = KS[ki]
  const cells = useMemo(() => {
    const o = []
    for (let i = 0; i < GX; i++) for (let j = 0; j < GY; j++) o.push({ i, j, p: vote(TRAIN, k, ((i + 0.5) / GX) * 10, ((j + 0.5) / GY) * 10, s) })
    return o
  }, [k, s])
  const cur = CURVES[s]
  const bestK = KS[cur.te.indexOf(Math.max(...cur.te))]
  const sx = (x) => (x / 10) * W, sy = (y) => H - (y / 10) * H

  let caption
  if (k === 1) caption = 'With k = 1 each point is its own neighborhood, so the boundary wraps tightly around single training points, noise included. Training accuracy is 100% by construction.'
  else if (k >= 25) caption = 'With a large k the vote averages over a big neighborhood, so the boundary is smooth but loses detail and drifts toward the overall majority.'
  else caption = 'A moderate k smooths out single noisy points while still following the real pattern.'
  if (s === 10) caption += ' Here the horizontal feature has been stretched ten times, as if it were measured in much larger units. Distance now mostly measures horizontal gap, which is pure noise, so neighbors are the wrong points and accuracy drops at every k.'

  return (
    <Shell title="k-nearest neighbors" intro="Classify a spot by a vote among the k closest training points. There is no training step: the data is the model."
      onClose={onClose}
      note="Toy data: the class depends only on the vertical feature, with a lot of noise; the horizontal feature carries no information. 120 training points, 400 test points. Shading shows the share of neighbors in the green class.">
      <div className="flex flex-wrap gap-3 mb-3">
        <Seg label="Feature units" value={scale} onChange={setScale} options={[{ id: '1', label: 'Both features in similar units' }, { id: '10', label: 'Horizontal stretched 10x' }]} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded-xl overflow-hidden" role="img" aria-label="k-nearest neighbors decision regions">
        {cells.map((c) => <rect shapeRendering="crispEdges" key={`${c.i}-${c.j}`} x={(c.i / GX) * W} y={H - ((c.j + 1) / GY) * H} width={W / GX + 0.6} height={H / GY + 0.6} fill={c.p >= 0.5 ? '#0f766e' : '#e11d48'} fillOpacity={0.12 + 0.3 * Math.abs(c.p - 0.5) * 2} />)}
        {TRAIN.map((p, i) => <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r="4.2" fill={p.c ? '#0f766e' : '#e11d48'} stroke="hsl(var(--card))" strokeWidth="1.5" />)}
      </svg>
      <div className="mt-3"><Slider label="Number of neighbors (k)" value={ki} min={0} max={KS.length - 1} onChange={setKi} display={String(k)} /></div>
      <p className="mt-3 mb-4 text-[15px] leading-relaxed min-h-[5.5rem]" aria-live="polite">{caption}</p>
      <Spark title="Accuracy as k grows" readout={`k = ${k}: training ${(cur.tr[ki] * 100).toFixed(0)}%, test ${(cur.te[ki] * 100).toFixed(0)}% (best test at k = ${bestK})`}
        series={[{ values: cur.tr.map((v) => v - 0.4), color: 'hsl(var(--primary))', label: 'training' }, { values: cur.te.map((v) => v - 0.4), color: '#7c3aed', label: 'test' }]}
        xs={KS} cur={ki} yMax={0.6} xLabel={['k = 1', 'k = 39']} />
      <p className="text-xs text-muted-foreground mt-1"><span style={{ color: 'hsl(var(--primary))' }}>Training</span> and <span style={{ color: '#7c3aed' }}>test</span> accuracy. The chart starts at 40%.</p>
    </Shell>
  )
}
