# 06. Insights tab

**Goal.** Show how self-ratings split into Solid, Shaky and Missed, overall and per topic, and make the split actionable.

## What was built
| File | Change |
|------|--------|
| `src/components/Insights.jsx` | **New.** The whole tab |
| `src/App.jsx` | New **Insights** tab (between Mock and Library), wired to `start` (practice by ids) and `openTag` (jump to the Library filtered by a tag) |

## Behaviour
- **Topic dropdown** (All topics or any one topic) re-cuts every number on the page.
- **Headline and stacked bar.** "N of M questions solid", then a bar split into Solid, Shaky, Missed and Not seen yet. Bars grow from zero when the tab opens and animate when the topic changes.
- **Four count cards** with number and share. Clicking one selects that segment (default: Missed, else Shaky, else Solid).
- **Segment list.** The questions in the selected segment, most overdue first, each with its topic and due description, a **Practice** link, and **Practice these** for the whole segment (a session with exactly those questions).
- **Where you slip.** The six tags with the most missed and shaky questions in scope (missed counts double); tapping a tag opens the Library filtered by it.
- **Topics side by side.** One bar per topic (shown when "All topics" is selected); tapping one switches the dropdown to that topic.
- Empty state: with nothing rated yet, the headline reads "Nothing rated yet" and the list invites you to practice.
- Accessibility: bars have text labels listing the counts, the headline is `aria-live`, count cards are toggle buttons.

## Verification done
- `vite build` passes.
- Browser run with seeded progress: default segment is Missed; selecting Shaky switches the list; choosing ML gives "1 of 10 ML questions solid"; Practice these starts a session of the right length; light, dark and 390 px mobile have no horizontal overflow. On mobile the rows stack the label and count above the bar so bars stay readable.
- No new data or scripts; it reads `progress`, the question list and the tags.

## Open
- The split uses your last rating per question, not history over time. A trend view (ratings per week) would need the attempts log, which only keeps the last 5 attempts per question.
- Mock-interview results feed the same ratings, so they are included.
