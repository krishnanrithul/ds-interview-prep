// Optional AI grade: one Haiku call per answer, using the learner's own Anthropic API key.
// The embedding score says whether an idea was mentioned; this says whether it was right.
import { safeParse } from './safeStorage'

export const API_KEY_STORAGE = 'ds-anthropic-key'
const CACHE_KEY = 'ds-grades'
const MODEL = 'claude-haiku-4-5'
const MAX_ANSWER = 4000 // room for a Mock transcript; Practice answers are usually far shorter

// Local development only: VITE_ANTHROPIC_API_KEY from .env.development.local (gitignored). Vite loads that file only
// for the dev server, and the DEV check lets the production build drop this branch, so a deployed build never
// carries the key. A key saved in Settings takes priority.
const DEV_KEY = import.meta.env.DEV ? (import.meta.env.VITE_ANTHROPIC_API_KEY || '') : ''
const storedKey = () => { try { return localStorage.getItem(API_KEY_STORAGE) || '' } catch { return '' } }
export const getApiKey = () => storedKey() || DEV_KEY
export const apiKeySource = () => (storedKey() ? 'settings' : DEV_KEY ? 'env' : null)
export const setApiKey = (k) => { try { k ? localStorage.setItem(API_KEY_STORAGE, k) : localStorage.removeItem(API_KEY_STORAGE) } catch { /* ignore */ } }

const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36) }
const fuSig = (fus) => (fus?.length ? fus.map((f) => `${f.text}=>${f.reply || ''}`).join('|') : '')
const cacheId = (q, answer, fus) => `${q.id}:${hash('v5|' + q.key_points.join('|') + '\n' + answer + '\n' + fuSig(fus))}`

export function cachedGrade(q, answer, fus = null) {
  return safeParse(CACHE_KEY, {})[cacheId(q, answer, fus)] || null
}
function storeGrade(q, answer, fus, result) {
  const all = safeParse(CACHE_KEY, {})
  all[cacheId(q, answer, fus)] = result
  const keys = Object.keys(all)
  if (keys.length > 200) keys.slice(0, keys.length - 200).forEach((k) => delete all[k])
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(all)) } catch { /* full storage: skip caching */ }
}

// One forced tool call to Claude from the browser with the learner's own key. Returns the tool input.
export async function callTool({ key, signal, system, user, tool, maxTokens = 800 }) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal,
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      tools: [tool],
      tool_choice: { type: 'tool', name: tool.name },
      messages: [{ role: 'user', content: user }],
    }),
  })
  if (!res.ok) {
    let msg = `Request failed (${res.status})`
    try { msg = (await res.json())?.error?.message || msg } catch { /* keep default */ }
    if (res.status === 401) msg = 'The API key was rejected. Check it in Settings.'
    throw new Error(msg)
  }
  const body = await res.json()
  return body.content?.find((c) => c.type === 'tool_use')?.input
}

const SYSTEM = `You grade a candidate's answer to a data science interview question against a list of key points.
For each key point decide:
- "correct": the answer makes this point, or an equivalent one, and gets it right. Different wording is fine.
- "partial": the answer gets part of the point right but leaves out an essential part of it (for example describes one step of a two-step process).
- "wrong": the answer addresses this point but says something incorrect, or the opposite of it.
- "missing": the answer does not address it.
Judge meaning, not wording. Do not give credit for vague gestures toward a point. Do not invent claims the candidate did not make.
If the answer is an interview transcript, credit only the candidate's lines. Ideas that appear only in the interviewer's questions earn no credit, even if the candidate agreed with them briefly.
Each note is one short sentence addressed to the candidate. For "wrong", say what is wrong and why. For "partial", say what part is missing. For "missing", say what they should have added. For "correct", note can be empty.
The summary is one or two sentences: the most important thing to fix, or what made the answer strong.`

const TOOL = {
  name: 'grade',
  description: 'Record the grade for each key point.',
  input_schema: {
    type: 'object',
    properties: {
      points: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            n: { type: 'integer', description: 'Key point number, starting at 1' },
            status: { type: 'string', enum: ['correct', 'partial', 'wrong', 'missing'] },
            note: { type: 'string' },
          },
          required: ['n', 'status', 'note'],
        },
      },
      summary: { type: 'string' },
    },
    required: ['points', 'summary'],
  },
}

// fus (optional): Practice follow-ups [{ text, intent, reply }]. Each reply gets its own verdict; the key points
// are still judged on the main answer only, so the score stays comparable across attempts.
const FU_RULES = `
Follow-up replies: for each, give a verdict:
- "good": answers what was asked and is right.
- "partial": on the right track but incomplete or vague.
- "weak": wrong, off the point, or doesn't answer what was asked.
- "none": no reply.
The note is one short sentence addressed to the candidate: for partial, weak or none, what a strong reply would have said; for good it can be empty. Don't repeat the follow-up back.`

const TOOL_FU = {
  ...TOOL,
  input_schema: {
    ...TOOL.input_schema,
    properties: {
      ...TOOL.input_schema.properties,
      follow_ups: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            n: { type: 'integer', description: 'Follow-up number, starting at 1' },
            verdict: { type: 'string', enum: ['good', 'partial', 'weak', 'none'] },
            note: { type: 'string' },
          },
          required: ['n', 'verdict', 'note'],
        },
      },
    },
    required: [...TOOL.input_schema.required, 'follow_ups'],
  },
}

export async function gradeAnswer(q, answer, key, signal, fus = null) {
  const text = answer.trim().slice(0, MAX_ANSWER)
  const cached = cachedGrade(q, text, fus)
  if (cached) return cached
  const withFus = !!fus?.length
  const user = [
    `Question: ${q.question}`,
    `Reference senior answer: ${q.senior_answer}`,
    `Key points:\n${q.key_points.map((p, i) => `${i + 1}. ${p}`).join('\n')}`,
    `Candidate answer:\n<answer>\n${text}\n</answer>`,
    ...(withFus ? [
      'Judge the key points on the candidate answer above only. Then judge each follow-up reply on its own:',
      fus.map((f, i) => `Follow-up ${i + 1}: ${f.text}\n(It tests: ${f.intent})\nCandidate reply: <reply>${(f.reply || '').trim().slice(0, 1200) || '(no reply)'}</reply>`).join('\n\n'),
    ] : []),
  ].join('\n\n')
  const input = await callTool({ key, signal, system: withFus ? SYSTEM + FU_RULES : SYSTEM, user, tool: withFus ? TOOL_FU : TOOL, maxTokens: withFus ? 1200 : 800 })
  if (!input?.points) throw new Error('The grader returned an unexpected response.')
  const byN = new Map(input.points.map((p) => [p.n, p]))
  const result = {
    points: q.key_points.map((_, i) => {
      const p = byN.get(i + 1)
      return { status: p?.status || 'missing', note: p?.note || '' }
    }),
    summary: input.summary || '',
    followUps: withFus
      ? fus.map((f, i) => {
        const r = (input.follow_ups || []).find((x) => x.n === i + 1)
        return { verdict: r?.verdict || (f.reply?.trim() ? 'partial' : 'none'), note: r?.note || '' }
      })
      : null,
    model: MODEL,
  }
  storeGrade(q, text, fus, result)
  return result
}
