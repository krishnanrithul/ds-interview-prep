import { useState } from 'react'
import { QUESTIONS } from '../data/questions'
import { isDue, describeDue } from '../lib/srs'
import { summarize } from '../lib/queue'
import { dot, RATINGS } from '../lib/topics'

const TILE = {
  solid: 'bg-emerald-500 border-emerald-600/30',
  shaky: 'bg-amber-400 border-amber-500/30',
  missed: 'bg-rose-400 border-rose-500/30',
  unseen: 'bg-transparent border-border',
}
const NAME = { solid: 'Solid', shaky: 'Shaky', missed: 'Missed it', unseen: 'Not seen yet' }

export default function MasteryMap({ progress, onStart }) {
  const [focus, setFocus] = useState(null)
  const topics = [...new Set(QUESTIONS.map((q) => q.topic))]
  const overall = summarize(QUESTIONS, progress)
  let order = 0

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
              <span className="tabular-nums text-foreground font-medium">{overall[k]}</span> {k === 'missed' ? 'missed' : k}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <div className="space-y-5">
          {topics.map((t) => {
            const qs = QUESTIONS.filter((q) => q.topic === t)
            const c = summarize(qs, progress)
            return (
              <div key={t} className="grid sm:grid-cols-[10.5rem_1fr] gap-x-4 gap-y-2 items-start">
                <button
                  onClick={() => onStart({ topic: t })}
                  className="group text-left rounded-lg -mx-1.5 px-1.5 py-1 hover:bg-muted transition-colors"
                  aria-label={`Practice ${t}`}
                >
                  <span className="flex items-center gap-2 font-semibold text-sm">
                    <span className={`w-2.5 h-2.5 rounded-full ${dot(t)}`} />
                    {t}
                  </span>
                  <span className="block text-xs text-muted-foreground tabular-nums mt-0.5 pl-[18px]">{c.solid} of {qs.length} solid</span>
                </button>
                <div className="flex flex-wrap gap-1.5 py-1">
                  {qs.map((q) => {
                    const e = progress[q.id]
                    const st = e?.rating || 'unseen'
                    const due = isDue(e)
                    return (
                      <button
                        key={q.id}
                        onClick={() => onStart({ only: [q.id] })}
                        onMouseEnter={() => setFocus(q)}
                        onMouseLeave={() => setFocus(null)}
                        onFocus={() => setFocus(q)}
                        onBlur={() => setFocus(null)}
                        aria-label={`${q.question} ${NAME[st]}${due ? ', due for review' : ''}`}
                        className={`tile-pop w-7 h-7 sm:w-8 sm:h-8 rounded-lg border transition-transform hover:scale-110 hover:-translate-y-0.5 active:scale-95 ${TILE[st]} ${due ? 'due-pulse' : ''}`}
                        style={{ animationDelay: `${120 + order++ * 14}ms` }}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-5 pt-4 border-t border-border min-h-[3.25rem] text-sm" aria-live="polite">
          {caption ? (
            <>
              <p className="font-medium leading-snug">{caption.title}</p>
              <p className="text-muted-foreground mt-0.5">{caption.meta}</p>
            </>
          ) : (
            <p className="text-muted-foreground">Each tile is a question. Pick one to practice it, or pick a topic. Pulsing tiles are due for review.</p>
          )}
        </div>
      </div>
    </section>
  )
}
