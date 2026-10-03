# Things to do

Living list for Gradient Ascent. What has already been built is recorded in `docs/implemented/`.

## 1. Ideas for improvement

### 1.1 Match score
**Problem.** Today you compare your answer with the senior one and rate yourself. If your wording differs, nothing says whether you were conceptually right, so a shaky self-rating can feel like "I'm wrong".
**Options.**
- **Rubric checklist (recommended first step).** Split each senior answer into 4 to 6 key points. In the debrief the learner ticks the points their answer covered, and the app suggests Solid, Shaky or Missed from the share ticked. It judges concepts, not wording, works offline and needs no backend.
- Automatic matching in the browser (keywords or a small embedding model). Not recommended: keywords fail on different wording and embeddings are heavy and weak at judging reasoning.
- AI scoring (see 1.2).
**Work.** Write key points for every question (first the 22 real ones), add a checklist step to the debrief, suggest a rating from it. The key points must be reviewed for accuracy because a wrong point would mislead.
**Notes.** Key points should be reusable as the rubric an AI grader checks against.

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

### 1.4 Junior and senior answers for every follow-up
**Problem.** Junior and senior answers exist once per question. Follow-ups only have their text and what they test, so a learner cannot compare their reply to a follow-up with how a senior would handle that follow-up.
**Plan.** Add `junior_answer` and `senior_answer` (a couple of sentences each) to every follow-up, about 120 follow-ups and 240 answers in total. In the debrief each follow-up becomes an expandable row showing the follow-up, what it tests, the learner's own reply and the two answers. Nothing changes during practice, so answers stay hidden until the debrief.
**Rollout.** Start with the 22 questions based on real interviews (the ones you can judge best), see whether the format works, then do the other 27. Mark generated answers as draft until reviewed.
**Review.** All answers need your review for accuracy.

## 2. Carried over from earlier discussion
- **Learn section.** Concept lessons linked both ways with questions, built on the tag vocabulary (first 8 to 10 concepts chosen from your questions, marked draft until reviewed).
- **More "go deeper" explainers.** Done: boosting, bias-variance, drift, false positives, time series, CLT. Next: SQL join fan-out, temperature and top-p, regularization paths, Bayesian updating, then gradient descent.
- **Review my drafts.** The 27 draft questions, all senior answers, and the 74 key-term definitions in `scripts/terms.map.json`.
- **Insights over time.** The Insights tab shows the latest rating only. A weekly trend needs a longer attempts history than the 5 attempts kept per question.
- **Launch polish.** Check the name Gradient Ascent for trademarks and domains (an ML newsletter and a podcast already use it), add a share image and PNG icon, a feedback or "suggest a question" link, and deploy (for example to Vercel).
- **Commit.** The explainers, Insights tab, name and icon and this file are not committed yet.

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


## 4. Status after the 2026-10-03 session
Done: collapsible map, 155 questions, 17 explainers, level and type filters.
Next candidates:
- Logo: the current mark (dots, trend line, arrow) may resemble others. Plan: contour hill with climbing dots; keep `Logo.jsx` and `public/favicon.svg` in sync; run a real trademark and logo search before public launch.
- More Foundations questions (only 25 easy).
- Expert review of all 106 draft questions.
- Optional explainers: class imbalance and threshold, hierarchical clustering, boosting residuals for LightGBM.
- Items in section 1 (match score, AI feedback, per-follow-up answers), Learn section, phone legends and PWA.
