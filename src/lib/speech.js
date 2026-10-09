// Voice-OUT: Teacher Gabay reads aloud. Best-available-first chain:
//   1. online -> POST /api/tts (edge hub when the app has one, else this host; the
//      server speaks with ElevenLabs or Google Cloud TTS, voice follows language)
//   2. floor  -> on-device speechSynthesis (works fully OFFLINE, robotic)
// Audio is cached in IndexedDB (tts:v3:{lang}:{mode}:{hash}; the learning mode changes
// the voice, so it is part of the key) so repeats cost nothing and
// replay works offline once heard.
//
// Playback controls: stopSpeaking(), pauseSpeaking(), resumeSpeaking().
// A generation token guards the async chain so Stop actually stops — a cloud
// fetch that resolves after Stop will NOT start the local fallback.

import { get, set } from 'idb-keyval'
import { speechLang, DEFAULT_LANG } from './lang.js'
import { apiUrl } from './api-base.js'
import { resolveEdgeBase } from './edge-llm.js'
import { normalizeMode } from './tutor-modes.js'

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

// Default speaking rates: the on-device voice reads a touch slower than normal,
// cloud audio plays at its native speed. A caller-supplied `rate` (Pakinig mode
// reads slower) replaces both.
export const LOCAL_RATE = 0.95
export const CLOUD_RATE = 1

