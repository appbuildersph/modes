import { useEffect, useState } from 'react'
import { Mascot } from '../ui/Mascot.jsx'
import { makeT } from '../lib/i18n.js'

const SUB_KEYS = ['questions.generatingSub', 'questions.generatingSub2', 'questions.generatingSub3', 'questions.generatingSub4']
const SUB_STEP_MS = 3200

export default function Generating({ lang = 'taglish' }) {
  const tt = makeT(lang)
  const [elapsedMs, setElapsedMs] = useState(0)

  useEffect(() => {
    const start = performance.now()
    const timer = setInterval(() => setElapsedMs(performance.now() - start), 200)
    return () => clearInterval(timer)
  }, [])

  const subKey = SUB_KEYS[Math.min(SUB_KEYS.length - 1, Math.floor(elapsedMs / SUB_STEP_MS))]
  // Decelerating curve so the bar keeps visibly inching forward on slow AI
  // responses instead of sitting frozen at a fixed width.
  const progress = 12 + 83 * (1 - Math.exp(-elapsedMs / 9000))

  return (
    <div className="gb-shell flex min-h-screen flex-col items-center justify-center bg-cream px-6 text-center">
      <div className="nova-idle"><Mascot size={144} /></div>
      <h1 className="mt-5 font-display text-3xl font-extrabold">{tt('questions.generating')}</h1>
      <p className="mt-2 max-w-sm font-bold text-ink/65">{tt(subKey)}</p>
      <div className="mt-5 h-3 w-48 overflow-hidden rounded-full border-2 border-outline bg-white">
        <div
          className="h-full rounded-full bg-mint transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
