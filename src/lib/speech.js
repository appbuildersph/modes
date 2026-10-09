// Voice-OUT: Teacher Gabay reads aloud. Best-available-first chain:
//   1. online -> POST /api/tts (edge hub when the app has one, else this host; the
//      server speaks with ElevenLabs or Google Cloud TTS, voice follows language)
//   2. floor  -> on-device speechSynthesis (works fully OFFLINE, robotic)
// Audio is cached in IndexedDB (tts:v2:{lang}:{hash}) so repeats cost nothing and
// replay works offline once heard.
//
// Playback controls: stopSpeaking(), pauseSpeaking(), resumeSpeaking().
// A generation token guards the async chain so Stop actually stops — a cloud
// fetch that resolves after Stop will NOT start the local fallback.

import { get, set } from 'idb-keyval'
import { speechLang, DEFAULT_LANG } from './lang.js'
import { apiUrl } from './api-base.js'
import { resolveEdgeBase } from './edge-llm.js'

// ---------------------------------------------------------------------------
// speechSynthesis floor (offline, on-device). Voice follows the chosen language.
// ---------------------------------------------------------------------------
let cachedVoices = []

function refreshVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  cachedVoices = window.speechSynthesis.getVoices()
}

export function initVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  refreshVoices()
  window.speechSynthesis.onvoiceschanged = refreshVoices
}

function pickVoice(lang) {
  if (!cachedVoices.length) refreshVoices()
  const code = speechLang(lang) // 'en-US' | 'fil-PH'
  if (code.startsWith('en')) {
    return (
      cachedVoices.find((v) => v.lang?.toLowerCase().startsWith('en-ph')) ||
      cachedVoices.find((v) => v.lang?.toLowerCase().startsWith('en')) ||
      null
    )
  }
  return (
    cachedVoices.find((v) => v.lang?.toLowerCase().startsWith('fil')) ||
    cachedVoices.find((v) => v.lang?.toLowerCase().startsWith('tl')) ||
    cachedVoices.find((v) => v.lang?.toLowerCase().startsWith('en-ph')) ||
    null
  )
}

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

let mode = null // 'audio' | 'local' | null

function speakLocal(text, lang) {
  if (!isSpeechSupported() || !text) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  const v = pickVoice(lang)
  if (v) u.voice = v
  u.lang = speechLang(lang)
  u.rate = 0.95
  u.pitch = 1.05
  u.onend = () => {
    if (mode === 'local') mode = null
  }
  mode = 'local'
  window.speechSynthesis.speak(u)
}

// ---------------------------------------------------------------------------
// Cloud TTS path + playback control.
// ---------------------------------------------------------------------------
function hash(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i)
  return (h >>> 0).toString(36)
}

let currentAudio = null
let token = 0 // generation guard — bumped on every speak()/stop()

function stopAudio() {
  if (currentAudio) {
    try {
      currentAudio.pause()
      if (currentAudio.src?.startsWith('blob:')) URL.revokeObjectURL(currentAudio.src)
    } catch {
      /* noop */
    }
    currentAudio = null
  }
}

function playBlob(blob) {
  return new Promise((resolve) => {
    stopAudio()
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    currentAudio = audio
    audio.onended = () => {
      if (currentAudio === audio) currentAudio = null
      if (mode === 'audio') mode = null
      URL.revokeObjectURL(url)
    }
    audio.play().then(
      () => {
        mode = 'audio'
        resolve(true)
      },
      () => {
        URL.revokeObjectURL(url)
        if (currentAudio === audio) currentAudio = null
        resolve(false) // autoplay blocked / decode error
      },
    )
  })
}

export const TTS_TIMEOUT_MS = 20_000
const EDGE_BASE_TTL_MS = 30_000

// resolveEdgeBase() can probe the network, so remember its answer briefly instead
// of paying for a probe on every spoken line.
let edgeBaseCache = null // { value, at }
async function resolveEdgeBaseCached() {
  const now = Date.now()
  if (edgeBaseCache && now - edgeBaseCache.at < EDGE_BASE_TTL_MS) return edgeBaseCache.value
  const value = await resolveEdgeBase()
  edgeBaseCache = { value, at: now }
  return value
}

// One /api/tts request. When the app has an edge hub (stored ?edge= override,
// VITE_EDGE_BASE, localhost, or a same-origin hub) the voice comes from the hub,
// where ElevenLabs is configured; otherwise from this host's own /api/tts. A hub
// base of '' means same origin. Resolves a Blob, or null on ANY failure so the
// caller falls back to speechSynthesis. Injectable so Node tests can fake the network.
export async function fetchCloudAudio(
  text,
  lang,
  {
    fetchImpl = globalThis.fetch,
    resolveBase = resolveEdgeBaseCached,
    timeoutMs = TTS_TIMEOUT_MS,
  } = {},
) {
  try {
    let base = null
    try {
      base = await resolveBase()
    } catch {
      /* no hub: use this host's own endpoint */
    }
    const viaHub = typeof base === 'string'
    const res = await fetchImpl(viaHub ? `${base}/api/tts` : apiUrl('/api/tts'), {
      method: 'POST',
      // ngrok interposes a warning page for browser requests without this header.
      headers: { 'Content-Type': 'application/json', ...(viaHub ? { 'ngrok-skip-browser-warning': '1' } : {}) },
      body: JSON.stringify({ text, lang }),
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!res.ok) return null
    if (!(res.headers.get('content-type') || '').includes('audio')) return null
    const blob = await res.blob()
    return blob.size ? blob : null
  } catch {
    return null
  }
}

async function speakCloud(text, lang, gen) {
  // v2: the server may now speak with ElevenLabs, so audio cached under the old
  // key (Google voice) is not replayed. Bump again if the voice changes.
  const key = `tts:v2:${lang}:${hash(text)}`

  try {
    const cached = await get(key)
    if (cached instanceof Blob && cached.size) {
      if (gen !== token) return true // stopped while loading — swallow
      return await playBlob(cached)
    }
  } catch {
    /* fall through */
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false

  try {
    const blob = await fetchCloudAudio(text, lang)
    if (!blob) return false
    set(key, blob).catch(() => {})
    if (gen !== token) return true // stopped while fetching
    return await playBlob(blob)
  } catch {
    return false
  }
}

// Public API. speak(text, { lang }). Tries cloud TTS, falls back to local.
export function speak(text, { lang = DEFAULT_LANG } = {}) {
  if (!text) return
  stopSpeaking()
  const gen = token
  speakCloud(text, lang, gen).then((ok) => {
    if (gen !== token) return // a newer speak()/stop() superseded us
    if (!ok) speakLocal(text, lang)
  })
}

export function stopSpeaking() {
  token++ // invalidate any in-flight cloud chain
  stopAudio()
  if (isSpeechSupported()) window.speechSynthesis.cancel()
  mode = null
}

export function pauseSpeaking() {
  if (mode === 'audio' && currentAudio) {
    try {
      currentAudio.pause()
    } catch {
      /* noop */
    }
  } else if (mode === 'local' && isSpeechSupported()) {
    window.speechSynthesis.pause()
  }
}

export function resumeSpeaking() {
  if (mode === 'audio' && currentAudio) {
    currentAudio.play().catch(() => {})
  } else if (mode === 'local' && isSpeechSupported()) {
    window.speechSynthesis.resume()
  }
}

export function isSpeaking() {
  return mode !== null
}
