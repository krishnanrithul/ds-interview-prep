# Saddle Point: handoff (2026-10-05)

Paste this into a new conversation, or tell it to read HANDOFF.md in the repo. It is written so work can resume without the old chat.

## 1. What this is
**Saddle Point** (formerly Gradient Ascent, before that "DS Interview Prep") is a local-first React app that teaches data science candidates decision-making under constraints. Each question has follow-ups, a key insight, a junior and a senior answer, and key points. Practice scores your answer live and can grade it with Haiku; Mock is a back-and-forth interview whose follow-ups react to what you say, with an overall grade. Owner: Rithul, Senior Staff Data Scientist, builds this alone.

- Repo on his Mac: `~/ds-interview-prep` (GitHub: krishnanrithul/ds-interview-prep, branch `main`).
- Stack: React 18, Vite 5, Tailwind pinned to 3.4.17, lucide-react 0.462.0, `@huggingface/transformers` 4.3.0 and `onnxruntime-web` 1.31.0-dev.20260914-8d85527a0 (both pinned exactly, see 6.1), localStorage only, no backend, Vercel planned.
- The session reaches his Mac only through the device bridge (`mcp__remote-devices__device_bash`, working directory `$HOME/mnt/ds-interview-prep`). That shell is a Linux VM: the repo's node_modules hold Mac binaries. To build: keep a copy in `$HOME/build` (`tar` the repo without node_modules, .git and dist into it, then `npm ci --ignore-scripts` once), copy changed files across, run `npx vite build` there, then copy `dist` back into the repo to stage it. The bridge has no GitHub credentials; he pushes from his Mac.
- Gotchas: (1) git in the bridge leaves `.git/index.lock` behind; delete permission was granted in the 2026-10-05 session, so `rm -f .git/index.lock` after git commands. A new session must ask again with `device_request_delete_permission`. (2) If VSCode has a file open with stale contents it can save over a bridge edit; grep after writing and tell him to close the tab without saving. (3) Commit with `GIT_AUTHOR_NAME`/`GIT_COMMITTER_NAME` = Rithul Krishnan and `..._EMAIL` = krishnanrithul@gmail.com; never change git config. (4) After adding dependencies he must run `npm install` on his Mac, or `npm run dev` fails to resolve imports. (5) Keep scratch output out of his repo; use the bridge `$HOME` or the sandbox scratchpad.

## 2. State right now
| Item | State |
|---|---|
| Git | Everything through doc 18 is committed and pushed (`e574d2f`). **Uncommitted:** doc 19 (saved scores) and doc 20 (rename to Saddle Point); he asked for them to be committed as two commits once reviewed. |
| Bank | 155 questions (133 draft; the 22 without `draft` are the real-interview ones), 9 topics, 455 follow-ups with 910 draft variants, 910 key points (all hand-written short points, all draft), 88 tags, 165 glossary terms, 17 explainers |
| AI | Live match score in Practice for all topics; Haiku grade in Practice (main answer plus a verdict per follow-up reply) and in the Mock review when a key is set; reactive Mock follow-ups for all topics (since doc 21) |
| Tested | Built app in headless Chromium with the model served locally and the Anthropic API mocked. Real Haiku calls have been checked by Rithul only a few times (grading works; one reactive Mock run). Safari, Firefox and real phones untested. |

## 3. What was built (see `docs/implemented/` for each)
01 to 15 as before: redesign, tags, key terms, explainers, Insights, levels and types, bank to 155, collapsible map, follow-up variants, Practice and map changes. New on 2026-10-04 and 05:
- **16 Key points (first pass)**: sentence extracts, later replaced (doc 17).
- **17 Match score**: short hand-written key points for all 155 questions; live in-browser score while typing in Practice ("x% of a senior answer"); key-points panel in the debrief; optional Haiku grade (correct, partial, wrong, missing, with notes and a summary); bring-your-own-key in Settings > AI feedback. A core/extra tier split was tried and removed the same day (confusing).
- **18 Reactive Mock**: Mock is a back-and-forth; for Production ML every follow-up is written by Haiku from the conversation so far, guided by the fixed follow-ups (also the fallback), with no affirmations and one re-ask when a reply dodges; the review grades each question on the whole conversation (crediting only the candidate) and opens with an interview score, verdict, strongest and weakest question, and suggested ratings.
- **19 Saved scores**: each attempt stores `score` and `scoredBy`; previous attempts show a trend ("25% → 75%"); Practice suggests a rating from the score; Insights shows an average score overall, per topic and per question.
- **20 Rename**: Saddle Point in the title, header, logo and favicon labels, README and THINGS_TO_DO. Repo name, backup format `DSInterviewPrep` and localStorage keys unchanged on purpose.

## 4. Data pipeline (how to change content)
Never hand-edit the generated parts of `src/data/questions.json`.
- Questions: `scripts/add_questions.py` merges `scripts/batches/*.json`, validates, appends unseen questions as `draft: true`, registers tags and terms, then runs `apply_tags.py` and `apply_terms.py`. Builders in `scripts/builders/` (`h.py`, `h2.py`, `b_*.py`); run with `PYTHONPATH=scripts/builders python3 scripts/builders/b_xxx.py`, then `python3 scripts/add_questions.py`. Required fields and allowed topics are in the script.
- Variants: `scripts/variants/<topic>.json`, applied with `python3 scripts/apply_variants.py` (refuses entries whose `base` no longer matches the follow-up). Runtime picking in `src/lib/variants.js`.
- **Key points**: `scripts/key_points/<topic>.json`, entries `{ id, base, draft, points }`, applied with `python3 scripts/apply_key_points.py`, which writes `key_points` and `key_points_draft` and refuses entries whose `base` (first 100 characters of the senior answer) no longer matches. Editing a senior answer means updating its `base` and re-checking its points. Rules for points: 4 to 6, one idea each, about 5 to 12 words, keep code construct names (DENSE_RANK, LAG, df.loc) so code answers can match; avoid bundling several details in one point (main cause of false misses).
- Removing a question: delete it from `questions.json`, from `tags.map.json`, `terms.map.json`, its variants file and its key-points file.

