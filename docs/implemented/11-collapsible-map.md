# 11. Collapsible mastery map

**Goal.** The map showed one tile per question, which gets unreadable as the bank grows. It now scales with topics, not questions.

## What changed
- `src/components/MasteryMap.jsx` rewritten: one row per topic with a stacked bar (solid, shaky, missed; unseen as the empty track), a count such as "1 of 16 solid, 2 due", a chevron to expand and a Practice button that starts a session for that topic.
- An expanded row groups its tiles by level (Foundations, Core, Advanced). Clicking a tile starts that one question.
- Topics with questions due for review start open; the rest start closed.
- `src/lib/topics.js` has dot colors for the two new topics.

## Verified
With seeded progress and 9 topics: 9 rows, 2 open at start, the toggle opens a third, Practice starts a session, and there is no horizontal overflow in light, dark and at 390 px.

## Open
- Row order is fixed; sorting by "most due first" is possible later.
