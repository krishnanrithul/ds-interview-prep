import { useState } from 'react'
import { Search, X, ChevronDown, CornerDownRight, Play } from 'lucide-react'
import { QUESTIONS } from '../data/questions'
import { DIFFICULTY, RATINGS, dot } from '../lib/topics'

const STATUS = ['all', 'unseen', 'missed', 'shaky', 'solid']

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap transition-colors capitalize ${
        active ? 'bg-foreground text-background border-foreground' : 'bg-card text-muted-foreground border-border hover:border-foreground/30'
      }`}
    >
      {children}
    </button>
  )
}

export default function Library({ progress, onPractice }) {
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState('all')
  const [status, setStatus] = useState('all')
  const [open, setOpen] = useState(null)
  const topics = [...new Set(QUESTIONS.map((q) => q.topic))]

  const list = QUESTIONS.filter((q) => {
    const r = progress[q.id]?.rating || 'unseen'
    return (
      (!query || q.question.toLowerCase().includes(query.toLowerCase())) &&
      (topic === 'all' || q.topic === topic) &&
      (status === 'all' || r === status)
    )
  })

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search all questions"
          className="w-full h-11 pl-10 pr-9 rounded-xl bg-card border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 [scrollbar-width:none]">
        <Chip active={topic === 'all'} onClick={() => setTopic('all')}>All topics</Chip>
        {topics.map((t) => <Chip key={t} active={topic === t} onClick={() => setTopic(t)}>{t}</Chip>)}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 [scrollbar-width:none]">
        {STATUS.map((s) => <Chip key={s} active={status === s} onClick={() => setStatus(s)}>{s}</Chip>)}
      </div>

      {list.length === 0 && <p className="text-center text-muted-foreground py-16">No questions match these filters.</p>}

      <div className="space-y-2.5">
        {list.map((q) => {
          const r = progress[q.id]?.rating
          const isOpen = open === q.id
          return (
            <article key={q.id} className="bg-card border border-border rounded-2xl">
              <button onClick={() => setOpen(isOpen ? null : q.id)} className="w-full text-left p-5 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs mb-1.5">
                    <span className="flex items-center gap-1.5 font-semibold text-foreground/80">
                      <span className={`w-2 h-2 rounded-full ${dot(q.topic)}`} />{q.topic}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md ring-1 capitalize font-medium ${DIFFICULTY[q.difficulty] || ''}`}>{q.difficulty}</span>
                    {r
                      ? <span className={`px-2 py-0.5 rounded-md ring-1 font-medium ${RATINGS[r].badge}`}>{RATINGS[r].label}</span>
                      : <span className="text-muted-foreground">Unseen</span>}
                  </div>
                  <h3 className="font-medium leading-snug">{q.question}</h3>
                </div>
                <ChevronDown className={`w-5 h-5 mt-1 text-muted-foreground shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
                  {q.context && <p className="text-sm text-muted-foreground">{q.context}</p>}
                  <ol className="space-y-3">
                    {q.follow_ups.map((fu, k) => (
                      <li key={k} className="text-sm">
                        <p><span className="font-semibold text-primary mr-1.5">{k + 1}.</span>{fu.text}</p>
                        <p className="text-xs text-muted-foreground mt-1 flex gap-1.5 ml-5">
                          <CornerDownRight className="w-3 h-3 mt-0.5 shrink-0" />{fu.intent}
                        </p>
                      </li>
                    ))}
                  </ol>
                  <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 p-4">
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-1">Key insight</p>
                    <p className="text-sm leading-relaxed">{q.key_insight}</p>
                  </div>
                  <button
                    onClick={() => onPractice(q.id)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Practice this question
                  </button>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
