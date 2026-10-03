import { useState } from 'react'
import { TAG_BY_ID } from '../lib/tags'

// Subject tags are neutral; skill tags (what the interviewer is testing) carry the marker tint.
const KIND = {
  subject: 'bg-muted text-foreground/80',
  skill: 'bg-marker/20 text-foreground ring-1 ring-marker/60',
}

export function TagChip({ id, onClick, active }) {
  const t = TAG_BY_ID[id]
  if (!t) return null
  const cls = `inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
    active ? 'bg-foreground text-background' : KIND[t.kind]
  }`
  return onClick ? (
    <button onClick={() => onClick(id)} className={`${cls} hover:ring-1 hover:ring-foreground/40`} aria-pressed={active}>
      {t.label}
    </button>
  ) : (
    <span className={cls}>{t.label}</span>
  )
}

// A row of tag chips. Long lists collapse behind "+N" so a question with many tags stays tidy.
export default function TagChips({ tags = [], onTag, max = 5, className = '' }) {
  const [all, setAll] = useState(false)
  if (!tags.length) return null
  const shown = all ? tags : tags.slice(0, max)
  const hidden = tags.length - shown.length
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {shown.map((id) => <TagChip key={id} id={id} onClick={onTag} />)}
      {hidden > 0 && (
        <button onClick={() => setAll(true)} className="rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          +{hidden} more
        </button>
      )}
    </div>
  )
}
