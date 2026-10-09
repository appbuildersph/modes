import { useEffect, useRef, useState } from 'react'
import { checkAnswer } from '../lib/check.js'
import { localize } from '../lib/i18n.js'
import { vibrateCorrect, vibrateWrong } from '../lib/feedback.js'
import { sfx } from '../lib/sound.js'
import { Button } from './Primitives.jsx'

export default function StepScaffold({ item, lang, tt, onComplete }) {
  const [step, setStep] = useState(0)
  const [input, setInput] = useState('')
  const [wrong, setWrong] = useState(false)
  const inputRef = useRef(null)
  const steps = item.steps ?? []

  useEffect(() => {
    setStep(0)
    setInput('')
    setWrong(false)
  }, [item])

  function submit() {
    if (!input.trim()) return
    const expected = item.step_answers?.[step]
    const ok = expected == null || checkAnswer({ answer: expected }, input)
    sfx(ok ? 'correct' : 'wrong')
    if (ok) vibrateCorrect()
    else vibrateWrong()
    if (!ok) {
      setWrong(true)
      setInput('')
      window.setTimeout(() => inputRef.current?.focus(), 0)
      return
    }
    const next = step + 1
    if (next >= steps.length) onComplete()
    else {
      setStep(next)
      setInput('')
      setWrong(false)
      window.setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  return (
    <div className={`gb-card bg-white p-4 ${wrong ? 'answer-shake' : ''}`}>
      <p className="text-xs font-extrabold uppercase tracking-wide text-ink/55">
        {tt('class.stepCounter', { step: step + 1, total: steps.length })}
      </p>
      <p className="mt-2 font-display text-lg font-extrabold leading-snug">{localize(steps[step], lang)}</p>
      <div className="mt-3 flex gap-2">
        <input
          ref={inputRef}
          autoFocus
          value={input}
          onChange={(event) => { setInput(event.target.value); setWrong(false) }}
          onKeyDown={(event) => event.key === 'Enter' && submit()}
          inputMode="decimal"
          pattern="[0-9.]*"
          type="text"
          placeholder={tt('common.answerPlaceholder')}
          className="min-w-0 flex-1 rounded-full border-[2.5px] border-outline px-4 py-3 text-lg font-bold outline-none focus:bg-cream"
        />
        <Button color="mint" onClick={submit} disabled={!input.trim()}>{tt('class.answer')}</Button>
      </div>
      {wrong && <p className="mt-2 text-sm font-extrabold text-[var(--gb-danger)]">{tt('classroom.tryAgain')}</p>}
    </div>
  )
}
