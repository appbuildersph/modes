import { useEffect, useRef } from 'react'
import './MicMeter.css'

const BARS = 14

// Phones give the mic to one capture at a time: a second stream next to Web
// Speech can stop recognition (Android Chrome, iOS). There the bars only animate.
const SHARED_MIC_RISKY = typeof navigator !== 'undefined' && (
  /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
  (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1) // iPadOS
)

// Live mini spectrogram while the mic listens, so the learner sees that the app
// hears them. Web Speech gives no audio levels, so this opens its own mic stream
// next to it; if that is refused, the bars just stay low and speech still works.
export default function MicMeter({ active, label }) {
  const barsRef = useRef([])

  useEffect(() => {
    if (!active || SHARED_MIC_RISKY || !navigator.mediaDevices?.getUserMedia) return undefined
    let stream = null
    let ctx = null
    let frame = 0
    let stopped = false

    navigator.mediaDevices.getUserMedia({ audio: true }).then((s) => {
      if (stopped) {
        s.getTracks().forEach((t) => t.stop())
        return
      }
      stream = s
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      ctx = new AudioCtx()
      // Created after an await, so browsers may start it suspended; an active
      // mic capture lets it resume.
      ctx.resume().catch(() => {})
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 64
      analyser.smoothingTimeConstant = 0.6
      ctx.createMediaStreamSource(stream).connect(analyser)
      const data = new Uint8Array(analyser.frequencyBinCount)
      const draw = () => {
        analyser.getByteFrequencyData(data)
        barsRef.current.forEach((bar, i) => {
          // Skip the lowest bins (hum) and spread the voice range over the bars.
          const v = data[2 + i] / 255
          if (bar) bar.style.transform = `scaleY(${Math.max(0.12, v)})`
        })
        frame = requestAnimationFrame(draw)
      }
      draw()
    }).catch(() => {})

    return () => {
      stopped = true
      cancelAnimationFrame(frame)
      stream?.getTracks().forEach((t) => t.stop())
      ctx?.close().catch(() => {})
      barsRef.current.forEach((bar) => bar && (bar.style.transform = 'scaleY(0.12)'))
    }
  }, [active])

  if (!active) return null
  return (
    <div className="mt-2 flex items-center gap-3" role="status" aria-live="polite">
      <div className="flex h-8 items-center gap-[3px]" aria-hidden="true">
        {Array.from({ length: BARS }, (_, i) => (
          <span
            key={i}
            ref={(el) => (barsRef.current[i] = el)}
            className={`block h-8 w-[5px] origin-center rounded-full border-[1.5px] border-outline bg-rose ${SHARED_MIC_RISKY ? 'mic-meter-idle' : ''}`}
            style={SHARED_MIC_RISKY ? { animationDelay: `${(i % 5) * 110}ms` } : { transform: 'scaleY(0.12)', transition: 'transform 60ms linear' }}
          />
        ))}
      </div>
      <span className="text-sm font-bold text-ink/70">{label}</span>
    </div>
  )
}
