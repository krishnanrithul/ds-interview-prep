import { useEffect, useMemo, useState } from 'react'
import { Play, ChevronDown } from 'lucide-react'
import { QUESTIONS } from '../data/questions'
import { RATINGS, dot } from '../lib/topics'
import { describeDue } from '../lib/srs'
import { TAGS } from '../lib/tags'

const STATUSES = ['solid', 'shaky', 'missed', 'unseen']
const NAME = { solid: 'Solid', shaky: 'Shaky', missed: 'Missed it', unseen: 'Not seen yet' }
const FILL = { solid: RATINGS.solid.bar, shaky: RATINGS.shaky.bar, missed: RATINGS.missed.bar, unseen: 'bg-muted-foreground/25' }
const TOPICS = [...new Set(QUESTIONS.map((q) => q.topic))]

const statusOf = (progress, q) => progress[q.id]?.rating || 'unseen'
const split = (progress, qs) => {
  const c = { solid: 0, shaky: 0, missed: 0, unseen: 0 }
  qs.forEach((q) => { c[statusOf(progress, q)]++ })
  return c
}

function Bar({ counts, total, ready, className = 'h-4' }) {
  const label = STATUSES.map((s) => `${counts[s]} ${NAME[s].toLowerCase()}`).join(', ')
  return (
    <div className={`flex w-full overflow-hidden rounded-full bg-muted ${className}`} role="img" aria-label={label}>
      {STATUSES.map((s) => (
        <div key={s} className={`${FILL[s]} h-full transition-[width] duration-700 ease-out`} style={{ width: ready && total ? `${(counts[s] / total) * 100}%` : '0%' }} />
      ))}
    </div>
  )
}

