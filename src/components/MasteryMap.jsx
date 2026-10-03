import { useState } from 'react'
import { ChevronDown, Play } from 'lucide-react'
import { QUESTIONS } from '../data/questions'
import { isDue, describeDue } from '../lib/srs'
import { summarize } from '../lib/queue'
import { dot } from '../lib/topics'
import { LEVELS } from '../lib/levels'

const TILE = {
  solid: 'bg-emerald-500 border-emerald-600/30',
  shaky: 'bg-amber-400 border-amber-500/30',
  missed: 'bg-rose-400 border-rose-500/30',
  unseen: 'bg-transparent border-border',
}
const BAR = { solid: 'bg-emerald-500', shaky: 'bg-amber-400', missed: 'bg-rose-400', unseen: 'bg-muted' }
const NAME = { solid: 'Solid', shaky: 'Shaky', missed: 'Missed it', unseen: 'Not seen yet' }

// One compact row per topic. Open a topic to see its questions as tiles, grouped by level.
// Topics with questions due for review start open, so the pulsing tiles are visible without a tap.
export default function MasteryMap({ progress, onStart }) {
  const [focus, setFocus] = useState(null)
  const topics = [...new Set(QUESTIONS.map((q) => q.topic))]
  const overall = summarize(QUESTIONS, progress)
  const dueIn = (t) => QUESTIONS.filter((q) => q.topic === t && isDue(progress[q.id])).length
  const [open, setOpen] = useState(() => new Set(topics.filter((t) => dueIn(t) > 0)))
  const toggle = (t) => setOpen((s) => { const n = new Set(s); n.has(t) ? n.delete(t) : n.add(t); return n })

  const caption = focus
    ? (() => {
        const e = progress[focus.id]
        const st = e?.rating || 'unseen'
        return { title: focus.question, meta: `${NAME[st]}${e ? `, ${describeDue(e)}` : ''}` }
      })()
    : null

  return (
    <section aria-label="Mastery map">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 mb-4">
        <h3 className="font-serif text-xl font-semibold">Where you stand</h3>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {['solid', 'shaky', 'missed', 'unseen'].map((k) => (
            <li key={k} className="inline-flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-[4px] border ${TILE[k]}`} />
              <span className="tabular-nums text-foreground font-medium">{overall[k]}</span> {k}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-border bg-card divide-y divide-border">
        {topics.map((t) => {
          const qs = QUESTIONS.filter((q) => q.topic === t)
          const c = summarize(qs, progress)
          const due = dueIn(t)
          const isOpen = open.has(t)
          let order = 0
          return (
            <div key={t}>
              <div className="flex items-center gap-2 pr-3 sm:pr-4">
                <button
                  onClick={() => toggle(t)}
                  aria-expanded={isOpen}
                  aria-label={`${t}, ${c.solid} of ${qs.length} solid${due ? `, ${due} due` : ''}`}
                  className="flex-1 min-w-0 grid grid-cols-[1fr_auto] sm:grid-cols-[11rem_1fr_auto] items-center gap-x-4 gap-y-2 text-left px-4 sm:px-5 py-3.5 hover:bg-muted/50 transition-colors rounded-l-2xl"
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 font-semibold text-sm">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot(t)}`} />
                      <span className="truncate">{t}</span>
                    </span>
                    <span className="block text-xs text-muted-foreground tabular-nums mt-0.5 pl-[18px]">
                      {c.solid} of {qs.length} solid{due > 0 && <span className="text-foreground font-medium">, {due} due</span>}
                    </span>
                  </span>
                  <span className="flex h-2.5 rounded-full overflow-hidden bg-muted col-span-2 sm:col-span-1 order-3 sm:order-none" role="img" aria-label={`${c.solid} solid, ${c.shaky} shaky, ${c.missed} missed, ${c.unseen} unseen`}>
                    {['solid', 'shaky', 'missed'].map((k) => c[k] > 0 && <span key={k} className={BAR[k]} style={{ width: `${(c[k] / qs.length) * 100}%` }} />)}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <button
                  onClick={() => onStart({ topic: t })}
                  aria-label={`Practice ${t}`}
                  className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:opacity-80 px-2 py-1.5 rounded-lg"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> <span className="hidden sm:inline">Practice</span>
                </button>
              </div>

              {isOpen && (
                <div className="px-4 sm:px-5 pb-4 pt-1 space-y-3 anim-msg">
                  {LEVELS.map((lv) => {
                    const group = qs.filter((q) => q.difficulty === lv.id)
                    if (!group.length) return null
                    return (
                      <div key={lv.id}>
                        <p className="text-xs text-muted-foreground mb-1.5">{lv.label} <span className="tabular-nums">({group.length})</span></p>
                        <div className="flex flex-wrap gap-1.5">
                          {group.map((q) => {
                            const e = progress[q.id]
                            const st = e?.rating || 'unseen'
                            const isDueNow = isDue(e)
                            return (
                              <button
                                key={q.id}
                                onClick={() => onStart({ only: [q.id] })}
                                onMouseEnter={() => setFocus(q)}
                                onMouseLeave={() => setFocus(null)}
                                onFocus={() => setFocus(q)}
                                onBlur={() => setFocus(null)}
                                aria-label={`${q.question} ${NAME[st]}${isDueNow ? ', due for review' : ''}`}
                                className={`tile-pop w-7 h-7 sm:w-8 sm:h-8 rounded-lg border transition-transform hover:scale-110 hover:-translate-y-0.5 active:scale-95 ${TILE[st]} ${isDueNow ? 'due-pulse' : ''}`}
                                style={{ animationDelay: `${Math.min(order++, 20) * 14}ms` }}
                              />
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-3 min-h-[3.25rem] text-sm px-1" aria-live="polite">
        {caption ? (
          <>
            <p className="font-medium leading-snug">{caption.title}</p>
            <p className="text-muted-foreground mt-0.5">{caption.meta}</p>
          </>
        ) : (
          <p className="text-muted-foreground">Open a topic to see its questions. Each tile is one question; pulsing tiles are due for review.</p>
        )}
      </div>
    </section>
  )
}
