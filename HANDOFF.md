# Gradient Ascent: handoff (2026-10-04)

Paste this into a new conversation, or tell it to read HANDOFF.md in the repo. It is written so work can resume without the old chat.

## 1. What this is
**Gradient Ascent** (formerly "DS Interview Prep") is a local-first React app, with no backend, that teaches data science candidates decision-making under constraints. Each question has follow-ups, a key insight, and a junior and a senior answer. Owner: Rithul, Senior Staff Data Scientist, builds this alone. He says it is his best app yet.

- Repo on his Mac: `~/ds-interview-prep` (GitHub: krishnanrithul/ds-interview-prep, branch `main`).
- Stack: React 18, Vite 5, Tailwind pinned to 3.4.17, lucide-react 0.462.0, localStorage only, Vercel planned.
- The session reaches his Mac only through the device bridge (`mcp__remote-devices__device_bash`, working directory `$HOME/mnt/ds-interview-prep`). That shell is a Linux VM: the repo's node_modules hold Mac binaries and fail there with "Exec format error". To build, copy the repo without node_modules to `$HOME/build`, run `npm ci` once, then `npx vite build` (copy `src` across again after edits). It has no GitHub credentials, so it cannot push; Claude's GitHub app isn't installed for the repo either, so pushing from the cloud sandbox is refused too. He pushes from his Mac.
- Gotchas: (1) Deleting files in his folder needs `device_request_delete_permission`, and so does git: without it every commit leaves `.git/index.lock` behind and blocks his git. (2) If VSCode has a file open with unsaved or stale contents, it can save over an edit made through the bridge; grep the file after writing and tell him to close the tab without saving. (3) Commit with his identity via `GIT_AUTHOR_NAME`/`GIT_COMMITTER_NAME` = Rithul Krishnan and `..._EMAIL` = krishnanrithul@gmail.com env vars; never change git config.

## 2. State right now
| Item | State |
|---|---|
| Git | Everything through docs 14 and 15 is committed on `main`. He pushes from his Mac (`git push`); check `git status -sb` for how far ahead of origin it is |
| Bank | 155 questions (133 are drafts; the 22 without `draft` are the real-interview ones), 455 follow-ups each with 2 draft variants (910), 88 tags, 165 glossary terms, 17 explainers, 9 topics |

## 3. What was built (see `docs/implemented/` 01 to 10 for the detail of each)
- Redesign: conversational Practice, mastery map on the Dashboard, spruce and marker-yellow palette, Literata and Schibsted Grotesk fonts, motion that responds to the learner and respects reduced motion.
- Tags (subject and skill) show in the debrief, Library and Insights only, because they can spoil answers. Key terms with neutral definitions show under the question while answering.
- Insights tab: Solid, Shaky, Missed split overall and per topic.
- Library: filters for topic, level (Foundations, Core, Advanced from `difficulty`), type (Concepts, Code and queries, Scenarios, System design from the new `kind` field), status and tag, and a "Practice these" bar.
- "Go deeper" explainers, opened from a key term that has a `deeper` field: `boosting`, `bias-variance`, `drift`, `false-positives`, `time-split`, `clt`. All are real seeded computations in `src/components/explainers/`, sharing `Shell.jsx`.
- Name and icon: Gradient Ascent, with `Logo.jsx` and `public/favicon.svg`. Keep the two in sync.
- Backup format name `DSInterviewPrep` and the localStorage keys are unchanged on purpose, for compatibility.