export default function Insights({ progress, onStart, onTag }) {
  const [topic, setTopic] = useState('all')
  const [segment, setSegment] = useState(null)
  const [ready, setReady] = useState(false)
  useEffect(() => { const t = setTimeout(() => setReady(true), 80); return () => clearTimeout(t) }, [])

  const scope = useMemo(() => (topic === 'all' ? QUESTIONS : QUESTIONS.filter((q) => q.topic === topic)), [topic])
  const counts = useMemo(() => split(progress, scope), [progress, scope])
  const total = scope.length
  const seen = total - counts.unseen
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0)

  // Default the list to whatever needs attention most.
  const active = segment && counts[segment] > 0 ? segment : counts.missed ? 'missed' : counts.shaky ? 'shaky' : counts.solid ? 'solid' : 'unseen'
  const inSegment = scope
    .filter((q) => statusOf(progress, q) === active)
    .sort((a, b) => (progress[a.id]?.due ?? 0) - (progress[b.id]?.due ?? 0))

  const weakSpots = useMemo(() => {
    return TAGS.map((t) => {
      const qs = scope.filter((q) => q.tags?.includes(t.id))
      const c = split(progress, qs)
      const notSolid = c.missed + c.shaky
      return { tag: t, c, n: qs.length, notSolid }
    })
      .filter((x) => x.notSolid > 0)
      .sort((a, b) => b.c.missed * 2 + b.c.shaky - (a.c.missed * 2 + a.c.shaky) || b.notSolid / b.n - a.notSolid / a.n)
      .slice(0, 6)
  }, [progress, scope])

  const headline = seen === 0
    ? 'Nothing rated yet'
    : `${counts.solid} of ${total} ${topic === 'all' ? 'questions' : topic + ' questions'} solid`

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-semibold">Insights</h2>
          <p className="text-muted-foreground mt-1">How your self-ratings split, overall and by topic.</p>
        </div>
        <label className="block text-sm">
          <span className="block text-muted-foreground mb-1">Topic</span>
          <span className="relative block">
            <select
              value={topic}
              onChange={(e) => { setTopic(e.target.value); setSegment(null) }}
              className="appearance-none h-10 min-w-[12rem] rounded-xl border border-border bg-card pl-3 pr-9 text-sm font-medium"
            >
              <option value="all">All topics</option>
              {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </span>
        </label>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <p className="font-serif text-2xl font-medium mb-4" aria-live="polite">{headline}</p>
        <Bar counts={counts} total={total} ready={ready} className="h-5" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setSegment(s)}
              aria-pressed={active === s}
              className={`text-left rounded-xl border p-3 transition-colors ${active === s ? 'border-foreground bg-muted' : 'border-border hover:bg-muted/60'}`}
            >
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className={`w-2.5 h-2.5 rounded-full ${FILL[s]}`} />{NAME[s]}
              </span>
              <span className="block text-2xl font-semibold tabular-nums mt-0.5">{counts[s]}</span>
              <span className="block text-xs text-muted-foreground tabular-nums">{pct(counts[s])}% of {total}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h3 className="font-serif text-xl font-semibold">
            {NAME[active]} <span className="text-muted-foreground font-sans text-base font-normal">({inSegment.length})</span>
          </h3>
          {inSegment.length > 0 && (
            <button onClick={() => onStart({ only: inSegment.map((q) => q.id) })} className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90">
              <Play className="w-3.5 h-3.5 fill-current" /> Practice these
            </button>
          )}
        </div>
        {inSegment.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card p-5 text-muted-foreground">
            {seen === 0 ? 'Practice a few questions and your results will show up here.' : `No ${NAME[active].toLowerCase()} questions${topic === 'all' ? '' : ' in ' + topic}.`}
          </p>
        ) : (
          <ul className="rounded-2xl border border-border bg-card divide-y divide-border">
            {inSegment.map((q) => (
              <li key={q.id} className="flex items-start gap-3 p-4">
                <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${dot(q.topic)}`} title={q.topic} />
                <div className="flex-1 min-w-0">
                  <p className="leading-snug">{q.question}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {q.topic}{progress[q.id] ? `, ${describeDue(progress[q.id])}` : ''}
                  </p>
                </div>
                <button onClick={() => onStart({ only: [q.id] })} className="text-sm font-medium text-primary hover:opacity-80 shrink-0">Practice</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {weakSpots.length > 0 && (
        <section>
          <h3 className="font-serif text-xl font-semibold mb-1">Where you slip</h3>
          <p className="text-sm text-muted-foreground mb-3">Tags with the most shaky or missed questions{topic === 'all' ? '' : ` in ${topic}`}. Tap one to see its questions.</p>
          <ul className="rounded-2xl border border-border bg-card divide-y divide-border">
            {weakSpots.map(({ tag, c, n }) => (
              <li key={tag.id}>
                <button onClick={() => onTag(tag.id)} className="w-full text-left grid grid-cols-[1fr_auto] sm:grid-cols-[14rem_1fr_6.5rem] items-center gap-x-4 gap-y-2 p-4 hover:bg-muted/50 transition-colors">
                  <span className="order-1 text-sm font-medium">{tag.label}</span>
                  <span className="order-3 col-span-2 sm:col-span-1 sm:order-2"><Bar counts={c} total={n} ready={ready} className="h-2.5" /></span>
                  <span className="order-2 sm:order-3 text-sm text-muted-foreground tabular-nums text-right">{c.missed + c.shaky} of {n} to fix</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {topic === 'all' && (
        <section>
          <h3 className="font-serif text-xl font-semibold mb-3">Topics side by side</h3>
          <ul className="rounded-2xl border border-border bg-card divide-y divide-border">
            {TOPICS.map((t) => {
              const qs = QUESTIONS.filter((q) => q.topic === t)
              const c = split(progress, qs)
              return (
                <li key={t}>
                  <button onClick={() => { setTopic(t); setSegment(null); window.scrollTo?.({ top: 0 }) }} className="w-full text-left grid grid-cols-[1fr_auto] sm:grid-cols-[14rem_1fr_6.5rem] items-center gap-x-4 gap-y-2 p-4 hover:bg-muted/50 transition-colors">
                    <span className="order-1 flex items-center gap-2 text-sm font-medium">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot(t)}`} />{t}
                    </span>
                    <span className="order-3 col-span-2 sm:col-span-1 sm:order-2"><Bar counts={c} total={qs.length} ready={ready} className="h-2.5" /></span>
                    <span className="order-2 sm:order-3 text-sm text-muted-foreground tabular-nums text-right">{c.solid} of {qs.length} solid</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
