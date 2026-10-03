import { lazy, Suspense } from 'react'

// Interactive explainers, opened from "Go deeper" on a glossary term. Loaded on demand.
const EXPLAINERS = {
  boosting: lazy(() => import('./explainers/Boosting.jsx')),
  'bias-variance': lazy(() => import('./explainers/BiasVariance.jsx')),
  drift: lazy(() => import('./explainers/Drift.jsx')),
  'false-positives': lazy(() => import('./explainers/FalsePositives.jsx')),
  'time-split': lazy(() => import('./explainers/TimeSplit.jsx')),
  clt: lazy(() => import('./explainers/CLT.jsx')),
  clustering: lazy(() => import('./explainers/Clustering.jsx')),
  'gradient-descent': lazy(() => import('./explainers/GradientDescent.jsx')),
  regularization: lazy(() => import('./explainers/Regularization.jsx')),
  trees: lazy(() => import('./explainers/Trees.jsx')),
  pca: lazy(() => import('./explainers/PCA.jsx')),
  svm: lazy(() => import('./explainers/SVM.jsx')),
  knn: lazy(() => import('./explainers/Knn.jsx')),
  'join-fanout': lazy(() => import('./explainers/JoinFanout.jsx')),
  sampling: lazy(() => import('./explainers/Sampling.jsx')),
  attention: lazy(() => import('./explainers/Attention.jsx')),
  bayes: lazy(() => import('./explainers/Bayes.jsx')),
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
