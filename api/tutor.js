// Serverless proxy for Teacher Gabay (Node runtime).
// Kept SEPARATE from the client — this is the ONLY place Vertex/Gemini creds live.
// The PWA POSTs { question, ref, lang } here; this returns { text, source }.
//
// Exposed as POST /api/tutor.
//
// Required env vars:
//   GCP_PROJECT            your Google Cloud project id
//   GCP_LOCATION           region, e.g. us-central1  (optional, defaults below)
//   GCP_SA_KEY             service-account JSON, single-line (stringified)
//   GEMINI_MODEL           optional model override (default gemini-2.5-pro)
//   TUTOR_RATE_LIMIT       optional per-IP requests/minute (default 10)
// NEVER commit creds. If GCP_PROJECT/GCP_SA_KEY are unset the handler returns a
// curriculum-grounded placeholder so the full client chain stays testable.
//
// Edge backend (D-018): TUTOR_BACKEND=edge (read per request) answers from a model
// served on the team's own machine instead of Vertex. Env vars:
//   EDGE_LLM_URL           OpenAI-compatible server, default http://127.0.0.1:1234 (LM Studio)
//   EDGE_MODEL             default google/gemma-4-e2b
//   EDGE_TIMEOUT_MS        upstream timeout, default 20000
// The upstream server must never be exposed directly; only this handler is.
//
// Uses the modern Google Gen AI SDK (@google/genai) in Vertex mode.
//
// SECURITY: the system instruction is built HERE from the request's ref+lang
// against the bundled curriculum. It is never accepted from the client — doing
// so turned this endpoint into an open, billable Gemini proxy for any caller.

import { GoogleGenAI } from '@google/genai'
import { getAllContent } from '../src/lib/content-catalog.js'
import { guard, parseBody } from './_shared.js'
import { buildTutorPrompt, isKnownLang, DEFAULT_LANG } from '../src/lib/tutor-prompt.js'
import { MODE_IDS, normalizeMode } from '../src/lib/tutor-modes.js'

const LOCATION = process.env.GCP_LOCATION || 'us-central1'
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-pro'
const RATE_LIMIT = Number(process.env.TUTOR_RATE_LIMIT || 10)
const MAX_BODY_BYTES = 8_000
const MAX_QUESTION_CHARS = 1_000

const catalogByRef = new Map(getAllContent().map((competency) => [competency.ref, competency]))

// The prompt is shared with the on-device path (src/lib/tutor-prompt.js), so
// Nano, the local model, and the cloud teach identically. Kept exported as a
// thin wrapper for the existing tests.
export function gabayPrompt(competency, lang = DEFAULT_LANG, options) {
  return buildTutorPrompt(competency, lang, options)
}

export function validateRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'invalid_body'
  const question = String(body.question ?? '').trim()
  if (!question) return 'no_question'
  if (question.length > MAX_QUESTION_CHARS) return 'question_too_long'
  if (typeof body.ref !== 'string' || !catalogByRef.has(body.ref)) return 'unknown_ref'
  if (body.lang !== undefined && !isKnownLang(body.lang)) return 'invalid_language'
  if (body.mode !== undefined && !MODE_IDS.includes(body.mode)) return 'invalid_mode'
  return null
}

function getCredentials() {
  // Service-account JSON passed as a single env var string.
  if (!process.env.GCP_SA_KEY) return null
  try {
    return JSON.parse(process.env.GCP_SA_KEY)
  } catch {
    return null
  }
}

let _client = null
function genaiClient() {
  if (_client) return _client
  const project = process.env.GCP_PROJECT
  const credentials = getCredentials()
  if (!project || !credentials) return null
  _client = new GoogleGenAI({
    vertexai: true,
    project,
    location: LOCATION,
    googleAuthOptions: { credentials },
  })
  return _client
}

function placeholder() {
  return 'Teacher Gabay is resting. Please try again soon.'
}

// Edge backend: one chat completion against an OpenAI-compatible local server.
// reasoning_effort 'none' is required for Gemma 4 on LM Studio: without it every
// token goes to reasoning_content and the visible content comes back empty.
async function edgeComplete(system, question) {
  const base = (process.env.EDGE_LLM_URL || 'http://127.0.0.1:1234').replace(/\/+$/, '')
  const timeoutMs = Number(process.env.EDGE_TIMEOUT_MS) || 20_000
  const response = await fetch(`${base}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.EDGE_MODEL || 'google/gemma-4-e2b',
      temperature: 0.4,
      max_tokens: 300,
      reasoning_effort: 'none',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: question },
      ],
    }),
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!response.ok) throw new Error('edge upstream error')
  const data = await response.json()
  const text = data?.choices?.[0]?.message?.content
  if (typeof text !== 'string' || !text.trim()) throw new Error('empty completion')
  return text.trim()
}

export default async function handler(req, res) {
  if (await guard(req, res, { bucket: 'tutor', limit: RATE_LIMIT, maxBytes: MAX_BODY_BYTES })) return

  const { body, error: parseError } = parseBody(req, MAX_BODY_BYTES)
  if (parseError) return res.status(parseError === 'invalid_json' ? 400 : 413).json({ error: parseError })

  const error = validateRequest(body)
  if (error) return res.status(400).json({ error })

  const question = String(body.question).trim()
  const lang = body.lang ?? DEFAULT_LANG
  const mode = normalizeMode(body.mode)
  const competency = catalogByRef.get(body.ref)?.competency ?? ''

  if (process.env.TUTOR_BACKEND === 'edge') {
    try {
      // The compact prompt: small local models loop on the long one (D-009).
      const text = await edgeComplete(gabayPrompt(competency, lang, { mode, short: true }), question)
      return res.status(200).json({ text, source: 'edge' })
    } catch {
      // Not echoed: upstream errors can carry local URLs and model details.
      return res.status(502).json({ error: 'edge_failed' })
    }
  }

  const system = gabayPrompt(competency, lang, { mode })

  const ai = genaiClient()

  // No creds — return the testable placeholder so Nano -> proxy -> cached chain works.
  if (!ai) {
    return res.status(200).json({ text: placeholder(), source: 'placeholder' })
  }

  try {
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts: [{ text: question }] }],
      config: {
        systemInstruction: system,
        temperature: 0.7,
        // 2.5-pro is a thinking model — thinking tokens count against the budget,
        // so keep headroom or the visible answer can come back empty.
        maxOutputTokens: 2048,
      },
    })
    const text =
      result?.text ??
      result?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ??
      ''
    if (!text) throw new Error('empty completion')
    return res.status(200).json({ text, source: 'vertex' })
  } catch {
    // Surface a 502 so the client falls through to its cached-explanation floor.
    // The upstream message is deliberately not echoed — it can carry project ids.
    return res.status(502).json({ error: 'vertex_failed' })
  }
}
