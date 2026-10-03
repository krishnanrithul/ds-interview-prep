import { X } from 'lucide-react'

// Shared frame and controls for the interactive explainers.
export default function Shell({ title, intro, onClose, children, note }) {
  return (
    <section className="anim-msg rounded-2xl border border-border bg-card p-4 sm:p-5" aria-label={title}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-serif text-xl font-semibold">{title}</h3>
          {intro && <p className="text-sm text-muted-foreground mt-0.5">{intro}</p>}
        </div>
        <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"><X className="w-4 h-4" /></button>
      </div>
      {children}
      {note && <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{note}</p>}
    </section>
  )
}

export function Seg({ value, onChange, options, label }) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-xl bg-muted p-1">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          aria-pressed={value === o.id}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${value === o.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Slider({ label, value, min, max, step = 1, onChange, display }) {
  return (
    <label className="block text-sm">
      <span className="flex justify-between mb-1"><span>{label}</span><span className="tabular-nums font-medium">{display ?? value}</span></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-primary" />
    </label>
  )
}

export const path = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('')

// Small labelled line chart used under the main picture. `series` is [{values, color, label}].
export function Spark({ title, readout, series, xs, cur, yMax, refs = [], W = 300, H = 120, xLabel }) {
  const px = (i) => 12 + (i / (xs.length - 1)) * (W - 24)
  const py = (v) => H - 22 - (Math.min(v, yMax) / yMax) * (H - 36)
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1 gap-2">
        <span className="font-semibold">{title}</span>
        <span className="tabular-nums text-muted-foreground">{readout}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={title}>
        <line x1="12" y1={H - 22} x2={W - 12} y2={H - 22} stroke="hsl(var(--border))" />
        {refs.map((r) => (
          <g key={r.v}>
            <line x1="12" x2={W - 12} y1={py(r.v)} y2={py(r.v)} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeOpacity="0.6" />
            <text x={W - 12} y={py(r.v) - 4} fontSize="11" textAnchor="end" fill="hsl(var(--muted-foreground))">{r.label}</text>
          </g>
        ))}
        {series.map((s) => <path key={s.label} d={path(s.values.map((v, i) => [px(i), py(v)]))} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" />)}
        <line x1={px(cur)} x2={px(cur)} y1="6" y2={H - 22} stroke="hsl(var(--foreground))" strokeOpacity="0.4" />
        {series.map((s) => <circle key={s.label} cx={px(cur)} cy={py(s.values[cur])} r="4.5" fill={s.color} />)}
        {xLabel && <text x="12" y={H - 6} fontSize="11" fill="hsl(var(--muted-foreground))">{xLabel[0]}</text>}
        {xLabel && <text x={W - 12} y={H - 6} fontSize="11" textAnchor="end" fill="hsl(var(--muted-foreground))">{xLabel[1]}</text>}
      </svg>
    </div>
  )
}
