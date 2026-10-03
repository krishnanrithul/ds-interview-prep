# 04. Key terms on the practice screen

**Goal.** While answering, a learner should be able to look up the terms in the question itself (for "You track 20 metrics in an A/B test and one shows a significant lift with p=0.04" that means A/B test, p-value, lift, statistical significance) without leaving the screen.

## Key terms are not the same as tags
| | Key terms | Topic tags (step 02 and 03) |
|---|---|---|
| What | Words and phrases that appear in the question | Subjects and skills the question covers |
| Shown | During the question, tap for a definition | Debrief and Library only |
| Why | Help you understand the question | Would spoil it: the A/B question's tags include Multiple testing, which is the answer |

Definitions are written to explain a term without hinting at the answer.

## Data
- `scripts/terms.map.json` is the source of truth: `terms` (id, label, definition, optional `tag`) and `questions` (question id to term ids).
- `scripts/apply_terms.py` writes `terms: [ids]` onto each question in `src/data/questions.json` and generates `src/data/glossary.json`. It reports unknown ids, unknown tags, questions with no terms and unused terms. Run from the repo root: `python3 scripts/apply_terms.py`
- Result: 74 terms, every one of the 49 questions has 1 to 4. Terms were chosen from the question text only, not the follow-ups, since follow-ups unlock later.
- Each term may carry a `tag` id, used for the "More questions on X" link.

## UI
| File | Change |
|------|--------|
| `src/lib/glossary.js` | **New.** `GLOSSARY` by id |
| `src/components/KeyTerms.jsx` | **New.** "Key terms in this question" chips; tapping one opens its definition below; tapping again closes it; "More questions on X" opens the Library filtered by that term's tag |
| `src/components/Practice.jsx` | Renders `KeyTerms` directly under the question. The global Space/Enter send shortcut now ignores keypresses on buttons and links, so pressing Enter on a chip does not send your answer |

Not added to Mock on purpose: a mock interview is a rehearsal, and definitions would undercut it.

## Verification done
- `apply_terms.py` ran with no problems; `vite build` passes.
- Browser run on the A/B question: chips A/B test, p-value, Lift, Statistical significance; the p-value definition opens with the link; Enter on a focused chip showed the definition and sent no answer; no horizontal overflow at 390 px.

## Open
- **The 74 definitions are my drafts and need your review**, like the draft questions. They should be accurate and short, and should not leak answers. Edit `terms.map.json`, then re-run the script.
- The chips sit under the question, so after a few follow-ups they scroll out of view. A pinned "Terms" button near the reply box would keep them reachable.
- Library cards do not show key terms yet.
