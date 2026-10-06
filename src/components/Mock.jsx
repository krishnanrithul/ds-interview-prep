import { useState, useEffect, useMemo, useRef } from 'react'
import { Timer, ArrowRight, X, Minus, Plus, CornerDownRight } from 'lucide-react'
import { pickVariants, markSeen, followUpText } from '../lib/variants'
import { QUESTIONS } from '../data/questions'
import { buildMockQueue } from '../lib/queue'
import { DIFFICULTY, RATINGS, dot } from '../lib/topics'
import AnswerLadder from './AnswerLadder'
import ConfirmDialog from './ConfirmDialog'
import DraftBadge from './DraftBadge'
import { generateProbe, reactiveEnabled } from '../lib/probe'
import { getApiKey } from '../lib/grade'
import { matchEnabled, ratingFromScore, interviewVerdict, toSavedScore } from '../lib/match'
import { useMatchScore } from '../hooks/useMatchScore'
import { KeyPointsReview } from './KeyPoints'
import { ReportQuestion } from './FeedbackLink'

function Reply({ text }) {
  return (
    <div className="flex justify-end">
      {text
        ? <p className="max-w-[88%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary text-primary-foreground px-4 py-3 text-[15px] leading-relaxed">{text}</p>
        : <p className="text-sm italic text-muted-foreground">You passed</p>}
    </div>
  )
}

// Key points for one Mock question: the live score reads only the learner's words; the AI grade reads the
// labeled conversation, so it can tell what the learner said from what the interviewer asked.
function MockKeyPoints({ q, thread, onScore }) {
  const mine = [thread?.main || '', ...(thread?.fus || []).map((f) => f.reply || '')].filter((t) => t.trim()).join('\n\n')
  const transcript = thread
    ? [`Candidate (answer to the main question): ${thread.main || '(no answer)'}`,
       ...thread.fus.map((f) => `Interviewer: ${f.text}\nCandidate: ${f.reply?.trim() || '(no reply)'}`)].join('\n\n')
    : ''
  const match = useMatchScore(q, mine)
  return <KeyPointsReview q={q} answer={mine} sims={match.sims} gradeText={transcript} onScore={onScore} />
}

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

