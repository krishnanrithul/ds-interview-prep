# 26. Content review fixes and 21 new questions

**Date**: 2026-10-14

## 1. Content review (THINGS_TO_DO item 14)
The content-reviewer checked all 155 questions, one topic per agent, and raised 260 flags. Each wrong, misleading and rule flag was re-checked before fixing: 175 fixed, 2 rejected, 56 polish flags deferred. The invented "asked Nx in last year" frequency labels on the 22 real-interview questions were replaced with descriptive ones. Full list and outcomes: `docs/reviews/CONTENT_REVIEW_2026-10-14.md`. Committed as `147e114`.

## 2. New questions (items 15 and 16)
21 questions, all `draft: true`, in `scripts/batches/new_2026_10.json`, with key points in `scripts/key_points/` and two variants per follow-up in `scripts/variants/`.

| Topic | Easy (Foundations) | Missing-topic questions |
|---|---|---|
| SQL | sql-017 LEFT JOIN filter placement, sql-018 conditional aggregation | |
| Python | python-018 groupby agg vs transform | |
| Statistics | stats-020 base rates (Bayes), stats-021 confounding and reverse causation | stats-022 instrumental variables (hard) |
| ML | ml-025 train, validation and test sets | ml-026 NDCG |
| ML Algorithms | algo-025 linear vs logistic regression | algo-026 log loss, algo-027 UMAP vs t-SNE vs PCA |
| System Design | system-design-015 batch vs real-time scoring, system-design-016 what to log per prediction | |
| Deep Learning & NLP | dl-013 epochs, batches and iterations, dl-014 tokenization, stemming and lemmatization | dl-015 RNN and LSTM mechanics, dl-016 topic models |
| LLMs & AI | llm-015 embedding vs generative models, llm-016 zero-shot vs few-shot | |
| Production ML | prodml-016 minimum monitoring for a first model, prodml-017 offline vs online evaluation | |

Process: three agents wrote the questions against the content rules and the existing questions in each topic (to match voice and avoid duplicates). Three separate reviewer agents then checked them and fixed what they found: two factual errors in dl-013, several misleading lines, near-duplicate follow-ups (dl-013, dl-015, algo-027, prodml-016) and bundled key points. Numbers were recomputed: Bayes 9.05%, NDCG@3 0.67 (linear gain), base-rate log loss 0.1985.

Live-score check: each senior answer matches 89% of its own key points on average (in line with the rest of the bank).

The bank now has 176 questions (40 easy, 83 medium, 53 hard), 1043 key points, 1036 variants and 182 glossary terms.

## 3. `add_questions.py` fix
The script used to re-register every batch's `new_terms` on each run, which brought back the 4 terms the review removed. It now skips questions already merged and registers a batch term only when a newly added question uses it.

## 4. Polish pass and code tidy (items 14 and 19)
- **Polish flags**: 55 of the 57 polish entries applied (wording, precision, a few missing caveats such as NULL amounts in sql-015's median, the LEFT JOIN filter in sql-004, and the intercept column in python-016). 4 rejected; reasons in the review report.
- **Ruff**: `ruff check scripts` passes. Safe fixes applied (import sorting, whitespace). `zip(..., strict=True)` in `apply_variants.py` (lengths are checked just before). Ambiguous names renamed (`I` to `INC` in two builders, `l` to `label` in `h2.py`). The compact one-line style in the pipeline scripts is now allowed in `ruff.toml` rather than rewritten. All builders regenerate byte-identical batch files.
- **Prettier**: run once over `src/` (61 files, formatting only). Before and after builds were compared: the only differences are how JSX text is split into strings, which renders identically. The Bayes explainer's lint exception moved to a block comment because Prettier reflowed the line it was attached to. ESLint passes; the build passes.

## 5. Quieter draft label (item 18)
154 of 176 questions are draft, so the badge in the Practice and Mock headers made the app look unfinished. The Draft badge now appears only in the Library. In the Practice debrief and Mock review, draft questions show an italic note just above "Report a problem with this question": "New question, not yet checked by the author. Flag anything that looks off." (`ReportQuestion` in `FeedbackLink.jsx`; the Library passes `showDraftNote={false}` because it keeps the badge.)

The ui-reviewer agent checked the change and found five issues, all fixed: the note's lighter muted color failed contrast in the light theme (3.8:1), so it now uses the standard muted color; the wording now says what the note means for the learner; the report link has a 44 px touch target on phones; the Flag and MessageSquare icons are `aria-hidden`; and the Library no longer shows both the badge and the note. Checked at 390 px in both themes.
