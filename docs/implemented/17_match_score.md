# Live match score and AI grade (doc 17)

**Date**: 2026-10-05
**Scope**: ML Algorithms only (24 questions), in Practice. Mock is not wired yet.

## What changed
1. **Key points rewritten for ML Algorithms.** `scripts/key_points/ml-algorithms.json` now holds hand-written short points (4 to 6, one idea each) with `"draft": true`, replacing the sentence extracts from doc 16. `apply_key_points.py` now copies the flag to `key_points_draft` on the question. The other 8 topics still have the doc 16 sentence extracts.
2. **Live coverage while typing.** Under the answer box: dots plus "3 of 6 key points covered". It never shows which points, so nothing is spoiled. It follows the main answer only (not follow-up replies), and freezes once the answer is sent.
   - In-browser embeddings: transformers.js (`@huggingface/transformers` 4.3.0), `Xenova/all-MiniLM-L6-v2` quantized, in a web worker (`src/lib/match/worker.js`).
   - Scoring: the answer is split into sentences; each key point takes the cosine similarity of its closest sentence. Covered at 0.5 or above (`THRESHOLD` in `src/lib/match/index.js`). Comparing whole answers to points was much weaker (strong answers scored 0.24 to 0.53).
   - Scored 450 ms after typing pauses; point vectors cached per question, sentence vectors cached per sentence.
   - Topics are enabled in `MATCH_TOPICS` (`src/lib/match/index.js`). Add a topic there once its points are rewritten.
3. **AI grade in the debrief.** A "Key points" panel under the question in the Practice debrief lists every point. Without an API key: filled marks show which points were mentioned, with a note that this is not a correctness check. With a key: one Haiku call (`claude-haiku-4-5`) marks each point correct, wrong or missing with a one-line note, plus a one-to-two-sentence summary (`src/lib/grade.js`). Forced tool use returns structured JSON. Answers are capped at 2,000 characters, the reply at 800 tokens. Results are cached in localStorage (`ds-grades`, last 200) by question, key points and answer, so the same answer is never graded twice.
4. **Settings > AI feedback.** Anthropic API key field. Stored only in localStorage (`ds-anthropic-key`), shown as its last 4 characters, removable. `exportBackup` skips it so it never lands in a backup file. Importing a backup clears localStorage, which removes the key too. The footer now says answers go to Anthropic when a key is set.

## Files
New: `src/lib/match/worker.js`, `src/lib/match/index.js`, `src/hooks/useMatchScore.js`, `src/lib/grade.js`, `src/components/KeyPoints.jsx`.
Changed: `src/components/Practice.jsx`, `src/components/Settings.jsx`, `src/lib/backup.js`, `vite.config.js` (ES-module workers, exclude transformers from dep pre-bundling), `package.json` and `package-lock.json` (new dependency), `scripts/apply_key_points.py`, `scripts/key_points/ml-algorithms.json`, `src/data/questions.json`.

## Download size
The runtime and model load only when an ML Algorithms question opens in Practice, never on first page load.
- Worker code 557 KB and ONNX runtime glue 53 KB, from this site.
- ONNX runtime WebAssembly 27 MB, from this site (`wasmPaths` set in the worker, so no jsdelivr dependency).
- Model about 23 MB, from huggingface.co.
About 50 MB the first time, compressed on the way where the host supports it; cached by the browser afterwards. If anything fails, the meter reads "Match score unavailable in this browser" and Practice works as before.

## Tests (2026-10-05, built app in headless Chromium)
| Answer | Live score |
|---|---|
| k-means, partial (algorithm and elbow only) | 2 of 6 |
| k-means, strong | 6 of 6 |
| Class imbalance, wrong (SMOTE before the split, report accuracy) | 1 of 6 |
| PCA, three ideas, at 390 px | 3 of 6, no horizontal overflow |
Earlier offline check: off-topic answers scored 0.30 or less on every point.

