// Picks what to study next: missed > unseen > shaky > solid, nudged toward
// weak topics and toward questions you haven't touched in a while.
export function buildQueue(questions, progress, { topic = 'all', size = 10, only = null } = {}) {
  if (only) return only
  const pool = questions.filter((q) => topic === 'all' || q.topic === topic)

  const weakness = {}
  for (const t of new Set(pool.map((q) => q.topic))) {
    const qs = pool.filter((q) => q.topic === t)
    weakness[t] = qs.filter((q) => progress[q.id]?.rating !== 'solid').length / qs.length
  }

  const now = Date.now()
  return pool
    .map((q) => {
      const p = progress[q.id]
      let s = !p ? 3 : p.rating === 'missed' ? 4 : p.rating === 'shaky' ? 2 : 0.5
      if (p) s += Math.min((now - p.last) / 86400000, 14) * 0.1
      s += weakness[q.topic] + Math.random() * 0.5
      return { id: q.id, s }
    })
    .sort((a, b) => b.s - a.s)
    .slice(0, size)
    .map((x) => x.id)
}

export function summarize(questions, progress) {
  const out = { solid: 0, shaky: 0, missed: 0, unseen: 0 }
  for (const q of questions) out[progress[q.id]?.rating || 'unseen']++
  return out
}
