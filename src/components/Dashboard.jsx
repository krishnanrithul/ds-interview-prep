import { ArrowRight, Play, CalendarDays } from 'lucide-react'
import { QUESTIONS } from '../data/questions'
import { summarize } from '../lib/queue'
import { dot, RATINGS } from '../lib/topics'

function StackedBar({ counts, total }) {
  const seg = (n, cls) => n > 0 && <div className={cls} style={{ width: `${(n / total) * 100}%` }} />
  return (
    <div className="flex h-2 w-full rounded-full overflow-hidden bg-muted">
      {seg(counts.solid, RATINGS.solid.bar)}
      {seg(counts.shaky, RATINGS.shaky.bar)}
      {seg(counts.missed, RATINGS.missed.bar)}
    </div>
  )
}

export default function Dashboard({ progress, settings, practicedToday, onStart }) {
  const overall = summarize(QUESTIONS, progress)
  const topics = [...new Set(QUESTIONS.map((q) => q.topic))]
  const pickCount = Math.min(settings.sessionSize, QUESTIONS.length)
  const goalPct = Math.min(100, Math.round((practicedToday / settings.dailyGoal) * 100))

  let daysLeft = null
  if (settings.interviewDate) {
    const start = new Date(); start.setHours(0, 0, 0, 0)
    daysLeft = Math.ceil((new Date(`${settings.interviewDate}T00:00:00`) - start) / 86400000)
  }

  const nextTopic = [...topics]
    .map((t) => {
      const qs = QUESTIONS.filter((q) => q.topic === t)
      return { t, weak: qs.filter((q) => progress[q.id]?.rating !== 'solid').length / qs.length }
    })
    .sort((a, b) => b.weak - a.weak)[0]

  const stats = [
    { label: 'Solid', n: overall.solid, cls: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Shaky', n: overall.shaky, cls: 'text-amber-600 dark:text-amber-400' },
    { label: 'Missed', n: overall.missed, cls: 'text-rose-600 dark:text-rose-400' },
    { label: 'Unseen', n: overall.unseen, cls: 'text-muted-foreground' },
  ]

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-primary text-primary-foreground p-7 sm:p-9 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-1">
          <p className="text-primary-foreground/70 text-sm font-medium">Today's session</p>
          {daysLeft !== null && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/15 rounded-full px-3 py-1">
              <CalendarDays className="w-3.5 h-3.5" />
              {daysLeft > 1 ? `${daysLeft} days to interview` : daysLeft === 1 ? 'Interview tomorrow' : daysLeft === 0 ? 'Interview today' : 'Interview passed'}
            </span>
          )}
        </div>
        <h2 className="text-2xl sm:text-3xl font-semibold leading-tight mb-2">
          {overall.solid === QUESTIONS.length
            ? 'Everything is solid. Keep it fresh with a review.'
            : `${pickCount} questions picked for you`}
        </h2>
        <p className="text-primary-foreground/80 text-sm sm:text-base mb-6 max-w-xl">
          Answer first, then face the follow-ups the way an interviewer would push. Rate yourself
          honestly. Missed questions come back sooner.
          {nextTopic && nextTopic.weak > 0 && (
            <> Weakest area right now: <span className="font-semibold text-primary-foreground">{nextTopic.t}</span>.</>
          )}
        </p>
        <button
          onClick={() => onStart({ topic: 'all' })}
          className="inline-flex items-center gap-2 bg-white text-indigo-700 font-semibold px-5 py-3 rounded-xl hover:bg-indigo-50 transition-colors"
        >
          <Play className="w-4 h-4 fill-current" />
          Start session
        </button>
      </section>

      <section className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Daily goal</h3>
          <span className="text-sm text-muted-foreground tabular-nums">
            {practicedToday} / {settings.dailyGoal} questions today
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${goalPct}%` }} />
        </div>
        {practicedToday >= settings.dailyGoal && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-3 font-medium">Goal reached. Anything more is a bonus.</p>
        )}
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
            <p className={`text-3xl font-semibold tabular-nums ${s.cls}`}>{s.n}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </section>

      <section>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Topics</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {topics.map((t) => {
            const qs = QUESTIONS.filter((q) => q.topic === t)
            const c = summarize(qs, progress)
            return (
              <div key={t} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${dot(t)}`} />
                    <h4 className="font-semibold">{t}</h4>
                  </div>
                  <span className="text-sm text-muted-foreground tabular-nums">{c.solid}/{qs.length} solid</span>
                </div>
                <StackedBar counts={c} total={qs.length} />
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-muted-foreground">
                    {c.unseen} unseen · {c.shaky} shaky · {c.missed} missed
                  </p>
                  <button
                    onClick={() => onStart({ topic: t })}
                    className="text-sm font-medium text-primary hover:text-primary/80 inline-flex items-center gap-1"
                  >
                    Practice <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
