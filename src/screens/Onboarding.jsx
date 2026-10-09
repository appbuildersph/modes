import { useState } from 'react'
import { set } from 'idb-keyval'
import { Button, Card, Doodles } from '../ui/Primitives.jsx'
import { Mascot } from '../ui/Mascot.jsx'
import { makeT } from '../lib/i18n.js'
import { GRADES } from '../lib/grades.js'


export default function Onboarding({ lang = 'taglish', onDone }) {
  const tt = makeT(lang)
  const [step, setStep] = useState(1)
  const [grade, setGrade] = useState(null)
  const [name, setName] = useState('')

  async function chooseGrade(value) {
    setGrade(value)
    await set('gabay:selectedGrade', value)
  }

  async function finish() {
    const cleanName = name.trim()
    if (!cleanName) return
    await Promise.all([set('gabay:studentName', cleanName), set('gabay:selectedGrade', grade)])
    onDone?.({ name: cleanName, grade })
  }

  return (
    <div className="gb-shell relative flex min-h-screen flex-col justify-center px-5 py-8">
      <Doodles />
      <Card color="cream" className="relative z-10 gb-pop p-6 text-center">
        <p className="mb-4 text-xs font-extrabold uppercase tracking-widest text-ink/55">
          {tt('onboarding.step', { step })}
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
            <Mascot size={150} float className="mx-auto" />
            <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight">
              {tt('onboarding.greeting', { name: name.trim() })}
            </h1>
            <Button color="yellow" className="mt-5 w-full text-lg" onClick={() => setStep(4)}>
              {tt('common.next')} →
            </Button>
          </>
        )}

        {step === 4 && (
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
