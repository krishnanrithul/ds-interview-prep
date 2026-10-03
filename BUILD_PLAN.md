# DS Interview Prep App: Build Plan

## Product Vision

A curated, structured interview prep tool for junior/mid DS candidates. Not a crowdsourced platform (like Blind), but a **bridging tool** that shows the *thinking chain* behind technical decisions.

**Core insight:** The gap isn't between "know XGBoost" and "don't know XGBoost." It's between "I studied algorithms" and "I understand when to use them and when NOT to."

**Example flow:**
- Q: "Build a churn prediction model"
- Follow-up: "Why XGBoost over logistic regression?"
- Follow-up: "What if accuracy is 92% but 50% false positive rate, is that good?"
- Follow-up: "How would you decide if the model is worth putting in production?"

This teaches **decision-making under constraints**, which is what seniority actually tests.

**Target audience:** Junior and mid-level DS candidates prepping for interviews.

**Differentiation:**
- Structured (not rambling posts like Blind)
- Frequency-weighted ("asked 5x in last year")
- Real follow-up chains (what interviewers actually ask next)
- Practice loop with self-rating and a smart queue, not just a reading list
- No crowdsourcing needed (curated by someone with hiring experience)

---

## Status

| Phase | Scope | Status |
|-------|-------|--------|
| 0 | Content: 22 questions with follow-up chains | Done |
| 1 | Study-loop UI (Dashboard, Practice, Library) | Done |
| 1.5 | Settings, theme, backup, wrap-up and bug pass | In progress |
| 2 | Deploy to Vercel and launch | Next |
| 3 | Iterate on feedback | Ongoing |

---

## Phases

### Phase 0: Content (DONE)

