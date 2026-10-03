# 10. Four more "Go deeper" explainers

**Goal.** Add the animations chosen in the animation review, only where motion teaches something a number cannot.

## What was built
| Explainer id | File | Opens from terms | Teaches |
|--------------|------|------------------|---------|
| `drift` | `explainers/Drift.jsx` | model-drift, psi, production-model | Two modes: the inputs move, or the relationship changes. Shows what an input monitor (PSI) sees against what the model actually gets wrong. Inputs can move a lot with little damage; a changed relationship can hurt with PSI near zero |
| `false-positives` | `explainers/FalsePositives.jsx` | p-value, type-i-error | 400 simulated experiments with no real effect. Tab 1: the false-positive rate climbs from 5 percent to about 28 percent as you check more often. Tab 2: tracking many metrics, with the 1 - 0.95^m curve and a divide-by-m correction |
| `time-split` | `explainers/TimeSplit.jsx` | time-series, backtesting | Random folds against walk-forward folds on a 59-week series (average error 2.4 against 5.6), plus a trend, seasonality and noise view with a 12-week forecast band |
| `clt` | `explainers/CLT.jsx` | central-limit-theorem, standard-error | Four populations, a sample-size slider, 1,000 more draws; compares the spread of averages with sigma over root n and shows skewness falling |

Shared pieces: `explainers/Shell.jsx` (frame, segmented control, slider, small line chart), `toy.js` now exports `gauss`, `Explainer.jsx` registers the four ids, and `scripts/terms.map.json` carries the `deeper` field.

## Honesty
- Everything is computed in the browser from seeded random numbers; nothing is a recording.
- Simplifications are stated on screen: the drift model is a piecewise-constant fit, the time-split model predicts from the two nearest training weeks (standing in for trees on a date feature), the forecast band widening is illustrative.

## Verified
Browser run for each explainer at desktop width and at 390 px: no horizontal overflow and no app errors. Numbers checked in the pictures: 19 of 400 false positives with one look (5 percent), 112 of 400 with 28 looks; 4 percent with the corrected threshold; the CLT spread of averages tracks theory (0.30 against 0.26 at n = 60 from 300 draws).
A bug found and fixed during checking: the first drift pattern did not punish the model enough, so the caption said it was fine at a large shift. The pattern now keeps rising beyond the training range.

## Open
- On a phone the legend text inside the main charts is small.
- Gradient descent, regularization paths, SQL join fan-out, temperature and top-p, Bayesian updating are the next candidates.
