import { Fragment, useState, useEffect, useRef, useMemo } from 'react'
import { ArrowUp, X, RotateCcw, Repeat, CornerDownRight } from 'lucide-react'
import { RATINGS, dot } from '../lib/topics'
import AnswerLadder from './AnswerLadder'
import Attempts from './Attempts'
import DraftBadge from './DraftBadge'
import TagChips from './TagChips'
import KeyTerms from './KeyTerms'
import { pickVariants, markSeen, followUpText } from '../lib/variants'
import { matchEnabled, ratingFromScore, toSavedScore } from '../lib/match'
import { useMatchScore } from '../hooks/useMatchScore'
import { CoverageMeter, KeyPointsReview } from './KeyPoints'

// Haiku's verdict on each follow-up reply, shown in the debrief.
const VERDICT = {
  good: { label: 'Answered well', cls: 'text-emerald-700 dark:text-emerald-300' },
  partial: { label: 'Partly there', cls: 'text-amber-700 dark:text-amber-300' },
  weak: { label: 'Missed the point', cls: 'text-rose-700 dark:text-rose-300' },
  none: { label: 'No reply', cls: 'text-muted-foreground' },
}

const reduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

function Interviewer({ children, label }) {
  return (
    <div className="anim-msg max-w-[92%] sm:max-w-[85%]">
      {label && <p className="text-xs text-muted-foreground mb-1.5">{label}</p>}
      {children}
    </div>
  )
}

function You({ text }) {
  return (
    <div className="anim-msg flex justify-end">
      {text ? (
        <p className="max-w-[88%] sm:max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary text-primary-foreground px-4 py-3 text-[15px] leading-relaxed">
          {text}
        </p>
      ) : (
        <p className="text-sm italic text-muted-foreground">You thought it through</p>
      )}
    </div>
  )
}

function Typing() {
  return (
    <div className="anim-msg inline-flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-muted px-4 py-3" role="status" aria-label="Interviewer is typing">
      {[0, 1, 2].map((d) => (
        <span key={d} className="typing-dot w-1.5 h-1.5 rounded-full bg-muted-foreground" style={{ animationDelay: `${d * 140}ms` }} />
      ))}
    </div>
  )
}

