import json
TAGS = {k: {"label": v, "kind": "subject"} for k, v in {
 "sql-fundamentals": "SQL fundamentals", "python-fundamentals": "Python fundamentals",
 "sampling-distributions": "Sampling & the CLT", "causal-inference": "Causal inference",
 "bayesian-inference": "Bayesian thinking", "summary-statistics": "Summary statistics",
 "calibration": "Probability calibration", "feedback-loops": "Feedback loops & selection bias",
 "embeddings-and-search": "Embeddings & semantic search", "llm-output-control": "Controlling LLM output",
 "llm-fundamentals": "LLM fundamentals"}.items()}
def _t(label, definition, tag=None, deeper=None):
    d = {"label": label, "definition": definition}
    if tag: d["tag"] = tag
    if deeper: d["deeper"] = deeper
    return d
TERMS = {
 "ranking": _t("Ranking", "Ordering rows by a value and assigning each a position, such as 1st or 2nd.", "window-functions"),
 "aggregate-function": _t("Aggregate function", "A function such as COUNT, SUM or AVG that collapses many rows into one value.", "sql-fundamentals"),
 "growth-rate": _t("Growth rate", "The change in a metric between two periods, usually shown as a percentage of the earlier period.", "window-functions"),
 "streak": _t("Streak", "A run of consecutive days (or other periods) with the same behavior.", "window-functions"),
 "join": _t("Join", "An operation that combines rows from two tables using a matching condition.", "joins"),
 "null-value": _t("NULL", "A marker meaning a value is missing or unknown. It is not the same as zero or an empty string.", "null-semantics"),
 "median": _t("Median", "The middle value when observations are sorted: half the values fall below it and half above.", "summary-statistics"),
 "repeat-purchase-rate": _t("Repeat purchase rate", "The share of customers who buy more than once.", "retention-cohorts"),
 "data-structure": _t("Data structure", "A way of organizing data in memory so it can be accessed or changed efficiently.", "python-fundamentals"),
 "dataframe": _t("DataFrame", "A table of rows and labeled columns, as used in pandas.", "pandas"),
 "precision-recall": _t("Precision and recall", "Precision is the share of predicted positives that are correct. Recall is the share of actual positives that were found.", "evaluation-metrics"),
 "default-argument": _t("Default argument", "A value a function parameter takes when the caller does not supply one.", "python-fundamentals"),
 "parallelism": _t("Parallelism", "Running several computations at the same time on separate CPU cores or machines.", "performance-at-scale"),
 "central-limit-theorem": _t("Central limit theorem", "A theorem in probability about the averages of samples.", "sampling-distributions"),
 "mean": _t("Mean", "The arithmetic average: the sum of values divided by how many there are.", "summary-statistics"),
 "frequentist": _t("Frequentist", "An approach to inference in which probability describes long-run frequencies across repeated experiments.", "hypothesis-testing"),
 "causation": _t("Causation", "A relationship in which changing one variable produces a change in another, rather than the two merely moving together.", "causal-inference"),
 "control-group": _t("Control group", "The subjects who do not receive the treatment, used as the comparison for those who do.", "ab-testing"),
 "standard-error": _t("Standard error", "A measure of how much a statistic, such as a sample mean, would vary across repeated samples.", "sampling-distributions"),
 "validation-set": _t("Validation set", "Data held out from training and used to evaluate a model while it is being developed.", "validation-strategy"),
 "random-forest": _t("Random forest", "An ensemble of decision trees, each trained on a random sample of the data, whose predictions are combined.", "model-selection"),
 "predicted-probability": _t("Predicted probability", "The number between 0 and 1 that a classifier outputs for how likely a case is to be positive.", "calibration"),
 "high-cardinality": _t("High cardinality", "Describes a feature with a very large number of distinct values.", "feature-engineering"),
 "multicollinearity": _t("Multicollinearity", "When two or more input features are strongly correlated with each other.", "feature-engineering"),
 "decision-threshold": _t("Decision threshold", "The score above which a model's output is treated as a positive prediction.", "cost-sensitive-decisions"),
 "residual": _t("Residual", "The difference between an observed value and the model's prediction for it.", "model-selection"),
 "r-squared": _t("R-squared", "The share of variance in the outcome that a regression model explains.", "model-selection"),
 "training-data": _t("Training data", "The historical examples a model learns from.", "feedback-loops"),
 "retraining": _t("Retraining", "Fitting a model again on newer data to replace the version in production.", "retraining"),
 "psi": _t("PSI", "Population Stability Index: a score that compares the binned distribution of a variable between two periods.", "distribution-shift"),
 "feature-store": _t("Feature store", "A shared system that stores, computes and serves model input features.", "feature-engineering"),
 "human-review": _t("Human review", "A step in which a person checks or overrides a model's output before action is taken.", "feedback-loops"),
 "anomaly-detection": _t("Anomaly detection", "Identifying observations that deviate markedly from the expected pattern.", "model-monitoring"),
 "scenario-analysis": _t("Scenario analysis", "Examining how an outcome changes under different sets of assumptions.", "time-series-forecasting"),
 "embedding": _t("Embedding", "A list of numbers representing a piece of text (or other data) so that similar items sit close together.", "embeddings-and-search"),
 "json": _t("JSON", "A text format for structured data using key-value pairs and arrays.", "llm-output-control"),
 "token": _t("Token", "A chunk of text, often a word fragment, that a language model reads and generates one at a time.", "llm-fundamentals"),
 "temperature": _t("Temperature", "A sampling setting on LLM requests, usually between 0 and 2.", "llm-output-control"),
 "top-p": _t("Top-p", "Another sampling setting on LLM requests, between 0 and 1.", "llm-output-control"),
 "system-prompt": _t("System prompt", "Instructions given to a language model ahead of the user's input to set its behavior.", "security-and-permissions"),
 "chunk": _t("Chunk", "A segment of a document split out for indexing and retrieval.", "rag"),
 "ground-truth": _t("Ground truth", "The verified correct answers against which a system's outputs are compared.", "llm-evaluation"),
}
def Q(id, q, topic, diff, freq, ctx, fus, ki, junior, senior, tags, terms, kind):
    return {"id": id, "question": q, "topic": topic, "difficulty": diff, "frequency": freq, "context": ctx, "kind": kind,
            "follow_ups": [{"text": t, "intent": i} for t, i in fus], "key_insight": ki,
            "junior_answer": junior, "senior_answer": senior, "tags": tags, "terms": terms}
def write(name, qs):
    ut = {t for q in qs for t in q["tags"]}; um = {t for q in qs for t in q["terms"]}
    nt = {k: v for k, v in TAGS.items() if k in ut}
    for m in um:
        if m in TERMS and TERMS[m].get("tag") in TAGS: nt.setdefault(TERMS[m]["tag"], TAGS[TERMS[m]["tag"]])
    json.dump({"new_tags": nt, "new_terms": {k: v for k, v in TERMS.items() if k in um}, "questions": qs},
              open(f"scripts/batches/{name}.json", "w"), indent=2, ensure_ascii=False)
    print(name, len(qs))
