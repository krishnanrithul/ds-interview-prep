import { useState, useEffect, useCallback } from 'react'
import { safeParse } from '../lib/safeStorage'

const KEY = 'ds-notes'
const MAX_ATTEMPTS = 5
const MAX_CHARS = 5000

// Your own answers per question: { [id]: [{ ts, text, rating, source }] }, newest last.
export function useNotes() {
  const [notes, setNotes] = useState(() => safeParse(KEY, {}))
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(notes)) }, [notes])

  const addAttempt = useCallback((id, text, rating, source = 'practice') => {
    const clean = (text || '').trim().slice(0, MAX_CHARS)
    if (!clean) return
    setNotes((n) => ({
      ...n,
      [id]: [...(n[id] || []), { ts: Date.now(), text: clean, rating, source }].slice(-MAX_ATTEMPTS),
    }))
  }, [])

  return { notes, addAttempt }
}