- 22 interview questions across 6 topics: SQL (4), ML (5), Statistics (3), System Design (3), Python (3), Production ML (4)
- Each question has 2-3 follow-ups (with the interviewer's intent) plus a key insight
- Real examples from a fintech / financial analytics context
- Source of truth: `src/data/questions.json`

### Phase 1: Study-loop UI (DONE)

The first UI was a flat, filterable list with a "studied" checkbox. It was replaced by a study loop modeled on flashcard apps (Anki, Quizlet), because the data's real value is the follow-up chain.

- **Dashboard:** today's session, daily goal, Solid/Shaky/Missed/Unseen counts, per-topic progress
- **Practice:** one question at a time. Think first, then follow-ups unlock one by one, then the key insight, then self-rate (Missed it / Shaky / Solid). Keyboard shortcuts: Space/Enter, 1/2/3
- **Smart queue:** overdue reviews first, then unseen, then weak-but-not-due, solid last; weighted toward weak topics
- **Library:** search plus topic and status filters over all questions

### Phase 1.5: Settings and wrap-up (IN PROGRESS)

Borrowed from the vape-ease-journey app:

- [x] Settings page: questions per session, daily goal, interview date (countdown on dashboard)
- [x] Theme: Light / Dark / Auto
- [x] Daily reminder via the Web Notifications API (fires while the app is open)
- [x] Backup: export progress and settings as JSON; import validates the file and asks before replacing; old export formats still import
- [x] Corrupted-storage protection (`safeStorage`) and an error boundary instead of a white screen
- [x] Docs updated to match the app
- [x] Junior vs senior answer ladder on every question (drafts, to be reviewed by the author)
- [x] Mock interview mode: mixed topics, follow-ups one at a time, soft timer, no answers until the review, then rate and save
- [x] Spaced repetition: each rating schedules the next review (Missed 1 day, Shaky 2 days, Solid 4/10/21/45 days); "due" questions come first
- [x] Activity log with streaks, best streak and a daily goal driven by it
- [x] Saved attempts: your answers are stored per question (last 5) and shown next to the senior answer on later attempts
- [x] Mobile check at phone width: no horizontal overflow, tabs collapse to icons (a bottom nav is still optional)
- [ ] Bug pass on edge cases: empty queue, 1-question session, keyboard shortcuts
- [ ] Optional polish: animations, card transitions

### Phase 2: Launch (1 week)

- Deploy to Vercel
- Make the GitHub repo public
- Post on r/datascience, r/MachineLearning, Twitter, LinkedIn, DS Discord

### Phase 3: Iterate (ongoing)

- Collect feedback from early users
- Add new questions as trends emerge
- If traction: expand to 50+ questions, streaks/achievements (as in vape-ease-journey), multi-device sync, a blog post

---

## Tech Stack

- **Frontend:** React 18 + Vite
- **Styling:** Tailwind CSS v3 with CSS-variable theme tokens (light/dark)
- **Icons:** Lucide
- **Storage:** localStorage only (no backend, no auth)
- **Hosting:** Vercel

Note: Tailwind is pinned to v3.4. v4 uses a different PostCSS plugin and CSS setup, and the config here is v3-style.

## Architecture

```
src/
  App.jsx                    shell, tab navigation, session state
  main.jsx                   ErrorBoundary > ThemeProvider > App
  data/
    questions.json           the content (edit this)
    questions.js             exports QUESTIONS from the JSON
  components/
    Dashboard.jsx            session start, streak, due count, daily goal, stats, topics
    Practice.jsx             the study loop (kept mounted while you switch tabs)
    Mock.jsx                 timed mock interview: setup, run, review
    Library.jsx              browse and search; shows ladder, due date, saved attempts
    AnswerLadder.jsx         junior vs senior answer plus key insight
    Attempts.jsx             your saved answers for a question
    Settings.jsx             study settings, theme, reminders, data
    ConfirmDialog.jsx        confirm before destructive actions
    ErrorBoundary.jsx        recovery screen instead of a white page
  hooks/
    useProgress.js           per-question rating, streak and due date, persisted
    useActivity.js           daily activity log (streak, daily goal)
    useNotes.js              your saved answers per question
    useSettings.js           session size, daily goal, interview date
    useTheme.jsx             light / dark / system
    useReminderScheduler.js  daily reminder timer
  lib/
    queue.js                 practice queue and mock queue, progress summary
    srs.js                   spaced-repetition scheduling and due dates
    streak.js                current and best streak from the activity log
    backup.js                export / import / clear
    reminders.js             Web Notifications reminder logic
    safeStorage.js           safe JSON parsing from localStorage
    topics.js                topic colors, rating and difficulty styles
```

### Question data

```json
{
  "id": "sql-001",
  "question": "...",
  "topic": "SQL | ML | Statistics | System Design | Python | Production ML",
  "difficulty": "easy | medium | hard",
  "frequency": "asked Nx in last year",
  "context": "...",
  "follow_ups": [{ "text": "...", "intent": "..." }],
  "key_insight": "...",
  "junior_answer": "what a typical weaker answer sounds like",
  "senior_answer": "what a strong answer sounds like"
}
```

### localStorage keys

| Key | Contents |
|-----|----------|
| `progress-v2` | `{ [questionId]: { rating: "missed"/"shaky"/"solid", last, count, streak, due } }` |
| `ds-activity` | `{ "YYYY-MM-DD": questionsPracticed }` (streak and daily goal) |
| `ds-notes` | `{ [questionId]: [{ ts, text, rating, source }] }`, last 5 answers per question |
| `ds-settings` | `{ sessionSize, dailyGoal, interviewDate }` |
| `ds-theme` | `"light"`, `"dark"` or `"system"` |
| `ds-reminder-enabled`, `ds-reminder-hour`, `ds-reminder-last-fired` | reminder state |

The backup file is `{ app: "DSInterviewPrep", version: 3, data: { ...all keys above } }`.

---

## Timeline

| Week | Task | Status |
|------|------|--------|
| 0 | Content dump (22 Qs + follow-ups) | Done |
| 1 | Study-loop UI | Done |
| 1.5 | Settings, theme, backup, wrap-up | In progress |
| 2 | Deploy and launch | Next |
| 3+ | Iterate and collect feedback | Ongoing |
