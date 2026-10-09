import { useCallback, useEffect, useRef, useState } from 'react'
import { speakWords, stopSpeaking } from '../lib/speech.js'
import { READ_SPEEDS } from '../lib/mode-ui.js'

// Pakinig read-aloud: the question as word spans, the current word highlighted
// while it is read aloud. speakWords() uses the ElevenLabs voice for the mode and
// falls back to the device voice only when that can't be reached. Words are split
// on whitespace, the same way speakWords() counts them, so the indexes line up.
export default function ReadAloudText({ text, lang, mode = 'pakinig', tt, autoRead = true, defaultRate = 0.8, className = '' }) {
  const [current, setCurrent] = useState(-1)
  const [reading, setReading] = useState(false)
  const [rate, setRate] = useState(defaultRate)
  const words = String(text ?? '').trim().split(/\s+/).filter(Boolean)
  const alive = useRef(true)

  const read = useCallback((atRate = rate) => {
    const started = speakWords(text, {
      lang,
      mode,
      rate: atRate,
      onWord: (i) => alive.current && setCurrent(i),
      onEnd: () => {
        if (!alive.current) return
        setCurrent(-1)
        setReading(false)
      },
    })
    setReading(started)
  }, [text, lang, mode, rate])

  useEffect(() => {
    alive.current = true
    setCurrent(-1)
    if (autoRead) read()
    return () => {
      alive.current = false
      stopSpeaking()
    }
    // Re-read only when the question itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, lang, autoRead])

  function changeRate(next) {
    setRate(next)
    read(next)
  }

  return (
    <div className="read-aloud">
      <div className="read-aloud-bar">
        <button type="button" onClick={() => (reading ? stopSpeaking() : read())} aria-pressed={reading}>
          {tt('class.readAgain')}
        </button>
        <div className="read-aloud-speeds" role="group" aria-label={tt('class.readSpeed')}>
          {READ_SPEEDS.map((value) => (
            <button key={value} type="button" aria-pressed={rate === value} onClick={() => changeRate(value)}>
              {value}×
            </button>
          ))}
        </div>
      </div>
      <p className={className}>
        {words.map((word, i) => (
          <span key={i}>
            <span className={`w ${i === current ? 'on' : ''}`}>{word}</span>
            {i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </p>
    </div>
  )
}
