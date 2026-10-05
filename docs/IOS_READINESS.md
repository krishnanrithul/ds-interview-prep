# Saddle Point on iOS: what's needed first

Written 2026-10-05. Assumes the content (questions, key points, variants) has been reviewed. Apple and Capacitor details are as known on that date: check Apple's current App Review Guidelines and developer program terms before submitting.

## 1. Decisions to make first
These change everything below, so settle them before writing iOS code.

| Decision | Options | Why it matters for iOS |
|---|---|---|
| **Who pays for AI grading** | (a) Users bring their own Anthropic key (today). (b) A hosted backend holds the key, with sign-in, a daily quota per user and a monthly spend cap. | Most App Store users have no API key, so with (a) the grade and reactive Mock are invisible to almost everyone. With (b) you pay, and if you charge for it, Apple requires in-app purchase (guideline 3.1.1) and takes 15% (Small Business Program) or 30%. |
| **How to ship** | (a) PWA: installable from Safari, no App Store. (b) Capacitor: wraps the existing React app as a real App Store app. (c) Native rewrite (Swift or React Native). | (a) is days of work; (b) is the realistic App Store route and reuses all the code; (c) isn't worth it at this stage. |
| **Where progress lives** | (a) On the device only (today). (b) Synced through an account. | iOS can clear a web view's storage under space pressure, and users expect progress to survive a new phone. (b) needs the backend from the first decision. |

**Recommended order:** launch the web app and add PWA support first, then make the backend decision, then wrap with Capacitor once there are real users.

## 2. Needed whatever the route (shared with the web launch)
- [ ] **Name cleared**: trademark search for "Saddle Point" (USPTO, IP India) for software and education, plus a domain.
- [ ] **New logo** that fits the name (a saddle surface or a mountain pass). Keep `Logo.jsx` and `public/favicon.svg` in sync, then export the iOS icon set (1024 px master).
- [ ] **Privacy policy** page: what's stored on the device, and that answers go to Anthropic when an API key (or the hosted backend) is used. Needed for the App Store listing and good practice for the web.
- [ ] **Support and feedback link** (an email or form). Apple requires a support URL.
- [ ] **Tap targets** at least 44 px: the mastery-map tiles are 28 to 32 px.
- [ ] **Safari tested** (desktop and iOS): the whole app, especially the match-score worker and WebAssembly. Only Chromium has been tested so far.
- [ ] **Reactive Mock** checked with real runs, then switched on for all topics (`REACTIVE_TOPICS` in `src/lib/probe.js`).
- [ ] **Error reporting** (e.g. Sentry or a minimal logger) so crashes on phones are visible.

## 3. PWA (route a): installable from Safari
- [ ] `manifest.webmanifest`: name, short name, icons (192 and 512 px, plus `apple-touch-icon` 180 px), theme and background colors, `display: standalone`.
- [ ] Service worker: cache the app shell and the score model files so the app opens offline after the first visit.
- [ ] iOS meta tags: `apple-mobile-web-app-capable`, status-bar style, safe-area insets (`env(safe-area-inset-*)`) so nothing hides under the notch or home indicator.
- [ ] Reminders: iOS allows web push only for apps added to the Home Screen (iOS 16.4 and later), and it needs a push server. Without one, reminders still only fire while the app is open.
- [ ] Explain "Add to Home Screen" in the app, since Safari doesn't prompt for it.
Limits: no App Store presence, and storage can still be cleared if the site goes unused for a long time.

## 4. Capacitor (route b): App Store app
**Accounts and tools**
- [ ] Apple Developer Program membership ($99 a year).
- [ ] Xcode on the Mac, a bundle ID (e.g. `app.saddlepoint`), signing certificates and provisioning profiles.

**Code changes**
- [ ] Add Capacitor (`@capacitor/core`, `@capacitor/ios`), point it at the Vite `dist` build, and add an `ios/` project.
- [ ] **Storage**: move progress, notes, settings and the API key out of `localStorage` into native storage (`@capacitor/preferences`, or SQLite for attempts), behind one storage module so web and iOS share code. Migrate existing data on first launch.
- [ ] **Reminders**: replace the browser Notification API with `@capacitor/local-notifications` so reminders fire when the app is closed.
- [ ] **Score model**: decide whether to bundle the 23 MB model and 27 MB runtime in the app (bigger download, works offline from the start) or fetch them on first use (smaller app, needs network once). Test memory on an older iPhone; the worker plus model can use a few hundred MB.
- [ ] **WebAssembly in the iOS web view**: confirm the ONNX runtime runs (threads may be unavailable without cross-origin isolation; the single-threaded path must work and be fast enough).
- [ ] **API calls**: confirm direct calls to `api.anthropic.com` work from the app's origin (`capacitor://localhost`), or route them through the backend.
- [ ] **Keyboard and layout**: the answer box must stay visible above the keyboard, with safe areas respected and no horizontal scroll at 390 px or below.
- [ ] **Backups**: replace the download link with the iOS share sheet (`@capacitor/share` or the filesystem plugin).
- [ ] **Links**: open external links in Safari, not inside the app.

**App Store review**
- [ ] **Minimum functionality (guideline 4.2)**: wrapped websites get rejected if they feel like one. Native storage, local notifications, the share sheet, offline use and no browser chrome all help.
- [ ] **API key entry**: asking consumers to paste an Anthropic key is awkward and may draw questions in review. A hosted backend, or hiding the option behind an "Advanced" setting, is safer.
- [ ] **In-app purchase (3.1.1)**: required if you sell AI grading or any premium feature inside the app.
- [ ] **Privacy labels** in App Store Connect: on-device only today; with grading, "user content sent to a third party (Anthropic) for app functionality". With a backend, also account and usage data.
- [ ] **Listing**: screenshots for the required iPhone sizes, description, keywords, age rating, privacy policy URL, support URL.
- [ ] **TestFlight** beta on a few real devices, including an older iPhone, before submitting.

## 5. Rough effort (one person, part time)
| Step | Effort |
|---|---|
| Shared launch items (section 2), excluding the logo design | 1 to 2 weeks |
| PWA (section 3) | 2 to 4 days |
| Hosted backend with sign-in, quotas, spend cap (only if chosen) | 1 to 2 weeks |
| Capacitor app and code changes (section 4) | 1 to 2 weeks |
| App Store listing, TestFlight, review back-and-forth | 1 to 2 weeks |
