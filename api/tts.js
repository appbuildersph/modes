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
// Provider switch (read per request, ttsProvider()): ElevenLabs whenever ELEVENLABS_API_KEY
//   is set, unless TTS_PROVIDER=google asks for Google explicitly. TTS_PROVIDER=elevenlabs
//   also forces it (and answers 501 when its key or voice is missing).
//   ELEVENLABS_API_KEY     server-only secret, sent as the xi-api-key header
//   ELEVENLABS_VOICE_ID    required; pick by ear (no default on purpose)
//   ELEVENLABS_MODEL       default eleven_flash_v2_5 (lists Filipino, low latency)
//   ELEVENLABS_TIMEOUT_MS  default 15000
//   ELEVENLABS_VOICE_ID_KALMA / _PAKINIG / _HAKBANG  optional: a different voice per
//                          learning mode; each falls back to ELEVENLABS_VOICE_ID
// The request may carry a learning `mode` (none | kalma | pakinig | hakbang). On
// ElevenLabs it picks the voice and the delivery settings (MODE_VOICE below); the
// Google provider ignores it. Speaking SPEED is not set here: the client applies the
// mode's read rate at playback, so the two never stack.
// Either provider unconfigured -> 501; a failed ElevenLabs call -> 502. Both make the
// client fall back to speechSynthesis.

import textToSpeech from '@google-cloud/text-to-speech'
import { guard, parseBody } from './_shared.js'
import { MODE_IDS } from '../src/lib/tutor-modes.js'

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

// ElevenLabs is the app's voice. A blank, missing, or differently cased TTS_PROVIDER
// (a hub restarted with a partial env) used to switch silently to Google, so only
// an explicit `google` selects Google once an ElevenLabs key is present.
export function ttsProvider(env = process.env) {
  const chosen = String(env.TTS_PROVIDER ?? '').trim().toLowerCase()
  if (chosen === 'google') return 'google'
  if (chosen === 'elevenlabs' || env.ELEVENLABS_API_KEY) return 'elevenlabs'
  return 'google'
}
const useElevenLabs = () => ttsProvider() === 'elevenlabs'

// One retry for a transient ElevenLabs failure (network error, 429 concurrency, 5xx).
// Not for a timeout (the client's own 20 s budget would run out) or another 4xx
// (bad key, quota exhausted), which a retry cannot fix.
const ELEVENLABS_RETRY_DELAY_MS = 300

// How each learning mode should sound. ElevenLabs voice_settings: lower stability =
// more expressive, higher = steadier and more even; style adds expressiveness (and
// latency) when above 0; speed runs 0.7 to 1.2. The voice speaks at about 173 words
// per minute at speed 1 (measured on this voice and model; speed 0.9 gave about 158
// and 0.8 about 142), which is fast for a child tutor, so standard, Kalma and Hakbang
// are slowed here. Pakinig sets NO speed:
// the client's read-speed buttons (0.8 / 0.65 / 1) change the audio playbackRate, and
// a server speed on top would stack. 'none' repeats the voice's own saved values
// (stability .5, similarity .75, style 0) so only the pace changes.
// The four are deliberately far apart (Kalma 0.95 steady vs Hakbang 0.15 expressive; speeds
// 0.72 to 0.85) so the modes are clearly different voices of the same speaker. Kalma's
// speed sits just above the 0.7 floor, where ElevenLabs warns quality can suffer. Not tuned by
// ear: adjust after listening.
export const MODE_VOICE = {
  none: { stability: 0.5, similarity_boost: 0.75, style: 0, speed: 0.85 }, // plain baseline, about 150 words/min
  kalma: { stability: 0.95, similarity_boost: 0.75, style: 0, speed: 0.72 }, // very steady, flat-calm, slowest
  pakinig: { stability: 0.75, similarity_boost: 0.95, style: 0 }, // crisp and consistent; speed is the client's
  hakbang: { stability: 0.15, similarity_boost: 0.75, style: 0.7, speed: 0.8 }, // lively, expressive, encouraging
}

// Null when the key or voice is missing, so the handler answers 501 like Google does.
// A per-mode voice id (ELEVENLABS_VOICE_ID_<MODE>) wins over the shared one.
function elevenLabsConfig(mode = 'none') {
  const apiKey = process.env.ELEVENLABS_API_KEY
  const voiceId =
    (mode !== 'none' && process.env[`ELEVENLABS_VOICE_ID_${mode.toUpperCase()}`]) || process.env.ELEVENLABS_VOICE_ID
  if (!apiKey || !voiceId) return null
  return {
    apiKey,
    voiceId,
    voiceSettings: MODE_VOICE[mode] ?? null,
    model: process.env.ELEVENLABS_MODEL || 'eleven_flash_v2_5',
    timeoutMs: Number(process.env.ELEVENLABS_TIMEOUT_MS) || 15_000,
  }
}

// language_code is deliberately not sent: ElevenLabs documents it as ISO 639-1,
// Filipino has no such code, and multilingual_v2 rejects the field anyway. The
// model detects the language from the text.
async function elevenLabsSynthesize(config, text) {
  try {
    return await elevenLabsOnce(config, text)
  } catch (error) {
    if (!error?.retryable) throw error
    await new Promise((resolve) => setTimeout(resolve, ELEVENLABS_RETRY_DELAY_MS))
    return await elevenLabsOnce(config, text)
  }
}

async function elevenLabsOnce(config, text) {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(config.voiceId)}?output_format=mp3_44100_64`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': config.apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: config.model,
        ...(config.voiceSettings ? { voice_settings: config.voiceSettings } : {}),
      }),
      signal: AbortSignal.timeout(config.timeoutMs),
    },
  ).catch((error) => {
    // A dropped connection is worth one retry; a timeout is not.
    if (error?.name !== 'TimeoutError') error.retryable = true
    throw error
  })
  if (!response.ok) {
    const error = new Error('elevenlabs upstream error')
    error.retryable = response.status === 429 || response.status >= 500
    throw error
  }
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

  const { body, error: parseError } = parseBody(req, MAX_BODY_BYTES)
  if (parseError) return res.status(parseError === 'invalid_json' ? 400 : 413).json({ error: parseError })

  // Unconfigured is checked first so a client without a voice gets 501 and falls back.
  const mode = body?.mode === undefined ? 'none' : MODE_IDS.includes(body.mode) ? body.mode : null
  const elevenLabs = useElevenLabs() ? elevenLabsConfig(mode ?? 'none') : null
  const client = useElevenLabs() ? null : ttsClient()
  if (!elevenLabs && !client) return res.status(501).json({ error: 'tts_unconfigured' })
  if (mode === null) return res.status(400).json({ error: 'invalid_mode' })

  const text = (body?.text || '').toString().trim()
  if (!text) return res.status(400).json({ error: 'no_text' })
  if (body?.lang !== undefined && !['en', 'fil', 'taglish'].includes(body.lang)) {
    return res.status(400).json({ error: 'invalid_language' })
  }
  // SIBOL lines are short; cap hard to guard cost/latency.
  const clipped = text.slice(0, 800)

  if (elevenLabs) {
    try {
      const buf = await elevenLabsSynthesize(elevenLabs, clipped)
      res.setHeader('Content-Type', 'audio/mpeg')
      res.setHeader('X-TTS-Provider', 'elevenlabs')
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
    res.setHeader('X-TTS-Provider', 'google')
    res.setHeader('Cache-Control', 'public, max-age=86400')
    return res.status(200).send(buf)
  } catch {
    return res.status(502).json({ error: 'tts_failed' })
  }
}
