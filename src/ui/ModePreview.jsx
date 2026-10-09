import { Fragment } from 'react'
import { Mascot } from './Mascot.jsx'
import { MODE_IDS, MODES, normalizeMode } from '../lib/tutor-modes.js'
import './ModePreview.css'

// A small practice screen drawn in the chosen mode, for the onboarding picker.
// Every mode's parts stay mounted and ModePreview.css moves between them with
// transitions, so changing the choice morphs the screen instead of swapping it.
// It is a picture of the screen (role="img"), not a working control.
export default function ModePreview({ mode, tt, lang }) {
  const active = normalizeMode(mode)
  const words = tt('modePreview.words').split(' ')

  return (
    <div
      className="mode-preview"
      data-preview={active}
      role="img"
      aria-label={tt('modePreview.label', { mode: MODES[active].label[lang] })}
    >
      <span className="mp-doodle mp-doodle-star" aria-hidden="true">★</span>
      <span className="mp-doodle mp-doodle-dot" aria-hidden="true" />
      <span className="mp-doodle mp-doodle-ring" aria-hidden="true" />

      <div className="mp-top" aria-hidden="true">
        <span className="mp-mascot">
          {MODE_IDS.map((id) => (
            <span key={id} className={`mp-pose ${id === active ? 'is-on' : ''}`}>
              <Mascot size={34} alt="" pose={id} />
            </span>
          ))}
        </span>
        <span className="mp-chip mp-stars">★ ★ ★</span>
        <span className="mp-chip mp-counter">{tt('class.questionCount', { n: 1, total: 5 })}</span>
        <span className="mp-chip mp-speaker">
          <svg viewBox="0 0 24 24" width="14" height="14"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          0.8×
        </span>
        <span className="mp-chip mp-steps"><i /><i /><i /></span>
      </div>

      <div className="mp-panel" aria-hidden="true">
        <p className="mp-layer mp-question">{tt('modePreview.question')}</p>
        <p className="mp-layer mp-words">
          {words.map((w, i) => (
            <Fragment key={i}>
              <span className="mp-word" style={{ '--i': i, '--n': words.length }}>{w}</span>{' '}
            </Fragment>
          ))}
        </p>
        <div className="mp-layer mp-step">
          <span className="mp-step-label">{tt('modePreview.step')}</span>
          <span className="mp-step-prompt">2 + 5 = ?</span>
          <span className="mp-blocks">
            {[0, 1].map((i) => <i key={`a${i}`} style={{ '--i': i }} />)}
            <b>+</b>
            {[0, 1, 2, 3, 4].map((i) => <i key={`b${i}`} className="is-b" style={{ '--i': i + 2 }} />)}
          </span>
        </div>
      </div>

      <div className="mp-answer" aria-hidden="true">
        <span className="mp-input" />
        <span className="mp-go">→</span>
      </div>
    </div>
  )
}