## Not tested
- **A real Haiku grade.** The sandbox has no API key and cannot reach api.anthropic.com, so the response was mocked. The request was checked (model, headers, key points in the prompt, forced tool). The panel rendering was checked against the mocked response. The first real call should be checked by hand: whether "wrong" is used sensibly and the notes are useful.
- A real download from huggingface.co: the sandbox blocks it, so the test served the same files from a local copy of the official quantized model.
- Safari and Firefox.

## Open
- Tune `THRESHOLD` on about 30 hand-labeled answers.
- Rewrite key points for the other 8 topics, then add them to `MATCH_TOPICS`.
- Use the same key points and grade call for reactive Mock (THINGS_TO_DO 1.5).
- Review the 24 rewritten ML Algorithms points, then remove the draft flag.

## Update: overall score (2026-10-05)
- **Overall score.** `scorePct()` in `src/lib/match/index.js`: the average credit over all key points, shown as "x% of a senior answer". Live credits are 0 or 1 from the embedding match; graded credits are correct 1, partial 0.5, wrong and missing 0. Every point weighs the same.
- **Live meter:** one dot per point (hidden below 640 px) and "17% of a senior answer".
- **Debrief:** the percentage, a bar, and one line saying what it is based on: "Based on which ideas you mentioned", or "Graded for correctness by Haiku" plus counts (1 correct · 1 partial · 4 missing).
- **Grader:** new `partial` status (amber, half credit) for points that are partly right. Grades cached before this change are not reused (versioned cache key).
- **Tried and removed the same day:** core points (counted double) and senior extras, with "Core 1/3 · Extras 0/3" in the meter and grouped lists in the debrief. Rithul found the split confusing, so it was dropped; the `core` field was removed from the data and the apply script. The "Live estimate · Draft" header label went too: both were author-side terms. The key-point draft flag stays in the data for review, but is not shown to learners.
- Example, a real k-means answer (how it works and choosing k, nothing on failure modes): live 17% (only "choose k" matched; "assign to centroids" scored 0.45, under the 0.5 line); graded 25% with a mocked response that marks the assignment point partial.

## Update: all topics (2026-10-05)
- Short, one-idea key points (4 to 6, marked draft) written by hand for the remaining 131 questions, replacing the doc 16 sentence extracts: ML, SQL, Python, Statistics, System Design, Production ML, LLMs & AI, Deep Learning & NLP. All 155 questions now have rewritten points (885 in total), each `"draft": true` in `scripts/key_points/<topic>.json`.
- `MATCH_TOPICS` removed: the live score and the Haiku grade are on for every question with key points. Settings text updated.
- Code-shaped points keep the construct names (DENSE_RANK, LAG, df.loc, validate='many_to_one') so answers written as code can match.

### Accuracy check on mixed answers (offline, same model and 0.5 threshold)
| Answer | Score | Notes |
|---|---|---|
| sql-005, bare DENSE_RANK query | 2/5 | Query matched its point at 0.87; also got "ROW_NUMBER vs RANK vs DENSE_RANK" (0.60) without discussing ties: false credit from shared words |
| sql-005, query plus reasoning | 3/5 | As expected |
| sql-003, bare LAG query | 3/6 | LAG point 0.84; "count the open gap" 0.53 is a false credit |
| python-004, prose | 6/6 | Strong answer |
| python-008, short mixed | 4/6 | As expected |
| stats-008, prose | 4/6 | "p-value isn't the probability the coin is fair" 0.72: false credit |
| llm-001, partial (chunk, embed, retrieve) | 0/6 | False misses at 0.34 to 0.40: points that bundle extra detail dilute the match |
| ml-007, off-topic | 0/5 | All under 0.16 |
Conclusion: off-topic answers are reliably near zero, but on-topic answers can be off by about one point per question in either direction. The live score is a progress gauge; the Haiku grade is the correctness check. Points that bundle several details are the main source of false misses; splitting them further would help.
