# 02. Tag vocabulary and tagged questions

**Goal.** Give every question tags (for example XGBoost, train/test validation, drift) so the app can later show them as chips, filter the Library by them, link them to concept lessons, and group the mastery map by them. This step is data only; no UI.

## Design
- **Controlled vocabulary**, not free text, so "XGBoost", "xgboost" and "XGB" cannot become three tags.
- Two kinds:
  - `subject`: what the question is about (45 tags).
  - `skill`: what the interviewer is really testing (6 tags: Debugging, Weighing tradeoffs, Talking to stakeholders, Edge cases, Designing systems, Explaining a concept).
- Tags were assigned by reading each question, its follow-ups and its key insight, not just the question text. Follow-ups are where the deeper tags come from (for example data drift and retraining on the XGBoost 2023-vs-2024 question).
- Every concept lesson planned later should share an id with a subject tag, so a tag with a lesson becomes a link and a tag without one stays a filter.

## Source of truth and how to reproduce
- `scripts/tags.map.json`: `kind -> tag id -> { label, questions: [ids] }`. Edit this file to change tagging.
- `scripts/apply_tags.py`: reads the map, writes `tags` arrays into `src/data/questions.json` and writes `src/data/tags.json`. Validates unknown ids, duplicates and questions with no subject tag. Idempotent.
- Run from the repo root: `python3 scripts/apply_tags.py`

## Resulting data
- `src/data/tags.json`: `{ tags: [{ id, label, kind, count }] }` (51 tags).
- `src/data/questions.json`: each question gains `tags: [ids]`, subject tags first. 1 to 9 tags per question (most 3 to 7).
- Example, `ml-005` (XGBoost trained on 2023 data fails in 2024): gradient-boosting, validation-strategy, distribution-shift, retraining, debugging.
- Reformatting by `json.dump` changed some array layout in `questions.json`, so the diff is larger than the real change.

## Known weak spots
- Four tags are used by only one question: Bias-variance, Fairness, Multiple testing, AI agents. Kept because each is a likely lesson topic; merge or drop if lessons are not written.
- `prodml-006` and `llm-002` have only one subject tag and no skill tag. Light on purpose; revisit if filters feel thin there.
- `system-design-006` has 9 tags, which is too many for a chip row. The UI should cap visible chips (for example 5, with "+N").
- Only the 22 real questions' tags reflect real interview content; the 27 draft questions are tagged on the same basis but share their draft status.

## Status
Vocabulary drafted and applied. UI built in step 03 on the drafted list; revise `scripts/tags.map.json` and re-run the script to change it.
