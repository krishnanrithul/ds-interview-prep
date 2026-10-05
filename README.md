# Saddle Point

Data science interview prep that pushes back. A curated, structured study tool: answer a question, take the follow-ups an interviewer would throw, compare with a junior and a senior answer, and let spaced repetition bring back what you got wrong.

*(Formerly "Gradient Ascent", and before that "DS Interview Prep". The repository and the saved-data format still use the old name so existing progress keeps working.)*

## The Problem

Most interview prep teaches you *what* to know (XGBoost, SQL, statistics). This teaches you *why* and *when*—through real follow-up chains showing how senior engineers actually think about tradeoffs.

**Example:** You know how to build a churn prediction model. But can you explain:
- Why XGBoost over logistic regression?
- What does 92% accuracy with 50% false positives mean?
- How do you decide if this is production-ready?

Those are the questions that separate junior from mid/senior candidates.

## What's Included

- **49 interview questions** across SQL, ML, Statistics, System Design, Python, Production ML and LLMs & AI. The first 22 come from the author's hiring experience; the other 27 are drafts (marked with a Draft badge) pending review
- **Follow-up chains** showing what interviewers actually ask next, with what each follow-up is testing
- **Topics:** SQL, ML, Statistics, System Design, Python, Production ML, LLMs & AI
- **Frequency weighting** so you know what actually gets asked
- **A practice loop:** write your answer, face the follow-ups one at a time, then compare with a junior and a senior answer and the key insight, and rate yourself Missed it / Shaky / Solid
- **Spaced repetition:** each rating schedules the next review (Missed tomorrow, Shaky in 2 days, Solid in 4 to 45 days), so due questions come first
- **Mock interview mode:** a timed run across topics with no answers until the end, then a review and ratings
- **Saved attempts:** your own answers are kept, so you can see how they change over time
- **Streaks and a daily goal**
- **Dashboard** with daily goal, interview-date countdown and per-topic progress
- **Light and dark themes**, optional daily reminder, JSON backup and restore
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

Progress saves to your browser's localStorage. Export a backup anytime from Settings.

## Building This

See `BUILD_PLAN.md` for the phase breakdown, architecture and tech stack.

**Where it stands:**
- Phase 0: Content (22 questions with follow-up chains), done
- Phase 1: Study-loop UI (Dashboard, Practice, Library), done
- Phase 1.5: Settings, theme, backup and wrap-up, in progress
- Phase 2: Deploy to Vercel, next
- Phase 3: Iterate on feedback, ongoing

## The Content

The questions live in `src/data/questions.json` (wrapped as `{ "questions": [...] }`). Each entry looks like:

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
  "key_insight": "Senior engineers choose models based on constraints, not accuracy alone",
  "junior_answer": "Clean the data, train XGBoost, report accuracy.",
  "senior_answer": "Start from the decision the model supports, define churn and the window, baseline with logistic regression, and judge it on cost-weighted precision and recall."
}
```

## Tech Stack

- **Frontend:** React + Vite
- **Styling:** Tailwind CSS v3 (light/dark theme tokens), Lucide icons
- **Storage:** localStorage (no backend)
- **Hosting:** Vercel (free)
- **Data:** `questions.json` (static)

## Adding Questions

Add an entry to `src/data/questions.json` using the format above. Add `"draft": true` to show a Draft badge until you've reviewed it (`junior_answer` and `senior_answer` are optional, and the ladder is hidden when they're missing). The app picks it up automatically, including topic counts and the practice queue. A new topic gets a neutral color unless you add it to `src/lib/topics.js`.

## Questions?

Open an issue or reach out on Twitter/LinkedIn.

---

Built by someone who's conducted 100+ DS interviews. This tool exists because the gap between "I know XGBoost" and "I understand when to use XGBoost" is real—and it's trainable.
