# 27. Library redesign

**Date**: 2026-10-14

The Library showed four rows of filter chips, an 82-tag panel and all 176 questions as one long list. It is now modelled on NeetCode's grouped topic list, LeetCode's filter bar and Linear's row density.

## What changed
- **Search and filter bar.** One search box (it matches question text and tag names) and a Filters button with a count of active filters. Topic, level, type, progress and tags live in a panel that opens on demand; tags are found by typing ("joins", "SHAP"), with the six "what the interviewer is testing" tags shown by default. Active filters appear as removable chips with the result count, "Clear all" and "Practice these".
- **Topic groups.** Nine collapsible sections with the question count, how many are due, and a solid-progress bar ("2 of 18 solid"). Collapsed by default, so the page fits on one screen; while searching or filtering, matching groups open automatically. When the last filter is removed, the groups that were open stay open.
- **One-line rows.** Status pill (New, Missed, Shaky, Solid), the question (two lines on phones, one on wider screens), a Due marker and the level. Tapping a row expands it with context, tags, follow-ups, the answer ladder, attempts, Practice this question and the report link, as before.
- **At most 10 rows per group**, sorted due, missed, shaky, new, then solid; "Show all N" reveals the rest.

## Review
The ui-reviewer agent found ten issues, all fixed: group open state going stale when filters change, focus lost when a chip or button disappears, an unreliable live region for the result count, a color-only shaky/missed bar (the bar now shows solid only, with the count in words), touch targets under 44 px (chips, Done, Clear all, Practice these, tag chips app-wide), "New" vs "Unseen" wording (the filter now says New), two count formats ("2 of 18" everywhere), missing headings and group labels for screen readers plus Escape to close the panel, a weak focus ring on the tag search, and the due count hidden on phones. `RATINGS` in `src/lib/topics.js` gained a short `status` label for lists.

Checked at 390 px and 1022 px in both themes with seeded progress: no horizontal overflow; the opening screen is 9 rows; a filter, removal and search sequence keeps the right groups open and returns focus to the search box or the Filters button.
