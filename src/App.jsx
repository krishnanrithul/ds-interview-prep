import { useState, useMemo, useCallback } from 'react'
import { BookOpen, LayoutDashboard, GraduationCap, Library as LibraryIcon, Settings as SettingsIcon } from 'lucide-react'
import { QUESTIONS } from './data/questions'
import { useProgress } from './hooks/useProgress'
import { useSettings } from './hooks/useSettings'
import { useReminderScheduler } from './hooks/useReminderScheduler'
import { buildQueue } from './lib/queue'
import Dashboard from './components/Dashboard'
import Practice from './components/Practice'
import Library from './components/Library'
import Settings from './components/Settings'
import './index.css'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'practice', label: 'Practice', icon: GraduationCap },
  { id: 'library', label: 'Library', icon: LibraryIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime() }

export default function App() {
  const { progress, rate } = useProgress()
  const { settings, update } = useSettings()
  const [view, setView] = useState('dashboard')
  const [session, setSession] = useState(null) // { ids, topic, key }
  const [status, setStatus] = useState(null)
  const byId = useMemo(() => Object.fromEntries(QUESTIONS.map((q) => [q.id, q])), [])

  const flash = useCallback((m) => { setStatus(m); setTimeout(() => setStatus(null), 3000) }, [])

  const practicedToday = Object.values(progress).filter((p) => p.last >= startOfToday()).length
  useReminderScheduler(() => Object.values(progress).some((p) => p.last >= startOfToday()))

  const start = ({ topic = 'all', only = null } = {}) => {
    setSession({ ids: buildQueue(QUESTIONS, progress, { topic, only, size: settings.sessionSize }), topic, key: Date.now() })
    setView('practice')
  }

  const go = (id) => {
    if (id === 'practice' && !session) return start()
    setView(id)
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 bg-card/90 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
          <div className="flex items-center gap-2.5 mr-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold hidden md:block">DS Interview Prep</span>
          </div>

          <nav className="flex gap-1 flex-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => go(id)}
                aria-label={label}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {view === 'dashboard' && <Dashboard progress={progress} settings={settings} practicedToday={practicedToday} onStart={start} />}
        {view === 'practice' && session && (
          <Practice
            key={session.key}
            ids={session.ids}
            byId={byId}
            onRate={rate}
            onExit={() => { setSession(null); setView('dashboard') }}
            onAgain={() => start({ topic: session.topic })}
          />
        )}
        {view === 'library' && <Library progress={progress} onPractice={(id) => start({ only: [id] })} />}
        {view === 'settings' && <Settings settings={settings} update={update} flash={flash} />}
      </main>

      {status && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 max-w-[90vw] px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium shadow-lg text-center">
          {status}
        </div>
      )}
    </div>
  )
}
