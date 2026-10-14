import { ChevronRight } from 'lucide-react'
import { RATINGS, dot } from '../lib/topics'

// Shared progress pieces for the Library and Insights, so the same topic looks the same on both pages.
export const STATUSES = ['solid', 'shaky', 'missed', 'unseen']
export const STATUS_NAME = { solid: 'Solid', shaky: 'Shaky', missed: 'Missed', unseen: 'New' }
export const STATUS_FILL = {
  solid: RATINGS.solid.bar,
  shaky: RATINGS.shaky.bar,
  missed: RATINGS.missed.bar,
  unseen: 'bg-muted-foreground/25',
}

export const countStatuses = (progress, qs) => {
  const c = { solid: 0, shaky: 0, missed: 0, unseen: 0 }
  qs.forEach((q) => {
    c[progress[q.id]?.rating || 'unseen']++
  })
  return c
}

// Stacked bar of solid, shaky, missed and new, with a 1px gap between segments and a 4px minimum so a count of 1 stays visible. The label carries the counts in
// words, and <StatusLegend /> sits near every use, so color is never the only signal.
export function StatusBar({ counts, total, ready = true, className = 'h-2 w-full' }) {
  const label = STATUSES.filter((s) => counts[s] > 0)
    .map((s) => `${counts[s]} ${STATUS_NAME[s].toLowerCase()}`)
    .join(', ')
  const shown = STATUSES.filter((s) => counts[s] > 0)
  return (
    <span className={`flex gap-px ${className}`} role="img" aria-label={label || 'No questions'}>
      {shown.map((s) => (
        <span
          key={s}
          className={`${STATUS_FILL[s]} h-full min-w-[4px] rounded-full transition-[width] duration-700 ease-out`}
          style={{ width: ready && total ? `${(counts[s] / total) * 100}%` : '0%' }}
        />
      ))}
    </span>
  )
}

export function StatusLegend({ className = '' }) {
  return (
    <p className={`flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground ${className}`} aria-hidden="true">
      {STATUSES.map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${STATUS_FILL[s]}`} />
          {STATUS_NAME[s]}
        </span>
      ))}
    </p>
  )
}

// One topic as a tappable row: dot, name, optional count, the right-hand figures, and the status bar.
// The Library uses it as a collapsible group header; Insights uses it to narrow the page to a topic.
export function TopicRow({ topic, counts, total, ready, leading, meta, right, chevron = false, ...button }) {
  return (
    <button {...button} className="w-full min-h-14 px-4 sm:px-5 py-3 flex items-center gap-3 text-left hover:bg-muted/40">
      {leading}
      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot(topic)}`} aria-hidden="true" />
      <span className="font-semibold">{topic}</span>
      {meta}
      <span className="ml-auto flex items-center gap-3 shrink-0 text-xs">
        {right}
        <StatusBar counts={counts} total={total} ready={ready} className="h-1.5 w-20 sm:w-28" />
      </span>
      {chevron && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />}
    </button>
  )
}
