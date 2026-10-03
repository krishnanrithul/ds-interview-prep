# DS Interview Prep App — Build Plan

## Product Vision

A curated, structured interview prep tool for junior/mid DS candidates. Not a crowdsourced platform (like Blind), but a **bridging tool** that shows the *thinking chain* behind technical decisions.

**Core insight:** The gap isn't between "know XGBoost" and "don't know XGBoost." It's between "I studied algorithms" and "I understand when to use them and when NOT to."

**Example flow:**
- Q: "Build a churn prediction model"
- Follow-up: "Why XGBoost over logistic regression?"
- Follow-up: "What if accuracy is 92% but 50% false positive rate—is that good?"
- Follow-up: "How would you decide if the model is worth putting in production?"

This teaches **decision-making under constraints**—what seniority actually tests.

**Target audience:** Junior and mid-level DS candidates prepping for interviews.

**Differentiation:**
- Structured (not rambling posts like Blind)
- Frequency-weighted ("SQL 35%, System Design 28%")
- Real follow-up chains (what interviewers actually ask next)
- No crowdsourcing needed (curated by someone with hiring experience)

---

## Build Plan Overview

### Phase 0: Content (1-2 weeks — CRITICAL)

**This is not a coding problem. It's a content problem.**

**Week 1: Brain dump**
- List every DS interview question you've asked or seen (target: 50-75)
- For each, write the follow-up chain (3-5 follow-ups typical)
- Organize by topic: SQL, System Design, ML Fundamentals, Statistics, Python, Production ML
- Add metadata:
  - Difficulty: easy, medium, hard
  - Frequency: how often you've seen it asked
  - Key insight: why this matters, what it tests

**Deliverable:** ~20-30 questions with follow-up chains (this is your entire product value).

---

### Phase 1: Tech (1.5 weeks)

**Tech stack:**
- Frontend: React (Vite for fast scaffolding)
- Storage: localStorage (no backend, no auth)
- Hosting: Vercel (free, one-command deploy)
- Data: questions.json in repo

**Week 1:**
- Scaffold React app with Vite
- Build QuestionList + QuestionCard (display questions + follow-ups)
- Build Sidebar (filter by topic/difficulty/search)
- Add localStorage persistence for progress
- Test locally

**Week 1.5:**
- Build TopicStats (frequency bars showing topic distribution)
- Add export/import progress as JSON
- Mobile responsive design
- Polish UI (clean, no distractions)

---

### Phase 2: Launch (1 week)

- Deploy to Vercel
- Write README
- Create GitHub repo (public, open source)
- Post on r/datascience, r/MachineLearning, Twitter, LinkedIn, DS Discord

---

### Phase 3: Iterate (ongoing)

- Collect feedback from early users
- Add new questions as trends emerge
- If traction: expand to 50+, add multi-device sync, write blog post

---

## Timeline

| Week | Task | Hours | Status |
|------|------|-------|--------|
| 1 | Content dump (20-30 Qs + follow-ups) | 20-30 | 👈 START HERE |
| 2 | React MVP (components + localStorage) | 20-25 | |
| 2.5 | Polish + deploy + launch | 5-10 | |
| 3+ | Iterate + collect feedback | ongoing | |

**Total: 60-80 hours over 3-4 weeks (part-time pace)**

---

## What's Included in This Repo

- **README.md** — Quick start guide
- **BUILD_PLAN.md** — This file (full strategy)
- **src/data/questions.json** — Your interview questions (template provided)
- **package.json** — Dependencies and scripts
- **.gitignore** — Standard Node ignores
- **src/** — React components, hooks, styling (scaffold ready for Phase 1)

## Next Step

**Start Phase 0:** Dump 15-20 interview questions from your experience into `src/data/questions.json`. Follow the format shown below.

If it feels natural and deep, continue to 30+. If it feels forced, revisit.

---

## Question Format

Each question needs:

```json
{
  "id": "unique-id",
  "question": "The core question text",
  "topic": "SQL|System Design|ML|Statistics|Python|Production ML",
  "difficulty": "easy|medium|hard",
  "frequency": "asked Nx in last Y",
  "context": "Where/when you asked it (company, role level)",
  "follow_ups": [
    {
      "text": "Follow-up question 1",
      "intent": "What this tests"
    }
  ],
  "key_insight": "Meta-lesson: why this matters"
}
```

That's it. Go fill it in.
