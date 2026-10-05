import { useState, useMemo, useCallback } from 'react'
import { LayoutDashboard, GraduationCap, Timer, BarChart3, Library as LibraryIcon, Settings as SettingsIcon } from 'lucide-react'
import { QUESTIONS } from './data/questions'
import { useProgress } from './hooks/useProgress'
import { useSettings } from './hooks/useSettings'
import { useActivity } from './hooks/useActivity'
import { useNotes } from './hooks/useNotes'
import { useReminderScheduler } from './hooks/useReminderScheduler'
import { buildQueue } from './lib/queue'
import { countToday } from './lib/streak'
import Dashboard from './components/Dashboard'
import Practice from './components/Practice'
import Mock from './components/Mock'
import Library from './components/Library'
import Insights from './components/Insights'
import Logo from './components/Logo'
import Settings from './components/Settings'
import './index.css'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'practice', label: 'Practice', icon: GraduationCap },
  { id: 'mock', label: 'Mock', icon: Timer },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
  { id: 'library', label: 'Library', icon: LibraryIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

export default function App() {
  const { progress, rate } = useProgress()
  const { settings, update } = useSettings()
  const { activity, record } = useActivity()
  const { notes, addAttempt } = useNotes()
  const [view, setView] = useState('dashboard')
  const [session, setSession] = useState(null) // { ids, topic, key }
  const [status, setStatus] = useState(null)
  const [libraryTags, setLibraryTags] = useState([])
  const byId = useMemo(() => Object.fromEntries(QUESTIONS.map((q) => [q.id, q])), [])

  const flash = useCallback((m) => { setStatus(m); setTimeout(() => setStatus(null), 3000) }, [])

  useReminderScheduler(() => countToday(activity) > 0)

  // One place that records a rated question: schedule, activity (streak/goal), and your answer.
  const handleRate = useCallback((id, rating, answer, source = 'practice', scored = null) => {
    rate(id, rating)
    record(1)
    addAttempt(id, answer, rating, source, scored)
  }, [rate, record, addAttempt])

  const saveMock = useCallback((results) => {
    results.forEach((r) => handleRate(r.id, r.rating, r.answer, 'mock', r.scored))
    flash(results.length ? `Saved ${results.length} result${results.length === 1 ? '' : 's'}. They'll shape your next sessions.` : 'Nothing was rated, so nothing was saved')
  }, [handleRate, flash])

  const start = ({ topic = 'all', only = null } = {}) => {
    setSession({ ids: buildQueue(QUESTIONS, progress, { topic, only, size: settings.sessionSize }), topic, key: Date.now() })
    setView('practice')
  }

  const openTag = (id) => { setLibraryTags([id]); setView('library') }

  const go = (id) => {
    if (id === 'practice' && !session) return start()
    setView(id)
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 bg-card/90 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
          <div className="flex items-center gap-2.5 mr-2">
            <Logo />
            <span className="font-serif font-semibold text-lg hidden md:block">Saddle Point</span>
          </div>

          <nav className="flex gap-1 flex-1 h-full">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => go(id)}
                aria-label={label}
                aria-current={view === id ? 'page' : undefined}
                className={`relative flex items-center gap-2 px-3 text-sm font-medium transition-colors ${
                  view === id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
                <span className={`absolute left-2 right-2 bottom-0 h-[3px] rounded-t-full bg-marker origin-left transition-transform duration-300 ${view === id ? 'scale-x-100' : 'scale-x-0'}`} />
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {view === 'dashboard' && (
          <Dashboard progress={progress} settings={settings} activity={activity} onStart={start} onMock={() => setView('mock')} />
        )}

        {/* Practice and Mock stay mounted while hidden so switching tabs doesn't lose your place. */}
        {session && (
          <div className={view === 'practice' ? '' : 'hidden'}>
            <Practice
              key={session.key}
              ids={session.ids}
              byId={byId}
              notes={notes}
              active={view === 'practice'}
              onRate={handleRate}
              onTag={openTag}
              onExit={() => { setSession(null); setView('dashboard') }}
              onAgain={() => start({ topic: session.topic })}
              onRedo={(ids) => start({ topic: session.topic, only: ids })}
            />
          </div>
        )}
        <div className={view === 'mock' ? '' : 'hidden'}>
          <Mock progress={progress} byId={byId} active={view === 'mock'} onSave={saveMock} />
        </div>

        {view === 'insights' && <Insights progress={progress} notes={notes} onStart={start} onTag={openTag} />}
        {view === 'library' && <Library progress={progress} notes={notes} onPractice={(id) => start({ only: [id] })} tags={libraryTags} setTags={setLibraryTags} onPracticeMany={(ids) => start({ only: ids })} />}
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
