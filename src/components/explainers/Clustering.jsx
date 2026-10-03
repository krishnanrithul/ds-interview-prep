import { useEffect, useMemo, useState } from 'react'
import { Play, Pause, Shuffle } from 'lucide-react'
import { rng, gauss } from '../../lib/toy.js'
import Shell, { Seg, Slider } from './Shell.jsx'

const COLORS = ['#0f766e', '#e11d48', '#ca8a04', '#7c3aed', '#0284c7', '#ea580c']
const NOISE = 'hsl(var(--muted-foreground))'
const W = 640, H = 340
const sx = (x) => 14 + (x / 10) * (W - 28)
const sy = (y) => H - 14 - (y / 10) * (H - 28)

function makeData(kind) {
  const r = rng(kind === 'blobs' ? 5 : kind === 'moons' ? 9 : 21)
  const pts = []
  const blob = (cx, cy, sd, n) => { for (let i = 0; i < n; i++) pts.push([cx + sd * gauss(r), cy + sd * gauss(r)]) }
  if (kind === 'blobs') { blob(2.6, 2.6, 0.7, 60); blob(7.6, 3.2, 0.7, 60); blob(5, 7.6, 0.7, 60) }
  if (kind === 'uneven') { blob(3, 5, 1.5, 120); blob(7.8, 7.2, 0.35, 25); blob(7.8, 3, 0.35, 25) }
  if (kind === 'moons') {
    for (let i = 0; i < 60; i++) {
      const t = (i / 59) * Math.PI
      pts.push([cos2(t, 0), sin2(t, 0)].map((v, j) => v + 0.06 * gauss(r)))
      pts.push([cos2(t, 1), sin2(t, 1)].map((v, j) => v + 0.06 * gauss(r)))
    }
    return pts.map(([x, y]) => [((x + 1) / 3) * 8 + 1, ((y + 0.5) / 1.5) * 5 + 2.5])
  }
  return pts
}
const cos2 = (t, lower) => (lower ? 1 - Math.cos(t) : Math.cos(t))
const sin2 = (t, lower) => (lower ? 0.5 - Math.sin(t) : Math.sin(t))
const DATA = { blobs: makeData('blobs'), moons: makeData('moons'), uneven: makeData('uneven') }
const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2

function kmeans(pts, k, seed) {
  const r = rng(seed * 7919 + k)
  const idx = new Set()
  while (idx.size < k) idx.add(Math.floor(r() * pts.length))
  let centers = [...idx].map((i) => [...pts[i]])
  const states = []
  let prev = null
  for (let it = 0; it < 40; it++) {
    const labels = pts.map((p) => { let b = 0; for (let c = 1; c < k; c++) if (d2(p, centers[c]) < d2(p, centers[b])) b = c; return b })
    const sse = pts.reduce((s, p, i) => s + d2(p, centers[labels[i]]), 0)
    states.push({ centers: centers.map((c) => [...c]), labels, sse })
    if (prev && labels.every((l, i) => l === prev[i])) break
    prev = labels
    centers = centers.map((c, j) => {
      const m = pts.filter((_, i) => labels[i] === j)
      return m.length ? [m.reduce((s, p) => s + p[0], 0) / m.length, m.reduce((s, p) => s + p[1], 0) / m.length] : c
    })
  }
  return states
}

function dbscan(pts, eps, minPts) {
  const n = pts.length, labels = new Array(n).fill(-2) // -2 unvisited, -1 noise
  const near = (i) => { const o = []; for (let j = 0; j < n; j++) if (d2(pts[i], pts[j]) <= eps * eps) o.push(j); return o }
  let c = 0
  for (let i = 0; i < n; i++) {
    if (labels[i] !== -2) continue
    const nb = near(i)
    if (nb.length < minPts) { labels[i] = -1; continue }
    labels[i] = c
    const q = [...nb]
    while (q.length) {
      const j = q.pop()
      if (labels[j] === -1) labels[j] = c
      if (labels[j] !== -2) continue
      labels[j] = c
      const nj = near(j)
      if (nj.length >= minPts) q.push(...nj)
    }
    c++
  }
  return { labels, clusters: c, noise: labels.filter((l) => l === -1).length }
}

