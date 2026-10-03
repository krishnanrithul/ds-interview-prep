import { lazy, Suspense } from 'react'

// Interactive explainers, opened from "Go deeper" on a glossary term. Loaded on demand.
const EXPLAINERS = {
  boosting: lazy(() => import('./explainers/Boosting.jsx')),
  'bias-variance': lazy(() => import('./explainers/BiasVariance.jsx')),
  drift: lazy(() => import('./explainers/Drift.jsx')),
  'false-positives': lazy(() => import('./explainers/FalsePositives.jsx')),
  'time-split': lazy(() => import('./explainers/TimeSplit.jsx')),
  clt: lazy(() => import('./explainers/CLT.jsx')),
}

export default function Explainer({ id, onClose }) {
  const Component = EXPLAINERS[id]
  if (!Component) return null
  return (
    <Suspense fallback={<div className="mt-3 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">Loading</div>}>
      <Component onClose={onClose} />
    </Suspense>
  )
}
