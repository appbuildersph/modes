// Serverless Google Cloud Text-to-Speech for Voice-OUT (Vercel Function, Node).
// The PWA POSTs { text } here; this returns audio/mpeg bytes in a native
// Filipino (fil-PH) voice. ONLINE-ONLY — the client falls back to on-device
// speechSynthesis when offline or when this is unconfigured.
//
// Reuses the SAME Vertex service-account creds as api/tutor.js — billed to the
// GCP project. Requires the Cloud TTS API enabled (texttospeech.googleapis.com).
//
// Env vars (same GCP_SA_KEY as the tutor):
//   GCP_SA_KEY   service-account JSON, single-line (NEVER client)
//   TTS_VOICE    optional voice name (default fil-PH-Wavenet-A — female, natural)
//   TTS_LANG     optional language code (default fil-PH)
//
// Unset creds -> 501 so the client uses speechSynthesis.

import textToSpeech from '@google-cloud/text-to-speech'
import { guard, parseBody } from './_shared.js'

const RATE_LIMIT = Number(process.env.TTS_RATE_LIMIT || 30)
const MAX_BODY_BYTES = 4_000
const VOICE = process.env.TTS_VOICE || 'fil-PH-Wavenet-A'
const LANG = process.env.TTS_LANG || 'fil-PH'
const EN_VOICE = process.env.TTS_VOICE_EN || 'en-US-Neural2-F'
const EN_LANG = 'en-US'

// Map the app language setting -> { voice, languageCode }. English answers get
// an English voice; Tagalog/Taglish use the fil-PH voice.
function voiceFor(lang) {
  if (lang === 'en') return { name: EN_VOICE, languageCode: EN_LANG }
  return { name: VOICE, languageCode: LANG }
}

function getCredentials() {
  if (!process.env.GCP_SA_KEY) return null
  try {
    return JSON.parse(process.env.GCP_SA_KEY)
  } catch {
    return null
  }
}

let _client = null
function ttsClient() {
  if (_client) return _client
  const credentials = getCredentials()
  if (!credentials) return null
  _client = new textToSpeech.TextToSpeechClient({
    credentials,
    projectId: credentials.project_id,
  })
  return _client
}

export default async function handler(req, res) {
  // Synthesis is billed per character, so this endpoint needs the same
  // origin + rate-limit floor as the rest. It previously had none.
  if (await guard(req, res, { bucket: 'tts', limit: RATE_LIMIT, maxBytes: MAX_BODY_BYTES })) return

  const client = ttsClient()
  // Not configured — signal client to fall back to speechSynthesis.
  if (!client) return res.status(501).json({ error: 'tts_unconfigured' })

  const { body, error: parseError } = parseBody(req, MAX_BODY_BYTES)
  if (parseError) return res.status(parseError === 'invalid_json' ? 400 : 413).json({ error: parseError })

  const text = (body?.text || '').toString().trim()
  if (!text) return res.status(400).json({ error: 'no_text' })
  if (body?.lang !== undefined && !['en', 'fil', 'taglish'].includes(body.lang)) {
    return res.status(400).json({ error: 'invalid_language' })
  }
  // Gabay lines are short; cap hard to guard cost/latency.
  const clipped = text.slice(0, 800)
  const { name, languageCode } = voiceFor(body?.lang)

  try {
    const [response] = await client.synthesizeSpeech({
      input: { text: clipped },
      voice: { languageCode, name },
      audioConfig: { audioEncoding: 'MP3', speakingRate: 0.96, pitch: 1.0 },
    })
    const buf = Buffer.from(response.audioContent)
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Cache-Control', 'public, max-age=86400')
    return res.status(200).send(buf)
  } catch {
    return res.status(502).json({ error: 'tts_failed' })
  }
}
