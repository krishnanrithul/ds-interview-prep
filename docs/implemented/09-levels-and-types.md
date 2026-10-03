# 09. Levels and question types

**Goal.** Let a learner browse by how hard a question is and by what kind of answer it needs, instead of one flat list.

## What was built
- `src/lib/levels.js`: Level maps the existing `difficulty` field (easy, medium, hard) to Foundations, Core and Advanced. Type comes from a new `kind` field: Concepts, Code and queries, Scenarios, System design.
- `kind` was added to all 105 questions (the 49 originals by hand, the 56 new ones in the batch files) and is required by `add_questions.py`.
- `src/components/Library.jsx`: a Level row and a Type row of chips above the status row; the level label and type show on each card; when a topic, level or type filter is active a "Practice these" bar starts a session from the filtered list.

## Counts
Foundations 16, Core 49, Advanced 40 at the time of writing. The Foundations tier is the thinnest.

## Open
- Level and type are not yet used in the Dashboard, the Practice queue or Insights.
- A learner-facing "path" (for example start with Foundations in every topic) is not built.
