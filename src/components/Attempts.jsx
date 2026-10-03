import { RATINGS } from '../lib/topics'

const fmt = (ts) => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

// Your saved answers for a question, newest first.
export default function Attempts({ attempts, title = 'Your attempts', limit = 5 }) {
  if (!attempts?.length) return null
  const list = [...attempts].reverse().slice(0, limit)
  return (
    <div>
      <p className="text-sm font-semibold text-muted-foreground mb-2">{title}</p>
      <ul className="space-y-2">
        {list.map((a) => (
          <li key={a.ts} className="rounded-xl border border-border bg-muted/50 p-3">
            <div className="flex items-center gap-2 text-xs mb-1.5">
              <span className="text-muted-foreground">{fmt(a.ts)}{a.source === 'mock' ? ' · mock interview' : ''}</span>
              {a.rating && RATINGS[a.rating] && (
                <span className={`px-2 py-0.5 rounded-md ring-1 font-medium ${RATINGS[a.rating].badge}`}>
                  {RATINGS[a.rating].label}
                </span>
              )}
            </div>
            <p className="text-sm whitespace-pre-wrap text-foreground/80">{a.text}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
