import { RATINGS } from '../lib/topics'

const fmt = (ts) => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
const hasScore = (a) => typeof a.score === 'number'
const scoreTitle = (a) => (a.scoredBy === 'haiku' ? 'Graded for correctness by Haiku' : 'Estimated from which ideas you mentioned')

// Your saved answers for a question, newest first, with the score each one got.
export default function Attempts({ attempts, title = 'Your attempts', limit = 5 }) {
  if (!attempts?.length) return null
  const list = [...attempts].reverse().slice(0, limit)
  const scored = attempts.filter(hasScore) // oldest first
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 mb-2">
        <p className="text-sm font-semibold text-muted-foreground">{title}</p>
        {scored.length > 1 && (
          <p className="text-xs text-muted-foreground tabular-nums" title="Scores of your attempts, oldest to newest">
            {scored.map((a) => `${a.score}%`).join(' → ')}
          </p>
        )}
      </div>
      <ul className="space-y-2">
        {list.map((a) => (
          <li key={a.ts} className="rounded-xl border border-border bg-muted/50 p-3">
            <div className="flex flex-wrap items-center gap-2 text-xs mb-1.5">
              <span className="text-muted-foreground">{fmt(a.ts)}{a.source === 'mock' ? ' · mock interview' : ''}</span>
              {a.rating && RATINGS[a.rating] && (
                <span className={`px-2 py-0.5 rounded-md ring-1 font-medium ${RATINGS[a.rating].badge}`}>
                  {RATINGS[a.rating].label}
                </span>
              )}
              {hasScore(a) && (
                <span title={scoreTitle(a)} className="px-2 py-0.5 rounded-md ring-1 ring-border font-medium tabular-nums">
                  {a.score}%{a.scoredBy === 'haiku' ? '' : ' est.'}
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
