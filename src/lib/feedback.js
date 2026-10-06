// Feedback opens the learner's email app with a pre-filled message. Nothing is sent automatically, and answers are
// never included. Change FEEDBACK_EMAIL to a dedicated address (or swap the links for a form) before a public launch.
export const FEEDBACK_EMAIL = 'krishnanrithul@gmail.com'

const mailto = (subject, body) => `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

export const generalFeedbackUrl = () =>
  mailto('Saddle Point feedback', 'What would you like to tell us?\n\n\n---\nBrowser: ' + (typeof navigator !== 'undefined' ? navigator.userAgent : ''))

export const questionFeedbackUrl = (q, where) =>
  mailto(
    `Saddle Point: problem with question ${q.id}`,
    `Question ${q.id} (${q.topic}): "${q.question}"\nSeen in: ${where}\n\nWhat's wrong? (e.g. the senior answer, a key point, a follow-up, the score or grade)\n\n`,
  )