function speakLocal(text, lang, rate = LOCAL_RATE) {
  if (!isSpeechSupported() || !text) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  const v = pickVoice(lang)
  if (v) u.voice = v
  u.lang = speechLang(lang)
  u.rate = rate
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

function playBlob(blob, rate = CLOUD_RATE) {
  return new Promise((resolve) => {
    stopAudio()
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    // The cache stores the audio as generated; speed is applied at playback so a
    // rate change never needs a new request.
    audio.playbackRate = rate
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
    mode,
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
      // The learning mode only ever travels as an allow-listed id; the server picks the voice.
      body: JSON.stringify(mode && mode !== 'none' ? { text, lang, mode } : { text, lang }),
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

async function speakCloud(text, lang, gen, rate, voiceMode) {
  // v3: the voice now depends on the learning mode, so the mode is part of the key
  // (a Kalma line must not replay in the Hakbang voice). Bump again if the voice changes.
  const key = `tts:v3:${lang}:${voiceMode}:${hash(text)}`

  try {
    const cached = await get(key)
    if (cached instanceof Blob && cached.size) {
      if (gen !== token) return true // stopped while loading — swallow
      return await playBlob(cached, rate)
    }
  } catch {
    /* fall through */
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false

  try {
    const blob = await fetchCloudAudio(text, lang, { mode: voiceMode })
    if (!blob) return false
    set(key, blob).catch(() => {})
    if (gen !== token) return true // stopped while fetching
    return await playBlob(blob, rate)
  } catch {
    return false
  }
}

// Public API. speak(text, { lang, rate, mode }). Tries cloud TTS, falls back to local.
// `mode` (kalma | pakinig | hakbang) selects the cloud voice character and delivery.
// `rate` is optional: it replaces the default speed on either path (cloud
// playbackRate, local utterance rate).
export function speak(text, { lang = DEFAULT_LANG, rate, mode } = {}) {
  if (!text) return
  stopSpeaking()
  const gen = token
  const voiceMode = normalizeMode(mode) // unknown or missing -> 'none'
  speakCloud(text, lang, gen, rate ?? CLOUD_RATE, voiceMode).then((ok) => {
    if (gen !== token) return // a newer speak()/stop() superseded us
    if (!ok) speakLocal(text, lang, rate ?? LOCAL_RATE)
  })
}

// ---------------------------------------------------------------------------
// Read-aloud with word highlighting (Pakinig mode). Always the on-device voice:
// cloud audio is a plain MP3 with no word timings.
// ---------------------------------------------------------------------------

// Start and end offsets of each whitespace-separated word. The word index that
// speakWords() reports is an index into this list, so the UI should split its
// text the same way (text.split(/\s+/) after trimming).
export function wordSpans(text) {
  const spans = []
  for (const m of String(text ?? '').matchAll(/\S+/g)) spans.push({ start: m.index, end: m.index + m[0].length })
  return spans
}

// Word that a speechSynthesis boundary charIndex falls in (or the next word when
// it lands in the gap between words). -1 when there are no words.
export function wordIndexAt(spans, charIndex) {
  if (!spans.length) return -1
  const i = spans.findIndex((sp) => sp.end > charIndex)
  return i === -1 ? spans.length - 1 : i
}

export const BOUNDARY_WAIT_MS = 700 // no boundary event this long after speech starts -> use the timer
const START_WAIT_MS = 2_500 // the voice never reported "start" -> arm the timer anyway
const MS_PER_CHAR = 75 // rough speaking pace at rate 1, for the fallback timer only

// How long the fallback timer shows a word: proportional to its length, with a
// pause after sentence punctuation. An estimate, not a measurement.
export function estimateWordMs(word, rate = LOCAL_RATE) {
  const pause = /[.!?]$/.test(word) ? 250 : /[,;:]$/.test(word) ? 120 : 0
  return Math.round(((word.length + 1) * MS_PER_CHAR) / rate + pause)
}

let activeWords = null // { finish, pause, resume } of the speakWords() call in progress

// speakWords(text, { lang, rate, onWord, onEnd }) -> boolean (false: nothing started,
// no callbacks will fire). Reads `text` with the on-device voice and calls
// onWord(index) as each word begins, using the voice's own boundary events. If none
// arrive within ~700 ms (some voices never send them), a length-based timer drives
// onWord instead; a boundary event that shows up later takes over again. onEnd()
// fires exactly once: at the natural end, on an error, or when stopSpeaking(), a
// newer speak(), or a newer speakWords() cuts it off.
export function speakWords(text, { lang = DEFAULT_LANG, rate = LOCAL_RATE, onWord, onEnd } = {}) {
  if (!text || !isSpeechSupported()) return false
  stopSpeaking()

  const words = String(text).match(/\S+/g) ?? []
  const spans = wordSpans(text)
  if (!words.length) return false

  const u = new SpeechSynthesisUtterance(text)
  const v = pickVoice(lang)
  if (v) u.voice = v
  u.lang = speechLang(lang)
  u.rate = rate
  u.pitch = 1.05

  let done = false
  let paused = false
  let gotBoundary = false
  let fallback = false
  let lastIndex = -1
  let nextIndex = 0
  let watchdog = null
  let ticker = null

  const emit = (i) => {
    if (i === lastIndex) return
    lastIndex = i
    try {
      onWord?.(i)
    } catch {
      /* a UI callback must not break playback */
    }
  }
  const clearTimers = () => {
    clearTimeout(watchdog)
    clearTimeout(ticker)
    watchdog = ticker = null
  }
  const tick = () => {
    if (done || paused || gotBoundary || nextIndex >= words.length) return
    const i = nextIndex++
    emit(i)
    ticker = setTimeout(tick, estimateWordMs(words[i], rate))
  }
  const armWatchdog = (ms) => {
    clearTimeout(watchdog)
    watchdog = setTimeout(() => {
      if (done || gotBoundary) return
      fallback = true
      tick()
    }, ms)
  }
  const finish = () => {
    if (done) return
    done = true
    clearTimers()
    if (activeWords === handle) activeWords = null
    if (mode === 'local') mode = null
    try {
      onEnd?.()
    } catch {
      /* ignore */
    }
  }
  const handle = {
    finish,
    pause() {
      paused = true
      clearTimeout(ticker)
    },
    resume() {
      if (!paused) return
      paused = false
      if (fallback && !gotBoundary) tick()
    },
  }

  u.onstart = () => armWatchdog(BOUNDARY_WAIT_MS)
  u.onboundary = (e) => {
    if (done || (e.name && e.name !== 'word')) return
    gotBoundary = true
    clearTimers() // real timings beat the estimate, even if the timer was running
    const i = wordIndexAt(spans, e.charIndex ?? 0)
    if (i >= 0) {
      nextIndex = i + 1
      emit(i)
    }
  }
  u.onend = finish
  u.onerror = finish

  activeWords = handle
  mode = 'local'
  armWatchdog(START_WAIT_MS)
  window.speechSynthesis.speak(u)
  return true
}

export function stopSpeaking() {
  // End an active speakWords() first, so its onEnd fires exactly once and a
  // highlight is cleared before anything new starts.
  if (activeWords) activeWords.finish()
  token++ // invalidate any in-flight cloud chain
  stopAudio()
  if (isSpeechSupported()) window.speechSynthesis.cancel()
  mode = null
}

export function pauseSpeaking() {
  if (activeWords) activeWords.pause()
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
  if (activeWords) activeWords.resume()
  if (mode === 'audio' && currentAudio) {
    currentAudio.play().catch(() => {})
  } else if (mode === 'local' && isSpeechSupported()) {
    window.speechSynthesis.resume()
  }
}

export function isSpeaking() {
  return mode !== null
}
