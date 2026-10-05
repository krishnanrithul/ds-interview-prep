// Optional AI grade: one Haiku call per answer, using the learner's own Anthropic API key.
// The embedding score says whether an idea was mentioned; this says whether it was right.
import { safeParse } from './safeStorage'

export const API_KEY_STORAGE = 'ds-anthropic-key'
const CACHE_KEY = 'ds-grades'
const MODEL = 'claude-haiku-4-5'
const MAX_ANSWER = 2000

export const getApiKey = () => { try { return localStorage.getItem(API_KEY_STORAGE) || '' } catch { return '' } }
export const setApiKey = (k) => { try { k ? localStorage.setItem(API_KEY_STORAGE, k) : localStorage.removeItem(API_KEY_STORAGE) } catch { /* ignore */ } }

const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36) }
const cacheId = (q, answer) => `${q.id}:${hash('v3|' + q.key_points.join('|') + '\n' + answer)}`

export function cachedGrade(q, answer) {
  return safeParse(CACHE_KEY, {})[cacheId(q, answer)] || null
}
function storeGrade(q, answer, result) {
  const all = safeParse(CACHE_KEY, {})
  all[cacheId(q, answer)] = result
  const keys = Object.keys(all)
  if (keys.length > 200) keys.slice(0, keys.length - 200).forEach((k) => delete all[k])
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(all)) } catch { /* full storage: skip caching */ }
}

const SYSTEM = `You grade a candidate's answer to a data science interview question against a list of key points.
For each key point decide:
- "correct": the answer makes this point, or an equivalent one, and gets it right. Different wording is fine.
- "partial": the answer gets part of the point right but leaves out an essential part of it (for example describes one step of a two-step process).
- "wrong": the answer addresses this point but says something incorrect, or the opposite of it.
- "missing": the answer does not address it.
Judge meaning, not wording. Do not give credit for vague gestures toward a point. Do not invent claims the candidate did not make.
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

export async function gradeAnswer(q, answer, key, signal) {
  const text = answer.trim().slice(0, MAX_ANSWER)
  const cached = cachedGrade(q, text)
  if (cached) return cached
  const user = [
    `Question: ${q.question}`,
    `Reference senior answer: ${q.senior_answer}`,
    `Key points:\n${q.key_points.map((p, i) => `${i + 1}. ${p}`).join('\n')}`,
    `Candidate answer:\n<answer>\n${text}\n</answer>`,
  ].join('\n\n')
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
      max_tokens: 800,
      system: SYSTEM,
      tools: [TOOL],
      tool_choice: { type: 'tool', name: 'grade' },
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
  const input = body.content?.find((c) => c.type === 'tool_use')?.input
  if (!input?.points) throw new Error('The grader returned an unexpected response.')
  const byN = new Map(input.points.map((p) => [p.n, p]))
  const result = {
    points: q.key_points.map((_, i) => {
      const p = byN.get(i + 1)
      return { status: p?.status || 'missing', note: p?.note || '' }
    }),
    summary: input.summary || '',
    model: body.model || MODEL,
  }
  storeGrade(q, text, result)
  return result
}
