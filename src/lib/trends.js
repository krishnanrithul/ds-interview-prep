// Score trends from saved attempts ({ ts, score }, the last 5 kept per question).
const DAY = 864e5
const WEEK = 7 * DAY

// Monday 00:00 local time of the week containing ts.
export function weekStart(ts) {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d.getTime()
}

const scored = (notes, ids) => ids.flatMap((id) => (notes?.[id] || []).filter((a) => typeof a.score === 'number' && a.ts))

// Average score of every scored attempt in each of the last `weeks` weeks, oldest first ({ start, avg, n }).
// A week with fewer than `minN` scored answers gets no average, so one lucky answer doesn't make a point.
export function weeklyScores(notes, ids, weeks = 8, now = Date.now(), minN = 2) {
  const first = weekStart(now) - (weeks - 1) * WEEK
  const b = Array.from({ length: weeks }, (_, i) => ({ start: first + i * WEEK, sum: 0, n: 0 }))
  scored(notes, ids).forEach((a) => {
    const i = Math.round((weekStart(a.ts) - first) / WEEK) // round absorbs daylight-saving shifts
    if (i >= 0 && i < weeks) {
      b[i].sum += a.score
      b[i].n++
    }
  })
  return b.map(({ start, sum, n }) => ({ start, n, avg: n >= minN ? Math.round(sum / n) : null }))
}

// Change between the two most recent weeks with at least `minN` scored answers each, or null.
export function latestChange(weeks, minN = 3) {
  const w = weeks.filter((x) => x.avg !== null && x.n >= minN)
  if (w.length < 2) return null
  return { delta: w[w.length - 1].avg - w[w.length - 2].avg, from: w[w.length - 2].start, to: w[w.length - 1].start }
}

// Direction for a topic: last 14 days against the 28 days before, each with at least 3 scored attempts.
export function recentTrend(notes, ids, now = Date.now()) {
  const xs = scored(notes, ids)
  const recent = xs.filter((a) => a.ts > now - 14 * DAY)
  const prior = xs.filter((a) => a.ts <= now - 14 * DAY && a.ts > now - 42 * DAY)
  if (recent.length < 3 || prior.length < 3) return null
  const avg = (ys) => ys.reduce((s, a) => s + a.score, 0) / ys.length
  return Math.round(avg(recent) - avg(prior))
}
