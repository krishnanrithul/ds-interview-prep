import { useEffect, useState } from 'react'
import { GLOSSARY } from '../lib/glossary'
import { tagLabel } from '../lib/tags'
import Explainer from './Explainer'

// Terms that appear in the question itself, with a short definition on tap.
// Deliberately separate from topic tags, which can give away the answer and only show in the debrief.
export default function KeyTerms({ terms = [], onTag, onDeepChange }) {
  const [openId, setOpenId] = useState(null)
  const [deepId, setDeepId] = useState(null) // term whose interactive explainer is open
  useEffect(() => { onDeepChange?.(!!deepId); return () => onDeepChange?.(false) }, [deepId])
  const list = terms.map((id) => GLOSSARY[id]).filter(Boolean)
  if (!list.length) return null
  const open = list.find((t) => t.id === openId)
  return (
    <div className="mt-4">
      <p className="text-sm text-muted-foreground mb-2">Key terms in this question</p>
      <div className="flex flex-wrap gap-1.5">
        {list.map((t) => (
          <button
            key={t.id}
            onClick={() => { setOpenId(openId === t.id ? null : t.id); setDeepId(null) }}
            aria-expanded={openId === t.id}
            className={`rounded-full px-3 py-1 text-sm font-medium border transition-colors ${
              openId === t.id ? 'bg-foreground text-background border-foreground' : 'bg-card text-foreground/90 border-border hover:border-foreground/40'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {open && (
        <div key={open.id} className="anim-msg mt-3 rounded-xl border border-border bg-card p-4 text-sm leading-relaxed" role="region" aria-label={`${open.label} definition`}>
          <p className="font-semibold mb-1">{open.label}</p>
          <p className="text-foreground/85">{open.definition}</p>
          {open.deeper && deepId !== open.id && (
            <button onClick={() => setDeepId(open.id)} className="mt-3 mr-4 inline-flex items-center rounded-xl bg-marker px-4 py-2 text-sm font-semibold text-[hsl(173_62%_12%)] hover:brightness-95 active:scale-[.98] transition">
              Go deeper
            </button>
          )}
          {open.tag && onTag && (
            <button onClick={() => onTag(open.tag)} className="mt-3 text-sm font-medium text-primary hover:opacity-80 underline underline-offset-2">
              More questions on {tagLabel(open.tag)}
            </button>
          )}
        </div>
      )}
      {open?.deeper && deepId === open.id && <div className="mt-3"><Explainer id={open.deeper} onClose={() => setDeepId(null)} /></div>}
    </div>
  )
}
