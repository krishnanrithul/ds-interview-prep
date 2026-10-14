# Privacy note, invite-code proxy, icons and PWA (doc 24)

**Date**: 2026-10-14. Rithul deployed the app to Vercel himself before this change.

## Privacy note
`src/components/Privacy.jsx`, opened from Settings ("Privacy details", footer) and the Dashboard footer (next to "Send feedback"); Back returns to where it was opened. Plain language, matching what the code actually does:
- Stays on the device: progress, ratings, answers, scores, settings, API key and invite code (localStorage); Clear all data deletes them; backups exclude the key and the invite code.
- Grading on: the question, key points, reference answer and what the learner wrote for it go to Anthropic, straight from the browser with the learner's key, or through `api/claude` on Vercel with an invite code (not stored there).
- Other services: Vercel (hosting, standard request logs), Hugging Face (one-time model download; answers are scored on the device), Google Fonts (sees the IP). No analytics, ads or tracking.
- Feedback links send nothing on their own.
If anything new leaves the device, update this page (the launch-reviewer agent checks it).

## Invite-code proxy
`api/claude.js`, a Vercel Function. Testers enter an invite code in Settings > AI feedback instead of an API key; their grading and interviewer calls go to `/api/claude`, which adds the owner's key server-side and forwards to Anthropic.
- Accepts only the app's own call shape: model `claude-haiku-4-5`, one message, one tool forced by `tool_choice`, `max_tokens` up to 1,500, body up to 40,000 characters. Anything else gets 400, so it can't be used as a general Claude proxy.
- Errors: 503 when the env vars are missing, 401 for a wrong code ("That invite code wasn't accepted"), 405 for non-POST, 502 if Anthropic can't be reached. Logs the status and the first three characters of the code for each call.
- Client (`src/lib/grade.js`): `getApiKey()` returns the learner's key, else the dev key, else `invite:<code>`; `callTool` sends invite calls to `/api/claude` with an `x-invite-code` header and no key. The learner's own key always takes priority. Invite codes don't work on `npm run dev` (no `/api` there): the app says "Invite codes only work on the deployed site."
- Settings: invite code first, own API key as the alternative; shows which is in use with Remove. Copy elsewhere now says "Add an invite code or an API key".
- No per-code rate limit yet (needs storage such as Vercel KV); the Anthropic spend limit is the hard cap. Revoke a code by removing it from `INVITE_CODES` and redeploying.
- Tested: handler with fake requests and a fake Anthropic (no env 503, wrong code 401, other model, too many tokens, no forced tool and oversized body all 400, valid call forwarded with the server key and no browser header); the built app with an invite code (grading went to `/api/claude`, no key in the request, zero direct Anthropic calls).

**Setup (Rithul, once):**
1. Create a separate Anthropic key for the proxy (e.g. "saddle-point-proxy"), so it can be revoked without touching his own.
2. Vercel > the project > Settings > Environment Variables: `ANTHROPIC_API_KEY` = that key; `INVITE_CODES` = comma-separated codes (e.g. one per tester group). Production environment. Redeploy.
3. Anthropic Console: set a monthly spend limit (the hard cap on tester cost).
4. On the live site: Settings > AI feedback > invite code, then grade one Practice answer.

## Icons and PWA
- `public/`: `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (artwork inside the safe zone for Android's circular crop), `icon-1024.png` (App Store master), `favicon-32.png`. Full-bleed squares from the mountain-pass mark; phones round the corners. Regenerate from `Logo.jsx` artwork if the mark changes.
- `public/manifest.webmanifest`: name, standalone display, theme and background `#0F4741`, icons.
- `public/sw.js`: pages network-first with the cached shell as offline fallback; `/assets/*` cache-first (hashed names, including the ONNX runtime once used); Google Fonts stale-while-revalidate; never touches `/api/`, Anthropic or Hugging Face (transformers.js caches the model itself). Registered in `src/main.jsx` in production builds only. Bump `VERSION` in `sw.js` to clear old caches.
- `vercel.json`: `sw.js` served `no-cache` so updates reach users; manifest content type; `/assets/*` immutable for a year.
- `index.html`: manifest, Apple touch icon, PNG favicon, `viewport-fit=cover`, iOS standalone meta tags.
- Safe areas: the header pads for the notch and status bar; the main area and Practice's sticky answer box clear the home indicator and rounded corners.
- Tested in Chromium as a phone: manifest and icons load, the service worker activates, offline reload shows the app with all 155 questions, nothing under `/api` is cached. Not tested: real iPhone Safari "Add to Home Screen" (Rithul's iPhone check).
