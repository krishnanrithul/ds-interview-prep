import { normalize } from '../hooks/useProgress'

const APP = 'DSInterviewPrep'

// Everything the app stores (progress, settings, theme, reminder) as JSON.
export function exportBackup() {
  const data = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue
    const raw = localStorage.getItem(key)
    try { data[key] = raw ? JSON.parse(raw) : raw } catch { data[key] = raw }
  }
  return JSON.stringify({ app: APP, version: 3, exportedAt: new Date().toISOString(), data }, null, 2)
}

// Returns an error message, or null on success. Caller should reload afterwards.
export function importBackup(json) {
  let parsed
  try { parsed = JSON.parse(json) } catch { return "That file isn't valid JSON." }
  if (typeof parsed !== 'object' || parsed === null) return "That doesn't look like a backup file."

  try {
    if (parsed.app === APP && parsed.data && typeof parsed.data === 'object') {
      localStorage.clear()
      for (const [k, v] of Object.entries(parsed.data)) {
        localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v))
      }
      return null
    }
    // Older exports: {version:2, progress:{...}} or a plain {id: true} map.
    const legacy = normalize(parsed)
    if (Object.keys(legacy).length === 0) return "That doesn't look like a DS Interview Prep backup."
    localStorage.setItem('progress-v2', JSON.stringify(legacy))
    return null
  } catch {
    return 'Could not write the backup to storage.'
  }
}

export function clearAll() {
  localStorage.clear()
}
