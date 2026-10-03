# 01. UI redesign

**Goal.** The first UI worked but felt generic ("boring"). Make it feel like interview practice, give it a distinct identity, and use motion with purpose.
Requested items: conversation-style Practice, new typography and palette, a mastery map, motion. Deferred: highlighting what the senior answer adds (needs content tagging).

## Design decisions
- **Palette.** Deep spruce ink on cool paper, with a highlighter-yellow "marker" as the one sharp accent. Chosen to avoid the common defaults (cream with terracotta, indigo SaaS, near-black with acid green).
  Status colors are unchanged in meaning: Solid emerald, Shaky amber, Missed rose, Unseen outlined.
- **Type.** Literata (serif) for questions and headings, Schibsted Grotesk for the interface. Loaded from Google Fonts in `index.html`; falls back to Georgia and system sans offline.
- **One bold element.** The marker stroke under each question and on primary buttons. Everything else stays quiet.
- **Dark mode.** Spruce surfaces, and the marker becomes the primary color.
- All-caps tracked labels were removed everywhere in favor of sentence case.

## What changed
| File | Change |
|------|--------|
| `index.html` | Google Fonts links |
| `tailwind.config.js` | `fontFamily` (sans, serif), colors `ink`, `ink-foreground`, `marker` |
| `src/index.css` | New HSL tokens (light and dark), serif headings, focus-visible ring, keyframes and utilities: `marker-text`, `anim-msg`, `typing-dot`, `tile-pop`, `due-pulse`, `bar-grow`; `prefers-reduced-motion` override |
| `src/App.jsx` | New header: serif wordmark, tabs with a marker underline that scales in |
| `src/components/Practice.jsx` | Rewritten as a conversation (see below) |
| `src/components/Dashboard.jsx` | Ink hero, one combined streak/due/goal strip, mastery map replaces stat tiles and stacked bars |
| `src/components/MasteryMap.jsx` | **New** |
| `src/components/AnswerLadder.jsx` | Sentence-case labels, key insight uses a marker tint |
| `Mock.jsx`, `Attempts.jsx`, `Settings.jsx` | Removed all-caps labels only. Layouts unchanged |

## Practice as a conversation
- Question is the interviewer's first message, set in serif with the marker stroke drawing in.
- You reply in your own bubble. The interviewer "types" for 650 ms (0 with reduced motion), then the next follow-up lands.
- You can reply to every follow-up. All replies are joined with a blank line and saved as one attempt (same `onRate(id, rating, answer)` contract and same notes format, so history and backups are unaffected).
- Sending an empty box is allowed; the button then reads "Thought it through" and the transcript shows "You thought it through".
- After the last reply: debrief headed by the question it refers to (the answer ladder, key insight and tags are per question, so the debrief restates it), then the answer ladder, what each follow-up tested and your previous attempt, then the Missed/Shaky/Solid dock.
- Keyboard: Ctrl/Cmd+Enter sends from the box; outside it Space/Enter sends and 1/2/3 rates; ignored while another tab is showing. Composer is sticky at the bottom.
- Session summary restyled; progress is a segmented bar, one segment per question.

## Mastery map
- All questions as tiles grouped by topic, colored by status. Tiles due for review pulse.
- Hover or focus shows the question text, status and due description in a caption below the map.
- Click a tile to practice that question (`onStart({only:[id]})`); click a topic name to practice the topic.
- Tiles pop in once with a stagger when the dashboard opens (the one non-interactive motion moment). Legend shows counts.

## Motion rules used
Motion either responds to an action (message arrival, marker drawing under a new question, tab underline, goal bar fill, tile hover) or marks something that needs attention (due-tile pulse). No scroll-triggered or per-card entrance effects. All animation is neutralised under `prefers-reduced-motion`.

## Verification done
- `vite build` passes.
- Playwright screenshots (Chromium via `vite preview`): dashboard light and dark, Practice question, typing state, debrief, mobile 390 px (no horizontal overflow), Library, Mock.
- One practice flow run end to end: send, typing, debrief, rate with key `3`, progress counter advances and progress is saved.
- Not re-run: the earlier vitest/jsdom suite (its temp directory was gone). Its selectors for the old button labels ("Done, hear the follow-up", etc.) no longer apply and need rewriting if the suite is restored.

## Open
- Fonts were not visible in the sandbox screenshots (network blocked); check typography locally with `npm run dev`.
- Library, Mock and Settings keep their old layouts, only recolored.
