// The Saddle Point mark: two peaks with the saddle point (yellow) in the pass between them, and the dotted path
// a climber takes up to it. Keep in sync with public/favicon.svg, which is the bolder small version (no path).
const PEAKS = 'M7 47 L20 21 Q22 17.5 24 21 L32 34 L40 21 Q42 17.5 44 21 L57 47'

export default function Logo({ className = 'w-9 h-9' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Saddle Point">
      <rect width="64" height="64" rx="14" fill="hsl(var(--ink))" />
      <path d={PEAKS} fill="none" stroke="hsl(var(--ink-foreground))" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 54 Q24 40 32 34" fill="none" stroke="hsl(var(--marker))" strokeWidth="3" strokeLinecap="round" strokeDasharray="0.1 6" />
      <circle cx="32" cy="34" r="4.6" fill="hsl(var(--marker))" />
    </svg>
  )
}
