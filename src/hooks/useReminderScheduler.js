import { useEffect, useRef } from 'react'
import { fireIfDue, scheduleReminder } from '../lib/reminders'

// Arms the daily reminder while the app is open, with a catch-up check
// whenever the tab returns to the foreground or the setting changes.
export function useReminderScheduler(getHasPracticedToday) {
  const getter = useRef(getHasPracticedToday)
  getter.current = getHasPracticedToday

  useEffect(() => {
    let cleanup = scheduleReminder(() => getter.current())
    const refresh = () => {
      if (document.visibilityState !== 'visible') return
      fireIfDue(getter.current())
      cleanup()
      cleanup = scheduleReminder(() => getter.current())
    }
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('ds-reminder-changed', refresh)
    return () => {
      cleanup()
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('ds-reminder-changed', refresh)
    }
  }, [])
}
