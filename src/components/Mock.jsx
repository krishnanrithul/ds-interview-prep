import { useState, useEffect, useMemo, useRef } from 'react'
import { Timer, ArrowRight, X, Minus, Plus, CornerDownRight } from 'lucide-react'
import { QUESTIONS } from '../data/questions'
import { buildMockQueue } from '../lib/queue'
import { DIFFICULTY, RATINGS, dot } from '../lib/topics'
import AnswerLadder from './AnswerLadder'
import ConfirmDialog from './ConfirmDialog'
import DraftBadge from './DraftBadge'

const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

function Stepper({ value, onChange, min, max, label }) {
  return (
    <div className="flex items-center gap-3" role="group" aria-label={label}>
      <button onClick={() => onChange(Math.max(min, value - 1))} aria-label={`Decrease ${label}`}
        className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
        <Minus size={16} />
      </button>
      <span className="text-2xl font-bold w-10 text-center tabular-nums">{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} aria-label={`Increase ${label}`}
        className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
        <Plus size={16} />
      </button>
    </div>
  )
}

// A real-interview rehearsal: mixed topics, follow-ups unlocked one at a time,
// a soft timer, and no answers until the very end.
export default function Mock({ progress, byId, active, onSave }) {
  const [stage, setStage] = useState('setup') // setup | run | review
  const [cfg, setCfg] = useState({ count: 5, minutes: 6, topic: 'all' })
  const [ids, setIds] = useState([])
  const [idx, setIdx] = useState(0)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [times, setTimes] = useState({})
  const [ratings, setRatings] = useState({})
  const [startedAt, setStartedAt] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const textRef = useRef(null)

  const topics = useMemo(() => [...new Set(QUESTIONS.map((q) => q.topic))], [])
  const poolSize = QUESTIONS.filter((q) => cfg.topic === 'all' || q.topic === cfg.topic).length
  const count = Math.min(cfg.count, poolSize)
  const limit = cfg.minutes * 60

  // wall-clock timer: keeps counting correctly even if the tab is hidden or switched
  useEffect(() => {
    if (stage !== 'run') return
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000)
    return () => clearInterval(t)
  }, [stage, startedAt])

  useEffect(() => { if (active && stage === 'run') textRef.current?.focus() }, [idx, stage, active])

  const q = stage === 'run' ? byId[ids[idx]] : null
  const n = q ? q.follow_ups.length : 0

  const start = () => {
    const picked = buildMockQueue(QUESTIONS, progress, { count, topic: cfg.topic })
    setIds(picked)
    setIdx(0); setStep(0); setAnswers({}); setTimes({}); setRatings({}); setElapsed(0)
    setStartedAt(Date.now())
    setStage('run')
  }

  const next = () => {
    if (step < n) return setStep(step + 1)
    // finish this question
    setTimes((t) => ({ ...t, [q.id]: Math.floor((Date.now() - startedAt) / 1000) }))
    if (idx + 1 < ids.length) {
      setIdx(idx + 1); setStep(0); setElapsed(0); setStartedAt(Date.now())
    } else {
      setStage('review')
    }
  }

  // Cmd/Ctrl+Enter advances from inside the answer box
  useEffect(() => {
    if (stage !== 'run' || !active) return
    const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); next() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const save = () => {
    const results = ids
      .filter((id) => ratings[id])
      .map((id) => ({ id, rating: ratings[id], answer: answers[id] || '' }))
    onSave(results)
    setStage('setup')
  }

  // ---------- setup ----------
  if (stage === 'setup') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Timer className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Mock interview</h1>
        </div>
        <p className="text-muted-foreground mb-6">
          A rehearsal, not a study session. Questions come from different topics, follow-ups arrive one at a time,
          and you won't see any answers until the end.
        </p>

        <div className="bg-card border border-border rounded-2xl divide-y divide-border mb-6">
          <div className="flex items-center justify-between gap-4 p-4">
            <div><p className="font-medium">Questions</p><p className="text-xs text-muted-foreground mt-0.5">How many to ask</p></div>
            <Stepper label="questions" value={count} min={1} max={Math.max(1, Math.min(10, poolSize))} onChange={(v) => setCfg({ ...cfg, count: v })} />
          </div>
          <div className="flex items-center justify-between gap-4 p-4">
            <div><p className="font-medium">Minutes per question</p><p className="text-xs text-muted-foreground mt-0.5">A soft limit: you can go over, and it's recorded</p></div>
            <Stepper label="minutes" value={cfg.minutes} min={2} max={15} onChange={(v) => setCfg({ ...cfg, minutes: v })} />
          </div>
          <div className="p-4">
            <p className="font-medium mb-3">Topics</p>
            <div className="flex flex-wrap gap-2">
              {['all', ...topics].map((t) => (
                <button key={t} onClick={() => setCfg({ ...cfg, topic: t })} aria-pressed={cfg.topic === t}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    cfg.topic === t ? 'bg-foreground text-background border-foreground' : 'bg-card text-muted-foreground border-border hover:border-foreground/30'
                  }`}>
                  {t === 'all' ? 'Mixed' : t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={start} disabled={poolSize === 0}
          className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-40 text-primary-foreground font-semibold py-3.5 rounded-xl transition-colors">
          Start interview <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-center text-xs text-muted-foreground mt-3">About {count * cfg.minutes} minutes in total</p>
      </div>
    )
  }

  // ---------- run ----------
  if (stage === 'run') {
    const over = elapsed > limit
    const timeLabel = over ? `+${mmss(elapsed - limit)} over` : mmss(limit - elapsed)
    const last = idx + 1 === ids.length
    const buttonLabel = step < n ? (step === 0 ? 'Done, hear the follow-up' : 'Next follow-up') : last ? 'Finish interview' : 'Finish question, next'

    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(idx / ids.length) * 100}%` }} />
          </div>
          <span className="text-sm text-muted-foreground tabular-nums">Question {idx + 1} of {ids.length}</span>
          <span className={`text-sm font-semibold tabular-nums px-2.5 py-1 rounded-lg ${over ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-muted'}`} aria-label="Time">
            {timeLabel}
          </span>
          <button onClick={() => setConfirmEnd(true)} title="End interview" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-card border border-border rounded-3xl shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 text-xs mb-4">
            <span className="flex items-center gap-1.5 font-semibold text-foreground/80">
              <span className={`w-2 h-2 rounded-full ${dot(q.topic)}`} />{q.topic}
            </span>
            <span className={`px-2 py-0.5 rounded-md ring-1 capitalize font-medium ${DIFFICULTY[q.difficulty] || ''}`}>{q.difficulty}</span>
            <DraftBadge q={q} />
          </div>
          <h2 className="text-2xl font-semibold leading-snug mb-5">{q.question}</h2>

          {step > 0 && (
            <ol className="space-y-3 mb-5">
              {q.follow_ups.slice(0, Math.min(step, n)).map((fu, k) => (
                <li key={k} className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Interviewer follow-up {k + 1}</p>
                  <p className="text-[15px] leading-relaxed">{fu.text}</p>
                </li>
              ))}
            </ol>
          )}

          <textarea
            ref={textRef}
            value={answers[q.id] || ''}
            onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
            rows={8}
            placeholder="Answer as you would out loud: your approach, trade-offs, and what you'd check. Include your answers to the follow-ups here."
            className="w-full rounded-xl border border-border bg-muted/50 p-4 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition resize-y"
          />
        </div>

        <button onClick={next}
          className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 rounded-xl transition-colors">
          {buttonLabel} <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-center text-xs text-muted-foreground mt-3">Cmd/Ctrl + Enter to continue</p>

        <ConfirmDialog
          open={confirmEnd}
          destructive
          title="End the interview?"
          description="Your answers from this run won't be saved or rated."
          confirmLabel="End interview"
          cancelLabel="Keep going"
          onConfirm={() => { setConfirmEnd(false); setStage('setup') }}
          onCancel={() => setConfirmEnd(false)}
        />
      </div>
    )
  }

  // ---------- review ----------
  const totalTime = ids.reduce((s, id) => s + (times[id] || 0), 0)
  const overCount = ids.filter((id) => (times[id] || 0) > limit).length
  const rated = ids.filter((id) => ratings[id]).length
  const weakTopics = [...new Set(ids.filter((id) => ratings[id] && ratings[id] !== 'solid').map((id) => byId[id].topic))]

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Interview review</h1>
      <p className="text-muted-foreground mb-6">Compare each answer with the senior version, then rate yourself honestly.</p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-3xl font-semibold tabular-nums">{mmss(totalTime)}</p>
          <p className="text-sm text-muted-foreground">Total time</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-3xl font-semibold tabular-nums">{mmss(Math.round(totalTime / Math.max(1, ids.length)))}</p>
          <p className="text-sm text-muted-foreground">Average per question</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className={`text-3xl font-semibold tabular-nums ${overCount ? 'text-rose-600 dark:text-rose-400' : ''}`}>{overCount}</p>
          <p className="text-sm text-muted-foreground">Went over time</p>
        </div>
      </div>

      {rated > 0 && weakTopics.length > 0 && (
        <p className="mb-6 text-sm rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 p-4">
          To revisit: <span className="font-semibold">{weakTopics.join(', ')}</span>. Those questions will come back sooner.
        </p>
      )}

      <div className="space-y-4">
        {ids.map((id, k) => {
          const item = byId[id]
          const t = times[id] || 0
          return (
            <article key={id} className="bg-card border border-border rounded-2xl p-5 sm:p-6">
              <div className="flex items-center flex-wrap gap-3 text-xs mb-2">
                <span className="text-muted-foreground">Question {k + 1}</span>
                <span className="flex items-center gap-1.5 font-semibold text-foreground/80">
                  <span className={`w-2 h-2 rounded-full ${dot(item.topic)}`} />{item.topic}
                </span>
                <span className={`font-medium tabular-nums ${t > limit ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'}`}>
                  {mmss(t)} of {mmss(limit)}
                </span>
              </div>
              <h3 className="text-lg font-semibold leading-snug mb-4">{item.question}</h3>

              <div className="rounded-xl bg-muted/50 border border-border p-4 mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Your answer</p>
                {answers[id]?.trim()
                  ? <p className="text-sm whitespace-pre-wrap text-foreground/80">{answers[id]}</p>
                  : <p className="text-sm text-muted-foreground italic">You didn't write an answer.</p>}
              </div>

              <ul className="space-y-1.5 mb-4">
                {item.follow_ups.map((fu, j) => (
                  <li key={j} className="text-sm">
                    <span className="font-semibold text-primary mr-1.5">{j + 1}.</span>{fu.text}
                    <span className="block text-xs text-muted-foreground ml-5 mt-0.5 flex gap-1.5">
                      <CornerDownRight className="w-3 h-3 mt-0.5 shrink-0" />Testing: {fu.intent}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mb-4"><AnswerLadder q={item} /></div>

              <div className="grid grid-cols-3 gap-2">
                {Object.entries(RATINGS).map(([r, v]) => (
                  <button key={r} onClick={() => setRatings({ ...ratings, [id]: ratings[id] === r ? undefined : r })}
                    aria-pressed={ratings[id] === r}
                    className={`rounded-xl border py-2.5 text-sm font-semibold transition-colors ${v.button} ${
                      ratings[id] === r ? 'ring-2 ring-offset-2 ring-offset-card ring-current' : 'opacity-70 hover:opacity-100'
                    }`}>
                    {v.label}
                  </button>
                ))}
              </div>
            </article>
          )
        })}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center">
        <button onClick={save}
          className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3.5 rounded-xl transition-colors">
          Save results
        </button>
        <button onClick={() => setStage('setup')} className="px-6 py-3.5 rounded-xl border border-border font-semibold hover:bg-muted transition-colors">
          Discard
        </button>
        <p className="text-sm text-muted-foreground">
          {rated === ids.length ? 'All questions rated.' : `${ids.length - rated} unrated won't be saved.`}
        </p>
      </div>
    </div>
  )
}
