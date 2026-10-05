import { useEffect, useState } from 'react'
import { matchEnabled, warmMatcher, matcherStatus, onMatcherStatus, scoreAnswer } from '../lib/match'

// Similarity of each key point to the answer, recomputed after the learner pauses typing.
// Returns { status: 'off' | 'loading' | 'ready' | 'error', sims: number[] | null }.
export function useMatchScore(q, text, delay = 450) {
  const on = matchEnabled(q)
  const [status, setStatus] = useState(on ? matcherStatus() : 'off')
  const [result, setResult] = useState(null) // { qid, text, sims }

  useEffect(() => {
    if (!on) return
    warmMatcher()
    setStatus(matcherStatus())
    return onMatcherStatus(setStatus)
  }, [on])

  useEffect(() => {
    if (!on || status === 'error') return
    const trimmed = text.trim()
    if (!trimmed) { setResult({ qid: q.id, text: '', sims: q.key_points.map(() => 0) }); return }
    let live = true
    const t = setTimeout(() => {
      scoreAnswer(q, trimmed).then((sims) => { if (live) setResult({ qid: q.id, text: trimmed, sims }) }).catch(() => {})
    }, delay)
    return () => { live = false; clearTimeout(t) }
  }, [on, q?.id, text, status]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!on) return { status: 'off', sims: null }
  return { status, sims: result && result.qid === q.id ? result.sims : null }
}
