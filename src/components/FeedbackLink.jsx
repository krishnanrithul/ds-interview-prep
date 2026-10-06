import { Flag, MessageSquare } from 'lucide-react'
import { generalFeedbackUrl, questionFeedbackUrl } from '../lib/feedback'

// "Report a problem with this question": pre-filled with the question id so content fixes are easy to find.
export function ReportQuestion({ q, where, className = '' }) {
  return (
    <a href={questionFeedbackUrl(q, where)} className={`inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground ${className}`}>
      <Flag className="w-3.5 h-3.5" /> Report a problem with this question
    </a>
  )
}

export function SendFeedback({ className = '' }) {
  return (
    <a href={generalFeedbackUrl()} className={`inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground ${className}`}>
      <MessageSquare className="w-4 h-4" /> Send feedback
    </a>
  )
}
