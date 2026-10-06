// Reactive Mock: every follow-up is written from the conversation so far.
// The question's fixed follow-ups guide what the interview should cover and are the fallback on any failure.
import { callTool } from './grade'

// Mock follow-ups react to the learner for every question with key points (all topics since 2026-10-06;
// Production ML only before that).
export const reactiveEnabled = (q) => !!q && (q.key_points?.length ?? 0) > 0

const TIMEOUT_MS = 10000 // total, including one retry

const SYSTEM = `You are a senior data science interviewer in a live interview. You will see the main question, the conversation so far, and a planned follow-up. Ask the NEXT follow-up: ONE question that reacts to what the candidate just said, the way a sharp, fair interviewer would.
Decide from the candidate's latest reply first:
- Wrong, vague or unjustified: make them defend or clarify that specific claim.
- "Don't know", very thin or off track: scaffold down. Ask a simpler, concrete question that gets them one step closer, without giving the answer away.
- Doesn't answer what you just asked (sidesteps, answers a different question, or restates the obvious): ask the same thing again more concretely. Do this at most once per question, then move on.
- Short but correct: build on it with the natural next step.
- Solid: move the interview forward, toward the planned follow-up's purpose or the most important key point not yet covered, or one level deeper.
Rules:
- One or two sentences, conversational, addressed to the candidate.
- Never reveal the answer, never list the key points, never grade. Don't open with affirmations or judgments like "Good", "Right", "That makes sense" or "Great"; a real interviewer moves on without telling the candidate how they did.
- Never repeat a question already asked, except the single concrete re-ask above. Don't restate what the candidate said as if they said more than they did.
- Never attribute a claim the candidate did not make. If you refer to their words, copy the exact phrase into "quote".
- Stay on the main question's topic. The planned follow-up shows what this part of the interview should test; adapt it to the conversation rather than copying it.`

const TOOL = {
  name: 'follow_up',
  description: 'Record the next follow-up question to ask.',
  input_schema: {
    type: 'object',
    properties: {
      question: { type: 'string', description: 'The follow-up question to ask the candidate' },
      target: { type: 'string', enum: ['claim', 'scaffold', 'reask', 'missed_point', 'deeper'] },
      quote: { type: 'string', description: 'Exact words from the candidate the question refers to, or empty' },
      point: { type: 'integer', description: 'Number of the key point the question steers toward, or 0' },
    },
    required: ['question', 'target', 'quote', 'point'],
  },
}

// history: [{ who: 'interviewer' | 'candidate', text }], starting with the candidate's main answer.
// guide: the fixed follow-up for this position, { text, intent }.
export async function generateProbe(q, history, guide, key) {
  const said = history.filter((h) => h.who === 'candidate').map((h) => h.text).join('\n')
  const transcript = history
    .map((h) => (h.who === 'interviewer' ? `Interviewer: ${h.text}` : `Candidate: ${h.text.trim().slice(0, 1500) || '(no reply)'}`))
    .join('\n')
  const user = [
    `Main question: ${q.question}`,
    `Key points a strong answer covers:\n${q.key_points.map((p, i) => `${i + 1}. ${p}`).join('\n')}`,
    `Conversation so far:\n<conversation>\n${transcript}\n</conversation>`,
    `Planned follow-up for this point in the interview: "${guide.text}" (it tests: ${guide.intent})`,
  ].join('\n\n')
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS)
  const ask = () => callTool({ key, signal: ctl.signal, system: SYSTEM, user, tool: TOOL, maxTokens: 300 })
  try {
    let input
    try {
      input = await ask()
    } catch (err) {
      // One retry for transient failures (overloaded, rate limit, network); not for a rejected key or a timeout.
      if (err.name === 'AbortError' || /rejected/.test(err.message)) throw err
      console.warn('[reactive mock] first attempt failed, retrying:', err.message)
      input = await ask()
    }
    const question = input?.question?.trim()
    if (!question) throw new Error('No follow-up returned')
    // Only keep a quote that really appears in what the candidate wrote, so "Asked because you said" is never invented.
    const quote = input.quote?.trim() && said.toLowerCase().includes(input.quote.trim().toLowerCase()) ? input.quote.trim() : ''
    const point = Number.isInteger(input.point) && input.point >= 1 && input.point <= q.key_points.length ? input.point - 1 : -1
    return { question, target: input.target, quote, point }
  } finally {
    clearTimeout(timer)
  }
}