// A real-interview rehearsal: mixed topics, a back-and-forth with the interviewer (follow-ups written
// from your replies in reactive topics), a soft timer, and no answers until the very end.
export default function Mock({ progress, byId, active, onSave }) {
  const [stage, setStage] = useState('setup') // setup | run | review
  const [cfg, setCfg] = useState({ count: 5, minutes: 6, topic: 'all' })
  const [ids, setIds] = useState([])
  const [idx, setIdx] = useState(0)
  const [threads, setThreads] = useState({}) // id -> { main, fus: [{ text, intent, probe, error, reply }] }
  const [draft, setDraft] = useState('')
  const [times, setTimes] = useState({})
  const [ratings, setRatings] = useState({})
  const [scores, setScores] = useState({}) // id -> { pct, status } from the key-points panel
  const [touched, setTouched] = useState({}) // ratings the learner chose themselves; others follow the score
  const [picks, setPicks] = useState({}) // follow-up wording chosen per question for this interview
  const [startedAt, setStartedAt] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [thinking, setThinking] = useState(false)
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

  useEffect(() => { if (active && stage === 'run' && !thinking) textRef.current?.focus() }, [idx, stage, active, thinking, threads])

  const q = stage === 'run' ? byId[ids[idx]] : null
  const n = q ? q.follow_ups.length : 0

  const start = () => {
    const picked = buildMockQueue(QUESTIONS, progress, { count, topic: cfg.topic })
    setIds(picked)
    const chosen = Object.fromEntries(picked.map((id) => [id, pickVariants(byId[id])]))
    Object.entries(chosen).forEach(([id, p]) => markSeen(id, p))
    setPicks(chosen)
    setIdx(0); setThreads({}); setDraft(''); setTimes({}); setRatings({}); setScores({}); setTouched({}); setElapsed(0); setThinking(false)
    setStartedAt(Date.now())
    setStage('run')
  }

  const thread = q ? threads[q.id] || { main: null, fus: [] } : null
  const awaitingReply = !!thread && (thread.main === null || (thread.fus.length > 0 && thread.fus[thread.fus.length - 1].reply === null))
  const questionDone = !!thread && thread.main !== null && !awaitingReply && !thinking && thread.fus.length >= n

  // Ask follow-up k: written from the conversation for reactive topics, otherwise the fixed one.
  const askNext = async (id, item, t) => {
    const k = t.fus.length
    if (k >= item.follow_ups.length) return
    const guide = { text: followUpText(item, picks[id], k), intent: item.follow_ups[k].intent }
    let fu = { text: guide.text, intent: guide.intent, probe: null, error: null, reply: null }
    const key = getApiKey()
    if (reactiveEnabled(item) && key) {
      const history = [{ who: 'candidate', text: t.main }]
      t.fus.forEach((f) => { history.push({ who: 'interviewer', text: f.text }); history.push({ who: 'candidate', text: f.reply || '' }) })
      setThinking(true)
      try {
        const p = await generateProbe(item, history, guide, key)
        fu = { ...fu, text: p.question, probe: p }
      } catch (err) {
        // Error or timeout: the fixed follow-up is asked instead, and the reason is shown under it.
        const why = err.name === 'AbortError' ? 'no reply within 10 seconds' : err.message
        console.warn('[reactive mock] fell back to the fixed follow-up:', why)
        fu = { ...fu, error: why }
      }
      setThinking(false)
    }
    setThreads((x) => ({ ...x, [id]: { ...x[id], fus: [...x[id].fus, fu] } }))
  }

  const send = () => {
    if (thinking || !awaitingReply) return
    const id = q.id
    const text = draft.trim()
    let t
    if (thread.main === null) t = { main: text, fus: [] }
    else t = { ...thread, fus: thread.fus.map((f, k) => (k === thread.fus.length - 1 ? { ...f, reply: text } : f)) }
    setThreads((x) => ({ ...x, [id]: t }))
    setDraft('')
    askNext(id, q, t)
  }

  const finishQuestion = () => {
    setTimes((t) => ({ ...t, [q.id]: Math.floor((Date.now() - startedAt) / 1000) }))
    if (idx + 1 < ids.length) {
      setIdx(idx + 1); setDraft(''); setElapsed(0); setStartedAt(Date.now())
    } else {
      setStage('review')
    }
  }

  // Cmd/Ctrl+Enter sends a reply, or moves on once the question is done
  useEffect(() => {
    if (stage !== 'run' || !active) return
    const onKey = (e) => {
      if (!((e.metaKey || e.ctrlKey) && e.key === 'Enter')) return
      e.preventDefault()
      if (questionDone) finishQuestion()
      else send()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Main answer plus each follow-up and reply, as one text for the saved attempt.
  const transcriptText = (id) => {
    const t = threads[id]
    if (!t) return ''
    return [t.main || '', ...t.fus.map((f, k) => `Follow-up ${k + 1}: ${f.text}
${f.reply || '(no reply)'}`)].filter(Boolean).join('\n\n')
  }

  const save = () => {
    const results = ids
      .filter((id) => ratings[id])
      .map((id) => ({ id, rating: ratings[id], answer: transcriptText(id), scored: toSavedScore(scores[id]) }))
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
        <p className="text-center text-xs text-muted-foreground mt-1">
          {getApiKey()
            ? 'The interviewer reacts to your answers, and each question is graded at the end.'
            : 'Add an API key in Settings and the interviewer reacts to your answers and grades them.'}
        </p>
      </div>
    )
  }

  // ---------- run ----------
  if (stage === 'run') {
    const over = elapsed > limit
    const timeLabel = over ? `+${mmss(elapsed - limit)} over` : mmss(limit - elapsed)
    const last = idx + 1 === ids.length
    const reactive = reactiveEnabled(q) && !!getApiKey()

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
            {reactive && <span className="text-muted-foreground">Follow-ups react to your answers</span>}
          </div>
          <h2 className="text-2xl font-semibold leading-snug mb-5">{q.question}</h2>

          <div className="space-y-4 mb-5">
            {thread.main !== null && <Reply text={thread.main} />}
            {thread.fus.map((f, k) => (
              <div key={k} className="space-y-4">
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm font-semibold text-primary mb-1">Interviewer follow-up {k + 1}</p>
                  <p className="text-[15px] leading-relaxed">{f.text}</p>
                  {f.error && <p className="text-xs text-muted-foreground mt-2">Couldn't react to your answer ({f.error}), so this is a standard follow-up.</p>}
                </div>
                {f.reply !== null && <Reply text={f.reply} />}
              </div>
            ))}
            {thinking && (
              <div className="inline-flex items-center gap-2 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground" role="status">
                {[0, 1, 2].map((d) => <span key={d} className="typing-dot w-1.5 h-1.5 rounded-full bg-muted-foreground" style={{ animationDelay: `${d * 140}ms` }} />)}
                <span className="ml-1">The interviewer is thinking</span>
              </div>
            )}
          </div>

          {awaitingReply && !thinking && (
            <div className="rounded-2xl border border-border bg-muted/40 focus-within:border-primary transition-colors">
              <textarea
                ref={textRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={thread.main === null ? 6 : 3}
                aria-label={thread.main === null ? 'Your answer' : 'Your reply'}
                placeholder={thread.main === null
                  ? 'Answer as you would out loud: your approach, trade-offs, and what you would check.'
                  : 'Reply to the interviewer'}
                className="w-full resize-y bg-transparent px-4 pt-3.5 pb-1 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none"
              />
              <div className="flex items-center justify-between gap-3 px-3 pb-3">
                <span className="text-xs text-muted-foreground pl-1 hidden sm:block">Cmd/Ctrl + Enter to send</span>
                <button onClick={send}
                  className="ml-auto inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-sm pl-4 pr-3 py-2 rounded-xl hover:opacity-90 transition">
                  {draft.trim() ? 'Send' : "Skip, I'd pass"} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {questionDone && (
          <>
            <button onClick={finishQuestion}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 rounded-xl transition-colors">
              {last ? 'Finish interview' : 'Next question'} <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-center text-xs text-muted-foreground mt-3">Cmd/Ctrl + Enter to continue</p>
          </>
        )}

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
  // A question's score pre-fills its rating until the learner picks one themselves.
  function setScore(id, sc) {
    setScores((x) => (x[id]?.pct === sc.pct && x[id]?.status === sc.status ? x : { ...x, [id]: sc }))
    if (sc.status === 'pending' || sc.status === 'unavailable') return
    setRatings((r) => (touched[id] ? r : { ...r, [id]: ratingFromScore(sc.pct) }))
  }
  const scored = ids.filter((id) => scores[id] && !['pending', 'unavailable'].includes(scores[id].status))
  const scoring = ids.some((id) => matchEnabled(byId[id]) && (!scores[id] || scores[id].status === 'pending'))
  const overall = scored.length ? Math.round(scored.reduce((a, id) => a + scores[id].pct, 0) / scored.length) : null
  const graded = scored.filter((id) => scores[id].status === 'graded').length
  const ranked = [...scored].sort((a, b) => scores[b].pct - scores[a].pct)
  const totalTime = ids.reduce((s, id) => s + (times[id] || 0), 0)
  const overCount = ids.filter((id) => (times[id] || 0) > limit).length
  const rated = ids.filter((id) => ratings[id]).length
  const weakTopics = [...new Set(ids.filter((id) => ratings[id] && ratings[id] !== 'solid').map((id) => byId[id].topic))]

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Interview review</h1>
      <p className="text-muted-foreground mb-6">How you did overall, then each question with its key points and the senior answer.</p>

      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 mb-4">
        {overall === null ? (
          <p className="text-sm text-muted-foreground" role="status">{scoring ? 'Scoring your interview…' : 'No score: no question in this interview has key points.'}</p>
        ) : (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p><span className="text-4xl font-semibold tabular-nums">{overall}%</span> <span className="text-muted-foreground">of a senior answer, across the interview</span></p>
              <p className="text-xs text-muted-foreground">
                {scoring ? 'Still scoring…' : graded === scored.length ? 'Graded for correctness by Haiku' : graded ? `${graded} of ${scored.length} graded by Haiku, the rest by which ideas you mentioned` : 'Based on which ideas you mentioned'}
              </p>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden mt-3" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={overall} aria-label="Interview score">
              <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${overall}%` }} />
            </div>
            <p className="font-semibold mt-3">{interviewVerdict(overall)}</p>
            {ranked.length > 1 && (
              <ul className="mt-3 space-y-1.5 text-sm">
                <li className="flex gap-2"><span className="text-muted-foreground shrink-0 w-24">Strongest</span><span><span className="tabular-nums font-medium">{scores[ranked[0]].pct}%</span> · {byId[ranked[0]].question}</span></li>
                <li className="flex gap-2"><span className="text-muted-foreground shrink-0 w-24">Biggest gap</span><span><span className="tabular-nums font-medium">{scores[ranked[ranked.length - 1]].pct}%</span> · {byId[ranked[ranked.length - 1]].question}</span></li>
              </ul>
            )}
            <p className="text-xs text-muted-foreground mt-3">Each question's rating below is suggested from its score. Change any you disagree with before saving.</p>
          </>
        )}
      </div>

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
                <p className="text-sm font-semibold text-muted-foreground mb-1">Your answer</p>
                {threads[id]?.main?.trim()
                  ? <p className="text-sm whitespace-pre-wrap text-foreground/80">{threads[id].main}</p>
                  : <p className="text-sm text-muted-foreground italic">You didn't write an answer.</p>}
              </div>

              <ol className="space-y-4 mb-4">
                {(threads[id]?.fus || []).map((f, j) => (
                  <li key={j} className="text-sm">
                    <p><span className="font-semibold text-primary mr-1.5">{j + 1}.</span>{f.text}</p>
                    <p className="text-xs text-muted-foreground ml-5 mt-0.5 flex gap-1.5">
                      <CornerDownRight className="w-3 h-3 mt-0.5 shrink-0" />
                      {f.probe
                        ? f.probe.quote
                          ? <span>Asked because you said “{f.probe.quote}”</span>
                          : f.probe.target === 'scaffold'
                            ? <span>A simpler step, because your last reply was thin</span>
                            : f.probe.target === 'reask'
                              ? <span>Asked again, because your reply didn't answer it</span>
                            : f.probe.point >= 0
                              ? <span>Asked to steer you toward: {item.key_points[f.probe.point]}</span>
                              : <span>Asked to push deeper on your answer</span>
                        : <span>Testing: {f.intent}</span>}
                    </p>
                    <div className="ml-5 mt-1.5 rounded-lg bg-muted/50 border border-border px-3 py-2">
                      <p className="text-xs text-muted-foreground mb-0.5">You said</p>
                      {f.reply?.trim()
                        ? <p className="whitespace-pre-wrap text-foreground/80">{f.reply}</p>
                        : <p className="italic text-muted-foreground">No reply</p>}
                    </div>
                  </li>
                ))}
              </ol>

              {matchEnabled(item) && <div className="mb-4"><MockKeyPoints q={item} thread={threads[id]} onScore={(sc) => setScore(id, sc)} /></div>}
              <div className="mb-4"><AnswerLadder q={item} /></div>
              <ReportQuestion q={item} where="Mock review" className="mb-4" />

              <div className="grid grid-cols-3 gap-2">
                {Object.entries(RATINGS).map(([r, v]) => (
                  <button key={r} onClick={() => { setTouched({ ...touched, [id]: true }); setRatings({ ...ratings, [id]: ratings[id] === r ? undefined : r }) }}
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
