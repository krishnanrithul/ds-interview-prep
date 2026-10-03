import { useState, useEffect, useCallback } from 'react'
import { safeParse } from '../lib/safeStorage'
import { schedule } from '../lib/srs'

const KEY = 'progress-v2'
const VALID = ['missed', 'shaky', 'solid']

// Accepts current/older exports ({progress}), or the very first {id: true} map.
// Fills in streak and due date for entries saved before spaced repetition existed.
export function normalize(data) {
  const src = data?.progress ?? data?.studied ?? data ?? {}
  const out = {}
  for (const [id, v] of Object.entries(src)) {
    if (v === true) {
      const now = Date.now()
      out[id] = { rating: 'shaky', last: now, count: 1, ...schedule('shaky', 0, now) }
    } else if (v && VALID.includes(v.rating)) {
      const last = v.last || Date.now()
      const fallback = schedule(v.rating, 0, last)
      out[id] = {
        rating: v.rating,
        last,
        count: v.count || 1,
        streak: Number.isFinite(v.streak) ? v.streak : fallback.streak,
        due: Number.isFinite(v.due) ? v.due : fallback.due,
      }
    }
  }
  return out
}

function load() {
  const current = safeParse(KEY, null)
  if (current) return normalize(current)
  return normalize(safeParse('studied', {})) // migrate the very first version
}

export function useProgress() {
  const [progress, setProgress] = useState(load)

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(progress)) }, [progress])

  const rate = useCallback((id, rating) => {
    setProgress((p) => {
      const now = Date.now()
      const prev = p[id]
      return {
        ...p,
        [id]: { rating, last: now, count: (prev?.count || 0) + 1, ...schedule(rating, prev?.streak || 0, now) },
      }
    })
  }, [])

  return { progress, rate }
}
