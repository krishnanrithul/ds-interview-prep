import { useMemo, useState } from 'react'
import { rng, gauss } from '../../lib/toy.js'
import Shell, { Seg, Slider, Spark } from './Shell.jsx'

// Two classes in a plane: an inner disc against an outer ring, with 12% of labels flipped.
function make(n, seed) {
  const r = rng(seed)
  return Array.from({ length: n }, () => {
    const x = r() * 10, y = r() * 10
    let c = Math.hypot(x - 5, y - 5) < 2.9 ? 1 : 0
    if (r() < 0.12) c = 1 - c
    return { x, y, c }
  })
}
const TRAIN = make(140, 3), TEST = make(500, 8)
const MAXD = 10

const gini = (p, k) => (k === 0 ? 0 : 1 - (p / k) ** 2 - ((k - p) / k) ** 2)
function grow(rows, depth, maxD, pickAxes) {
  const pos = rows.filter((r) => r.c === 1).length
  const leaf = { p: rows.length ? pos / rows.length : 0.5 }
  if (depth >= maxD || pos === 0 || pos === rows.length || rows.length < 2) return leaf
  let best = null
  for (const axis of pickAxes()) {
    const s = [...rows].sort((a, b) => a[axis] - b[axis])
    let lp = 0
    const totalPos = pos
    for (let i = 0; i < s.length - 1; i++) {
      lp += s[i].c
      if (s[i][axis] === s[i + 1][axis]) continue
      const ln = i + 1, rn = s.length - ln
      const imp = (ln * gini(lp, ln) + rn * gini(totalPos - lp, rn)) / s.length
      if (!best || imp < best.imp) best = { imp, axis, t: (s[i][axis] + s[i + 1][axis]) / 2 }
    }
  }
  if (!best) return leaf
  const L = rows.filter((r) => r[best.axis] <= best.t), R = rows.filter((r) => r[best.axis] > best.t)
  return { axis: best.axis, t: best.t, l: grow(L, depth + 1, maxD, pickAxes), r: grow(R, depth + 1, maxD, pickAxes) }
}
const predict = (node, x, y) => (node.l ? predict(x_or_y(node, x, y) <= node.t ? node.l : node.r, x, y) : node.p)
const x_or_y = (node, x, y) => (node.axis === 'x' ? x : y)

function singleTree(d) { return [grow(TRAIN, 0, d, () => ['x', 'y'])] }
function forest(d) {
  const r = rng(77)
  return Array.from({ length: 25 }, () => {
    const boot = Array.from({ length: TRAIN.length }, () => TRAIN[Math.floor(r() * TRAIN.length)])
    return grow(boot, 0, d, () => [r() < 0.5 ? 'x' : 'y'])
  })
}
const prob = (trees, x, y) => trees.reduce((s, t) => s + predict(t, x, y), 0) / trees.length
const acc = (trees, data) => data.filter((p) => (prob(trees, p.x, p.y) >= 0.5 ? 1 : 0) === p.c).length / data.length
const MODELS = { tree: Array.from({ length: MAXD }, (_, i) => singleTree(i + 1)), forest: Array.from({ length: MAXD }, (_, i) => forest(i + 1)) }
const ACC = {
  tree: { tr: MODELS.tree.map((m) => acc(m, TRAIN)), te: MODELS.tree.map((m) => acc(m, TEST)) },
  forest: { tr: MODELS.forest.map((m) => acc(m, TRAIN)), te: MODELS.forest.map((m) => acc(m, TEST)) },
}

const W = 640, H = 320, GX = 48, GY = 24
export default function Trees({ onClose }) {
  const [kind, setKind] = useState('tree')
  const [depth, setDepth] = useState(2)
  const trees = MODELS[kind][depth - 1]
  const a = ACC[kind]
  const cells = useMemo(() => {
    const out = []
    for (let i = 0; i < GX; i++) for (let j = 0; j < GY; j++) {
      const x = ((i + 0.5) / GX) * 10, y = ((j + 0.5) / GY) * 10
      out.push({ i, j, p: prob(trees, x, y) })
    }
    return out
  }, [trees])
  const sx = (x) => (x / 10) * W, sy = (y) => H - (y / 10) * H
  const tr = a.tr[depth - 1], te = a.te[depth - 1]
  const gap = tr - te

  let caption
  if (kind === 'tree') caption = depth <= 2 ? 'Too few questions. A couple of straight cuts cannot trace a disc, so the tree is wrong on training and test data alike.'
    : gap < 0.08 ? 'A few more cuts start to capture the disc. Training and test accuracy are still close, which means the tree is learning the pattern, not the noise.'
      : 'Deeper cuts chase single points. Training accuracy keeps rising while test accuracy stalls or falls, and the boundary turns into small boxes around individual dots, including the mislabeled ones. That gap is overfitting.'
  else caption = depth <= 2 ? 'Averaging many shallow trees helps a little, but each tree is still too simple to follow a disc.'
    : 'Each of the 25 trees sees a different resample of the rows and picks its split axis at random, so each overfits in its own way. Averaging their votes cancels much of that, so the boundary is smoother and test accuracy holds up at depths where one tree fell apart.'

  return (
    <Shell title="Decision trees and forests" intro="Each cut asks one yes/no question about one feature. Let the tree ask more questions and watch what happens to the boundary."
      onClose={onClose}
      note="Toy data: an inner disc and an outer ring, with 12% of the labels flipped to mimic noise. 140 training points, 500 test points. Trees split to reduce Gini impurity; the forest averages 25 trees grown on bootstrap resamples with a random split axis. Shading shows the predicted share of the inner class.">
      <div className="flex flex-wrap gap-3 mb-3">
        <Seg label="Model" value={kind} onChange={setKind} options={[{ id: 'tree', label: 'One tree' }, { id: 'forest', label: 'Forest of 25 trees' }]} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded-xl overflow-hidden" role="img" aria-label="Decision regions">
        {cells.map((c) => <rect shapeRendering="crispEdges" key={`${c.i}-${c.j}`} x={(c.i / GX) * W} y={H - ((c.j + 1) / GY) * H} width={W / GX + 0.6} height={H / GY + 0.6} fill={c.p >= 0.5 ? '#0f766e' : '#e11d48'} fillOpacity={0.12 + 0.3 * Math.abs(c.p - 0.5) * 2} />)}
        {TRAIN.map((p, i) => <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r="4.5" fill={p.c ? '#0f766e' : '#e11d48'} stroke="hsl(var(--card))" strokeWidth="1.5" />)}
      </svg>
      <div className="mt-3">
        <Slider label="Maximum depth (questions asked in a row)" value={depth} min={1} max={MAXD} onChange={setDepth} />
      </div>
      <p className="mt-3 mb-4 text-[15px] leading-relaxed min-h-[5.5rem]" aria-live="polite">{caption}</p>
      <Spark title="Accuracy by depth" readout={`training ${(tr * 100).toFixed(0)}%, test ${(te * 100).toFixed(0)}%`}
        series={[{ values: a.tr.map((v) => v - 0.4), color: 'hsl(var(--primary))', label: 'training' }, { values: a.te.map((v) => v - 0.4), color: '#7c3aed', label: 'test' }]}
        xs={a.tr} cur={depth - 1} yMax={0.6} xLabel={['depth 1', `depth ${MAXD}`]} />
      <p className="text-xs text-muted-foreground mt-1"><span style={{ color: 'hsl(var(--primary))' }}>Training</span> and <span style={{ color: '#7c3aed' }}>test</span> accuracy. The chart starts at 40%.</p>
    </Shell>
  )
}
