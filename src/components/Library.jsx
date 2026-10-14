import { useMemo, useRef, useState } from 'react'
import { Search, X, ChevronDown, ChevronRight, CornerDownRight, Play, SlidersHorizontal } from 'lucide-react'
import { QUESTIONS } from '../data/questions'
import { RATINGS } from '../lib/topics'
import { describeDue } from '../lib/srs'
import AnswerLadder from './AnswerLadder'
import Attempts from './Attempts'
import DraftBadge from './DraftBadge'
import TagChips, { TagChip } from './TagChips'
import { TAGS, tagLabel } from '../lib/tags'
import { LEVELS, KINDS, levelLabel, kindLabel } from '../lib/levels'
import { ReportQuestion } from './FeedbackLink'
import { TopicRow, StatusLegend, countStatuses } from './Progress'

// Layout: one search and filter bar (filters live in a panel that opens on demand), then the questions grouped
// by topic in collapsible sections with progress, one line per question. A group shows its 10 most useful
// questions (due, missed and shaky first) until you ask for the rest.
const STATUS = [
  { id: 'unseen', label: 'New' },
  { id: 'due', label: 'Due' },
  { id: 'missed', label: 'Missed' },
  { id: 'shaky', label: 'Shaky' },
  { id: 'solid', label: 'Solid' },
]
const TOPICS = [...new Set(QUESTIONS.map((q) => q.topic))]
const GROUP_LIMIT = 10
const TAG_MATCH_LIMIT = 15
const TOUCH = '[@media(pointer:coarse)]:min-h-11'

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`px-3 py-1.5 ${TOUCH} rounded-full text-sm font-medium border whitespace-nowrap transition-colors ${
        active
          ? 'bg-foreground text-background border-foreground'
          : 'bg-card text-muted-foreground border-border hover:border-foreground/30'
      }`}
    >
      {children}
    </button>
  )
}

function ActiveChip({ label, onRemove }) {
  return (
    <button
      onClick={onRemove}
      aria-label={`Remove filter ${label}`}
      className={`inline-flex items-center gap-1 rounded-full bg-foreground text-background pl-3 pr-2 py-1 ${TOUCH} text-xs font-medium`}
    >
      {label} <X className="w-3 h-3" aria-hidden="true" />
    </button>
  )
}

