// Junior vs senior answer side by side, plus the key insight.
export default function AnswerLadder({ q }) {
  const hasLadder = q.junior_answer || q.senior_answer
  return (
    <div className="space-y-3">
      {hasLadder && (
        <div className="grid gap-3 sm:grid-cols-2 items-start">
          {q.junior_answer && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10 p-4">
              <p className="text-sm font-semibold text-rose-700 dark:text-rose-300 mb-1.5">
                A typical junior answer
              </p>
              <p className="text-sm leading-relaxed">{q.junior_answer}</p>
            </div>
          )}
          {q.senior_answer && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10 p-4">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-1.5">
                A senior answer
              </p>
              <p className="text-sm leading-relaxed">{q.senior_answer}</p>
            </div>
          )}
        </div>
      )}
      {q.key_insight && (
        <div className="rounded-xl border border-marker/60 bg-marker/20 p-4">
          <p className="text-sm font-semibold mb-1.5">Key insight</p>
          <p className="text-sm leading-relaxed">{q.key_insight}</p>
        </div>
      )}
    </div>
  )
}
