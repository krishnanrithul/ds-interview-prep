# 13. Nine more "Go deeper" explainers (6 to 15)

**Goal.** More animations, only where a slider shows something a learner would not predict. All are real computations on seeded toy data, built on the shared `Shell.jsx`.

| Explainer id | File | Opens from terms | Teaches |
|---|---|---|---|
| `clustering` | Clustering.jsx | k-means, clustering, dbscan | k-means iterations and random starts vs DBSCAN on round, crescent and uneven data; eps and min points |
| `gradient-descent` | GradientDescent.jsx | gradient-descent, learning-rate | Path on a loss surface; learning rate; unscaled vs scaled features (cap 2/h); noisy mini-batch gradient |
| `regularization` | Regularization.jsx | ridge, lasso | L1 vs L2 coefficient paths on 8 features, exact ridge, coordinate-descent lasso, validation error |
| `trees` | Trees.jsx | decision-tree, random-forest | Depth vs overfitting, one tree vs 25-tree forest, train vs test accuracy |
| `pca` | PCA.jsx | pca | Rotate a projection line, variance kept; why scaling changes the first component |
| `svm` | SVM.jsx | support-vector-machine, support-vector-regression | Margin and C with a stray point; best line vs distance-from-centre cut (kernel idea) |
| `knn` | Knn.jsx | k-nearest-neighbors | k vs accuracy; stretching one feature's units breaks distances |
| `join-fanout` | JoinFanout.jsx | join | Payments per order change SUM after a join; inner vs left |
| `sampling` | Sampling.jsx | temperature, top-p | Softmax with temperature, top-p cut-off, 50 draws |
| `attention` | Attention.jsx | attention, transformer | Query, scores, softmax weights, scale and sqrt(d) |
| `bayes` | Bayes.jsx | frequentist | Beta-binomial updating with three starting beliefs |

(That is 11 new ids; 6 existed before, so 17 explainers in total.)

## Honesty notes
- Attention vectors are hand-made and the temperature scores are illustrative; both say so on screen.
- `bayes` opens from the "Frequentist" term on stats-011 because no term in that question's text names Bayesian ideas.
- Several explainers reveal the answer to the question they are opened from; they are opt-in via "Go deeper".

## Fixed during checking
DBSCAN default eps did not match its caption (now per-shape defaults); gradient descent converged too easily at the first default (now rate 0.1 with steps-to-1% numbers and a divergence cap); lasso caption claimed a behavior the data did not show (now data-driven); the attention demo made "it" attend to itself (now separate query vectors); the k-NN toy data was too clean to show overfitting (more noise). Accuracy charts start at 40% and say so.

## Verified
Browser runs of each explainer at desktop width, 390 px for several: no overflow and no app errors. The last small edits (attention default, sampling label, k-NN noise) were rebuilt but not re-screenshotted.

## Open
Legend text on phones; Bayesian and SQL explainers could be linked from more questions.
