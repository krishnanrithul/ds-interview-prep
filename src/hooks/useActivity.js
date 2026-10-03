import { useState, useEffect, useCallback } from 'react'
import { safeParse } from '../lib/safeStorage'
import { dayKey } from '../lib/streak'

const KEY = 'ds-activity'

export function useActivity() {
  const [activity, setActivity] = useState(() => safeParse(KEY, {}))
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(activity)) }, [activity])
  const record = useCallback((n = 1) => {
    const k = dayKey()
    setActivity((a) => ({ ...a, [k]: (a[k] || 0) + n }))
  }, [])
  return { activity, record }
}
