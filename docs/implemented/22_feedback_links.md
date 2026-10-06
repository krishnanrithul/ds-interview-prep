# Feedback links (doc 22)

**Date**: 2026-10-06

- **Report a problem with this question**: in the Practice debrief (under previous attempts), each Mock review question (under the answers) and each open Library question (next to "Practice this question"). Opens the email app with the subject "Saddle Point: problem with question <id>" and a body naming the question id, topic, text and where it was seen, with prompts (senior answer, key point, follow-up, score or grade).
- **Send feedback**: at the bottom of the Dashboard and as Settings > Feedback > "Email us". The body includes the browser's user agent, which helps with device-specific bugs.
- Nothing is sent automatically and answers are never included.
- Address: `FEEDBACK_EMAIL` in `src/lib/feedback.js`, set to Rithul's email. Change it to a dedicated address (or replace the links with a form such as Tally or Google Forms) before sharing publicly, since it appears in every link.
- Files: `src/lib/feedback.js`, `src/components/FeedbackLink.jsx` (new); `Practice.jsx`, `Mock.jsx`, `Library.jsx`, `Settings.jsx`, `Dashboard.jsx`.
