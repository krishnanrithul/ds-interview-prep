# Things to do

Living list for Saddle Point (formerly Gradient Ascent). What has already been built is recorded in `docs/implemented/`.

## 1. Ideas for improvement

### 1.1 Match score
**Problem.** Today you compare your answer with the senior one and rate yourself. If your wording differs, nothing says whether you were conceptually right, so a shaky self-rating can feel like "I'm wrong".
**Options.**
- **Rubric checklist (recommended first step).** Split each senior answer into 4 to 6 key points. In the debrief the learner ticks the points their answer covered, and the app suggests Solid, Shaky or Missed from the share ticked. It judges concepts, not wording, works offline and needs no backend.
- Automatic matching in the browser (keywords or a small embedding model). Not recommended: keywords fail on different wording and embeddings are heavy and weak at judging reasoning.
- AI scoring (see 1.2).
**Work.** Write key points for every question (first the 22 real ones), add a checklist step to the debrief, suggest a rating from it. The key points must be reviewed for accuracy because a wrong point would mislead.
**Notes.** Key points should be reusable as the rubric an AI grader checks against.
**Update (2026-10-03).** The score should be automatic and real-time, not self-ticked. Plan: in-browser embeddings (transformers.js) score key-point coverage as the learner types; they measure topic match, not correctness, so optional AI grading on submit checks correctness. Tune the match threshold on about 30 hand-labeled answers.
**Status (2026-10-05).** Key points exist for all 155 questions (`key_points` in `questions.json`; source of truth `scripts/key_points/<topic>.json`, applied with `python3 scripts/apply_key_points.py`, which checks the first 100 characters of the senior answer). See docs/implemented/16. They are a first pass: whole sentences picked from the senior answer by a keyword-scoring script, not short points written by hand. Some are filler (sql-003: "The business rules matter more than the syntax."), some sentences bundle two or three ideas, and they are not marked draft. Before the coverage score is built they should be rewritten as short points (5 to 12 words, one idea each, `draft: true`) and reviewed. No screen reads them yet.

