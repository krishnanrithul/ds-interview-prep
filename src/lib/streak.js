// Activity log: { 'YYYY-MM-DD': questionsPracticed }. Powers the daily goal and streak.
const DAY = 86400000

export const dayKey = (t = Date.now()) => {
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const parseKey = (k) => {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, m - 1, d, 12).getTime()
}

export const countToday = (activity, now = Date.now()) => activity[dayKey(now)] || 0

// Consecutive days with activity, ending today. If you haven't practiced yet today,
// the streak is still alive as long as yesterday had activity.
export function currentStreak(activity, now = Date.now()) {
  const d = new Date(now)
  d.setHours(12, 0, 0, 0)
  if (!activity[dayKey(d.getTime())]) d.setDate(d.getDate() - 1)
  let n = 0
  while (activity[dayKey(d.getTime())]) {
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}

export function bestStreak(activity) {
  const days = Object.keys(activity).filter((k) => activity[k] > 0).sort()
  let best = 0
  let run = 0
  let prev = null
  for (const k of days) {
    const t = parseKey(k)
    run = prev !== null && Math.round((t - prev) / DAY) === 1 ? run + 1 : 1
    best = Math.max(best, run)
    prev = t
  }
  return best
}
