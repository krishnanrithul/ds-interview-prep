import { Flag, MessageSquare } from 'lucide-react'
import { generalFeedbackUrl, questionFeedbackUrl } from '../lib/feedback'

// "Report a problem with this question": pre-filled with the question id so content fixes are easy to find.
// In Practice and Mock, unreviewed questions get a short note here instead of a Draft badge in the header.
// The Library keeps its Draft badge, so it passes showDraftNote={false}.
export function ReportQuestion({ q, where, className = '', showDraftNote = true }) {
  return (
    <span className={`inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground ${className}`}>
      {showDraftNote && q.draft && (
        <span className="italic">New question, not yet checked by the author. Flag anything that looks off.</span>
      )}
      <a
        href={questionFeedbackUrl(q, where)}
        className="inline-flex items-center gap-1.5 hover:text-foreground [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:py-2"
      >
        <Flag className="w-3.5 h-3.5" aria-hidden="true" /> Report a problem with this question
      </a>
    </span>
  )
}

export function SendFeedback({ className = '' }) {
  return (
    <a
      href={generalFeedbackUrl()}
      className={`inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground ${className}`}
    >
      <MessageSquare className="w-4 h-4" aria-hidden="true" /> Send feedback
    </a>
  )
}
