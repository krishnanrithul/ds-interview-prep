# 08. Question bank expansion (49 to 105)

**Goal.** Grow the bank from 49 to 105 questions, 8 new questions in each of the 7 topics, filling thin tags first.

## What was built
- `scripts/add_questions.py`: reads `scripts/batches/*.json`, validates every question, appends the unseen ones to `src/data/questions.json` marked `draft: true`, records tag and term membership in `scripts/tags.map.json` and `scripts/terms.map.json`, then runs `apply_tags.py` and `apply_terms.py`. Re-running is safe. Nothing is written if any problem is found.
- Validation rules: required fields, topic, difficulty and kind in the allowed sets, 2 to 3 follow-ups each with text and intent, every tag and term exists, at least one subject tag and one key term, no duplicate ids.
- `scripts/batches/`: sql, python, stats, ml, prodml, system-design, llm (8 questions each). They were generated from small Python builders (`h.py` and one file per topic) that are not part of the repo.
- 11 new tags (SQL fundamentals, Python fundamentals, Sampling and the CLT, Causal inference, Bayesian thinking, Summary statistics, Probability calibration, Feedback loops and selection bias, Embeddings and semantic search, Controlling LLM output, LLM fundamentals) and 42 new key terms.
- Totals now: 105 questions, 62 tags, 116 glossary terms.

## Rules the new content follows
- Key terms come from the question text and never name the answer (no peeking, join grain, vectorization, chained assignment, confounder, feedback loop and so on as terms on the question that tests them).
- Every question has a junior answer, a senior answer, a key insight and follow-up intents. Frequency labels are descriptive ("common in DS interviews"), not claims about specific counts.
- All 56 are marked draft until reviewed.
- Five first-draft questions duplicated existing ones (a 50 GB CSV, an agent that loops, an A/B platform, real-time fraud, a homepage recommender) and were replaced by a generator question, a churn early-warning system, a regulated credit-limit system, a metrics layer and an LLM cost-reduction question.

## Verify
`python3 scripts/add_questions.py` prints `problems: none` and `total 105`. In the app the Library shows 105 questions and the new tags appear in the tag filter.

## Open
- Numbers in the answers (for example the coin p-value of about 0.34 and the interval of 35 to 93 percent) were checked by hand; the rest need a reviewer's eye.
- Coverage of algorithms is still thin: see THINGS_TO_DO.md section 3.