export default function Practice({ ids, byId, notes, active, onRate, onExit, onAgain, onRedo, onTag }) {
  const [i, setI] = useState(0)
  const [turns, setTurns] = useState([]) // your replies, one per message you sent
  const [revealed, setRevealed] = useState(0) // how many interviewer replies have landed
  const [text, setText] = useState('')
  const [deepOpen, setDeepOpen] = useState(false) // an interactive explainer is open
  const [results, setResults] = useState([])
  const [kp, setKp] = useState(null) // { id, pct, status, basis } from the key-points panel for the current question
  const [fuGrade, setFuGrade] = useState(null) // { id, followUps: [{ verdict, note }] } from the Haiku grade
  const textRef = useRef(null)
  const endRef = useRef(null)

  const step = turns.length
  const done = i >= ids.length
  const q = done ? null : byId[ids[i]]
  const n = q ? q.follow_ups.length : 0
  const total = n + 1
  const typing = !!q && revealed < step
  const rating = !!q && step === total && revealed === total
  const draft = turns.filter(Boolean).join('\n\n')
  // Key-point coverage follows the main answer: live while it is typed, then frozen once sent.
  const match = useMatchScore(q, step === 0 ? text : turns[0] || '')

  // One wording per follow-up for this question, avoiding the wording shown last time.
  const picks = useMemo(() => (q ? pickVariants(q) : []), [q?.id, i]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (q) markSeen(q.id, picks) }, [q, picks])

  const send = () => {
    if (typing || rating) return
    setTurns((t) => [...t, text.trim()])
    setText('')
  }
  const score = kp && q && kp.id === q.id ? kp : null
  const suggested = score?.basis ? ratingFromScore(score.pct) : null
  const rate = (r) => {
    onRate(q.id, r, draft, 'practice', toSavedScore(score))
    setResults((x) => [...x, { id: q.id, rating: r }])
    setI((x) => x + 1)
    setTurns([])
    setRevealed(0)
    setText('')
  }

  // The interviewer "types" for a moment before each follow-up lands.
  useEffect(() => {
    if (step === 0 || revealed >= step) return
    const t = setTimeout(() => setRevealed(step), reduced() ? 0 : 650)
    return () => clearTimeout(t)
  }, [step, revealed])

  // Cmd/Ctrl+Enter sends from the box. Outside it: Space/Enter sends, 1/2/3 rates. Ignored while another tab shows.
  useEffect(() => {
    if (done || !active) return
    const onKey = (e) => {
      const inField = ['TEXTAREA', 'INPUT'].includes(e.target.tagName)
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); send(); return }
      if (inField) return
      if (rating) {
        const hit = Object.entries(RATINGS).find(([, v]) => v.key === e.key)
        if (hit) rate(hit[0])
      } else if ((e.key === ' ' || e.key === 'Enter') && !e.target.closest?.('button, a')) { e.preventDefault(); send() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => { if (active && !typing && !rating && !done) textRef.current?.focus() }, [i, step, revealed, active])
  useEffect(() => {
    if (!active || (step === 0 && revealed === 0)) return
    endRef.current?.scrollIntoView?.({ behavior: reduced() ? 'auto' : 'smooth', block: 'end' })
  }, [step, revealed, active])

  if (ids.length === 0) {
    return <p className="text-center text-muted-foreground py-20">No questions to practice here.</p>
  }

  if (done) {
    const count = (k) => results.filter((r) => r.rating === k).length
    const revisit = results.filter((r) => r.rating !== 'solid')
    return (
      <div className="max-w-xl mx-auto py-8">
        <h2 className="anim-msg text-3xl font-semibold mb-1">That's the session</h2>
        <p className="text-muted-foreground mb-8">{results.length} {results.length === 1 ? 'question' : 'questions'} answered</p>
        <div className="grid grid-cols-3 gap-3 mb-8">
          {Object.entries(RATINGS).map(([k, v], idx) => (
            <div key={k} className="tile-pop rounded-2xl border border-border bg-card p-4" style={{ animationDelay: `${idx * 90}ms` }}>
              <span className={`block w-6 h-1.5 rounded-full mb-3 ${v.bar}`} />
              <p className="text-3xl font-semibold tabular-nums">{count(k)}</p>
              <p className="text-sm text-muted-foreground">{v.label}</p>
            </div>
          ))}
        </div>
        {revisit.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5 mb-8">
            <p className="font-semibold mb-3">Coming back soon</p>
            <ul className="space-y-2">
              {revisit.map((r) => (
                <li key={r.id} className="text-sm flex gap-2.5">
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${RATINGS[r.rating].bar}`} />
                  {byId[r.id].question}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          <button onClick={onAgain} className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-3 rounded-xl hover:opacity-90 transition-opacity">
            <RotateCcw className="w-4 h-4" /> Another session
          </button>
          <button
            onClick={() => onRedo(ids)}
            title="Same questions again. Follow-ups with alternative wordings will be phrased differently."
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-border font-semibold hover:bg-muted transition-colors"
          >
            <Repeat className="w-4 h-4" /> Practice these again
          </button>
          <button onClick={onExit} className="px-5 py-3 rounded-xl border border-border font-semibold hover:bg-muted transition-colors">
            Dashboard
          </button>
        </div>
      </div>
    )
  }

  const empty = text.trim() === ''
  const sendLabel = empty ? 'Thought it through' : 'Send'

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 flex gap-1.5" role="progressbar" aria-valuemin={0} aria-valuemax={ids.length} aria-valuenow={i}>
          {ids.map((id, k) => (
            <span key={id} className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${k < i ? 'bg-primary' : k === i ? 'bg-primary/40' : 'bg-muted'}`} />
          ))}
        </div>
        <span className="text-sm text-muted-foreground tabular-nums">{i + 1} of {ids.length}</span>
        <button onClick={onExit} title="End session" aria-label="End session" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-6" style={{ paddingBottom: '1.5rem' }}>
        <div key={q.id} className="anim-msg">
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-3">
            <span className="inline-flex items-center gap-1.5 font-medium text-foreground/80">
              <span className={`w-2 h-2 rounded-full ${dot(q.topic)}`} />{q.topic}
            </span>
            <span className="capitalize">{q.difficulty}</span>
            <span>{q.frequency}</span>
            <DraftBadge q={q} />
          </div>
          <h2 className="font-serif text-[1.65rem] sm:text-3xl leading-[1.4] font-medium">
            <span className="marker-text">{q.question}</span>
          </h2>
          <KeyTerms key={q.id} terms={q.terms} onTag={onTag} onDeepChange={setDeepOpen} />
        </div>

        {turns.map((t, k) => (
          <Fragment key={k}>
            <You text={t} />
            {k < revealed && k < n && (
              <Interviewer label={`Follow-up ${k + 1} of ${n}`}>
                <p className="font-serif text-lg leading-relaxed">{followUpText(q, picks, k)}</p>
              </Interviewer>
            )}
          </Fragment>
        ))}

        {typing && <Typing />}

        {rating && (
          <div className="anim-msg space-y-5 pt-2">
            <div className="border-l-2 border-marker pl-4">
              <p className="text-sm text-muted-foreground mb-1">Here's how that lands for this question</p>
              <p className="font-serif text-lg leading-snug">{q.question}</p>
            </div>
            {matchEnabled(q) && <KeyPointsReview
                key={q.id} q={q} answer={turns[0]} sims={match.sims}
                followUps={q.follow_ups.map((fu, k) => ({ text: followUpText(q, picks, k), intent: fu.intent, reply: turns[k + 1] || '' }))}
                onScore={(sc) => setKp({ id: q.id, ...sc })}
                onGrade={(g) => setFuGrade({ id: q.id, followUps: g.followUps })}
              />}
            <AnswerLadder q={q} />
            {q.tags?.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">Tags</p>
                <TagChips tags={q.tags} onTag={onTag} max={6} />
              </div>
            )}
            {n > 0 && (
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm font-semibold mb-3">The follow-ups, your replies, and what they were testing</p>
                <ol className="space-y-4">
                  {q.follow_ups.map((fu, k) => {
                    const reply = turns[k + 1]
                    return (
                      <li key={k} className="text-sm">
                        <p className="font-medium text-foreground/90">
                          <span className="text-muted-foreground tabular-nums mr-1.5">{k + 1}.</span>
                          {followUpText(q, picks, k)}
                        </p>
                        <div className="mt-1.5 ml-5 rounded-lg bg-muted/50 border border-border px-3 py-2">
                          <p className="text-xs text-muted-foreground mb-0.5">You said</p>
                          {reply
                            ? <p className="whitespace-pre-wrap text-foreground/80">{reply}</p>
                            : <p className="italic text-muted-foreground">No written reply</p>}
                        </div>
                        {(() => {
                          const v = fuGrade?.id === q.id ? fuGrade.followUps?.[k] : null
                          return v && VERDICT[v.verdict] && (
                            <p className="mt-1.5 ml-5 text-xs">
                              <span className={`font-semibold ${VERDICT[v.verdict].cls}`}>{VERDICT[v.verdict].label}</span>
                              {v.note && <span className="text-muted-foreground"> · {v.note}</span>}
                            </p>
                          )
                        })()}
                        <p className="text-muted-foreground flex gap-1.5 mt-1.5 ml-5">
                          <CornerDownRight className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          Testing: {fu.intent}
                        </p>
                      </li>
                    )
                  })}
                </ol>
              </div>
            )}
            <Attempts attempts={notes[q.id]} title="Your previous attempts" limit={1} />
          </div>
        )}
        <div ref={endRef} style={{ scrollMarginBottom: '12rem' }} />
      </div>

      <div className={deepOpen ? '' : 'sticky bottom-4 z-10'}>
        {!rating ? (
          <div className="rounded-2xl border border-border bg-card shadow-lg focus-within:border-primary transition-colors">
            <textarea
              ref={textRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              aria-label={step === 0 ? 'Your answer' : 'Your reply'}
              placeholder={step === 0 ? 'Answer as you would in the room. Writing is optional, and whatever you write is saved for later.' : 'Reply to the follow-up'}
              className="w-full resize-none bg-transparent px-4 pt-3.5 pb-1 text-[15px] leading-relaxed placeholder:text-muted-foreground focus:outline-none"
            />
            <div className="flex items-center justify-between gap-3 px-3 pb-3">
              {step === 0 && match.status !== 'off'
                ? <div className="pl-1"><CoverageMeter q={q} status={match.status} sims={match.sims} /></div>
                : <span className="text-xs text-muted-foreground pl-1 hidden sm:block">Ctrl or Cmd + Enter to send</span>}
              <button
                onClick={send}
                disabled={typing}
                className="ml-auto inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-sm pl-4 pr-3 py-2 rounded-xl hover:opacity-90 disabled:opacity-40 transition"
              >
                {sendLabel}
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="anim-msg rounded-2xl border border-border bg-card shadow-lg p-4">
            <p className="text-center text-sm text-muted-foreground mb-3">
              How did you do?{suggested && <> Your score of {score.pct}% suggests <span className="font-semibold text-foreground">{RATINGS[suggested].label}</span>.</>}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(RATINGS).map(([k, v]) => (
                <button key={k} onClick={() => rate(k)} aria-describedby={k === suggested ? 'suggested-rating' : undefined}
                  className={`rounded-xl border py-3 font-semibold transition-all active:scale-95 ${v.button} ${k === suggested ? 'ring-2 ring-offset-2 ring-offset-card ring-current' : ''}`}>
                  {v.label}
                  <span className="block text-xs font-normal opacity-70">{k === suggested ? <span id="suggested-rating">Suggested · {v.key}</span> : <>{v.hint} · {v.key}</>}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
