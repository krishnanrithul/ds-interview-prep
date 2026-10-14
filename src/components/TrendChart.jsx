import { useEffect, useRef, useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

// Weekly average score as a small line chart. Fixed 0 to 100 scale (no zoom, so small changes look small), one
// series, a gap where a week has too few answers, and a readout line above the plot that shows the latest week or
// the week under the pointer (hover, tap or arrow keys). Screen readers get the same numbers as a table.
const H = 128
const PAD = { t: 10, r: 10, b: 22, l: 34 }
const TREND_MIN = 3
const fmt = (ts) => new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })

export default function TrendChart({ weeks, change }) {
  const ref = useRef(null)
  const [w, setW] = useState(0)
  const [active, setActive] = useState(null)
  const [spoken, setSpoken] = useState('')
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const iw = Math.max(0, w - PAD.l - PAD.r)
  const ih = H - PAD.t - PAD.b
  const x = (i) => PAD.l + (weeks.length > 1 ? (i / (weeks.length - 1)) * iw : iw / 2)
  const y = (v) => PAD.t + ih - (v / 100) * ih
  const pts = weeks.map((wk, i) => ({ ...wk, i })).filter((p) => p.avg !== null)
  // Start a new segment after a missing week, so a gap is never drawn as a trend.
  const path = pts.map((p, k) => `${k && pts[k - 1].i === p.i - 1 ? 'L' : 'M'}${x(p.i).toFixed(1)},${y(p.avg).toFixed(1)}`).join(' ')
  const act = pts.find((p) => p.i === active)
  const last = pts[pts.length - 1]
  const shown = act || last
  const describe = (p) => `Week of ${fmt(p.start)}: ${p.avg}%, ${p.n} ${p.n === 1 ? 'answer' : 'answers'}`

  const nearest = (clientX) => {
    const left = ref.current.getBoundingClientRect().left
    let best = null
    pts.forEach((p) => {
      if (best === null || Math.abs(x(p.i) - (clientX - left)) < Math.abs(x(best.i) - (clientX - left))) best = p
    })
    setActive(best ? best.i : null)
  }
  const step = (dir) => {
    const k = pts.findIndex((p) => p.i === active)
    const next = pts[k === -1 ? (dir > 0 ? 0 : pts.length - 1) : Math.min(pts.length - 1, Math.max(0, k + dir))]
    setActive(next.i)
    setSpoken(describe(next))
  }
  const showChange = change && Math.abs(change.delta) >= TREND_MIN && !act

  return (
    <div>
      <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground mb-1 min-h-5" aria-hidden="true">
        <span className="font-medium text-foreground">{act ? `Week of ${fmt(act.start)}` : 'Weekly average'}</span>
        <span className="tabular-nums">
          {shown.avg}% {act ? `· ${act.n} ${act.n === 1 ? 'answer' : 'answers'}` : 'this week'}
        </span>
        {showChange && (
          <span className="inline-flex items-center gap-1 text-foreground">
            {change.delta > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {change.delta > 0 ? 'up' : 'down'} {Math.abs(change.delta)} on the week before
          </span>
        )}
      </p>
      <div ref={ref} style={{ height: H }}>
        {w > 0 && (
          <svg
            width={w}
            height={H}
            tabIndex={0}
            role="img"
            aria-label={`Weekly average score for the last ${weeks.length} weeks, latest ${last.avg}%${
              showChange ? `, ${change.delta > 0 ? 'up' : 'down'} ${Math.abs(change.delta)} on the week before` : ''
            }. Details in the table below.`}
            className="block rounded-md touch-pan-y"
            onPointerDown={(e) => nearest(e.clientX)}
            onPointerMove={(e) => nearest(e.clientX)}
            onPointerLeave={(e) => e.pointerType !== 'touch' && setActive(null)}
            onBlur={() => setActive(null)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') step(1)
              if (e.key === 'ArrowLeft') step(-1)
            }}
          >
            {[0, 25, 50, 75, 100].map((v) => (
              <g key={v}>
                <line
                  x1={PAD.l}
                  x2={w - PAD.r}
                  y1={y(v)}
                  y2={y(v)}
                  stroke="hsl(var(--border))"
                  strokeWidth="1"
                  strokeOpacity={v % 50 ? 0.5 : 1}
                />
                {v % 50 === 0 && (
                  <text x={PAD.l - 6} y={y(v) + 3} textAnchor="end" fontSize="10" fill="hsl(var(--muted-foreground))">
                    {v === 100 ? '100%' : v}
                  </text>
                )}
              </g>
            ))}
            <text x={x(0)} y={H - 6} fontSize="10" fill="hsl(var(--muted-foreground))">
              {fmt(weeks[0].start)}
            </text>
            <text x={x(weeks.length - 1)} y={H - 6} fontSize="10" textAnchor="end" fill="hsl(var(--muted-foreground))">
              This week
            </text>
            {act && <line x1={x(act.i)} x2={x(act.i)} y1={PAD.t} y2={PAD.t + ih} stroke="hsl(var(--muted-foreground))" strokeWidth="1" />}
            <path d={path} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {pts.map((p) => (
              <circle
                key={p.i}
                cx={x(p.i)}
                cy={y(p.avg)}
                r={p.i === active ? 5 : 4}
                fill="hsl(var(--primary))"
                stroke="hsl(var(--card))"
                strokeWidth="2"
              />
            ))}
          </svg>
        )}
      </div>
      <span role="status" aria-live="polite" className="sr-only">
        {spoken}
      </span>
      <table className="sr-only">
        <caption>Weekly average score</caption>
        <thead>
          <tr>
            <th>Week of</th>
            <th>Average score</th>
            <th>Answers</th>
          </tr>
        </thead>
        <tbody>
          {pts.map((p) => (
            <tr key={p.i}>
              <td>{fmt(p.start)}</td>
              <td>{p.avg}%</td>
              <td>{p.n}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
