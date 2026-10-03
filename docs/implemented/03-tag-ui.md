# 03. Tag UI

**Goal.** Show the tags from step 02 where they help: on questions, as a Library filter, and as a way to jump between related questions.
Depends on: `src/data/tags.json`, `tags` on each question (see 02).

## What changed
| File | Change |
|------|--------|
| `src/lib/tags.js` | **New.** `TAGS`, `TAG_BY_ID`, `tagLabel(id)` |
| `src/components/TagChips.jsx` | **New.** `TagChip` (single chip, optionally a button, optionally active) and `TagChips` (row, collapses past `max` behind "+N more") |
| `src/components/Library.jsx` | Tag chips on every card; "Filter by tag" panel; tag filter banner; practice-by-tag |
| `src/components/Practice.jsx` | Tags shown in the debrief only (they would give away the answer during the question); chips are buttons |
| `src/App.jsx` | `libraryTags` state lifted here; `openTag(id)` switches to Library filtered by that tag |

## Behaviour
- **Two chip styles.** Subject tags are neutral grey. Skill tags (what the interviewer is testing) use the marker tint, so the two kinds read differently at a glance.
- **Cards.** Collapsed cards show up to 4 tags, expanded cards show all. Clicking a chip adds it to the filter.
- **Filter panel.** "Filter by tag (n)" opens all 51 tags in two groups: Topics and What the interviewer is testing. Selecting several tags means AND (a question must have all of them).
- **Tag page.** With at least one tag selected, a banner shows "N questions tagged X and Y", removable chips, **Practice these** (starts a session with exactly the filtered questions, in list order) and Clear. This is the tag page; it is the Library, filtered, so no extra route is needed.
- **From Practice.** In the debrief, clicking a tag jumps to the Library filtered by it. The practice session stays mounted, so you can come back to it.
- Tag filters combine with the existing search, topic and status filters.

## Verification done
- `vite build` passes.
- Playwright run: Drift tag filter returned 5 questions (matches the tag count); adding Retraining narrowed to 4; "Practice these" started a 4-question session; debrief chip click landed on the Library with that tag selected; 390 px mobile has no horizontal overflow. Screenshots reviewed for the Library, filter panel and debrief.

## Decisions and open items
- Practice-by-tag uses `start({ only: ids })`, which keeps the Library's order and ignores the spaced-repetition queue. If it should prioritise due or weak questions within a tag, route it through `buildQueue` with a tag filter instead.
- Tag filter state is not persisted across reloads.
- Not done: grouping the mastery map by tag, and linking tags to concept lessons (step 04: a tag with a lesson will link to it, one without stays a filter).