### 1.2 AI-based feedback
**Idea.** A model reads the learner's answer against the senior answer and the key points, returns a match score and specific feedback (what was covered, what was missed, what a senior answer would add).
**Cost (rough, my assumptions: about 1,500 input and 400 output tokens per grade; prices from Anthropic's pricing page).**
- Haiku 4.5 ($1 / $5 per million input / output tokens): about $0.0035 per grade, about $0.04 per 10-question session.
- Sonnet 5.5 ($2 / $10): about $0.007 per grade.
- Casual daily use is roughly $2 a month on Haiku. Prompt caching (reads at 10% of input price) and the Batch API (50% off) cut it further. Measure real calls before relying on these numbers.
**What makes cost blow up.** A hosted free tier with no limits, uncapped answer length, regrading the same answer, and an API key shipped in the browser.
**Controls.** Cap answers at about 2,000 characters and replies at about 500 output tokens; grade once per attempt and store the result; default to Haiku; if hosted, require sign-in, a daily quota per user (for example 20 grades) and a hard monthly spend limit in the API console.
**Approach.**
1. Optional "AI feedback" in Settings where the user brings their own API key, stored only in their browser. No backend, no bill for the owner. Friction suits a developer audience.
2. If the app grows: a small hosted backend holding the key, with sign-in, quotas and the spend cap.
**Decision needed.** Bring-your-own-key only, or a hosted version, and which model to default to.

### 1.3 AI-generated follow-up questions that get harder
**Idea.** When a learner has rated a section Solid, generate harder follow-ups that react to what they actually wrote, so the question set does not run out.
**Why.** The question set and follow-ups are fixed, so after mastering them there is little reason to return. Repeat value is the app's main weakness.
**Cheaper alternatives to do first or alongside.**
- Harder follow-up tiers written by hand, unlocked after a question is Solid twice.
- Scenario variants: 2 to 3 versions of each question with different numbers or business context, which defeats memorized answers.
- A steady trickle of new questions.
**Needs.** The same backend or bring-your-own-key decision as 1.2, plus a rule for what counts as a section being "strong" (for example every question in a topic Solid at least twice) and a way to review generated questions for quality.
**Open question.** Who is the app for: personal prep and a portfolio piece, or a product people return to? The answer decides how much to invest here.
**Status (2026-10-03).** Pre-generated variants done for all topics (see section 4). Follow-ups that react to the learner's answer moved to Mock (1.5).

### 1.4 Junior and senior answers for every follow-up
**Problem.** Junior and senior answers exist once per question. Follow-ups only have their text and what they test, so a learner cannot compare their reply to a follow-up with how a senior would handle that follow-up.
**Plan.** Add `junior_answer` and `senior_answer` (a couple of sentences each) to every follow-up, about 120 follow-ups and 240 answers in total. In the debrief each follow-up becomes an expandable row showing the follow-up, what it tests, the learner's own reply and the two answers. Nothing changes during practice, so answers stay hidden until the debrief.
**Rollout.** Start with the 22 questions based on real interviews (the ones you can judge best), see whether the format works, then do the other 27. Mark generated answers as draft until reviewed.
**Review.** All answers need your review for accuracy.

### 1.5 Mock interview with reactive follow-ups
**Problem.** Mock is currently Practice with a timer and hidden answers. It steps through the same fixed `follow_ups` list, so the interviewer never reacts to what the learner said. Fixed follow-ups can also assume an answer the learner never gave (for example "Why would you convert it to Parquet?" when Parquet was never mentioned), which breaks the feel of a real interview.
**Idea.** Make Mock the one place where the interviewer listens. After the main answer, generate one follow-up that probes what the learner actually wrote: the vaguest claim they made, or the most important key point they missed. Practice keeps its fixed follow-ups (see 1.3), because spaced repetition needs a stable question for ratings to be comparable. Mock has no ratings to keep consistent, so unpredictability is the point.
**Why.** In real interviews the hardest follow-ups come from your own answer ("You mentioned SMOTE, what does that do to calibration?"). Defending your own claims is the skill a fixed question bank cannot train, and it is what would set the app apart from flashcards.
**Approach.**
- Hook into `Mock.jsx` where `next()` advances from the main answer (`step === 0`): call the model and replace follow-up 1 with the generated probe before it is shown. The existing "interviewer is typing" delay covers the 1 to 2 seconds of latency.
- Prompt inputs: the question, the learner's answer and the question's key points (from 1.1). Grounding on key points prevents probes built on a false premise ("you said X" when they did not).
- One reactive probe per question to start; at most two (a probe on the probe) later.
- Fallback: no API key, a failed call or a timeout over about 4 seconds means the fixed follow-up is used, so Mock never breaks.
- In the review screen, label the probe "Asked because you said…" with the quoted part of the answer, so the learner sees why it came up.
- The same call can return the match score and feedback from 1.2, so the probe adds little extra cost.
**Needs.** Key points for every question (1.1) and the bring-your-own-key setting (1.2), default model Haiku. Cost is about the same as one AI grade per question.
**Open questions.** Replace only follow-up 1 or all of them; whether to allow a second probe; how to review probe quality (log a sample of probes and check them by hand).

## 2. Carried over from earlier discussion
- **Learn section.** Concept lessons linked both ways with questions, built on the tag vocabulary (first 8 to 10 concepts chosen from your questions, marked draft until reviewed).
- **More "go deeper" explainers.** Done (17): attention, Bayesian updating, bias-variance, boosting, CLT, clustering, drift, false positives, gradient descent, SQL join fan-out, k-NN, PCA, regularization, sampling, SVM, time splits, trees. Next: temperature and top-p, plus the optional ones in section 4.
- **Review my drafts.** The 133 draft questions, all senior answers, the key-term definitions in `scripts/terms.map.json`, and the 910 follow-up variants in `scripts/variants/`.
- **Insights over time.** The Insights tab shows the latest rating only. A weekly trend needs a longer attempts history than the 5 attempts kept per question.
- **Launch polish.** Renamed to Saddle Point on 2026-10-05 (Gradient Ascent clashed with an ML newsletter and a podcast; a quick web search found no product called Saddle Point). Still to do: a proper trademark search (USPTO, IP India) and a domain, a new mark that fits the name (the current one is a climbing line with an arrow; a saddle surface or a mountain pass would fit), add a share image and PNG icon, a feedback or "suggest a question" link, and deploy (for example to Vercel).

## 3) Coverage gaps (audit of 2026-10-03, bank of 105) — mostly resolved

Status: 50 questions were added (bank now 155, see docs/implemented/12). Still without a dedicated question: instrumental variables, UMAP specifically, topic models, NDCG as its own question, log loss as its own question, RNN/LSTM details beyond dl-007. The list below is the original audit.

The audit searched every question, answer and follow-up for a checklist of algorithms and techniques. A mention inside an answer is not coverage: only gradient boosting, bias-variance, logistic regression versus boosting, and bagging versus boosting have their own question. Everything below has no dedicated question.

- Supervised: linear regression assumptions, lasso and elastic net, decision trees, SVM and SVR, k-nearest neighbors, naive Bayes, random forest on its own (OOB, importance pitfalls), LightGBM versus XGBoost versus CatBoost, GLMs (Poisson), isolation forest.
- Unsupervised (nothing at all): k-means, DBSCAN, hierarchical clustering, Gaussian mixtures, judging clusters without labels, PCA, t-SNE and UMAP, customer segmentation.
- Deep learning (nothing at all): neural network basics and backpropagation, dropout and batch norm, CNNs, RNNs and LSTMs, attention and transformers, transfer learning, word embeddings.
- Optimization: gradient descent, SGD and Adam, loss function choice (log loss, MSE, MAE, Huber), hyperparameter search (grid, random, Bayesian).
- Data and evaluation: SMOTE, class weights and resampling, MAPE and forecast metrics, log loss.
- Time series: ARIMA and stationarity, exponential smoothing, Prophet versus ML, hierarchical forecasting.
- Statistics: maximum likelihood, chi-square and ANOVA, multi-armed bandits, instrumental variables, survival analysis.
- Recommenders and NLP: matrix factorization, TF-IDF, ranking metrics (NDCG), topic models, RLHF.

Proposed fix: a new "ML Algorithms" topic (supervised plus unsupervised, about 24 questions) and a "Deep Learning & NLP" topic (about 12), plus about 14 questions spread across the existing topics. Roughly 50 questions, taking the bank to about 155.


## 4. Status after the 2026-10-03 sessions
Done (first session): collapsible map, 155 questions, 17 explainers, level and type filters.
Done (second session):
- Follow-up variants for every topic: 910 variants (2 for each of the 455 follow-ups, same intent, different scenario), marked draft, one file per topic in `scripts/variants/`. Apply with `python3 scripts/apply_variants.py`; it refuses variants whose follow-up text has changed. Practice and Mock pick one wording per follow-up and avoid the one shown last time (`src/lib/variants.js`, localStorage key `ds-variant-seen`). The Practice debrief now shows the follow-up actually asked.
- Practice debrief: each follow-up now shows the wording asked, your reply ("You said") and what it was testing.
- "Practice these again" on the end-of-session screen reruns the same questions with new follow-up wording.
- Mastery map: clicking a tile opens a preview inside that topic, under its tiles, with Practice and Close.
- Queue: unseen questions ramp by level (Foundations, then Core, then Advanced), so a new learner starts easy. No login needed: "new" just means no rating stored in this browser.
- Decided: Practice keeps fixed follow-ups plus variants (stable for spaced repetition); Mock becomes the reactive mode (1.5). Match score should be automatic, not self-ticked: in-browser embeddings give real-time key-point coverage, with optional AI grading on submit for correctness (1.1, 1.2).

Recommended next, in order:
1. Push any local commits (the sandbox has no GitHub credentials).
2. Review the variants, topic by topic, and flip `"draft"` to false for the good ones. Start with ML and the 22 real-interview questions.
3. ~~Key points for every question (1.1).~~ First pass done 2026-10-05 for all 155 (docs/implemented/16).
4. ~~Rewrite the key points as short, one-idea points marked draft.~~ Done for all 155 questions (2026-10-05, doc 17); the score is on for every topic. Remaining: review the points topic by topic and drop the draft flag; split points that bundle several details (main cause of false misses).
5. ~~Real-time coverage score~~ Built in Practice for all topics (doc 17): in-browser embeddings, live "x of n key points covered", key-points panel in the debrief. Still to do: tune the 0.5 threshold on about 30 hand-labeled answers. Overall score ("x% of a senior answer", partial credit from the AI grade) added the same day. Possible next: let the score suggest Solid, Shaky or Missed; grade follow-up replies in the same Haiku call.
6. ~~Bring-your-own-key setting~~ Built (doc 17): Settings > AI feedback; one Haiku grade per answer in the debrief marks each key point correct, wrong or missing. Check the first real grades by hand (the sandbox test used a mocked response). Reactive Mock (1.5) built for Production ML (doc 18): Mock is a back-and-forth and every follow-up is written by Haiku from the conversation so far, guided by the fixed follow-ups, which are also the fallback. Next: check real probes, then widen to other topics.

Still open:
- Logo: the current mark (dots, trend line, arrow) may resemble others. Plan: contour hill with climbing dots; keep `Logo.jsx` and `public/favicon.svg` in sync; run a real trademark and logo search before public launch.
- More Foundations questions (only 25 easy). Matters more now that new learners start with them.
- Expert review of the 133 draft questions.
- Optional explainers: class imbalance and threshold, hierarchical clustering, boosting residuals for LightGBM.
- Per-follow-up junior and senior answers (1.4), Learn section, phone legends and PWA.
- ~~Mock layout: all follow-ups stack above one text box.~~ Done (doc 18): Mock is a back-and-forth.
- Phone tap targets: mastery-map tiles are 28 to 32px, below the roughly 44px a finger needs.
- Draft badge: it appears on 133 of 155 questions, so it no longer stands out. Consider showing it only in Library, or as a quiet note in the debrief.
