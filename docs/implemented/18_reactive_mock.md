# Reactive Mock follow-up (doc 18)

**Date**: 2026-10-05
**Scope**: Production ML questions in Mock (15). THINGS_TO_DO 1.5.

## What changed
- After the main answer, "Done, hear the follow-up" sends the question, its key points and the answer to Haiku, which writes one follow-up that replaces fixed follow-up 1. Follow-ups 2 and 3 stay fixed.
- What it aims at, in order: a wrong, vague or unjustified claim in the answer; otherwise the most important missed key point (steered toward, not named); otherwise one level deeper on something the learner said.
- While it waits: "The interviewer is reading your answer" with typing dots; the button is disabled.
- The follow-up shows "Interviewer follow-up 1 · reacting to your answer".
- Review screen: instead of "Testing: …", the reactive follow-up says why it was asked: "Asked because you said “…”" (only when the quoted words really appear in the answer, checked in code), "Asked to steer you toward: <key point>", or "Asked to push deeper on your answer".
- Setup screen notes that Production ML questions get a reacting follow-up, or that it needs an API key.
- Fallback: no key, an API error or no reply within 10 seconds means the fixed follow-up is asked, so Mock never breaks. One retry on transient errors (not on a rejected key or a timeout). When it falls back with a key set, a muted line under the follow-up says why, and the reason is logged to the console as `[reactive mock]`. Added after a real run fell back silently.

## Files
New: `src/lib/probe.js` (prompt, tool schema, `REACTIVE_TOPICS`, 10 s timeout with one retry, quote check).
Changed: `src/components/Mock.jsx`; `src/lib/grade.js` (the API call is now the shared `callTool()` used by both the grade and the probe).

## Cost
One Haiku call per Production ML question in Mock, up to 300 output tokens: under $0.003.

## Tests (built app, headless Chromium, mocked API)
- With a key: the thinking state shows, the probe replaces follow-up 1 with its label, and the review shows "Asked because you said “just retrain on the latest data”". Request checked: tool `follow_up`, model `claude-haiku-4-5`.
- API error: the fixed follow-up is asked and the review shows its usual "Testing" line.
- No key: no call is made; the fixed follow-ups are used and setup says a key is needed.
Not tested: real Haiku probes. The first real ones should be checked by hand for whether they target the right thing, never invent claims and never give the answer away.

## Open
- Widen `REACTIVE_TOPICS` after checking real probes.
- A second probe on the learner's reply to the first.
- Mock still has one answer box for the main answer and all follow-up replies; the probe reads the box as it is when the main answer is sent. A back-and-forth layout (THINGS_TO_DO) would make that clearer.

## Update: back-and-forth, every follow-up reactive (2026-10-05)
Prompted by a real run: the first follow-up scaffolded down after "Don't know", the learner replied "Data drift", and the fixed follow-up 2 then jumped to a question that assumed a strong answer. Mock also used one shared answer box, so replies to individual follow-ups could not be read.
- **Layout.** Mock is now a conversation: answer the main question, it shows as a bubble, the interviewer's follow-up appears, reply, and so on. Each reply has its own box (Cmd/Ctrl + Enter sends). An empty reply is "Skip, I'd pass" and shows as "You passed". After the last follow-up, "Next question" or "Finish interview" appears. Replaces the THINGS_TO_DO item "Mock layout: all follow-ups stack above one text box".
- **Every follow-up reacts** (Production ML, with a key). Each call sends the main question, the key points, the whole conversation so far and the fixed follow-up for that position as a guide ("what this part of the interview should test"). The model reacts to the latest reply: defends a wrong or vague claim, scaffolds down after "don't know" or a thin reply, builds on a short correct one, or moves forward when it's solid. Still three follow-ups per question.
- **Review** shows each follow-up, why it was asked ("Asked because you said …", "A simpler step, because your last reply was thin", "Asked to steer you toward: …", "Asked to push deeper", or "Testing: …" for fixed ones) and the learner's reply under it.
- **Saved attempt**: the main answer plus each follow-up and reply, as one text, so "Your previous attempts" shows the whole exchange.
- Non-reactive topics use the same layout with the fixed follow-ups.
- Cost: up to three Haiku calls per Production ML question, about $0.008.

### Tests (built app, headless Chromium, mocked API)
- Production ML with a key: three calls, each with the full conversation (a skipped reply is sent as "(no reply)"); review reasons and replies render; the saved attempt holds the transcript.
- First attempt "Overloaded", retry succeeds: no fallback note.
- Both attempts fail: fixed follow-up with "Couldn't react to your answer (Overloaded)…", interview continues.
- SQL: no API calls, fixed follow-ups in the new layout.
Not tested: real Haiku follow-ups across a whole question.

## Update: grading in the Mock review, firmer follow-ups (2026-10-05)
From a real run: the review had no grade, and the follow-ups opened with "Good—" and "That makes sense—", including after a reply that didn't answer the question.
- **Mock review grades each question** with the same key-points panel as Practice (all topics). The live score reads only the learner's words (main answer plus replies). The Haiku grade reads the labeled conversation ("Candidate (answer to the main question): …", "Interviewer: …", "Candidate: …") and the grader prompt now says to credit only the candidate's lines, never ideas that appear only in the interviewer's questions. Answer cap raised to 4,000 characters for transcripts. `KeyPointsReview` takes an optional `gradeText`.
- **Probe prompt:** no affirmations or judgments ("Good", "Right", "That makes sense", "Great"); if a reply doesn't answer what was asked, ask it again more concretely, at most once per question (new target `reask`, shown in the review as "Asked again, because your reply didn't answer it"); don't restate the candidate's words as if they said more.
- Grade cache version bumped, so earlier cached grades aren't reused.

## Update: overall interview grade (2026-10-05)
The point of a Mock is to see how you did overall, so the review now opens with a summary card:
- **Interview score**: the average of the per-question scores ("42% of a senior answer, across the interview"), with a bar and a line saying whether it is graded by Haiku, partly graded, or based on which ideas were mentioned. "Scoring your interview…" shows while grades are coming in.
- **Verdict** from the score: 75%+ "Strong: close to senior level on most questions"; 50 to 74 "A solid base, with gaps to close"; 25 to 49 "Partly there: important ideas were missing"; under 25 "Not ready yet: most key points were missing" (`interviewVerdict` in `src/lib/match/index.js`).
- **Strongest and biggest gap**: the highest- and lowest-scoring questions with their scores.
- **Suggested ratings**: each question's Missed it / Shaky / Solid is pre-filled from its score (70%+ Solid, 40 to 69 Shaky, under 40 Missed it; `ratingFromScore`) and can be changed before saving; a changed rating no longer follows the score.
- `KeyPointsReview` reports its score through `onScore({ pct, status })` (graded, estimate, empty, pending, unavailable). Unanswered questions count as 0%; questions whose scoring couldn't run are left out of the average.
- Test (mocked grades of 75%, 8% and 42%): overall 42%, verdict "Partly there", strongest and biggest gap correct, ratings Solid / Missed it / Shaky, and an override sticks.
