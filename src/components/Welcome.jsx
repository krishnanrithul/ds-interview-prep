import { GraduationCap, Timer, Sparkles, X } from 'lucide-react'
import { getApiKey } from '../lib/grade'

// First-visit welcome on the Dashboard: what Saddle Point is and how to start. Dismissed once, reopenable from the footer.
export const WELCOME_KEY = 'ds-welcome-dismissed'
export const welcomeDismissed = () => {
  try {
    return localStorage.getItem(WELCOME_KEY) === '1'
  } catch {
    return false
  }
}
export const setWelcomeDismissed = (v) => {
  try {
    v ? localStorage.setItem(WELCOME_KEY, '1') : localStorage.removeItem(WELCOME_KEY)
  } catch {
    /* ignore */
  }
}

function Item({ icon: Icon, title, children }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 w-8 h-8 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
        <Icon className="w-4 h-4" />
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">{children}</p>
      </div>
    </div>
  )
}

export default function Welcome({ onStart, onMock, onSettings, onClose }) {
  const hasAI = !!getApiKey()
  return (
    <section className="anim-msg relative rounded-3xl border border-border bg-card p-6 sm:p-8" aria-labelledby="welcome-title">
      <button
        onClick={onClose}
        aria-label="Close the welcome"
        className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
      >
        <X className="w-4 h-4" />
      </button>
      <h2 id="welcome-title" className="font-serif text-2xl sm:text-3xl font-medium pr-8">
        Welcome to Saddle Point
      </h2>
      <p className="text-muted-foreground mt-2 max-w-2xl leading-relaxed">
        Interview practice, not a course. You answer a data science question, the interviewer pushes back with follow-ups, and you see how
        close you got to a senior answer.
      </p>
      <div className="grid gap-5 sm:grid-cols-3 mt-6">
        <Item icon={GraduationCap} title="Practice">
          One question at a time. Answer, take the follow-ups, then see your score, the key points you missed and a senior answer. Questions
          you miss come back sooner.
        </Item>
        <Item icon={Timer} title="Mock interview">
          A timed run of several questions. The interviewer reacts to what you say, and you get an overall grade at the end.
        </Item>
        <Item icon={Sparkles} title={hasAI ? 'Grading is on' : 'Turn on grading'}>
          {hasAI
            ? 'Your answers are checked for correctness, not just coverage, and the Mock interviewer reacts to you.'
            : 'The live score works for everyone. For grading on correctness and an interviewer that reacts, add your invite code (or your own API key) in Settings.'}
        </Item>
      </div>
      <div className="flex flex-wrap gap-3 mt-7">
        <button
          onClick={() => {
            onClose()
            onStart({ topic: 'all' })
          }}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-xl hover:opacity-90"
        >
          Start practicing
        </button>
        <button
          onClick={() => {
            onClose()
            onMock()
          }}
          className="px-5 py-2.5 rounded-xl border border-border font-semibold hover:bg-muted"
        >
          Try a mock interview
        </button>
        {!hasAI && (
          <button
            onClick={() => {
              onClose()
              onSettings()
            }}
            className="px-5 py-2.5 rounded-xl border border-border font-semibold hover:bg-muted"
          >
            Add an invite code
          </button>
        )}
      </div>
    </section>
  )
}