export default function Clustering({ onClose }) {
  const [algo, setAlgo] = useState('kmeans')
  const [shape, setShape] = useState('blobs')
  const [k, setK] = useState(3)
  const [seed, setSeed] = useState(1)
  const [iter, setIter] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [eps, setEps] = useState(0.7)
  const [minPts, setMinPts] = useState(5)
  const pts = DATA[shape]
  const pickShape = (id) => { setShape(id); setEps({ blobs: 0.7, moons: 0.8, uneven: 0.6 }[id]); setK(id === 'moons' ? 2 : 3) }

  const states = useMemo(() => kmeans(pts, k, seed), [pts, k, seed])
  const db = useMemo(() => dbscan(pts, eps, minPts), [pts, eps, minPts])
  const it = Math.min(iter, states.length - 1)
  const st = states[it]

  useEffect(() => { setIter(0); setPlaying(false) }, [shape, k, seed, algo])
  useEffect(() => {
    if (!playing) return
    if (it >= states.length - 1) { setPlaying(false); return }
    const t = setTimeout(() => setIter((v) => v + 1), 700)
    return () => clearTimeout(t)
  }, [playing, it, states.length])

  const labels = algo === 'kmeans' ? st.labels : db.labels
  const colorOf = (l) => (l < 0 ? NOISE : COLORS[l % COLORS.length])
  const done = it >= states.length - 1

  let caption
  if (algo === 'kmeans') {
    caption = shape === 'blobs'
      ? 'Three round, similar-sized groups are what k-means expects. Step through the iterations: the centers move to the middle of their points and the split settles in a few steps. Try "New random start" and k = 4 or 2 to see how much the answer depends on the choice of k.'
      : shape === 'moons'
        ? 'k-means draws a straight boundary between centers, so it slices across both crescents instead of separating them. Changing k only changes how many slices; the method assumes round groups.'
        : 'The big spread-out group pulls a center toward it and the small tight groups get merged or the big one gets split. k-means weighs every point by distance, so size and spread matter.'
  } else {
    caption = shape === 'moons'
      ? `Found ${db.clusters} cluster${db.clusters === 1 ? '' : 's'} and ${db.noise} noise points. DBSCAN follows chains of nearby points, so it can trace each crescent. Make eps too small and it shatters them into noise; too large and it joins both into one.`
      : shape === 'uneven'
        ? `Found ${db.clusters} cluster${db.clusters === 1 ? '' : 's'} and ${db.noise} noise points. One eps has to suit both the sparse group and the dense ones. Raise it until the sparse group is found and the tight groups may merge with it; lower it and the sparse group turns into noise.`
        : `Found ${db.clusters} cluster${db.clusters === 1 ? '' : 's'} and ${db.noise} noise points. You never told it how many clusters to find; eps and the minimum points per neighborhood decide. Grey points are noise.`
  }

  return (
    <Shell title="How k-means and DBSCAN group points" intro="The same dots, two different ideas of what a cluster is. Switch the shape of the data and see which method copes." onClose={onClose}
      note="Toy data with a fixed seed; both algorithms are computed here, not animated by hand. k-means starts from randomly chosen points, so a different start can give a different answer.">
      <div className="flex flex-wrap gap-3 mb-3">
        <Seg label="Algorithm" value={algo} onChange={setAlgo} options={[{ id: 'kmeans', label: 'k-means' }, { id: 'dbscan', label: 'DBSCAN' }]} />
        <Seg label="Data shape" value={shape} onChange={pickShape} options={[{ id: 'blobs', label: 'Round groups' }, { id: 'moons', label: 'Crescents' }, { id: 'uneven', label: 'Uneven groups' }]} />
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded-xl bg-muted/40" role="img" aria-label="Scatter plot of points colored by cluster">
        {pts.map((p, i) => <circle key={i} cx={sx(p[0])} cy={sy(p[1])} r="4" fill={colorOf(labels[i])} fillOpacity={labels[i] < 0 ? 0.5 : 0.85} style={{ transition: 'fill 400ms' }} />)}
        {algo === 'kmeans' && st.centers.map((c, j) => (
          <g key={j}>
            <circle cx={sx(c[0])} cy={sy(c[1])} r="10" fill="hsl(var(--card))" stroke={COLORS[j % COLORS.length]} strokeWidth="3.5" />
            <circle cx={sx(c[0])} cy={sy(c[1])} r="3" fill={COLORS[j % COLORS.length]} />
          </g>
        ))}
      </svg>

      {algo === 'kmeans' ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => { if (done) setIter(0); setPlaying((p) => !p) }} className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold px-3.5 py-2 rounded-xl hover:opacity-90">
              {playing ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Run</>}
            </button>
            <button onClick={() => setSeed((s) => s + 1)} className="inline-flex items-center gap-1.5 border border-border text-sm font-medium px-3 py-2 rounded-xl hover:bg-muted"><Shuffle className="w-4 h-4" /> New random start</button>
          </div>
          <div className="text-sm tabular-nums text-muted-foreground self-center">Iteration {it} of {states.length - 1}, within-cluster spread {st.sse.toFixed(0)}{done ? ' (settled)' : ''}</div>
          <Slider label="Number of clusters (k)" value={k} min={2} max={6} onChange={setK} />
          <Slider label="Iteration" value={it} min={0} max={Math.max(states.length - 1, 1)} onChange={(v) => { setPlaying(false); setIter(v) }} />
        </div>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Slider label="Neighborhood radius (eps)" value={eps} min={0.1} max={1.5} step={0.05} onChange={setEps} display={eps.toFixed(2)} />
          <Slider label="Minimum points to form a core" value={minPts} min={3} max={12} onChange={setMinPts} />
        </div>
      )}

      <p className="mt-4 text-[15px] leading-relaxed min-h-[5.5rem]" aria-live="polite">{caption}</p>
    </Shell>
  )
}
