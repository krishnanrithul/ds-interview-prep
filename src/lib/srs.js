// Simple spaced repetition. Missed returns tomorrow, Shaky in 2 days, and
// consecutive Solids stretch out: 4, 10, 21, then 45 days.
const DAY = 86400000
const SOLID_STEPS = [4, 10, 21, 45]

export const startOfDay = (t = Date.now()) => {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export const endOfDay = (t = Date.now()) => {
  const d = new Date(t)
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

export function addDays(t, n) {
  const d = new Date(t)
  d.setDate(d.getDate() + n)
  return startOfDay(d.getTime())
}

// Returns the new consecutive-solid streak and the next due date (start of day).
export function schedule(rating, prevStreak = 0, now = Date.now()) {
  if (rating === 'missed') return { streak: 0, due: addDays(now, 1) }
  if (rating === 'shaky') return { streak: 0, due: addDays(now, 2) }
  const streak = prevStreak + 1
  return { streak, due: addDays(now, SOLID_STEPS[Math.min(streak - 1, SOLID_STEPS.length - 1)]) }
}

export const isDue = (entry, now = Date.now()) => !!entry && entry.due <= endOfDay(now)

export function overdueDays(entry, now = Date.now()) {
  return Math.max(0, Math.round((startOfDay(now) - entry.due) / DAY))
}

// "today", "tomorrow", "in 4 days", or "2 days overdue"
export function describeDue(entry, now = Date.now()) {
  if (!entry) return null
  const diff = Math.round((entry.due - startOfDay(now)) / DAY)
  if (diff < 0) return `${-diff} day${diff === -1 ? '' : 's'} overdue`
  if (diff === 0) return 'due today'
  if (diff === 1) return 'due tomorrow'
  return `due in ${diff} days`
}
