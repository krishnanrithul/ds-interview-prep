# DS Interview Prep

A curated, structured interview prep tool for junior/mid-level data science candidates.

## The Problem

Most interview prep teaches you *what* to know (XGBoost, SQL, statistics). This teaches you *why* and *when*—through real follow-up chains showing how senior engineers actually think about tradeoffs.

**Example:** You know how to build a churn prediction model. But can you explain:
- Why XGBoost over logistic regression?
- What does 92% accuracy with 50% false positives mean?
- How do you decide if this is production-ready?

Those are the questions that separate junior from mid/senior candidates.

## What's Included

- **20-30 real interview questions** from someone with 10+ years of hiring experience
- **Follow-up chains** showing what interviewers actually ask next
- **Topic breakdown:** SQL, System Design, ML Fundamentals, Statistics, Python, Production ML
- **Frequency weighting** so you know what actually gets asked
- **Local-first design:** No backend, no login, runs entirely in your browser

## Getting Started

### Option 1: Use the Web App (once deployed)

Go to [deployed link] and start studying.

### Option 2: Run Locally

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open http://localhost:5173
```

Progress saves to your browser's localStorage. Export anytime as JSON.

## Building This

See `BUILD_PLAN.md` for the complete 3-4 week development timeline, Phase 0-3 breakdown, and tech stack details.

**TL;DR:**
- Phase 0: Content (brain-dump 20-30 interview questions) ← **YOU ARE HERE**
- Phase 1: React MVP (1.5 weeks)
- Phase 2: Launch (1 week)
- Phase 3: Iterate (ongoing)

## The Content

Your interview questions live in `src/data/questions.json`. Format:

```json
{
  "id": "ml-001",
  "question": "Build a churn prediction model",
  "topic": "ML",
  "difficulty": "medium",
  "frequency": "asked 5x in last year",
  "context": "Senior DS role, fintech",
  "follow_ups": [
    {
      "text": "Why XGBoost over logistic regression?",
      "intent": "test understanding of tradeoffs"
    }
  ],
  "key_insight": "Senior engineers choose models based on constraints, not accuracy alone"
}
```

## Tech Stack

- **Frontend:** React + Vite
- **Storage:** localStorage (no backend)
- **Hosting:** Vercel (free)
- **Data:** questions.json (static)

## Next Steps

1. Review `BUILD_PLAN.md`
2. Start Phase 0: Dump 15-20 interview questions into `src/data/questions.json`
3. Once you have 20+ questions, run `npm install && npm run dev` to see them in the UI
4. Iterate on follow-ups until they feel like real interview flows

## Questions?

Open an issue or reach out on Twitter/LinkedIn.

---

Built by someone who's conducted 100+ DS interviews. This tool exists because the gap between "I know XGBoost" and "I understand when to use XGBoost" is real—and it's trainable.
