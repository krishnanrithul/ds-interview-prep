# Review agents and linters (doc 23)

**Date**: 2026-10-14

## Review agents (`.claude/agents/`)
Claude Code subagents, committed to the repo so any Claude Code session in it (terminal, VS Code, desktop) can use them. All are read-only reviewers that report; they never edit, commit or deploy. Each starts with fresh context, so it isn't grading work it wrote.

| Agent | Runs | Checks | Returns |
|---|---|---|---|
| `content-reviewer` | On request, and proactively after content changes (`questions.json`, `scripts/key_points/`, `scripts/variants/`, `scripts/batches/`, `scripts/terms.map.json`) | Correctness of senior and junior answers and key insights; key-point rules (4 to 6, one idea, 5 to 12 words, supported by the senior answer, `base` matches); follow-ups and variants test their intent; key terms don't name the answer; descriptive frequency labels; difficulty fit | Table of flags per question: wrong, misleading, rule, polish, with quoted text and a suggested fix |
| `ai-prompt-reviewer` | Proactively after changes to `grade.js`, `probe.js`, `KeyPoints.jsx` or the AI parts of Practice and Mock | Agreed grader behavior (statuses, Mock credits only the candidate, follow-up verdicts, caps, cache version bumps, error messages) and interviewer behavior (reacts to the latest reply, no affirmations, one re-ask, verified quotes, fallback and retry), key handling, cost | Verdict, risks with file and line, 3 to 6 hand tests (always a wrong answer, a "Don't know" and a dodge) |
| `ui-reviewer` | Proactively after changes to `src/components/`, `App.jsx`, `index.css` | Sentence case, plain learner-facing labels, nothing revealed before answering, motion only on learner action, reduced motion, 390 px, 44 px touch targets, aria labels, focus, color not the only signal, both themes, reuse of existing pieces, logo and favicon in sync | Violations with file and line, and whether the build passes |
| `launch-reviewer` | Manually, before each deploy | No keys in tracked files or `dist/` (including a build with a dummy dev key), `.env` ignore rules, backups skip the key, every network destination, feedback address, build and bundle sizes, pinned AI packages, unfinished-looking UI | Go or no-go, then a pass, fail or check-by-hand checklist with fixes |

**Triggering:** Claude calls the proactive ones itself after relevant edits; any can be asked for by name ("have content-reviewer check scripts/key_points/sql.json"); `/agents` in Claude Code lists and edits them. Shortcut commands in `.claude/commands/`: `/review-content <scope>`, `/review-prompts`, `/review-ui`, `/prelaunch`, `/lint`.

`.claude/settings.local.json` (personal Claude Code settings) is gitignored; the agents and commands are shared.

## Linters
- **ESLint 9** (`eslint.config.js`, flat config): recommended JS rules, React, React hooks; PropTypes and unescaped-entity rules off. `npm run lint`. First run: 2 errors, 8 warnings. The 2 errors are `no-loss-of-precision` on the log-gamma coefficients in `explainers/Bayes.jsx` (more digits than a double holds; harmless). The warnings are unused variables (5) and hook dependency arrays (3: `KeyTerms.jsx`, `Practice.jsx` keyboard handler, `explainers/CLT.jsx`), worth a look but not known bugs.
- **Prettier 3** (`.prettierrc.json`: no semicolons, single quotes, width 140, trailing commas, matching the existing style). `npm run format:check` and `npm run format`. 58 files would change (formatting only); not run yet, so history stays readable until Rithul decides.
- **Ruff** (`ruff.toml`) for `scripts/`: E, F, W, B and import order, long lines allowed, and the builders' deliberate `from h import *` and one-line style allowed. `ruff check scripts` (install with `brew install ruff` or `pipx install ruff`). First run: 138 style issues (one-liners outside the builders, import order, 5 unused imports, 5 f-strings without placeholders), none of them bugs.
- New dev dependencies: `eslint`, `@eslint/js`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `globals`, `prettier`. Run `npm install` on the Mac.

## THINGS_TO_DO
New section 0: one prioritized open list (soft launch, public launch, score accuracy, content, later, housekeeping, tooling). Sections 1 to 4 kept as history; stale lines struck (logo, follow-up grading, rating suggestion).
