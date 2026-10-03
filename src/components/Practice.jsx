import { useState, useEffect, useRef } from 'react'
import { ArrowRight, X, RotateCcw, CornerDownRight } from 'lucide-react'
import { DIFFICULTY, RATINGS, dot } from '../lib/topics'
import AnswerLadder from './AnswerLadder'
import Attempts from './Attempts'

export default function Practice({ ids, byId, notes, active, onRate, onExit, onAgain }) {
  const [i, setI] = useState(0)
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState('')
  const [results, setResults] = useState([])
  const textRef = useRef(null)

  const done = i >= ids.length
  const q = done ? null : byId[ids[i]]
  const n = q ? q.follow_ups.length : 0
  const total = n + 1 // step === total -> ladder + insight + rating
  const rating = q && step === total

  const advance = () => setStep((s) => Math.min(s + 1, total))
  const rate = (r) => {
    onRate(q.id, r, draft)
    setResults((x) => [...x, { id: q.id, rating: r }])
    setI((x) => x + 1)
    setStep(0)
    setDraft('')
  }

  // Keyboard: Cmd/Ctrl+Enter or Space/Enter advances, 1/2/3 rates. Ignored while another tab is showing.
  useEffect(() => {
    if (done || !active) return
    const onKey = (e) => {
      const typing = ['TEXTAREA', 'INPUT'].includes(e.target.tagName)
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); if (!rating) advance(); return }
      if (typing) return
      if (rating) {
        const hit = Object.entries(RATINGS).find(([, v]) => v.key === e.key)
        if (hit) rate(hit[0])
      } else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); advance() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => { if (active && step === 0) textRef.current?.focus() }, [i, step, active])

  if (ids.length === 0) {
    return <p className="text-center text-muted-foreground py-20">No questions to practice here.</p>
  }

  if (done) {
    const count = (k) => results.filter((r) => r.rating === k).length
    const revisit = results.filter((r) => r.rating !== 'solid')
    return (
      <div className="max-w-xl mx-auto text-center py-8">
        <h2 className="text-3xl font-semibold mb-2">Session complete</h2>
        <p className="text-muted-foreground mb-8">{results.length} questions answered</p>
        <div className="grid grid-cols-3 gap-3 mb-8">
          {Object.entries(RATINGS).map(([k, v]) => (
            <div key={k} className="bg-card border border-border rounded-2xl p-4">
              <p className="text-3xl font-semibold tabular-nums">{count(k)}</p>
              <p className="text-sm text-muted-foreground">{v.label}</p>
            </div>
          ))}
        </div>
        {revisit.length > 0 && (
          <div className="text-left bg-card border border-border rounded-2xl p-5 mb-8">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Coming back soon</p>
            <ul className="space-y-2">
              {revisit.map((r) => (
                <li key={r.id} className="text-sm flex gap-2">
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${r.rating === 'missed' ? 'bg-rose-400' : 'bg-amber-400'}`} />
                  {byId[r.id].question}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex gap-3 justify-center">
          <button onClick={onAgain} className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 py-3 rounded-xl transition-colors">
            <RotateCcw className="w-4 h-4" /> Another session
          </button>
          <button onClick={onExit} className="px-5 py-3 rounded-xl border border-border font-semibold hover:bg-muted transition-colors">
            Dashboard
          </button>
        </div>
      </div>
    )
  }

  const label = step < n ? (step === 0 ? 'Done, hear the follow-up' : 'Answered, next follow-up') : 'Show the answers'
  const previous = notes[q.id]

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(i / ids.length) * 100}%` }} />
        </div>
        <span className="text-sm text-muted-foreground tabular-nums">{i + 1} / {ids.length}</span>
        <button onClick={onExit} title="End session" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-card border border-border rounded-3xl shadow-sm p-6 sm:p-8">
        <div className="flex items-center flex-wrap gap-3 text-xs mb-4">
          <span className="flex items-center gap-1.5 font-semibold text-foreground/80">
            <span className={`w-2 h-2 rounded-full ${dot(q.topic)}`} />{q.topic}
          </span>
          <span className={`px-2 py-0.5 rounded-md ring-1 capitalize font-medium ${DIFFICULTY[q.difficulty] || ''}`}>{q.difficulty}</span>
          <span className="text-muted-foreground">{q.frequency}</span>
        </div>

        <h2 className="text-2xl font-semibold leading-snug mb-6">{q.question}</h2>

        {step === 0 && (
          <textarea
            ref={textRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            placeholder="Write or think through your answer. If you write something, it's saved so you can compare later."
            className="w-full rounded-xl border border-border bg-muted/50 p-4 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition resize-y"
          />
        )}

        {step > 0 && draft && (
          <div className="mb-6 rounded-xl bg-muted/50 border border-border p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Your answer</p>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{draft}</p>
          </div>
        )}

        {step > 0 && (
          <ol className="space-y-3 mb-6">
            {q.follow_ups.slice(0, Math.min(step, n)).map((fu, k) => (
              <li key={k} className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Interviewer follow-up {k + 1}</p>
                <p className="text-[15px] leading-relaxed">{fu.text}</p>
                {rating && (
                  <p className="text-xs text-muted-foreground mt-2 flex gap-1.5">
                    <CornerDownRight className="w-3 h-3 mt-0.5 shrink-0" />
                    Testing: {fu.intent}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}

        {rating && (
          <div className="space-y-5">
            <AnswerLadder q={q} />
            <Attempts attempts={previous} title="Your previous attempts" limit={1} />
          </div>
        )}
      </div>

      <div className="mt-5">
        {!rating ? (
          <button
            onClick={advance}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 rounded-xl transition-colors"
          >
            {label} <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <>
            <p className="text-center text-sm text-muted-foreground mb-3">How did you do?</p>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(RATINGS).map(([k, v]) => (
                <button key={k} onClick={() => rate(k)} className={`rounded-xl border py-3 font-semibold transition-colors ${v.button}`}>
                  {v.label}
                  <span className="block text-xs font-normal opacity-70">{v.hint} · {v.key}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
