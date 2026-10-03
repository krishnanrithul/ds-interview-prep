# 14. Follow-up variants

## What changed
Every follow-up now has two alternative wordings that test the same thing in a different scenario, so repeat practice can't be passed by remembering the wording. 910 variants cover all 455 follow-ups across the 9 topics. All are marked draft.

## Files
- `scripts/variants/<topic>.json`: the source of truth, one file per topic. Shape: `{"<question id>": [{"base": "<follow-up text>", "draft": true, "variants": ["...", "..."]}, ...]}`, one entry per follow-up, in order.
- `scripts/apply_variants.py`: merges every variants file into `src/data/questions.json` as `follow_ups[k].variants = [{text, draft}]`. Idempotent. Refuses an entry whose `base` no longer matches the follow-up text, so editing a follow-up never silently keeps stale variants. Also rejects empty, duplicate or over-300-character variants. Writes nothing to the problem list and exits 1 if anything fails.
- `src/lib/variants.js`: `options(fu)` (original text is option 0), `pickVariants(q)` (random option per follow-up, never the one shown last time), `markSeen(id, picks)`, `followUpText(q, picks, k)`. The last pick per question is stored in localStorage key `ds-variant-seen`, separate from saved answers, so it works even when nothing is written.
- `src/components/Practice.jsx` and `Mock.jsx`: pick once per question (Practice) or once per interview (Mock), and show the chosen wording during the question and in the debrief or review. Library still shows the original text.

## Decisions
- Same intent, new scenario, rather than harder variants. A harder tier unlocked after Solid twice is a later option (THINGS_TO_DO 1.3).
- Pre-generated and stored, not generated live: no API cost and every variant can be reviewed. Follow-ups that react to the learner's answer belong in Mock (THINGS_TO_DO 1.5), because spaced repetition in Practice needs a stable question.
- Written by Claude in the session rather than by an API script.

## How to verify
- `python3 scripts/apply_variants.py` prints `variants applied: 910` and `problems: none`.
- Practice the same question twice (tile, then Practice, twice): each follow-up wording differs from the previous time.

## Open
- Review. Flip `"draft"` to `false` per follow-up in the topic file once checked, then re-run the script. Start with ML and the 22 real-interview questions.
