// The Gradient Ascent mark: data points, a fitted line climbing up and to the right, and an arrowhead.
// Keep in sync with public/favicon.svg.
export default function Logo({ className = 'w-9 h-9' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Gradient Ascent">
      <rect width="64" height="64" rx="14" fill="hsl(var(--ink))" />
      <g fill="hsl(var(--ink-foreground))" fillOpacity=".92">
        <circle cx="17" cy="41" r="3.2" /> <circle cx="26" cy="49" r="3.2" /> <circle cx="31" cy="30" r="3.2" /> <circle cx="41" cy="38" r="3.2" /> <circle cx="48" cy="30" r="3.2" />
      </g>
      <g fill="none" stroke="hsl(var(--marker))" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 51 C26 47 34 35 50 17" />
        <path d="M41 14h11v11" />
      </g>
    </svg>
  )
}
