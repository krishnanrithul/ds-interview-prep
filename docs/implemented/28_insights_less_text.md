# 28. Insights: less text

**Date**: 2026-10-14

Rithul's feedback: the content is right but the page is too text-heavy. Same sections, fewer words; numbers and bars carry the page.

- Removed the subtitle, the "13 of 176 questions solid" headline (the bar and boxes say it), the "% of 176" lines and the separate score bar. The score now reads "52% average score · 50 answered".
- Status boxes use the Library's words (Solid, Shaky, Missed, New); a box with no questions is disabled.
- The question list is one line per question (two on phones) with a Due pill, the last score under a "Last score" caption and a play icon; the whole row starts practice. It shows 5 rows, then "Show all N".
- Where you slip: no description line, "8 to fix" instead of "8 of 26 to fix", sorted by that number, with a small color key. By topic: just the bar and the average score, under an "Average score" caption. Both have a chevron to show they open something.

The ui-reviewer agent found 12 issues; 10 fixed (focus moves to the topic select when a topic row is chosen, screen readers hear Due and the last score, no color-only topic dots, a visible label for the score, the color key, sorting that matches the shown number, 44 px topic select on touch screens, narrower box padding at 390 px, disabled empty boxes, chevrons). Not changed: the bars' grow-in animation on page load (reduced motion is honored globally).

Page height with 50 rated questions: 3,980 px to 1,888 px on a 390 px phone, 2,694 px to 1,594 px on desktop.