function FilterSection({ id, title, children }) {
  return (
    <div role="group" aria-labelledby={id}>
      <p id={id} className="text-xs font-semibold text-muted-foreground mb-2">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

// Status shown in words as well as color, so color is never the only signal.
function StatusPill({ rating }) {
  if (!rating) return <span className="w-16 shrink-0 text-xs text-muted-foreground">New</span>
  return (
    <span className={`w-16 shrink-0 text-center px-1.5 py-0.5 rounded-md ring-1 text-xs font-medium ${RATINGS[rating].badge}`}>
      {RATINGS[rating].status}
    </span>
  )
}

// Due first, then missed and shaky, then new, with solid last: the rows worth practicing come first.
const rank = (p, endOfToday) => {
  if (p && p.due <= endOfToday) return 0
  return { missed: 1, shaky: 2, solid: 4 }[p?.rating] ?? 3
}

const flip = (t) => (set) => {
  const next = new Set(set)
  next.has(t) ? next.delete(t) : next.add(t)
  return next
}

export default function Library({ progress, notes, onPractice, tags, setTags, onPracticeMany }) {
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState('all')
  const [status, setStatus] = useState('all')
  const [level, setLevel] = useState('all')
  const [kind, setKind] = useState('all')
  const [panel, setPanel] = useState(false)
  const [tagQuery, setTagQuery] = useState('')
  const [open, setOpen] = useState(null) // expanded question id
  const [opened, setOpened] = useState(() => new Set()) // groups opened while not filtering
  const [closed, setClosed] = useState(() => new Set()) // groups closed while filtering
  const [showAll, setShowAll] = useState(() => new Set())
  const searchRef = useRef(null)
  const filtersRef = useRef(null)
  const focusSearch = () => searchRef.current?.focus()
  const toggleTag = (id) => setTags(tags.includes(id) ? tags.filter((t) => t !== id) : [...tags, id])
  const endOfToday = new Date().setHours(23, 59, 59, 999)

  const q = query.trim().toLowerCase()
  const list = QUESTIONS.filter((x) => {
    const p = progress[x.id]
    const r = p?.rating || 'unseen'
    const statusOk = status === 'all' || (status === 'due' ? !!p && p.due <= endOfToday : r === status)
    const text = q && `${x.question} ${(x.tags || []).map(tagLabel).join(' ')}`.toLowerCase()
    return (
      (!q || text.includes(q)) &&
      (topic === 'all' || x.topic === topic) &&
      (level === 'all' || x.difficulty === level) &&
      (kind === 'all' || x.kind === kind) &&
      tags.every((t) => x.tags?.includes(t)) &&
      statusOk
    )
  })

  const active = [
    topic !== 'all' && { key: 'topic', label: topic, clear: () => setTopic('all') },
    level !== 'all' && { key: 'level', label: levelLabel(level), clear: () => setLevel('all') },
    kind !== 'all' && { key: 'kind', label: kindLabel(kind), clear: () => setKind('all') },
    status !== 'all' && { key: 'status', label: STATUS.find((s) => s.id === status)?.label, clear: () => setStatus('all') },
    ...tags.map((id) => ({ key: `tag-${id}`, label: tagLabel(id), clear: () => toggleTag(id) })),
  ].filter(Boolean)
  const filtering = active.length > 0 || !!q
  const clearAll = () => {
    setTopic('all')
    setLevel('all')
    setKind('all')
    setStatus('all')
    setTags([])
    setQuery('')
    focusSearch()
  }

  const groups = TOPICS.map((t) => {
    const all = QUESTIONS.filter((x) => x.topic === t)
    const rows = list
      .filter((x) => x.topic === t)
      .map((x, i) => ({ x, i, k: rank(progress[x.id], endOfToday) }))
      .sort((a, b) => a.k - b.k || a.i - b.i)
      .map((r) => r.x)
    const due = all.filter((x) => progress[x.id] && progress[x.id].due <= endOfToday).length
    return { topic: t, total: all.length, rows, counts: countStatuses(progress, all), due }
  }).filter((g) => g.rows.length > 0)

  // When filtering starts, every matching group opens. When it ends, the groups that were open stay open,
  // so removing the last filter doesn't collapse the question you were reading.
  const isGroupOpen = (t) => (filtering ? !closed.has(t) : opened.has(t))
  const lastOpen = useRef([])
  if (filtering) lastOpen.current = groups.filter((g) => isGroupOpen(g.topic)).map((g) => g.topic)
  const [wasFiltering, setWasFiltering] = useState(filtering)
  if (filtering !== wasFiltering) {
    // Adjusting state during render (React's pattern for reacting to a prop change) avoids a collapsed flash.
    setWasFiltering(filtering)
    if (filtering) setClosed(new Set())
    else setOpened((o) => new Set([...o, ...lastOpen.current]))
  }
  const toggleGroup = (t) => (filtering ? setClosed(flip(t)) : setOpened(flip(t)))

  const tagMatches = useMemo(() => {
    const tq = tagQuery.trim().toLowerCase()
    if (!tq) return TAGS.filter((t) => t.kind === 'skill')
    return TAGS.filter((t) => t.label.toLowerCase().includes(tq)).slice(0, TAG_MATCH_LIMIT)
  }, [tagQuery])

  const closePanel = () => {
    setPanel(false)
    filtersRef.current?.focus()
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions or tags"
            aria-label="Search questions and tags"
            className="w-full h-11 pl-10 pr-10 rounded-xl bg-card border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('')
                focusSearch()
              }}
              aria-label="Clear search"
              className="absolute right-0.5 top-1/2 -translate-y-1/2 w-10 h-10 grid place-items-center text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <button
          ref={filtersRef}
          onClick={() => setPanel((v) => !v)}
          aria-expanded={panel}
          aria-controls="library-filters"
          className={`h-11 shrink-0 inline-flex items-center gap-2 px-3.5 rounded-xl border text-sm font-medium transition-colors ${
            panel || active.length
              ? 'border-foreground/40 text-foreground bg-card'
              : 'border-border text-muted-foreground bg-card hover:text-foreground'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
          Filters
          {active.length > 0 && (
            <span className="min-w-5 h-5 px-1.5 rounded-full bg-foreground text-background text-xs grid place-items-center">
              {active.length}
              <span className="sr-only"> active</span>
            </span>
          )}
        </button>
      </div>

      {panel && (
        <div
          id="library-filters"
          onKeyDown={(e) => e.key === 'Escape' && closePanel()}
          className="anim-msg rounded-2xl border border-border bg-card p-4 space-y-4"
        >
          <FilterSection id="f-topic" title="Topic">
            {TOPICS.map((t) => (
              <Chip key={t} active={topic === t} onClick={() => setTopic(topic === t ? 'all' : t)}>
                {t}
              </Chip>
            ))}
          </FilterSection>
          <FilterSection id="f-level" title="Level">
            {LEVELS.map((l) => (
              <Chip key={l.id} active={level === l.id} onClick={() => setLevel(level === l.id ? 'all' : l.id)}>
                {l.label}
              </Chip>
            ))}
          </FilterSection>
          <FilterSection id="f-type" title="Type">
            {KINDS.map((k) => (
              <Chip key={k.id} active={kind === k.id} onClick={() => setKind(kind === k.id ? 'all' : k.id)}>
                {k.label}
              </Chip>
            ))}
          </FilterSection>
          <FilterSection id="f-progress" title="Your progress">
            {STATUS.map((s) => (
              <Chip key={s.id} active={status === s.id} onClick={() => setStatus(status === s.id ? 'all' : s.id)}>
                {s.label}
              </Chip>
            ))}
          </FilterSection>
          <div>
            <p id="f-tags" className="text-xs font-semibold text-muted-foreground mb-2">
              Tags
            </p>
            <input
              value={tagQuery}
              onChange={(e) => setTagQuery(e.target.value)}
              placeholder="Find a tag, such as joins or SHAP"
              aria-label="Find a tag"
              className="w-full h-10 px-3 mb-2 rounded-lg bg-background border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
            />
            {!tagQuery.trim() && <p className="text-xs text-muted-foreground mb-2">What the interviewer is testing:</p>}
            <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby="f-tags">
              {tagMatches.map((t) => (
                <TagChip key={t.id} id={t.id} active={tags.includes(t.id)} onClick={toggleTag} />
              ))}
              {tagQuery.trim() && tagMatches.length === 0 && <p className="text-xs text-muted-foreground">No tag matches.</p>}
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={closePanel}
              className={`text-sm font-medium px-3 py-2 ${TOUCH} rounded-xl border border-border hover:bg-muted`}
            >
              Done
            </button>
          </div>
        </div>
      )}

      <span role="status" aria-live="polite" className="sr-only">
        {filtering ? `${list.length} ${list.length === 1 ? 'question matches' : 'questions match'}` : ''}
      </span>
      {filtering && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium mr-1" aria-hidden="true">
            {list.length} {list.length === 1 ? 'question' : 'questions'}
          </span>
          {active.map((a) => (
            <ActiveChip
              key={a.key}
              label={a.label}
              onRemove={() => {
                a.clear()
                focusSearch()
              }}
            />
          ))}
          <button onClick={clearAll} className={`text-xs font-medium text-muted-foreground hover:text-foreground px-2 py-1 ${TOUCH}`}>
            Clear all
          </button>
          {list.length > 0 && (
            <button
              onClick={() => onPracticeMany(list.map((x) => x.id))}
              className={`ml-auto inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 ${TOUCH} rounded-xl hover:opacity-90`}
            >
              <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" /> Practice these
            </button>
          )}
        </div>
      )}

      {list.length === 0 && <p className="text-center text-muted-foreground py-16">No questions match. Try fewer filters.</p>}

      {groups.length > 0 && Object.keys(progress).length > 0 && <StatusLegend className="justify-end" />}
      <div className="space-y-3">
        {groups.map((g) => {
          const gOpen = isGroupOpen(g.topic)
          const rows = showAll.has(g.topic) ? g.rows : g.rows.slice(0, GROUP_LIMIT)
          return (
            <section key={g.topic} aria-label={g.topic} className="bg-card border border-border rounded-2xl overflow-hidden">
              <h3>
                <TopicRow
                  topic={g.topic}
                  counts={g.counts}
                  total={g.total}
                  onClick={() => toggleGroup(g.topic)}
                  aria-expanded={gOpen}
                  leading={
                    <ChevronRight
                      className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${gOpen ? 'rotate-90' : ''}`}
                      aria-hidden="true"
                    />
                  }
                  meta={
                    <span className="text-sm text-muted-foreground">
                      {filtering ? `${g.rows.length} of ${g.total}` : g.total}
                      <span className="sr-only"> questions</span>
                    </span>
                  }
                  right={
                    <>
                      {g.due > 0 && <span className="font-medium text-primary">{g.due} due</span>}
                      <span className="hidden sm:inline text-muted-foreground tabular-nums">
                        {g.counts.solid} of {g.total} solid
                      </span>
                    </>
                  }
                />
              </h3>

              {gOpen && (
                <div className="border-t border-border">
                  <ul className="divide-y divide-border">
                    {rows.map((x) => {
                      const p = progress[x.id]
                      const isOpen = open === x.id
                      const isDue = !!p && p.due <= endOfToday
                      return (
                        <li key={x.id}>
                          <button
                            onClick={() => setOpen(isOpen ? null : x.id)}
                            aria-expanded={isOpen}
                            className="w-full min-h-12 px-4 sm:px-5 py-2.5 flex items-center gap-3 text-left hover:bg-muted/40"
                          >
                            <StatusPill rating={p?.rating} />
                            <span className={`flex-1 min-w-0 text-sm ${isOpen ? '' : 'line-clamp-2 sm:line-clamp-1'}`}>{x.question}</span>
                            {isDue && (
                              <span className="text-xs font-medium text-primary ring-1 ring-primary/40 rounded-md px-1.5 py-0.5 shrink-0">
                                Due
                              </span>
                            )}
                            <span className="hidden sm:inline text-xs text-muted-foreground shrink-0 w-20 text-right">
                              {levelLabel(x.difficulty)}
                            </span>
                            <ChevronDown
                              className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                              aria-hidden="true"
                            />
                          </button>

                          {isOpen && (
                            <div className="anim-msg px-4 sm:px-5 pb-5 pt-1 space-y-5">
                              <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                <span>{levelLabel(x.difficulty)}</span>
                                {x.kind && <span>{kindLabel(x.kind)}</span>}
                                <DraftBadge q={x} />
                                {p && <span>{describeDue(p)}</span>}
                              </div>
                              {x.context && <p className="text-sm text-muted-foreground">{x.context}</p>}
                              <TagChips tags={x.tags} onTag={(id) => !tags.includes(id) && setTags([...tags, id])} max={99} />
                              <ol className="space-y-3">
                                {x.follow_ups.map((fu, k) => (
                                  <li key={k} className="text-sm">
                                    <p>
                                      <span className="font-semibold text-primary mr-1.5">{k + 1}.</span>
                                      {fu.text}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1 flex gap-1.5 ml-5">
                                      <CornerDownRight className="w-3 h-3 mt-0.5 shrink-0" aria-hidden="true" />
                                      {fu.intent}
                                    </p>
                                  </li>
                                ))}
                              </ol>
                              <AnswerLadder q={x} />
                              <Attempts attempts={notes[x.id]} />
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <button
                                  onClick={() => onPractice(x.id)}
                                  className={`inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 ${TOUCH}`}
                                >
                                  <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" /> Practice this question
                                </button>
                                <ReportQuestion q={x} where="Library" showDraftNote={false} />
                              </div>
                            </div>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                  {g.rows.length > GROUP_LIMIT && (
                    <button
                      onClick={() => setShowAll(flip(g.topic))}
                      className="w-full min-h-11 border-t border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    >
                      {showAll.has(g.topic) ? 'Show fewer' : `Show all ${g.rows.length}`}
                    </button>
                  )}
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
