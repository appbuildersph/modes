// Serverless Gemini speech-to-text for Voice-IN (Vercel Function, Node runtime).
// The PWA records mic audio (MediaRecorder), base64-encodes it, and POSTs
// { audio, mimeType } here. Gemini multimodal transcribes Taglish far better
// than the browser Web Speech API. Returns { text, source }.
//
// ONLINE-ONLY by nature — the client falls back to Web Speech (and ultimately
// typing) when offline. Same Vertex creds as api/tutor.js.
//
// Env: GCP_PROJECT, GCP_LOCATION, GCP_SA_KEY (see api/tutor.js).
//   STT_MODEL  optional model override (default gemini-2.5-flash — cheap + fast,
//              plenty for transcription; no need for 2.5-pro here).

import { GoogleGenAI } from '@google/genai'
import { guard, parseBody } from './_shared.js'

const LOCATION = process.env.GCP_LOCATION || 'us-central1'
// Flash, not pro — transcription is not a reasoning task; flash is ~25x cheaper.
const MODEL = process.env.STT_MODEL || 'gemini-2.5-flash'
const RATE_LIMIT = Number(process.env.STT_RATE_LIMIT || 10)
// Base64 audio is bulky but a clip is short. ~1.5 MB of base64 is roughly a
// minute of webm/opus — well past any real question, and a hard ceiling on
// what a single caller can push into a billed multimodal model.
const MAX_BODY_BYTES = 1_500_000
const ALLOWED_MIME = new Set(['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav'])

const PROMPT =
  'Transcribe this audio verbatim. The speaker is a Filipino Grade 6 student ' +
  'asking a math question in Tagalog, English, or Taglish. Output ONLY the ' +
  'transcription text — no labels, no quotes, no commentary. If silent or ' +
  'unintelligible, output an empty string.'

function getCredentials() {
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

export default async function handler(req, res) {
  // Multimodal transcription is billed per request and this endpoint used to
  // have no rate limit and no size cap at all.
  if (await guard(req, res, { bucket: 'transcribe', limit: RATE_LIMIT, maxBytes: MAX_BODY_BYTES })) return

  const { body, error: parseError } = parseBody(req, MAX_BODY_BYTES)
  if (parseError) return res.status(parseError === 'invalid_json' ? 400 : 413).json({ error: parseError })

  const { audio = '', mimeType = 'audio/webm' } = body

  if (typeof audio !== 'string' || !audio) return res.status(400).json({ error: 'no_audio' })
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(audio)) return res.status(400).json({ error: 'invalid_audio' })
  if (!ALLOWED_MIME.has(mimeType)) return res.status(400).json({ error: 'invalid_mime_type' })

  const ai = genaiClient()
  // No creds — signal the client to fall back to Web Speech / typing.
  if (!ai) return res.status(501).json({ error: 'stt_unconfigured' })

  try {
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { text: PROMPT },
            { inlineData: { mimeType, data: audio } },
          ],
        },
      ],
      config: { temperature: 0 },
    })
    const text = (result?.text ?? '').trim()
    return res.status(200).json({ text, source: 'gemini' })
  } catch {
    return res.status(502).json({ error: 'stt_failed' })
  }
}
