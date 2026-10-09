import { useEffect, useState } from 'react'
import ModeIcon from './ModeIcon.jsx'
import { MODES } from '../lib/tutor-modes.js'
import { modeTransitionTimes } from '../lib/mode-ui.js'

const BG = { none: 'var(--gb-background)', kalma: 'var(--gb-secondary)', pakinig: 'var(--gb-sky)', hakbang: 'var(--gb-peach)' }

function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

// Full-page cover shown while the app switches learning mode. onApply runs while
// the screen is covered, so the new look appears as the cover lifts.
export default function ModeTransition({ to, tt, lang, onApply, onDone }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const times = modeTransitionTimes(prefersReducedMotion())
    const timers = [
      window.setTimeout(onApply, times.apply),
      window.setTimeout(() => setLeaving(true), times.exit),
      window.setTimeout(onDone, times.done),
    ]
    return () => timers.forEach(window.clearTimeout)
    // Runs once per switch; the parent remounts this with a new key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const mode = MODES[to] ?? MODES.none
  return (
    <div
      className={`mode-transition ${leaving ? 'is-leaving' : ''} ${to === 'kalma' ? 'is-calm' : ''}`}
      style={{ '--mode-transition-bg': BG[to] ?? BG.none }}
      role="status"
      aria-live="polite"
    >
      <div className="mode-transition-card">
        <span className="mode-transition-icon"><ModeIcon mode={to} size={96} /></span>
        <p className="mode-transition-kicker">{tt('mode.switching')}</p>
        <h2 className="mode-transition-title">{mode.label[lang]}</h2>
        <p className="mode-transition-gloss">{mode.gloss[lang]}</p>
        <span className="mode-transition-bar" aria-hidden="true"><i /></span>
      </div>
    </div>
  )
}
