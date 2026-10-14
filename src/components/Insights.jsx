import { useEffect, useMemo, useRef, useState } from 'react'
import { Play, ChevronDown, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react'
import { QUESTIONS } from '../data/questions'
import { describeDue } from '../lib/srs'
import { TAGS } from '../lib/tags'
import { weeklyScores, latestChange, recentTrend } from '../lib/trends'
import TrendChart from './TrendChart'
import { STATUSES, STATUS_NAME, STATUS_FILL, countStatuses, StatusBar, StatusLegend, TopicRow } from './Progress'

const TOPICS = [...new Set(QUESTIONS.map((q) => q.topic))]
const LIST_LIMIT = 5
const TREND_MIN = 3 // points of change before a topic shows an arrow

const statusOf = (progress, q) => progress[q.id]?.rating || 'unseen'
// Score of your latest scored attempt on a question ("of a senior answer"), or null.
const latestScore = (notes, id) => {
  const a = [...(notes?.[id] || [])].reverse().find((x) => typeof x.score === 'number')
  return a ? a.score : null
}
const avgScore = (notes, qs) => {
  const xs = qs.map((q) => latestScore(notes, q.id)).filter((x) => x !== null)
  return { avg: xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null, n: xs.length }
}

function TrendArrow({ delta }) {
  if (delta === null || Math.abs(delta) < TREND_MIN) return null
  const up = delta > 0
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span className="inline-flex items-center text-foreground">
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      <span className="sr-only">
        {up ? 'up' : 'down'} {Math.abs(delta)} points over the last two weeks,
      </span>
    </span>
  )
}

