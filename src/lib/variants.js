import { safeParse } from './safeStorage'

// Follow-up variants: each follow-up's own text is option 0, and any entries in
// `variants` are options 1..n. Every time a question is shown we pick one option per
// follow-up, avoiding the one shown last time so repeat practice doesn't feel memorized.
// The last pick per question lives in localStorage, separate from your saved answers,
// so it's remembered even when you don't write anything.
const KEY = 'ds-variant-seen'

export const options = (fu) => [fu.text, ...(fu.variants || []).map((v) => v.text)]

export function pickVariants(q, rand = Math.random) {
  const last = safeParse(KEY, {})[q.id] || []
  return q.follow_ups.map((fu, k) => {
    const count = options(fu).length
    if (count === 1) return 0
    const pool = [...Array(count).keys()].filter((j) => j !== last[k])
    return pool[Math.floor(rand() * pool.length)]
  })
}

export function markSeen(id, picks) {
  try {
    const seen = safeParse(KEY, {})
    seen[id] = picks
    localStorage.setItem(KEY, JSON.stringify(seen))
  } catch { /* storage unavailable: variants still work, just without avoiding repeats */ }
}

export const followUpText = (q, picks, k) => options(q.follow_ups[k])[picks?.[k] ?? 0] ?? q.follow_ups[k].text
