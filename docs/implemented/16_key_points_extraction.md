# Key Points Extraction (doc 16)

**Date**: 2026-10-04  
**Scope**: Extract 4–6 key points from 41 priority questions (24 ML + 22 real-interview)  
**Files touched**: `scripts/extract_key_points.py` (new), `scripts/apply_key_points.py` (new), `scripts/key_points/` (new directory with 6 topic files), `src/data/questions.json` (key_points field added)

## What changed

### Extracted key points for 41 priority questions
- **24 ML questions** (all of topic "ML")
- **22 real-interview questions** (those without `draft` flag)
- **Overlap**: 5 questions are both ML and real-interview (they are in ML topic AND have no draft flag), so total unique: 41 questions

### Distribution by topic:
| Topic | Questions | Avg points/Q |
|-------|-----------|-------------|
| ML | 24 | 4.8 |
| Production ML | 4 | 4.5 |
| SQL | 4 | 5.2 |
| Statistics | 3 | 5.0 |
| Python | 3 | 4.0 |
| System Design | 3 | 3.7 |
| **Total** | **41** | **4.7** |

### Point count distribution:
- 2 questions with 3 points (short answers)
- 18 questions with 4 points
- 11 questions with 5 points
- 10 questions with 6 points

## How it works

### Extraction heuristic
`scripts/extract_key_points.py` uses sentence-level analysis:

1. **Split** senior answer into sentences (regex on `.!?` boundaries)
2. **Filter** for substantive sentences (>15 chars, not fluff)
3. **Score** by:
   - Starter phrases ("I'd", "First", "Then", "The", "If", "When", etc.) → +3 points
   - Presence of keywords (define, constraint, trade-off, scale, optimize, etc.) → +2 points
   - Length bonus (longer sentences typically more substantive) → up to +1 point
4. **Select** top 4–6 by score, then re-sort to original order

### Storage structure
Topic files in `scripts/key_points/<topic>.json`:
```json
{
  "key_points": [
    {
      "id": "ml-001",
      "base": "I'd start with the decision the model supports...",
      "points": ["Point 1", "Point 2", ...]
    }
  ]
}
```

The `base` field stores the first 100 chars of the senior_answer as a checksum, so if the answer changes, `apply_key_points.py` will warn.

### Application
`scripts/apply_key_points.py`:
- Reads all topic files
- Validates that `base` text still matches the senior_answer
- Adds `key_points` array to each question in questions.json
- Reports any mismatches (indicating the answer needs re-extraction)

## Example: ml-001

**Question**: Build a churn prediction model—walk me through your approach...

**Extracted key points**:
1. I'd start with the decision the model supports: who gets a retention offer, and what an offer costs versus a lost customer.
2. Then I'd define churn and the prediction window, build features only from data available at prediction time.
3. Churn is imbalanced, so accuracy is meaningless.
4. I'd use precision and recall at the top-k the team can actually act on, plus calibration.
5. XGBoost is justified if it beats the baseline by enough to matter, and SHAP explains it.
6. Production-ready means the false-positive cost is acceptable, not that a metric crossed a number.

Each point captures one decision or constraint from the senior answer.

## Next steps

1. **Review and refine** (Rithul): Edit topic files in `scripts/key_points/` if any points miss the mark or are unclear. Re-run `python3 scripts/apply_key_points.py` to update questions.json.

2. **Real-time match score**: Use these key points to calculate coverage as the learner types:
   - Embed key points (all-MiniLM-L6-v2 via transformers.js)
   - Score learner's answer against key-point embeddings in real-time
   - Show coverage % as the learner types

3. **AI feedback**: On submit, optionally call Haiku (bring-your-own-key) to grade against these key points and suggest missing areas.

4. **Reactive Mock follow-up**: Generate one follow-up that probes uncovered key points from the learner's answer.

## Verification

To check the extraction:

1. Open `scripts/key_points_extracted.json` to see all 41 before-and-after
2. Edit topic files as needed
3. Run `python3 scripts/apply_key_points.py` to re-apply
4. Verify in questions.json: `cat src/data/questions.json | jq '.questions[] | select(.id == "ml-001") | .key_points'`

## Open questions

- Point quality: Are these points at the right granularity? (Too fine or too coarse?)
- Coverage: Do they capture the most important ideas, or are there gaps?
- Refinement: Should we tune the extraction heuristic further, or is manual review of each topic file better?

---

**Commit**: Extract 4–6 key points from 41 priority ML and real-interview questions

## Update: 2026-10-05 — All 155 questions now have key points

**Second pass completed**: Extracted and applied key points for remaining 114 questions.

### Full coverage
| Topic | Questions | Avg points/Q |
|-------|-----------|-------------|
| Deep Learning & NLP | 12 | 4.4 |
| LLMs & AI | 14 | 5.2 |
| ML Algorithms | 24 | 4.8 |
| Production ML | 15 | 4.5 |
| Python | 17 | 5.0 |
| SQL | 16 | 4.5 |
| Statistics | 19 | 5.2 |
| System Design | 14 | 5.3 |
| **ML** (original 24) | 24 | 4.8 |
| **Total** | **155** | **4.9** |

### Final distribution
- 4 questions with 3 points (very concise answers)
- 48 questions with 4 points
- 73 questions with 5 points
- 30 questions with 6 points

All 155 questions now have key_points in `src/data/questions.json`, ready for:
- Real-time match score (embeddings-based coverage scoring)
- AI feedback (grade against key points)
- Reactive Mock follow-ups (probe missing points)

