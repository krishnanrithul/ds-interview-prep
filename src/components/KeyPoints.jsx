import { useEffect, useState } from 'react'
import { Check, X, Minus, Sparkles } from 'lucide-react'
import { summarize, liveCredits, GRADE_CREDIT } from '../lib/match'
import { getApiKey, gradeAnswer, cachedGrade } from '../lib/grade'

// Live line under the answer box: how far the answer is toward a senior answer, never which points it hit.
export function CoverageMeter({ q, status, sims }) {
  if (status === 'off') return null
  if (status === 'error') return <p className="text-xs text-muted-foreground">Match score unavailable in this browser</p>
  if (status === 'loading' || !sims) return <p className="text-xs text-muted-foreground" role="status">Loading match score…</p>
  const credits = liveCredits(sims)
  const s = summarize(q, credits)
  const dots = (pred) => q.key_points.map((_, i) => (pred(i) ? (
    <span key={i} className={`w-2 h-2 rounded-full transition-colors duration-300 ${credits[i] ? 'bg-primary' : 'bg-muted-foreground/25'}`} />
  ) : null))
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
      <span className="hidden sm:flex items-center gap-1" aria-hidden="true">
        {dots(s.isCore)}
        {s.tiered && <span className="w-1.5" />}
        {s.tiered && dots((i) => !s.isCore(i))}
      </span>
      <span className="tabular-nums">
        {s.tiered
          ? <>Core {s.core.hit}/{s.core.total} · Extras {s.extra.hit}/{s.extra.total} · <span className="font-semibold text-foreground/80">{s.pct}%</span></>
          : <>{s.core.hit} of {s.core.total} key points covered · <span className="font-semibold text-foreground/80">{s.pct}%</span></>}
      </span>
    </div>
  )
}

const MARK = {
  correct: { icon: Check, cls: 'bg-emerald-600 text-white', label: 'Correct' },
  partial: { icon: Check, cls: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/60', label: 'Partly right' },
  wrong: { icon: X, cls: 'bg-rose-600 text-white', label: 'Covered, but wrong' },
  missing: { icon: Minus, cls: 'bg-muted text-muted-foreground', label: 'Missing' },
  covered: { icon: Check, cls: 'bg-primary/15 text-primary', label: 'Mentioned' },
}

function PointList({ q, idx, grade, sims, text }) {
  return (
    <ol className="space-y-2.5">
      {idx.map((k) => {
        const g = grade?.points[k]
        const kind = g ? g.status : sims && text && sims[k] >= 0.5 ? 'covered' : null
        const m = kind && MARK[kind]
        const Icon = m?.icon
        return (
          <li key={k} className="flex gap-2.5 text-sm">
            <span title={m?.label || 'Not mentioned'} className={`mt-0.5 w-5 h-5 shrink-0 rounded-full flex items-center justify-center ${m ? m.cls : 'border border-border'}`}>
              {Icon && <Icon className="w-3 h-3" strokeWidth={3} />}
              <span className="sr-only">{m?.label || 'Not mentioned'}</span>
            </span>
            <div className="min-w-0">
              <p className={kind === 'missing' || (!kind && text) ? 'text-foreground/70' : ''}>{q.key_points[k]}</p>
              {g?.note && <p className={`text-xs mt-0.5 ${g.status === 'wrong' ? 'text-rose-700 dark:text-rose-300' : g.status === 'partial' ? 'text-amber-700 dark:text-amber-300' : 'text-muted-foreground'}`}>{g.note}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

// Debrief panel: overall score, then each key point grouped into core and senior extras.
export function KeyPointsReview({ q, answer, sims }) {
  const text = (answer || '').trim()
  const [grade, setGrade] = useState(() => (text ? cachedGrade(q, text.slice(0, 2000)) : null))
  const [state, setState] = useState(grade ? 'done' : 'idle') // idle | busy | done | error | nokey
  const [error, setError] = useState('')

  useEffect(() => {
    if (grade || !text) return
    const key = getApiKey()
    if (!key) { setState('nokey'); return }
    const ctl = new AbortController()
    setState('busy')
    gradeAnswer(q, text, key, ctl.signal)
      .then((g) => { setGrade(g); setState('done') })
      .catch((e) => { if (e.name !== 'AbortError') { setError(e.message); setState('error') } })
    return () => ctl.abort()
  }, [q.id, text]) // eslint-disable-line react-hooks/exhaustive-deps

  const credits = grade ? grade.points.map((p) => GRADE_CREDIT[p.status] ?? 0) : text ? liveCredits(sims) : null
  const s = summarize(q, credits)
  const all = q.key_points.map((_, i) => i)
  const coreIdx = all.filter(s.isCore)
  const extraIdx = all.filter((i) => !s.isCore(i))
  const counts = grade && grade.points.reduce((a, p) => ({ ...a, [p.status]: (a[p.status] || 0) + 1 }), {})

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-sm font-semibold">Key points</p>
        <p className="text-xs text-muted-foreground">
          {[grade ? 'Graded by Haiku' : text && credits ? 'Live estimate' : null, q.key_points_draft ? 'Draft' : null].filter(Boolean).join(' · ')}
        </p>
      </div>
      {text && credits && (
        <div className="mt-3">
          <div className="flex items-baseline justify-between gap-3 mb-1.5">
            <p className="text-sm"><span className="text-2xl font-semibold tabular-nums">{s.pct}%</span> <span className="text-muted-foreground">of a senior answer</span></p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {grade
                ? ['correct', 'partial', 'wrong', 'missing'].filter((k) => counts[k]).map((k) => `${counts[k]} ${k}`).join(' · ')
                : s.tiered ? `Core ${s.core.hit}/${s.core.total} · Extras ${s.extra.hit}/${s.extra.total}` : `${s.core.hit} of ${s.core.total}`}
            </p>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={s.pct} aria-label="Score">
            <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${s.pct}%` }} />
          </div>
        </div>
      )}
      <div className="mt-4 space-y-4">
        {s.tiered ? (
          <>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Core: what a passing answer needs</p>
              <PointList q={q} idx={coreIdx} grade={grade} sims={sims} text={text} />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Senior extras: what makes it strong</p>
              <PointList q={q} idx={extraIdx} grade={grade} sims={sims} text={text} />
            </div>
          </>
        ) : <PointList q={q} idx={all} grade={grade} sims={sims} text={text} />}
      </div>
      <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
        {!text && <p>Write an answer next time to see how close it gets.</p>}
        {text && state === 'busy' && <p className="flex items-center gap-1.5" role="status"><Sparkles className="w-3.5 h-3.5" />Checking correctness with Haiku…</p>}
        {text && state === 'done' && grade?.summary && <p className="text-sm text-foreground/90"><Sparkles className="inline w-3.5 h-3.5 mr-1.5 -mt-0.5 text-muted-foreground" />{grade.summary}</p>}
        {text && state === 'error' && <p>AI check failed: {error}. The score above is the live estimate.</p>}
        {text && state === 'nokey' && <p>The live estimate checks which ideas you mentioned, not whether you got them right. Core points count double. Add an Anthropic API key in Settings to grade correctness, with half credit for partly right points.</p>}
      </div>
    </div>
  )
}
