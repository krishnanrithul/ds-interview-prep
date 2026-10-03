# 12. Algorithm and technique questions (105 to 155)

**Goal.** Close the coverage gaps found in the audit (SVM/SVR, trees and forests, LightGBM/CatBoost, clustering, PCA, deep learning, optimization, ARIMA, MLE, bandits, survival and more).

## What was added (50 questions, all marked draft)
| Topic | Count | Ids |
|-------|-------|-----|
| ML Algorithms (new topic) | 24 | algo-001 to algo-024: linear and regularized models, trees, forests, boosting libraries, SVM and SVR, k-NN, naive Bayes, GLMs, isolation forest, k-means, DBSCAN, hierarchical, mixtures, judging clusters, segmentation, PCA, t-SNE, feature selection, stacking, imbalance, tuning |
| Deep Learning & NLP (new topic) | 12 | dl-001 to dl-012: backpropagation, optimizers, losses, regularization, deep nets vs boosting, CNNs, transformers, attention, transfer learning, text classification options, word2vec, RLHF |
| Spread across existing topics | 14 | stats-016 to 019, ml-019 to 024, python-015 to 017, llm-014 |

Also added: 26 subject tags and 50 key terms. Bank totals now: 155 questions, 88 tags, 165 glossary terms. Mix: 25 easy, 78 medium, 52 hard; 60 concept, 54 case, 22 design, 19 implementation.

## How it was done
Builder files in `scripts/builders/` (`b_algo1.py`, `b_algo2.py`, `b_dl.py`, `b_spread.py`, plus `h2.py` for tags and terms) write batch JSON; `scripts/add_questions.py` validated and merged them with no problems.

## Open
- Foundations is still the thinnest level (25 easy). Add more entry-level questions.
- All 106 drafts need an expert read; senior answers in particular.
