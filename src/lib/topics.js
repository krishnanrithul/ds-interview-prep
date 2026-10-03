const TOPIC_DOT = {
  SQL: 'bg-sky-500',
  ML: 'bg-violet-500',
  Statistics: 'bg-teal-500',
  'System Design': 'bg-fuchsia-500',
  Python: 'bg-yellow-500',
  'Production ML': 'bg-orange-500',
  'LLMs & AI': 'bg-cyan-500',
}
export const dot = (t) => TOPIC_DOT[t] || 'bg-slate-400'

export const RATINGS = {
  missed: {
    label: 'Missed it', hint: 'Tomorrow', key: '1',
    button: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20',
    badge: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30',
    bar: 'bg-rose-400',
  },
  shaky: {
    label: 'Shaky', hint: 'In 2 days', key: '2',
    button: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20',
    badge: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30',
    bar: 'bg-amber-400',
  },
  solid: {
    label: 'Solid', hint: 'Spaces out', key: '3',
    button: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30',
    bar: 'bg-emerald-500',
  },
}

export const DIFFICULTY = {
  easy: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30',
  medium: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30',
  hard: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30',
}