## 4. Data pipeline (how to change content)
Never hand-edit the generated parts.
- `scripts/add_questions.py` merges `scripts/batches/*.json` (`new_tags`, `new_terms`, `questions`), validates, appends unseen questions marked `draft: true`, records membership in `scripts/tags.map.json` and `scripts/terms.map.json`, then runs `apply_tags.py` and `apply_terms.py`. Run it from the repo root. It writes nothing if any problem is found. Re-running is safe; existing ids are skipped.
- Required per question: id, question, topic, difficulty, frequency, context, kind, 2 to 3 follow-ups with text and intent, key_insight, junior_answer, senior_answer, at least one subject tag, at least one key term.
- Allowed topics: SQL, ML, Statistics, System Design, Python, Production ML, LLMs & AI, plus the two new ones ML Algorithms and Deep Learning & NLP (already added to the script's allow-list and to `topics.js`).
- `apply_tags.py` resets every question's tags and refills them from `tags.map.json`, so a new question must be registered there (the batch script does that).
- To link a term to an explainer, set `"deeper": "<explainer id>"` on the term in `scripts/terms.map.json`, run `python3 scripts/apply_terms.py`, and register the component in `src/components/Explainer.jsx`.
- Removing a question: delete it from `questions.json`, from every list in `tags.map.json`, and from `terms.map.json` `questions`, then re-run the batch.

## 5. Builder helpers (in `scripts/builders/`)
`h.py` (Q, write, shared TAGS and TERMS dictionaries), `h2.py` (26 new tags and 50 new terms already defined for the algorithm batch), and the earlier per-topic files `b_*.py` as examples. Each topic file calls `write("name", [Q(...), ...])`, which writes `scripts/batches/name.json` containing only the tags and terms that batch uses. Run from the repo root with `PYTHONPATH=scripts/builders python3 scripts/builders/b_xxx.py`, then `python3 scripts/add_questions.py`. `Q(id, question, topic, difficulty, frequency, context, follow_ups, key_insight, junior, senior, tags, terms, kind)`; `kind` is concept, implementation, case or design.

## 5b. Follow-up variants (doc 14)
`scripts/variants/<topic>.json` is the source of truth; `python3 scripts/apply_variants.py` merges it into `questions.json` and refuses entries whose `base` text no longer matches the follow-up. Editing a follow-up means updating its `base` and variants in the topic file too. Runtime picking is in `src/lib/variants.js`.

## 6. Done: 50 algorithm questions
See docs/implemented/12. Builders in `scripts/builders/` (`b_algo1`, `b_algo2`, `b_dl`, `b_spread`, helper `h2.py`).

## 7. Done: explainers
17 now (docs 05, 10, 13). Remaining optional ones are in THINGS_TO_DO.md section 4.

## 8. Other open items
1. **Logo** may resemble an existing one (user concern). Redesign planned, see THINGS_TO_DO.md section 4.
2. Re-screenshot attention, sampling and k-NN after their last small edits.
3. His review of the 56 (soon 106) draft questions and the 74 original definitions. Senior answers need an expert eye.
4. THINGS_TO_DO.md section 4 has the current plan. Decisions from 2026-10-03: Practice keeps fixed follow-ups plus stored variants (stable for spaced repetition); Mock becomes the reactive mode, where one generated follow-up probes what the learner actually wrote (1.5). The match score must be automatic and real-time, not self-ticked: in-browser embeddings (transformers.js, all-MiniLM-L6-v2) score key-point coverage as the learner types, with optional AI grading on submit for correctness, bring-your-own-key, Haiku by default.
5. **Next task: key points per question.** 4 to 6 short points per question, each one idea a strong answer must cover, taken from the senior answer, marked draft. Start with the 24 ML questions and the 22 real-interview ones. Match score, AI feedback and reactive Mock all check against them. Suggested store: `scripts/key_points/<topic>.json` plus an apply script, same pattern as variants, with a `base` check against the senior answer.

## 9. How to verify (the loop used all along)
1. On the Mac shell: `npx vite build` (assets get new hash names each build).
2. Stage `dist/index.html` and every file under `dist/assets/` with `device_stage_files` into the cloud sandbox (`/mnt/user-data/uploads/ds-interview-prep/dist`).
3. In the cloud sandbox: copy into `/tmp/shot/dist`, `cd /tmp/shot && npx vite preview --port 4173`, drive it with Playwright (`playwright-core`, chromium at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, `--no-sandbox`). `shots.mjs` has a seeded-state helper; `ex2.mjs` opens a question's key term and "Go deeper". Google Fonts are blocked, so fallback fonts show and "Failed to load resource" console errors are expected.
4. Key-term button labels are the glossary labels (for example "Model in production", "Time series"). Do not pkill vite preview inside the same shell command that continues.

## 10. Rules and preferences to keep
- Rithul prefers direct, honest answers without hedging, dislikes repetition, dislikes emoji-heavy replies. Answer questions in the reply; ask only when a wrong guess is expensive.
- Be honest about state: say what is unbuilt, untested or unpushed. A past correction: tags were data-only and the UI was held back, and he asked "where are the tags", so say plainly what is and is not visible.
- Content rules: key terms come from the question text and never name the answer (examples: peeking, join grain, vectorization, chained assignment, confounder, feedback loop, cold start, shadow mode). New questions are drafts. Frequency labels stay descriptive ("common in DS interviews", "common in senior DS interviews", "increasingly common"), never invented counts.
- Design: no all-caps labels, no accent-one-word headlines, sentence case, motion only in response to the learner, `prefers-reduced-motion` honored, 390 px must not overflow.
- Document every step in `docs/implemented/` (what changed, files touched, decisions, how to verify, what is open).
- Commit messages end with the attribution lines the session provides. Commit only when he asks. He asks with "commit" or "push".
- Facts he gave earlier: pricing checked for Claude models (Haiku 4.5 $1/$5 per million tokens, Sonnet 5.5 $2/$10); mobile browsers work today but reminders only fire while the app is open and there is no cross-device sync.
