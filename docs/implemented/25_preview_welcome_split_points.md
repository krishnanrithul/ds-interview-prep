# 25. Link preview, welcome card, housekeeping, split key points

**Date**: 2026-10-14
**Status**: Built, uncommitted at time of writing

## 1. Link preview (THINGS_TO_DO item 8)
- `public/og-image.png`, 1200×630: dark spruce background, the mountain-pass logo, "Saddle Point", "Data science interviews that push back."
- `index.html`: `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, and `twitter:card` = `summary_large_image`. The image URL is `%VITE_SITE_URL%/og-image.png`, filled by Vite at build time.
- `.env.production` (committed; not a secret) holds `VITE_SITE_URL=`. It is empty until the live URL is known, which gives a relative `/og-image.png`. LinkedIn, Slack and iMessage need an absolute URL, so set it to the deployed origin (no trailing slash) before sharing links.

## 2. First-visit welcome
- `src/components/Welcome.jsx`: a card above the Dashboard hero on the first visit. It covers Practice, Mock interviews and grading ("Grading is on" when a key or invite code is set). It has buttons to start practicing, try a mock and add an invite code (opens Settings).
- Closing it sets `ds-welcome-dismissed` in localStorage. The Dashboard footer's "How it works" brings it back.
- Tested at 390px and 1100px: shows, closes, stays closed after reload, reopens, no horizontal overflow.

## 3. Housekeeping (item 19)
- Deleted `scripts/extract_key_points.py` and `scripts/extract_all_key_points.py`, which the hand-written key points replaced.
- Fixed the ESLint hook warnings: the `KeyTerms` effect dependencies and the Practice focus effect (`[i, step, revealed, active, typing, rating, done]`). The CLT explainer's effect deliberately runs only when the population or n changes, so it carries a disable comment explaining why.
- Removed unused variables (Clustering, Sampling, Trees, `CoverageMeter`'s `q` prop). The Lanczos coefficients in Bayes carry a `no-loss-of-precision` disable comment because they are published constants.
- Ruff: unused imports and empty f-strings fixed (4). The 81 remaining issues are style in older scripts.
- `npm run lint` exits clean; the build passes; `apply_key_points.py` leaves `questions.json` unchanged.

## 4. Split bundled key points (item 13)
The live score credits a point when one answer sentence scores at least 0.5 against it. A point that bundles two ideas ("Unpaid invoices are censored; dropping them biases toward fast payers") is a poor target for an answer that makes only one of them.

**Method**
- Flagged points with semicolons, colon lists, "so" or "which" clauses, or more than 13 words.
- Embedded each clause on its own and compared it with its whole point using the app's model (all-MiniLM-L6-v2). A clause scoring under 0.6 is an idea a candidate could state and get little credit for.
- Rewrote each bundled point as one idea, keeping 4 to 6 points per question and the senior answer as the only source.
- When a split pushed a question past 6 points, two weaker points were merged or the secondary half was dropped. This applied to dl-009, ml-006, stats-001 and stats-013. Questions with 5 points took the split directly (algo-008, ml-008, ml-024, sql-002).

**Result**
- 93 of 155 questions changed. There are now 914 points (previously 910).
- Clauses scoring under 0.6 against their own point fell from 78 to 37. The remaining 37 are a framing phrase plus one idea ("Start from the decision: who gets a retention offer") or a single cause and effect ("Tree models split on thresholds, so scaling changes nothing"), which are fine.
- A 20-sentence test of one-idea answers covered, for example, "I would recommend running a holdout experiment" and "Then unfreeze the last few layers with a low learning rate". The average best match rose from about 0.65 to about 0.81. At the 0.5 threshold, 19 of 20 were credited before the change and 20 of 20 after. The bigger gain is margin: several matches that sat just above 0.5 now clear it comfortably.
- Trade-off: matching the senior answer against its own points fell from 91.6% to 89.6% of points on the changed questions. Senior answers are long, multi-idea sentences, and short points match a long sentence a little less strongly. Nothing in the misses is under 0.47.
- Grade cache: the cache key hashes the key points, so changed questions are re-graded rather than served stale results.
