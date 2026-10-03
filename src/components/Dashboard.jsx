import { Play, CalendarDays, Flame, Timer, RotateCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import MasteryMap from './MasteryMap'
import { QUESTIONS } from '../data/questions'
import { summarize, countDue } from '../lib/queue'
import { currentStreak, bestStreak, countToday } from '../lib/streak'

export default function Dashboard({ progress, settings, activity, onStart, onMock }) {
  const overall = summarize(QUESTIONS, progress)
  const topics = [...new Set(QUESTIONS.map((q) => q.topic))]
  const due = countDue(QUESTIONS, progress)
  const today = countToday(activity)
  const streak = currentStreak(activity)
  const best = bestStreak(activity)
  const goalPct = Math.min(100, Math.round((today / settings.dailyGoal) * 100))
  const [shownPct, setShownPct] = useState(0)
  useEffect(() => { const t = setTimeout(() => setShownPct(goalPct), 250); return () => clearTimeout(t) }, [goalPct])

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

  const heading =
    due > 0 ? `${due} ${due === 1 ? 'question is' : 'questions are'} due for review`
    : overall.unseen > 0 ? `${Math.min(settings.sessionSize, overall.unseen)} new questions to try`
    : 'All caught up. Try a mock interview to stay sharp.'

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-ink text-ink-foreground p-7 sm:p-10 border border-white/5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <p className="text-ink-foreground/70 text-sm">Today's session</p>
          {daysLeft !== null && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/10 rounded-full px-3 py-1">
              <CalendarDays className="w-3.5 h-3.5" />
              {daysLeft > 1 ? `${daysLeft} days to interview` : daysLeft === 1 ? 'Interview tomorrow' : daysLeft === 0 ? 'Interview today' : 'Interview passed'}
            </span>
          )}
        </div>
        <h2 className="font-serif text-3xl sm:text-[2.6rem] font-medium leading-[1.15] mb-4 max-w-2xl">{heading}</h2>
        <p className="text-ink-foreground/75 mb-8 max-w-xl leading-relaxed">
          Answer out loud or in writing, then take the follow-ups the way an interviewer would push them. Rate yourself honestly. Missed questions come back tomorrow.
          {nextTopic && nextTopic.weak > 0 && <> Your weakest area right now is {nextTopic.t}.</>}
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onStart({ topic: 'all' })}
            className="inline-flex items-center gap-2 bg-marker text-[hsl(173_62%_12%)] font-semibold px-5 py-3 rounded-xl hover:brightness-95 active:scale-[.98] transition"
          >
            <Play className="w-4 h-4 fill-current" />
            Start session
          </button>
          <button
            onClick={onMock}
            className="inline-flex items-center gap-2 border border-white/25 text-ink-foreground font-semibold px-5 py-3 rounded-xl hover:bg-white/10 transition-colors"
          >
            <Timer className="w-4 h-4" />
            Mock interview
          </button>
        </div>
      </section>

      <section className="grid sm:grid-cols-3 rounded-2xl border border-border bg-card divide-y sm:divide-y-0 sm:divide-x divide-border">
        <div className="p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Flame className={`w-4 h-4 ${streak > 0 ? 'text-orange-500' : ''}`} /> Streak
          </div>
          <p className="text-3xl font-semibold tabular-nums">{streak} <span className="text-base font-medium text-muted-foreground">{streak === 1 ? 'day' : 'days'}</span></p>
          <p className="text-xs text-muted-foreground mt-1">
            {streak === 0 ? 'Practice today to start one' : today === 0 ? 'Practice today to keep it going' : `Best: ${Math.max(best, streak)} ${Math.max(best, streak) === 1 ? 'day' : 'days'}`}
          </p>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <RotateCw className="w-4 h-4" /> Due for review
          </div>
          <p className="text-3xl font-semibold tabular-nums">{due}</p>
          <p className="text-xs text-muted-foreground mt-1">{due === 0 ? 'Nothing due today' : 'Included first in your next session'}</p>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
            <span>Daily goal</span>
            <span className="tabular-nums">{today} of {settings.dailyGoal}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden mt-3">
            <div className="h-full bg-primary rounded-full bar-grow" style={{ width: `${shownPct}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {today >= settings.dailyGoal ? 'Goal reached. Anything more is a bonus.' : `${settings.dailyGoal - today} to go today`}
          </p>
        </div>
      </section>

      <MasteryMap progress={progress} onStart={onStart} />
    </div>
  )
}
