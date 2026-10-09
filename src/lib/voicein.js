// Voice-IN: student speaks their question. Best-available-first chain:
//   1. online -> MediaRecorder mic capture -> POST /api/transcribe (Gemini)
//   2. fallback -> browser SpeechRecognition (Web Speech API)
//   3. floor -> the student just types (handled by the caller)

import { apiUrl } from './api-base.js'

export function isRecognitionSupported() {
  return (
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  )
}

export function createRecognizer({ onResult, onError, onEnd, lang = 'fil-PH' } = {}) {
  if (!isRecognitionSupported()) return null
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition
  const rec = new Ctor()
  rec.lang = lang
  rec.interimResults = false
  rec.maxAlternatives = 1
  rec.continuous = false

  rec.onresult = (e) => {
    const text = e.results?.[0]?.[0]?.transcript ?? ''
    onResult?.(text)
  }
  rec.onerror = (e) => onError?.(e.error || 'speech-error')
  rec.onend = () => onEnd?.()

  return {
    start() {
      try {
        rec.start()
      } catch (err) {
        onError?.(String(err))
      }
    },
    stop() {
      try {
        rec.stop()
      } catch {
        /* noop */
      }
    },
  }
}

export function isMediaRecorderSupported() {
  return (
    typeof window !== 'undefined' &&
    typeof window.MediaRecorder !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia
  )
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const s = String(reader.result)
      resolve(s.slice(s.indexOf(',') + 1))
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function pickMime() {
  const prefs = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']
  for (const m of prefs) {
    if (window.MediaRecorder?.isTypeSupported?.(m)) return m
  }
  return ''
}

export function createGeminiRecorder({ onResult, onError, onEnd, onStart, maxMs = 7000 } = {}) {
  if (!isMediaRecorderSupported()) return null

  let recorder = null
  let stream = null
  let chunks = []
  let cancelled = false
  let autoStopTimer = null

  function clearAutoStop() {
    if (autoStopTimer) clearTimeout(autoStopTimer)
    autoStopTimer = null
  }

  function stopTracks() {
    stream?.getTracks().forEach((t) => t.stop())
    stream = null
  }

  async function transcribe(blob) {
    let timeout = null
    try {
      const mimeType = (blob.type || 'audio/webm').split(';')[0]
      const audio = await blobToBase64(blob)
      const controller = new AbortController()
      timeout = setTimeout(() => controller.abort(), 20000)
      const res = await fetch(apiUrl('/api/transcribe'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio, mimeType }),
        signal: controller.signal,
      })
      if (!res.ok) {
        onError?.(res.status === 501 ? 'stt-unconfigured' : 'stt-failed')
        return
      }
      const data = await res.json()
      const text = (data.text || '').trim()
      if (text) onResult?.(text)
      else onError?.('stt-empty')
    } catch (err) {
      onError?.(err?.name === 'AbortError' ? 'stt-timeout' : 'stt-network')
    } finally {
      if (timeout) clearTimeout(timeout)
      onEnd?.()
    }
  }

  return {
    async start() {
      try {
        cancelled = false
        chunks = []
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mimeType = pickMime()
        recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
        recorder.ondataavailable = (e) => {
          if (e.data?.size) chunks.push(e.data)
        }
        recorder.onstop = () => {
          clearAutoStop()
          stopTracks()
          if (cancelled) {
            onEnd?.()
            return
          }
          const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
          if (blob.size === 0) {
            onError?.('stt-empty')
            onEnd?.()
            return
          }
          transcribe(blob)
        }
        recorder.start()
        if (maxMs > 0) {
          autoStopTimer = setTimeout(() => {
            try {
              if (recorder && recorder.state !== 'inactive') recorder.stop()
            } catch {
              /* noop */
            }
          }, maxMs)
        }
        onStart?.()
      } catch (err) {
        clearAutoStop()
        stopTracks()
        onError?.(err?.name === 'NotAllowedError' ? 'mic-denied' : String(err))
        onEnd?.()
      }
    },
    stop() {
      try {
        clearAutoStop()
        if (recorder && recorder.state !== 'inactive') recorder.stop()
      } catch {
        /* noop */
      }
    },
    cancel() {
      cancelled = true
      this.stop()
    },
  }
}
