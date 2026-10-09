import { useState } from 'react'
import { set } from 'idb-keyval'
import { Button, Card, Doodles } from '../ui/Primitives.jsx'
import { Mascot } from '../ui/Mascot.jsx'
import ModeIcon from '../ui/ModeIcon.jsx'
import { makeT } from '../lib/i18n.js'
import { GRADES } from '../lib/grades.js'
import { MODES, MODE_IDS, DEFAULT_MODE } from '../lib/tutor-modes.js'
import { ONBOARDING_STEPS } from '../lib/onboarding-flow.js'


export default function Onboarding({ lang = 'taglish', onDone }) {
  const tt = makeT(lang)
  const [step, setStep] = useState(1)
  const [grade, setGrade] = useState(null)
  const [name, setName] = useState('')
  const [mode, setMode] = useState(DEFAULT_MODE)

  async function chooseGrade(value) {
    setGrade(value)
    await set('gabay:selectedGrade', value)
  }

  async function finish() {
    const cleanName = name.trim()
    if (!cleanName) return
    await Promise.all([set('gabay:studentName', cleanName), set('gabay:selectedGrade', grade)])
    onDone?.({ name: cleanName, grade, mode })
  }

  return (
    <div className="gb-shell relative flex min-h-screen flex-col justify-center px-5 py-8">
      <Doodles />
      <Card color="cream" className="relative z-10 gb-pop p-6 text-center">
        <p className="mb-4 text-xs font-extrabold uppercase tracking-widest text-ink/55">
          {tt('onboarding.step', { step, total: ONBOARDING_STEPS })}
        </p>

        {step === 1 && (
          <>
            <h1 className="font-display text-3xl font-extrabold">{tt('onboarding.grade')}</h1>
            <div className="mt-5 grid grid-cols-1 gap-3">
              {GRADES.map((value) => (
                <button
                  key={value}
                  onClick={() => chooseGrade(value)}
                  className={`gb-btn text-lg ${grade === value ? 'bg-yellow' : 'bg-white'}`}
                >
                  {tt('onboarding.gradeLabel', { grade: value })}
                </button>
              ))}
            </div>
            <Button color="mint" className="mt-5 w-full text-lg" disabled={!grade} onClick={() => setStep(2)}>
              {tt('common.next')} →
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="font-display text-3xl font-extrabold">{tt('onboarding.name')}</h1>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && name.trim() && setStep(3)}
              className="mt-5 w-full rounded-full border-[2.5px] border-outline bg-white px-5 py-4 text-center text-xl font-extrabold outline-none focus:bg-yellow/20"
              placeholder={tt('onboarding.namePlaceholder')}
              maxLength={40}
            />
            <Button color="mint" className="mt-5 w-full text-lg" disabled={!name.trim()} onClick={() => setStep(3)}>
              {tt('onboarding.next')} →
            </Button>
          </>
        )}

        {step === 3 && (
          <>
            <Mascot size={88} float className="mx-auto -mt-2" />
            <h1 className="mt-1 font-display text-2xl font-extrabold leading-tight">{tt('onboarding.modeTitle')}</h1>
            <p className="mt-1.5 text-sm font-bold text-ink/60">{tt('onboarding.modeHint')}</p>
            <div className="mt-4 grid grid-cols-1 gap-2.5 text-left" role="radiogroup" aria-label={tt('onboarding.modeTitle')}>
              {MODE_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={mode === id}
                  onClick={() => setMode(id)}
                  className={`flex min-h-[56px] w-full items-center gap-3 rounded-[1.25rem] border-[2.5px] border-outline px-4 py-3 text-left ${mode === id ? 'bg-yellow shadow-hard-sm' : 'bg-white'}`}
                >
                  <ModeIcon mode={id} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-display text-lg font-extrabold leading-tight">{MODES[id].label[lang]}</span>
                      <span className="text-sm font-bold text-ink/60">{MODES[id].gloss[lang]}</span>
                    </span>
                    <span className="mt-1 block text-sm font-semibold leading-snug text-ink/80">{MODES[id].description[lang]}</span>
                    {id !== 'none' && mode === id && (
                      <span className="mt-1.5 block text-xs font-medium leading-snug text-ink/60">{MODES[id].useCase[lang]}</span>
                    )}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[2.5px] border-outline ${mode === id ? 'bg-outline' : 'bg-white'}`}
                  >
                    {mode === id && <span className="h-2 w-2 rounded-full bg-yellow" />}
                  </span>
                </button>
              ))}
            </div>
            <Button color="mint" className="mt-5 w-full text-lg" onClick={() => setStep(4)}>
              {tt('common.next')} →
            </Button>
          </>
        )}

        {step === 4 && (
          <>
            <Mascot size={150} float scene="wink" className="mx-auto" />
            <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight">
              {tt('onboarding.greeting', { name: name.trim() })}
            </h1>
            <Button color="yellow" className="mt-5 w-full text-lg" onClick={() => setStep(5)}>
              {tt('common.next')} →
            </Button>
          </>
        )}

        {step === 5 && (
          <>
            <h1 className="font-display text-3xl font-extrabold">{tt('onboarding.masteryTitle')}</h1>
            <div className="mt-6 h-7 overflow-hidden rounded-full border-[2.5px] border-outline bg-white">
              <div className="onboarding-mastery h-full bg-mint" />
            </div>
            <p className="mt-4 text-base font-bold leading-snug text-ink/75">{tt('onboarding.mastery')}</p>
            <Button color="mint" className="mt-5 w-full text-lg" onClick={finish}>
              {tt('onboarding.start')} →
            </Button>
          </>
        )}
      </Card>
    </div>
  )
}
