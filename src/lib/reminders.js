// Daily "time to practice" reminder. Local-first, no push server: uses the Web
// Notifications API, so it only fires while the app is open. A timer is aimed at
// the next reminder hour, plus a catch-up check when the tab returns to focus.
export const REMINDER_ENABLED_KEY = 'ds-reminder-enabled'
export const REMINDER_HOUR_KEY = 'ds-reminder-hour'
const LAST_FIRED_KEY = 'ds-reminder-last-fired'
export const DEFAULT_REMINDER_HOUR = 19

export const isReminderSupported = () => typeof window !== 'undefined' && 'Notification' in window
export const isReminderEnabled = () => localStorage.getItem(REMINDER_ENABLED_KEY) === 'true'

export function getReminderHour() {
  const raw = Number(localStorage.getItem(REMINDER_HOUR_KEY))
  return Number.isInteger(raw) && raw >= 0 && raw <= 23 ? raw : DEFAULT_REMINDER_HOUR
}
export const setReminderHour = (h) => localStorage.setItem(REMINDER_HOUR_KEY, String(h))

export async function setReminderEnabled(enabled) {
  if (!enabled) { localStorage.setItem(REMINDER_ENABLED_KEY, 'false'); return false }
  if (!isReminderSupported()) return false
  let permission = Notification.permission
  if (permission === 'default') permission = await Notification.requestPermission()
  const ok = permission === 'granted'
  localStorage.setItem(REMINDER_ENABLED_KEY, ok ? 'true' : 'false')
  return ok
}

const todayKey = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`

function nextFireDelayMs(hour) {
  const now = new Date()
  const target = new Date(now)
  target.setHours(hour, 0, 0, 0)
  if (target <= now) target.setDate(target.getDate() + 1)
  return target.getTime() - now.getTime()
}

function show() {
  if (Notification.permission !== 'granted') return
  try {
    new Notification('DS Interview Prep', {
      body: "You haven't practiced today. A 10-minute session keeps it fresh.",
      tag: 'ds-daily-reminder',
    })
    localStorage.setItem(LAST_FIRED_KEY, todayKey())
  } catch (err) { console.warn('Reminder failed', err) }
}

export function fireIfDue(hasPracticedToday) {
  if (!isReminderEnabled() || !isReminderSupported() || hasPracticedToday) return
  if (localStorage.getItem(LAST_FIRED_KEY) === todayKey()) return
  if (new Date().getHours() >= getReminderHour()) show()
}

export function scheduleReminder(getHasPracticedToday) {
  if (!isReminderEnabled() || !isReminderSupported()) return () => {}
  let timer
  const arm = () => {
    window.clearTimeout(timer)
    timer = window.setTimeout(() => { fireIfDue(getHasPracticedToday()); arm() }, nextFireDelayMs(getReminderHour()))
  }
  arm()
  return () => window.clearTimeout(timer)
}
