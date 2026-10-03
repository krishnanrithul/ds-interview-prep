import { useState, useEffect, useCallback } from 'react'
import { safeParse } from '../lib/safeStorage'

const KEY = 'progress-v2'
const VALID = ['missed', 'shaky', 'solid']

// Accepts v2/v3 exports ({progress}), or the old {id: true} map.
export function normalize(data) {
  const src = data?.progress ?? data?.studied ?? data ?? {}
  const out = {}
  for (const [id, v] of Object.entries(src)) {
    if (v === true) out[id] = { rating: 'shaky', last: Date.now(), count: 1 }
    else if (v && VALID.includes(v.rating)) {
      out[id] = { rating: v.rating, last: v.last || Date.now(), count: v.count || 1 }
    }
  }
  return out
}

function load() {
  const v2 = safeParse(KEY, null)
  if (v2) return normalize(v2)
  return normalize(safeParse('studied', {})) // migrate the very first version
}

export function useProgress() {
  const [progress, setProgress] = useState(load)

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(progress)) }, [progress])

  const rate = useCallback((id, rating) => {
    setProgress((p) => ({ ...p, [id]: { rating, last: Date.now(), count: (p[id]?.count || 0) + 1 } }))
  }, [])

  return { progress, rate }
}
