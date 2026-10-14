// Vercel Function: forwards Saddle Point's grading and interviewer calls to Anthropic with the owner's API key,
// for testers who have an invite code instead of their own key. The key stays on the server.
//
// Vercel project settings > Environment Variables:
//   ANTHROPIC_API_KEY  the owner's key
//   INVITE_CODES       comma-separated codes, e.g. "alpha-7k2,beta-q9x" (remove one to revoke it)
// Also set a monthly spend limit in the Anthropic Console: it's the hard cap on what testers can cost.
//
// Only the app's own call shape is accepted (one forced tool call to Haiku with bounded size), so the endpoint
// can't be used as a general-purpose Claude proxy.

const MODEL = 'claude-haiku-4-5'
const MAX_TOKENS = 1500
const MAX_BODY_CHARS = 40000

const fail = (res, status, message) => res.status(status).json({ type: 'error', error: { message } })

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return fail(res, 405, 'Method not allowed')
  }

  const key = process.env.ANTHROPIC_API_KEY
  const codes = (process.env.INVITE_CODES || '').split(',').map((s) => s.trim()).filter(Boolean)
  if (!key || !codes.length) return fail(res, 503, 'Invite codes are not set up on this server yet.')

  const code = String(req.headers['x-invite-code'] || '').trim()
  if (!codes.includes(code)) return fail(res, 401, "That invite code wasn't accepted.")

  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { return fail(res, 400, 'Invalid JSON') }
  }
  const ok = body
    && body.model === MODEL
    && Number.isInteger(body.max_tokens) && body.max_tokens > 0 && body.max_tokens <= MAX_TOKENS
    && Array.isArray(body.messages) && body.messages.length === 1
    && Array.isArray(body.tools) && body.tools.length === 1
    && body.tool_choice?.type === 'tool' && body.tool_choice?.name === body.tools[0]?.name
    && JSON.stringify(body).length <= MAX_BODY_CHARS
  if (!ok) return fail(res, 400, 'Request not allowed')

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: body.max_tokens,
        system: body.system,
        tools: body.tools,
        tool_choice: body.tool_choice,
        messages: body.messages,
      }),
    })
    const text = await upstream.text()
    // Which code was used (first characters only), for spotting abuse in Vercel's logs.
    console.log(`claude ${upstream.status} code=${code.slice(0, 3)}…`)
    res.status(upstream.status).setHeader('content-type', 'application/json')
    return res.send(text)
  } catch (err) {
    console.error('upstream error', err)
    return fail(res, 502, 'Could not reach the grading service. Try again.')
  }
}
