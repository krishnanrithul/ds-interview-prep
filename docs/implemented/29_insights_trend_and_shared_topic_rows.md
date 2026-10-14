# 29. Insights trend, topic picker and shared topic rows

**Date**: 2026-10-14

Goal: make Insights consistent with the redesigned Library (doc 27) and answer "am I improving?".

## What changed
- **Shared progress pieces** (`src/components/Progress.jsx`): `StatusBar` (stacked solid, shaky, missed and new; 1 px gaps, 4 px minimum segment, counts in its accessible label), `StatusLegend`, `countStatuses` and `TopicRow`. The Library's group headers and the Insights "By topic" rows now use the same `TopicRow`, so a topic looks the same on both pages. The Library shows "N of M solid"; Insights shows the average score and a trend arrow. The Library bar is now the stacked bar, with a color key above the groups.
- **Weekly trend** (`src/components/TrendChart.jsx`, `src/lib/trends.js`): the average score of all scored answers per week for the last 8 weeks, on a fixed 0 to 100 scale. A week with fewer than 2 answers gets no point and breaks the line. A readout above the plot shows "Weekly average · 60% this week · up 3 on the week before", or the week under the pointer (hover, tap or arrow keys). The change appears only when both weeks have 3 or more answers and it moved by 3 points or more. Before a second week of data: "Your weekly trend appears after a second week of practice." Screen readers get a table of the weeks.
- **Topic trend arrows** on By topic rows: the last 14 days against the 28 days before, each with at least 3 scored answers, shown when the change is 3 points or more. Arrows and the change line use the text color, not green and red, so they don't read as Solid or Missed.
- **Topic picker**: the native select became a chip next to the title ("All topics" or the chosen topic) that opens a row of topic chips, the same style as the Library's filters. The By topic rows still narrow the page too. Focus returns to the chip after a choice; Escape closes the row.

## Review
The ui-reviewer agent found 12 issues; all fixed. The main ones: the 52% headline (latest score per question) and the weekly line measure different things, so the chart now has its own labelled readout; the floating tooltip covered the headline, so it became a fixed readout line; tapping the chart did nothing on phones; gaps were drawn as a continuous line; green "up" text failed contrast in light mode and clashed with the status colors; the topic select's removal made topic filtering hard to find; tiny bars hid counts of 1; the chart pushed the page down on load; and the plot was too short to show a small change.

Checked at 390 px (light) and 1022 px (dark) with 8 weeks of seeded attempts: no horizontal overflow, the tap and hover readouts work, and choosing a topic from the picker focuses the chip.
