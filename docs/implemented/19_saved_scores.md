# Saved scores, suggested ratings, scores in Insights (doc 19)

**Date**: 2026-10-05

## What changed
- **Attempts store the score.** `ds-notes` attempts gain `score` (0 to 100, "of a senior answer") and `scoredBy` (`haiku` for a correctness grade, `match` for the in-browser estimate). Practice saves the debrief's score when you rate; Mock saves each question's score with Save results. If you rate before Haiku answers, the estimate is saved and marked as one. Older attempts have no score and show none. Blank answers still aren't saved.
- **Previous attempts** show each attempt's score ("75%", or "40% est." for an estimate, with a tooltip) and a trend line, oldest to newest ("25% → 60% → 85%").
- **Practice suggests a rating** from the score, as Mock does: "Your score of 25% suggests Missed it", with that button ringed and labeled "Suggested". 70%+ Solid, 40 to 69 Shaky, under 40 Missed it (`ratingFromScore`).
- **Insights**: an average score card (latest scored attempt per question, overall or for the chosen topic), "last score" on each question in the lists, and each topic's average in "Topics side by side" ("1 of 24 solid · 75%").

## Files
`src/hooks/useNotes.js`, `src/App.jsx` (`handleRate` takes the score), `src/components/Practice.jsx`, `src/components/Mock.jsx`, `src/components/KeyPoints.jsx` (`onScore` also reports `basis`), `src/lib/match/index.js` (`toSavedScore`), `src/components/Attempts.jsx`, `src/components/Insights.jsx`.

## Test (built app, mocked grades of 25% then 75% on algo-013)
Saved attempts `{score: 25, scoredBy: haiku, rating: shaky}` and `{score: 75, scoredBy: haiku, rating: solid}`; suggestion text correct for both; attempts header "25% → 75%"; Insights average 75% and the ML Algorithms row "1 of 24 solid · 75%".
