import { useState, useEffect, useCallback } from 'react'
import { safeParse } from '../lib/safeStorage'

const KEY = 'ds-settings'
export const DEFAULT_SETTINGS = { sessionSize: 10, dailyGoal: 5, interviewDate: null }

export function useSettings() {
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, ...safeParse(KEY, {}) }))
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(settings)) }, [settings])
  const update = useCallback((patch) => setSettings((s) => ({ ...s, ...patch })), [])
  return { settings, update }
}
