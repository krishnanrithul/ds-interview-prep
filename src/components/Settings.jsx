import { useEffect, useRef, useState } from 'react'
import { Minus, Plus, Sun, Moon, Monitor, Download, Upload, Trash2, Bell, X, KeyRound } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { exportBackup, importBackup, clearAll } from '../lib/backup'
import {
  getReminderHour, isReminderEnabled, isReminderSupported, setReminderEnabled, setReminderHour,
} from '../lib/reminders'
import ConfirmDialog from './ConfirmDialog'
import { getApiKey, setApiKey } from '../lib/grade'

const formatHour = (h) => `${h % 12 === 0 ? 12 : h % 12}:00 ${h < 12 ? 'AM' : 'PM'}`

function Stepper({ value, onChange, min, max }) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="Decrease"
        className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
      >
        <Minus size={16} />
      </button>
      <span className="text-2xl font-bold w-10 text-center tabular-nums">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        aria-label="Increase"
        className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
      >
        <Plus size={16} />
      </button>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="text-sm font-semibold text-muted-foreground mb-3">{title}</h2>
      <div className="bg-card border border-border rounded-2xl divide-y divide-border">{children}</div>
    </section>
  )
}

function Row({ label, hint, children }) {
  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div className="min-w-0">
        <p className="font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange, disabled, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-40 ${checked ? 'bg-primary' : 'bg-muted'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  )
}

const buttonCls = 'inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors'

