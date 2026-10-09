// Serverless Google Cloud Text-to-Speech for Voice-OUT (Node runtime).
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
//
// Provider switch (read per request): TTS_PROVIDER = google (default) | elevenlabs
//   ELEVENLABS_API_KEY     server-only secret, sent as the xi-api-key header
//   ELEVENLABS_VOICE_ID    required; pick by ear (no default on purpose)
//   ELEVENLABS_MODEL       default eleven_flash_v2_5 (lists Filipino, low latency)
//   ELEVENLABS_TIMEOUT_MS  default 15000
// Either provider unconfigured -> 501; a failed ElevenLabs call -> 502. Both make the
// client fall back to speechSynthesis.

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

const useElevenLabs = () => process.env.TTS_PROVIDER === 'elevenlabs'

// Null when the key or voice is missing, so the handler answers 501 like Google does.
function elevenLabsConfig() {
  const apiKey = process.env.ELEVENLABS_API_KEY
  const voiceId = process.env.ELEVENLABS_VOICE_ID
  if (!apiKey || !voiceId) return null
  return {
    apiKey,
    voiceId,
    model: process.env.ELEVENLABS_MODEL || 'eleven_flash_v2_5',
    timeoutMs: Number(process.env.ELEVENLABS_TIMEOUT_MS) || 15_000,
  }
}

// language_code is deliberately not sent: ElevenLabs documents it as ISO 639-1,
// Filipino has no such code, and multilingual_v2 rejects the field anyway. The
// model detects the language from the text.
async function elevenLabsSynthesize(config, text) {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(config.voiceId)}?output_format=mp3_44100_64`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': config.apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({ text, model_id: config.model }),
      signal: AbortSignal.timeout(config.timeoutMs),
    },
  )
  if (!response.ok) throw new Error('elevenlabs upstream error')
  if (!(response.headers.get('content-type') || '').includes('audio')) throw new Error('not audio')
  const buf = Buffer.from(await response.arrayBuffer())
  if (!buf.length) throw new Error('empty audio')
  return buf
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

  const elevenLabs = useElevenLabs() ? elevenLabsConfig() : null
  const client = useElevenLabs() ? null : ttsClient()
  // Not configured — signal client to fall back to speechSynthesis.
  if (!elevenLabs && !client) return res.status(501).json({ error: 'tts_unconfigured' })

  const { body, error: parseError } = parseBody(req, MAX_BODY_BYTES)
  if (parseError) return res.status(parseError === 'invalid_json' ? 400 : 413).json({ error: parseError })

  const text = (body?.text || '').toString().trim()
  if (!text) return res.status(400).json({ error: 'no_text' })
  if (body?.lang !== undefined && !['en', 'fil', 'taglish'].includes(body.lang)) {
    return res.status(400).json({ error: 'invalid_language' })
  }
  // Gabay lines are short; cap hard to guard cost/latency.
  const clipped = text.slice(0, 800)

  if (elevenLabs) {
    try {
      const buf = await elevenLabsSynthesize(elevenLabs, clipped)
      res.setHeader('Content-Type', 'audio/mpeg')
      res.setHeader('Cache-Control', 'public, max-age=86400')
      return res.status(200).send(buf)
    } catch {
      // Not echoed: upstream errors can carry account details.
      return res.status(502).json({ error: 'tts_failed' })
    }
  }

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
