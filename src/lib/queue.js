import { isDue, overdueDays } from './srs.js'

export function summarize(questions, progress) {
  const out = { solid: 0, shaky: 0, missed: 0, unseen: 0 }
  for (const q of questions) out[progress[q.id]?.rating || 'unseen']++
  return out
}

export const countDue = (questions, progress, now = Date.now()) =>
  questions.filter((q) => isDue(progress[q.id], now)).length

// Unseen questions ramp up by level so a new learner starts with Foundations, then Core,
// then Advanced. The gaps are larger than the random nudge, so a Foundations question always
// outranks an unseen Advanced one in the same topic.
const UNSEEN_LEVEL_BONUS = { easy: 0.6, medium: 0.3, hard: 0 }

// Priority: overdue reviews first, then unseen (easier levels first), then not-yet-due weak
// ones, and solid-and-not-due last. Nudged toward weak topics, with a little randomness.
function scored(pool, progress, now, rand) {
  const weakness = {}
  for (const t of new Set(pool.map((q) => q.topic))) {
    const qs = pool.filter((q) => q.topic === t)
    weakness[t] = qs.filter((q) => progress[q.id]?.rating !== 'solid').length / qs.length
  }
  return pool
    .map((q) => {
      const p = progress[q.id]
      let s
      if (!p) s = 3 + (UNSEEN_LEVEL_BONUS[q.difficulty] ?? 0)
      else if (isDue(p, now)) s = 5 + Math.min(overdueDays(p, now), 10) * 0.2 + (p.rating === 'missed' ? 0.5 : 0)
      else s = p.rating === 'solid' ? 0.1 : 1.2
      return { q, s: s + weakness[q.topic] + rand() * 0.5 }
    })
    .sort((a, b) => b.s - a.s)
}

export function buildQueue(questions, progress, { topic = 'all', size = 10, only = null, now = Date.now(), rand = Math.random } = {}) {
  if (only) return only
  const pool = questions.filter((q) => topic === 'all' || q.topic === topic)
  return scored(pool, progress, now, rand).slice(0, size).map((x) => x.q.id)
}

// Mock interviews should feel like a real loop: spread across topics first,
// then fill the remaining slots by priority.
export function buildMockQueue(questions, progress, { count = 5, topic = 'all', now = Date.now(), rand = Math.random } = {}) {
  const pool = questions.filter((q) => topic === 'all' || q.topic === topic)
  const ranked = scored(pool, progress, now, rand)
  if (topic !== 'all') return ranked.slice(0, count).map((x) => x.q.id)

  const picked = []
  const seen = new Set()
  for (const x of ranked) {
    if (picked.length >= count) break
    if (!seen.has(x.q.topic)) { seen.add(x.q.topic); picked.push(x.q.id) }
  }
  for (const x of ranked) {
    if (picked.length >= count) break
    if (!picked.includes(x.q.id)) picked.push(x.q.id)
  }
  return picked
}