export default function Insights({ progress, notes, onStart, onTag }) {
  const [topic, setTopic] = useState('all')
  const [segment, setSegment] = useState(null)
  const [showAll, setShowAll] = useState(false)
  const [ready, setReady] = useState(false)
  const [picker, setPicker] = useState(false)
  const chipRef = useRef(null)
  const focusChip = useRef(false)
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80)
    return () => clearTimeout(t)
  }, [])
  // After choosing a topic (from the picker or a By topic row), focus returns to the topic button at the top.
  useEffect(() => {
    if (!focusChip.current) return
    focusChip.current = false
    chipRef.current?.focus()
  }, [topic])

  const choose = (t) => {
    focusChip.current = true
    setPicker(false)
    setTopic(t)
    setSegment(null)
    setShowAll(false)
    window.scrollTo?.({ top: 0 })
  }
  const pick = (s) => {
    setSegment(s)
    setShowAll(false)
  }

  const scope = useMemo(() => (topic === 'all' ? QUESTIONS : QUESTIONS.filter((q) => q.topic === topic)), [topic])
  const ids = useMemo(() => scope.map((q) => q.id), [scope])
  const counts = useMemo(() => countStatuses(progress, scope), [progress, scope])
  const scoreAll = useMemo(() => avgScore(notes, scope), [notes, scope])
  const weeks = useMemo(() => weeklyScores(notes, ids), [notes, ids])
  const change = latestChange(weeks)
  const total = scope.length
  const seen = total - counts.unseen
  const endOfToday = new Date().setHours(23, 59, 59, 999)

  // Default the list to whatever needs attention most.
  const active =
    segment && counts[segment] > 0 ? segment : counts.missed ? 'missed' : counts.shaky ? 'shaky' : counts.solid ? 'solid' : 'unseen'
  const inSegment = scope
    .filter((q) => statusOf(progress, q) === active)
    .sort((a, b) => (progress[a.id]?.due ?? 0) - (progress[b.id]?.due ?? 0))
  const shown = showAll ? inSegment : inSegment.slice(0, LIST_LIMIT)

  const weakSpots = useMemo(() => {
    return TAGS.map((t) => {
      const qs = scope.filter((q) => q.tags?.includes(t.id))
      const c = countStatuses(progress, qs)
      return { tag: t, c, n: qs.length, notSolid: c.missed + c.shaky }
    })
      .filter((x) => x.notSolid > 0)
      .sort((a, b) => b.notSolid - a.notSolid || b.c.missed - a.c.missed || b.notSolid / b.n - a.notSolid / a.n)
      .slice(0, 6)
  }, [progress, scope])

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-3xl font-semibold">Insights</h2>
          <button
            ref={chipRef}
            onClick={() => setPicker((v) => !v)}
            aria-expanded={picker}
            aria-controls="insights-topics"
            className={`inline-flex items-center gap-1 rounded-full pl-3 pr-2 py-1 [@media(pointer:coarse)]:min-h-11 text-sm font-medium border ${
              topic === 'all'
                ? 'border-border text-muted-foreground hover:text-foreground'
                : 'bg-foreground text-background border-foreground'
            }`}
          >
            <span className="sr-only">Topic: </span>
            {topic === 'all' ? 'All topics' : topic}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${picker ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
        </div>
        {picker && (
          <div
            id="insights-topics"
            role="group"
            aria-label="Topic"
            className="anim-msg flex flex-wrap gap-2"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setPicker(false)
                chipRef.current?.focus()
              }
            }}
          >
            {['all', ...TOPICS].map((t) => (
              <button
                key={t}
                onClick={() => choose(t)}
                aria-pressed={topic === t}
                className={`px-3 py-1.5 [@media(pointer:coarse)]:min-h-11 rounded-full text-sm font-medium border whitespace-nowrap transition-colors ${
                  topic === t
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-card text-muted-foreground border-border hover:border-foreground/30'
                }`}
              >
                {t === 'all' ? 'All topics' : t}
              </button>
            ))}
          </div>
        )}
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5">
        {scoreAll.avg !== null && (
          <div className="space-y-3">
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-4xl font-semibold tabular-nums">{scoreAll.avg}%</span>
              <span className="text-sm text-muted-foreground">average score · {scoreAll.n} answered</span>
            </p>
            {weeks.filter((x) => x.avg !== null).length >= 2 ? (
              <TrendChart weeks={weeks} change={change} />
            ) : (
              <p className="text-xs text-muted-foreground">Your weekly trend appears after a second week of practice.</p>
            )}
          </div>
        )}
        <div>
          <StatusBar counts={counts} total={total} ready={ready} className="h-3 w-full" />
          <div className="grid grid-cols-4 gap-2 mt-3" role="group" aria-label="Show questions by status">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => pick(s)}
                aria-pressed={active === s}
                disabled={counts[s] === 0}
                className={`text-left rounded-xl border px-2 sm:px-3 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-default ${active === s ? 'border-foreground bg-muted' : 'border-border hover:bg-muted/60'}`}
              >
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_FILL[s]}`} aria-hidden="true" />
                  {STATUS_NAME[s]}
                </span>
                <span className="block text-2xl font-semibold tabular-nums">{counts[s]}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="font-serif text-xl font-semibold">
            {STATUS_NAME[active]} <span className="text-muted-foreground font-sans text-base font-normal">{inSegment.length}</span>
          </h3>
          {inSegment.length > 0 && (
            <button
              onClick={() => onStart({ only: inSegment.map((q) => q.id) })}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 [@media(pointer:coarse)]:min-h-11 rounded-xl hover:opacity-90"
            >
              <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" /> Practice these
            </button>
          )}
        </div>
        {inSegment.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card p-5 text-muted-foreground">
            {seen === 0 ? 'Practice a few questions to see your results here.' : 'None here yet.'}
          </p>
        ) : (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <p className="hidden sm:block px-4 pt-2.5 pb-1 pr-11 text-right text-xs text-muted-foreground" aria-hidden="true">
              Last score
            </p>
            <ul className="divide-y divide-border">
              {shown.map((q) => {
                const p = progress[q.id]
                const sc = latestScore(notes, q.id)
                return (
                  <li key={q.id}>
                    <button
                      onClick={() => onStart({ only: [q.id] })}
                      className="w-full min-h-12 px-4 py-2.5 flex items-center gap-3 text-left hover:bg-muted/40"
                    >
                      <span className="flex-1 min-w-0 text-sm line-clamp-2 sm:line-clamp-1">
                        <span className="sr-only">Practice: </span>
                        {q.question}
                      </span>
                      {topic === 'all' && <span className="hidden sm:inline text-xs text-muted-foreground shrink-0">{q.topic}</span>}
                      {p && p.due <= endOfToday && (
                        <span className="text-xs font-medium text-primary ring-1 ring-primary/40 rounded-md px-1.5 py-0.5 shrink-0">
                          Due<span className="sr-only">, {describeDue(p)}</span>
                        </span>
                      )}
                      {sc !== null && (
                        <span className="w-10 text-right text-sm font-semibold tabular-nums shrink-0">
                          <span className="sr-only">, last score </span>
                          {sc}%
                        </span>
                      )}
                      <Play className="w-3.5 h-3.5 text-primary fill-current shrink-0" aria-hidden="true" />
                    </button>
                  </li>
                )
              })}
            </ul>
            {inSegment.length > LIST_LIMIT && (
              <button
                onClick={() => setShowAll((v) => !v)}
                className="w-full min-h-11 border-t border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40"
              >
                {showAll ? 'Show fewer' : `Show all ${inSegment.length}`}
              </button>
            )}
          </div>
        )}
      </section>

      {weakSpots.length > 0 && (
        <section>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-3">
            <h3 className="font-serif text-xl font-semibold">Where you slip</h3>
            <StatusLegend />
          </div>
          <ul className="rounded-2xl border border-border bg-card divide-y divide-border">
            {weakSpots.map(({ tag, c, n }) => (
              <li key={tag.id}>
                <button
                  onClick={() => onTag(tag.id)}
                  className="w-full text-left grid grid-cols-[1fr_auto] sm:grid-cols-[14rem_1fr_5rem_1rem] items-center gap-x-4 gap-y-2 px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <span className="order-1 text-sm font-medium">{tag.label}</span>
                  <span className="order-3 col-span-2 sm:col-span-1 sm:order-2">
                    <StatusBar counts={c} total={n} ready={ready} className="h-2 w-full" />
                  </span>
                  <span className="order-2 sm:order-3 text-sm text-muted-foreground tabular-nums text-right">
                    {c.missed + c.shaky} to fix
                  </span>
                  <ChevronRight className="hidden sm:block order-4 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {topic === 'all' && (
        <section>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-3">
            <h3 className="font-serif text-xl font-semibold">By topic</h3>
            <span className="text-xs text-muted-foreground">Average score · arrow shows the last 2 weeks</span>
          </div>
          <StatusLegend className="mb-3" />
          <div className="space-y-3">
            {TOPICS.map((t) => {
              const qs = QUESTIONS.filter((q) => q.topic === t)
              const sc = avgScore(notes, qs)
              const trend = recentTrend(
                notes,
                qs.map((q) => q.id),
              )
              return (
                <div key={t} className="bg-card border border-border rounded-2xl overflow-hidden">
                  <TopicRow
                    topic={t}
                    counts={countStatuses(progress, qs)}
                    total={qs.length}
                    ready={ready}
                    chevron
                    onClick={() => choose(t)}
                    right={
                      <span className="flex items-center gap-1.5 text-sm font-semibold tabular-nums">
                        <TrendArrow delta={trend} />
                        {sc.avg !== null ? (
                          <>
                            {sc.avg}%<span className="sr-only"> average score</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground font-normal">
                            –<span className="sr-only">no scores yet</span>
                          </span>
                        )}
                      </span>
                    }
                  />
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