export default function Settings({ settings, update, flash }) {
  const { theme, setTheme } = useTheme()

  // Numeric settings use a draft with Save/Cancel, like vape-ease-journey.
  const [draft, setDraft] = useState(settings)
  useEffect(() => setDraft(settings), [settings])
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings)

  const save = () => { update(draft); flash('Settings saved') }

  // reminders
  const supported = isReminderSupported()
  const [reminderOn, setReminderOn] = useState(isReminderEnabled())
  const [hour, setHour] = useState(getReminderHour())
  const changed = () => window.dispatchEvent(new Event('ds-reminder-changed'))

  const toggleReminder = async (next) => {
    const enabled = await setReminderEnabled(next)
    setReminderOn(enabled)
    changed()
    if (next && !enabled) flash('Notifications are blocked for this site. Allow them in browser settings.')
    else flash(enabled ? `Daily reminder on at ${formatHour(hour)}` : 'Daily reminder off')
  }

  // AI feedback: the key stays in this browser and is sent only to Anthropic
  const [savedKey, setSavedKey] = useState(getApiKey())
  const [keyDraft, setKeyDraft] = useState('')
  const saveKey = () => {
    const k = keyDraft.trim()
    if (!k) return
    setApiKey(k); setSavedKey(k); setKeyDraft('')
    flash('API key saved in this browser')
  }
  const removeKey = () => { setApiKey(''); setSavedKey(''); flash('API key removed') }

  // data
  const fileRef = useRef(null)
  const [pendingImport, setPendingImport] = useState(null)
  const [confirmClear, setConfirmClear] = useState(false)

  const handleExport = () => {
    const blob = new Blob([exportBackup()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ds-interview-prep-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    flash('Backup downloaded')
  }

  const confirmImport = () => {
    const error = importBackup(pendingImport)
    setPendingImport(null)
    if (error) return flash(`Import failed: ${error}`)
    window.location.reload() // every hook re-hydrates from restored storage
  }

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'Auto', icon: Monitor },
  ]
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <Section title="Study">
        <Row label="Questions per session" hint="How many questions each practice session contains">
          <Stepper value={draft.sessionSize} min={3} max={30} onChange={(v) => setDraft({ ...draft, sessionSize: v })} />
        </Row>
        <Row label="Daily goal" hint="Questions you want to practice each day">
          <Stepper value={draft.dailyGoal} min={1} max={30} onChange={(v) => setDraft({ ...draft, dailyGoal: v })} />
        </Row>
        <Row label="Interview date" hint="Shows a countdown on your dashboard">
          <div className="flex items-center gap-2">
            <input
              type="date"
              min={today}
              value={draft.interviewDate || ''}
              onChange={(e) => setDraft({ ...draft, interviewDate: e.target.value || null })}
              className="h-9 rounded-md border border-border bg-background px-2 text-sm"
              aria-label="Interview date"
            />
            {draft.interviewDate && (
              <button onClick={() => setDraft({ ...draft, interviewDate: null })} aria-label="Clear date" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted">
                <X size={14} />
              </button>
            )}
          </div>
        </Row>
        {dirty && (
          <div className="p-4 flex gap-2 justify-end">
            <button onClick={() => setDraft(settings)} className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted">
              Cancel
            </button>
            <button onClick={save} className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
              Save
            </button>
          </div>
        )}
      </Section>

      <Section title="Appearance">
        <Row label="Theme">
          <div className="flex rounded-lg border border-border p-1 bg-background">
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                aria-pressed={theme === value}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  theme === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </Row>
      </Section>

      <Section title="Reminders">
        <Row
          label="Daily reminder"
          hint={!supported ? 'Not supported in this browser' : "A nudge if you haven't practiced yet. Fires while the app is open in a tab."}
        >
          <Toggle checked={reminderOn} onChange={toggleReminder} disabled={!supported} label="Toggle daily reminder" />
        </Row>
        {reminderOn && (
          <Row label="Remind me at">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-muted-foreground" />
              <select
                value={hour}
                onChange={(e) => { const h = Number(e.target.value); setReminderHour(h); setHour(h); changed() }}
                className="h-9 rounded-md border border-border bg-background px-2 text-sm"
                aria-label="Reminder hour"
              >
                {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{formatHour(h)}</option>)}
              </select>
            </div>
          </Row>
        )}
      </Section>

      <Section title="AI feedback">
        <div className="p-4 space-y-3">
          <div>
            <p className="font-medium">Anthropic API key</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Optional. Checks whether your answer is right, not just whether it mentions the key points. One Haiku call per answer, roughly $0.004, billed to your key. Your answer and the question go to Anthropic. The key is stored only in this browser and is left out of backups. Used in Practice.
            </p>
          </div>
          {savedKey ? (
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-sm font-mono text-muted-foreground"><KeyRound size={14} />…{savedKey.slice(-4)}</span>
              <button onClick={removeKey} className={buttonCls}>Remove</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="password"
                autoComplete="off"
                spellCheck={false}
                value={keyDraft}
                onChange={(e) => setKeyDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveKey() }}
                placeholder="sk-ant-…"
                aria-label="Anthropic API key"
                className="flex-1 min-w-0 h-9 rounded-md border border-border bg-background px-3 text-sm font-mono"
              />
              <button onClick={saveKey} disabled={!keyDraft.trim()} className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40">Save</button>
            </div>
          )}
        </div>
      </Section>

      <Section title="Data">
        <Row label="Export backup" hint="Download progress and settings as JSON">
          <button onClick={handleExport} className={buttonCls}><Download size={16} />Export</button>
        </Row>
        <Row label="Import backup" hint="Restore from a previously exported file">
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) setPendingImport(await file.text())
            }}
          />
          <button onClick={() => fileRef.current?.click()} className={buttonCls}><Upload size={16} />Import</button>
        </Row>
        <Row label="Clear all data" hint="Deletes progress and settings on this device">
          <button onClick={() => setConfirmClear(true)} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors">
            <Trash2 size={16} />Clear
          </button>
        </Row>
      </Section>

      <p className="text-center text-xs text-muted-foreground mt-8">All data stays on this device. Nothing is sent anywhere, except answers sent to Anthropic for grading if you add an API key.</p>

      <ConfirmDialog
        open={pendingImport !== null}
        title="Replace all current data?"
        description="Importing this backup replaces your progress and settings on this device. This can't be undone. Export your current data first if you want to keep it."
        confirmLabel="Replace data"
        onConfirm={confirmImport}
        onCancel={() => setPendingImport(null)}
      />
      <ConfirmDialog
        open={confirmClear}
        destructive
        title="Delete everything?"
        description="This removes your progress and settings from this device. It can't be undone. Export a backup first if you want to keep it."
        confirmLabel="Delete everything"
        cancelLabel="Keep my data"
        onConfirm={() => { clearAll(); window.location.reload() }}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  )
}
