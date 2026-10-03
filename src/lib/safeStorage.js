// A corrupted or truncated localStorage value must never throw during render.
export function safeParse(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null || raw === '') return fallback
    return JSON.parse(raw)
  } catch (err) {
    console.error(`Corrupted localStorage key "${key}", resetting to default.`, err)
    try { localStorage.removeItem(key) } catch { /* ignore */ }
    return fallback
  }
}
