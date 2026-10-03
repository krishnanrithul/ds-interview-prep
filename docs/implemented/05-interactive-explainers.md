# 05. "Go deeper" interactive explainers (XGBoost and bias-variance)

**Goal.** Let a learner who does not understand a term go deeper without leaving the question.
Flow: question, tap the XGBoost key term, read the definition, tap **Go deeper**, get an interactive animation.

## What was built
| File | Purpose |
|------|---------|
| `src/lib/toy.js` | Seeded random numbers, a fixed underlying pattern with noise, sample generator. Same seed gives the same dots every time |
| `src/lib/boost.js` | Gradient boosting for squared error written the XGBoost way: leaf value = sum(residual) / (count + lambda), split gain from the same formula, lambda = 1. Returns, for 0 to 40 trees, the prediction on a grid and on training points, plus training and validation error |
| `src/lib/polyfit.js` | Polynomial least squares in a Chebyshev basis (stable at high degree) and `biasVariance()`, which returns fitted curves per degree and error averaged over 25 training samples |
| `src/hooks/useTween.js` | Eases arrays of numbers toward a new target with requestAnimationFrame; jumps straight there under reduced motion |
| `src/components/explainers/Boosting.jsx` | Boosting animation |
| `src/components/explainers/BiasVariance.jsx` | Bias-variance animation |
| `src/components/Explainer.jsx` | Registry (id to lazily loaded component), so each explainer loads only when opened |
| `src/components/KeyTerms.jsx` | Shows a yellow **Go deeper** button for terms that have an explainer, and renders it under the definition |
| `src/components/Practice.jsx` | While an explainer is open the answer box stops being sticky, so it does not cover the charts |
| `scripts/terms.map.json` | `deeper` field on terms: xgboost and gradient-boosting open `boosting`; bias-variance-tradeoff opens `bias-variance` |

## The two animations
**Boosting.** 40 made-up points. Start with the average, then add trees one at a time (button, Play, or a scrubber). Gray lines are residuals and shrink as trees are added. A learning-rate slider recomputes the whole run. A second chart shows training error against validation error with the lowest-validation-error point marked, so overfitting is visible. The caption changes with how many trees are in: start, first tree, improving, near the best point, past it.
**Bias-variance.** 18 points and a degree slider (1 to 12). The dashed line is the real pattern. A switch overlays the fit on 8 other samples, so the wobble that defines variance is visible. An error chart (averaged over 25 samples) shows training error falling while validation error makes a U, with the noise floor marked. Sweep plays the slider through the degrees.

## Honesty and motion
- Both explainers are real computations, not recordings. The boosting model is simplified on purpose (depth-2 trees, squared error, no column sampling or pruning) and says so on screen.
- Motion happens only in response to the learner (adding a tree, moving a slider). Under `prefers-reduced-motion`, curves jump between states.
- Captions use `aria-live`, readouts give the numbers as text, sliders are native inputs.

## Verification done
- Numbers checked before building the UI: with learning rate 0.3, validation error bottoms out near 11 trees while training error keeps falling; higher rates bottom out sooner. Averaged bias-variance error is U-shaped (minimum near degree 4, 2.4 at degree 12).
- Browser run on the XGBoost question and the bias-variance question in light and dark; screenshots reviewed at 0, 3 and 40 trees, degrees 1, 4 and 12 with and without other samples; 390 px mobile has no horizontal overflow.
- Confirmed the answer box is not sticky while an explainer is open and is again after closing it.

## Open
- Only two explainers exist. Next candidates: distribution shift (matches the XGBoost question), gradient descent, p-values and sampling.
- The "go deeper" content is not yet linked from tags, the Library or the debrief, only from key-term definitions.
- The validation rise after the best point is small at the default learning rate; raising the learning rate makes it clearer.
