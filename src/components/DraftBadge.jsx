// Shown on questions that haven't been reviewed by the author yet (draft: true in questions.json).
export default function DraftBadge({ q }) {
  if (!q.draft) return null
  return (
    <span
      title="Not yet reviewed by the author"
      className="px-2 py-0.5 rounded-md ring-1 ring-border text-muted-foreground font-medium"
    >
      Draft
    </span>
  )
}