## 5. AI features: how they work
- **Live match score** (`src/lib/match/`, `src/hooks/useMatchScore.js`, `src/components/KeyPoints.jsx`): a web worker runs transformers.js with `Xenova/all-MiniLM-L6-v2` (quantized, about 23 MB from huggingface.co). The ONNX runtime (about 27 MB WASM plus a 53 KB loader) is served from this site via `?url` imports in `worker.js`, not jsdelivr. The answer is split into sentences; each key point takes its closest sentence's cosine similarity; covered at `THRESHOLD = 0.5`; score = covered share. Measures topic match, not correctness: off-topic answers stay near 0, on-topic ones can be off by about one point either way. Loads only when a question opens in Practice; fails quietly ("Match score unavailable").
- **Haiku grade** (`src/lib/grade.js`): `callTool()` makes one forced tool call from the browser with the learner's key (`anthropic-dangerous-direct-browser-access`), model `claude-haiku-4-5`. Grades each point correct (1), partial (0.5), wrong or missing (0). Answers capped at 4,000 characters; results cached in `ds-grades` (versioned key). In Mock it grades a labeled transcript and credits only the candidate's lines. About $0.004 per grade.
- **Reactive Mock** (`src/lib/probe.js`): on for every question with key points (doc 21). Each follow-up call gets the question, key points, conversation and the planned fixed follow-up; returns question, target (claim, scaffold, reask, missed_point, deeper), quote (kept only if it really appears in the candidate's words) and point. 10 s timeout with one retry; fallback to the fixed follow-up with a visible reason. About $0.008 per question.
- **API key**: `localStorage['ds-anthropic-key']`, never written into backups (`src/lib/backup.js` skips it); importing a backup clears it.
- **Saved scores**: attempts in `ds-notes` carry `score` and `scoredBy` (`haiku` or `match`); `ratingFromScore`: 70%+ Solid, 40 to 69 Shaky, under 40 Missed it.

## 6. Verify loop
1. Build in `$HOME/build` (section 1), copy `dist` into the repo, `device_stage_files` `dist/index.html` and changed assets (CSS names change when new Tailwind classes appear; stage it too).
2. In the cloud sandbox: serve the staged `dist` with `python3 -m http.server 4173` and drive it with `playwright-core` (chromium at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, `--no-sandbox`).
3. huggingface.co and jsdelivr are blocked from both shells. For tests, the npm package `@ryanstark24/sfgraph-models` contains the official Xenova quantized model files; extract it and route `huggingface.co/.../resolve/main/<file>` to them with `context.route`. Mock `api.anthropic.com` with `context.route` (return a `tool_use` block). For offline score experiments, `@huggingface/transformers` installs in the sandbox with `--ignore-scripts` (its postinstall needs nuget, which is blocked).
4. Practice and Mock stay mounted when hidden, so text selectors can hit hidden copies; scope them (e.g. `locator('h3', { hasText })` in Library).

### 6.1 Why the AI packages are pinned
The worker serves the ONNX runtime files from the installed `onnxruntime-web`. If transformers updated and expected a different runtime version, the served files would stop matching. Upgrade both together and re-test.

## 7. Next (THINGS_TO_DO section 4 has the full list)
1. Commit docs 19 and 20 (two commits), and he pushes.
2. A few real Mock runs to confirm the stricter rules (no "Good—", one re-ask); reactive Mock is already on for all topics.
3. Review: the 910 key points, 910 variants and 133 draft questions; split bundled key points.
4. Tune `THRESHOLD` from saved answers and scores (about 30 labeled).
5. ~~Grade follow-up replies in Practice~~ Done (doc 21).
6. Launch: trademark search and domain for Saddle Point, a new logo that fits the name, decision on bring-your-own-key versus a hosted backend, privacy note, feedback link, Vercel deploy, PWA. iOS: see `docs/IOS_READINESS.md`.

## 8. Rules and preferences to keep
- Rithul prefers direct, honest answers without hedging, dislikes repetition and emoji-heavy replies. Answer in the reply; ask only when a wrong guess is expensive. Explain in plain words when he asks what something is.
- Be honest about state: say what is unbuilt, untested, mocked or unpushed. Scores and grades tested with mocked API replies must be described as such.
- Content rules: key terms come from the question text and never name the answer. New content is draft. Frequency labels stay descriptive, never invented counts.
- Design: no all-caps labels, sentence case, motion only in response to the learner, `prefers-reduced-motion` honored, 390 px must not overflow. Learner-facing labels must be plain ("Based on which ideas you mentioned", not "Live estimate · Draft").
- Document every step in `docs/implemented/` (what changed, files, decisions, how to verify, what is open).
- Commit only when he says "commit"; messages end with the attribution lines the session provides.
- Facts given earlier: Haiku 4.5 $1/$5 per million tokens, Sonnet 5.5 $2/$10; reminders fire only while the app is open; no cross-device sync.
