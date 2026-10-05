// Live key-point coverage. Topic match only: it can't tell a right claim from its opposite.
// Correctness comes from the optional AI grade (src/lib/grade.js).

// Topics with reviewed-format key points. Widen as other topics' points are rewritten.
export const MATCH_TOPICS = new Set(['ML Algorithms'])

// A key point counts as covered when an answer sentence scores at least this.
// Set from first tests (strong answers 0.53 to 0.89 on every point, off-target sentences 0.43 or lower).
// Re-tune on about 30 hand-labeled answers.
export const THRESHOLD = 0.5

export const matchEnabled = (q) => !!q && MATCH_TOPICS.has(q.topic) && (q.key_points?.length ?? 0) > 0

export function splitSentences(text) {
  return text
    .split(/(?<=[.!?;])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3)
    .slice(0, 60)
}

let worker = null
let status = 'idle' // idle | loading | ready | error
const listeners = new Set()
const pending = new Map()
let nextId = 1

const setStatus = (s) => { status = s; listeners.forEach((fn) => fn(s)) }

function getWorker() {
  if (worker || typeof Worker === 'undefined') return worker
  try {
    worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })
  } catch {
    setStatus('error')
    return null
  }
  setStatus('loading')
  worker.onmessage = ({ data }) => {
    if (data.type === 'ready') setStatus('ready')
    else if (data.type === 'score') {
      if (status !== 'ready') setStatus('ready')
      pending.get(data.reqId)?.resolve(data.sims)
      pending.delete(data.reqId)
    } else if (data.type === 'error') {
      if (status !== 'ready') setStatus('error')
      pending.get(data.reqId)?.reject(new Error(data.message))
      pending.delete(data.reqId)
    }
  }
  worker.onerror = () => setStatus('error')
  worker.postMessage({ type: 'warm' })
  return worker
}

export function warmMatcher() { getWorker() }
export function matcherStatus() { return status }
export function onMatcherStatus(fn) { listeners.add(fn); return () => listeners.delete(fn) }

export function scoreAnswer(q, text) {
  const w = getWorker()
  if (!w) return Promise.reject(new Error('Match score unavailable'))
  const reqId = nextId++
  return new Promise((resolve, reject) => {
    pending.set(reqId, { resolve, reject })
    w.postMessage({ type: 'score', reqId, qid: q.id, points: q.key_points, sentences: splitSentences(text) })
  })
}

// Overall score: how close the answer is to a complete senior answer.
// Core points (what a passing answer needs, roughly one per part of the question) count double;
// senior extras count once. Credits are 0 to 1 per point: live matching gives 0 or 1,
// the AI grade gives 1 (correct), 0.5 (partial) or 0 (wrong, missing).
export const CORE_WEIGHT = 2

export function summarize(q, credits) {
  const core = new Set(q.key_points_core || [])
  const tiered = core.size > 0 && core.size < q.key_points.length
  let got = 0, max = 0
  const t = { core: { hit: 0, total: 0 }, extra: { hit: 0, total: 0 } }
  q.key_points.forEach((_, i) => {
    const isCore = !tiered || core.has(i)
    const w = tiered && isCore ? CORE_WEIGHT : 1
    const c = credits?.[i] ?? 0
    got += w * c
    max += w
    const bucket = isCore ? t.core : t.extra
    bucket.total += 1
    if (c >= 1) bucket.hit += 1
  })
  return { pct: max ? Math.round((100 * got) / max) : 0, tiered, isCore: (i) => !tiered || core.has(i), ...t }
}

export const liveCredits = (sims) => sims?.map((s) => (s >= THRESHOLD ? 1 : 0)) ?? null
export const GRADE_CREDIT = { correct: 1, partial: 0.5, wrong: 0, missing: 0 }
