# 15. Practice and mastery map changes

## What changed
1. **Tile preview in the mastery map.** Clicking a tile opens a preview inside that topic, directly under its tiles: question, rating status, up to three tags, Practice and Close. The clicked tile gets a ring; clicking it again closes the preview. Replaced the caption that sat under the whole map, which was off-screen for topics near the top. A floating bubble was tried first and dropped: it covered the map and sat in the wrong place.
2. **Easier-first queue.** Unseen questions get a bonus by level (Foundations +0.6, Core +0.3, Advanced 0) in `scored()` in `src/lib/queue.js`. The gaps exceed the 0 to 0.5 random nudge, so within a topic an unseen Foundations question always outranks an unseen Advanced one. Due reviews (score 5 or more) still come first. No login needed: "unseen" just means no rating stored in this browser.
3. **Practice these again.** A button on the end-of-session screen reruns the same questions (`onRedo` in `App.jsx` calls `start({ topic, only: ids })`), with new follow-up wording from doc 14.
4. **Debrief shows your replies.** Each follow-up in the Practice debrief shows the wording asked, your reply ("You said", or "No written reply") and what it was testing.

## Files
`src/components/MasteryMap.jsx`, `src/lib/queue.js`, `src/components/Practice.jsx`, `src/App.jsx`.

## How to verify
- New browser profile, click Practice on the ML row: the first questions are Foundations, then Core.
- Click a tile in SQL (top of the map): the preview appears under SQL's tiles.
- Finish a session: "Practice these again" sits next to "Another session".
- Answer a follow-up, finish the question: the debrief shows your reply under that follow-up.

## Open
- A mixed all-topics session for a new learner is all Foundations until the 25 easy questions are seen. Fine for beginners, slow for senior users; a starting-level choice would fix it.
