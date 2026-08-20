// Shared Groq client for the serverless routes.
//
// Keys are read from the environment here, server-side only, and never leave
// this process. Each task has its own key so a rate limit on one feature
// cannot starve another — and a limited key is never swapped for another
// task's key, the caller falls back to its deterministic path instead.

const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
const TIMEOUT_MS = 7000

export const KEYS = {
  confidence: 'GROQ_API_KEY_CONFIDENCE',
  occasion: 'GROQ_API_KEY_OCCASION',
  crosssell: 'GROQ_API_KEY_CROSSSELL',
}

/**
 * Calls Groq and returns parsed JSON, or null on any failure at all —
 * missing key, timeout, rate limit, non-JSON body, malformed shape.
 * Callers treat null as "use the deterministic fallback".
 */
export async function groqJSON(task, { system, user, maxTokens = 900 }) {
  const key = process.env[KEYS[task]]
  if (!key) return null

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + key,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
      signal: controller.signal,
    })

    // 429 and every other error status take the deterministic path
    if (!res.ok) return null

    const body = await res.json()
    const text = body?.choices?.[0]?.message?.content
    if (typeof text !== 'string') return null

    return JSON.parse(text)
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

// Small helpers so routes can drop malformed fields instead of crashing.
export const asString = (v, max = 220) =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null

export const asArray = (v) => (Array.isArray(v) ? v : [])

export function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return null
    }
  }
  return null
}

export function methodGuard(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return false
  }
  return true
}
