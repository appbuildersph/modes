import { useState } from 'react'
import { Button, Doodles } from '../ui/Primitives.jsx'
import { Mascot } from '../ui/Mascot.jsx'
import OnlineBadge from '../ui/OnlineBadge.jsx'
import SoundToggle from '../ui/SoundToggle.jsx'
import { masteryColor } from '../lib/mastery.js'
import { topicTitleLocalized, topicArea } from '../lib/topics.js'
import { makeT, localize } from '../lib/i18n.js'
import { lessonTeaching } from '../lib/lesson-teaching.js'
import './LessonBrief.css'

export default function LessonBrief({ competency: c, score = 0, answered = false, online = true, lang = 'taglish', onEnter, onEnter3D, onBack }) {
  const tt = makeT(lang), title = topicTitleLocalized(c.ref, c.competency, lang), teaching = lessonTeaching(c)
  const pct = Math.round((score ?? 0) * 100), area = topicArea(c.ref, c.domain)
  const tasks = [tt('brief.task.understandShort'), tt('brief.task.answerShort'), tt('brief.task.askShort')]
  const [step, setStep] = useState(0), [furthest, setFurthest] = useState(0)
  const [unlocked, setUnlocked] = useState(false), [direction, setDirection] = useState('forward')

  const back = () => { if (step === 1) { setDirection('backward'); setStep(0) } }
  const next = () => {
    if (step === 0) { setDirection('forward'); setFurthest(1); setStep(1) }
    else { setFurthest(1); setUnlocked(true) }
  }
  const openViewed = (target) => {
    if (target <= furthest) { setDirection(target < step ? 'backward' : 'forward'); setStep(target) }
  }
  return <div className="lesson-brief-page gb-shell relative flex min-h-screen flex-col px-4 pb-28 pt-4">
    <div className="lesson-brief-doodles"><Doodles /></div>
    <header className="lesson-brief-header">
      <button className="lesson-brief-header-back" onClick={onBack}>{tt('common.back')}</button>
      <div className="lesson-brief-header-meta"><OnlineBadge online={online} /><span className="lesson-brief-brand"><Mascot size={22} />Gabay</span></div>
    </header>
    <main className="lesson-brief-content">
      <div className={`lesson-brief-carousel is-step-${step + 1}`} aria-label="Lesson introduction">
      <div key={`${step}-${lang}`} className={`lesson-brief-slide lesson-brief-slide-${step + 1} is-${direction}`}>
        {step === 0 && <section className="lesson-brief-section" aria-labelledby="lesson-overview-title"><span className="lesson-brief-illustration" aria-hidden="true" />
          <h2 className="lesson-brief-section-title">{tt('brief.lessonOverview')}</h2>
          <p className="lesson-brief-domain">{tt(`domain.${c.domain}`)}</p>
          <h1 id="lesson-overview-title" className="lesson-brief-title">{title}</h1>
          <p className="lesson-brief-explanation">{localize(teaching.explanation, lang)}</p>
          <div className="lesson-brief-standard"><span className="lesson-brief-check" aria-hidden="true">{'\u2713'}</span><div><p className="font-extrabold">{lang === 'en' ? tt('brief.contentStandard') : tt('brief.lessonGoal')}</p><p>{lang === 'en' ? c.content_standard : localize(teaching.example.prompt, lang)}</p></div></div>
        </section>}
        {step === 1 && <section className="lesson-brief-section" aria-labelledby="lesson-tasks-title"><span className="lesson-brief-illustration" aria-hidden="true" />
          <h2 id="lesson-tasks-title" className="lesson-brief-section-title">{tt('brief.whatYouDo')}</h2>
          <p className="lesson-brief-domain lesson-brief-steps-label">{tt('brief.lessonSteps')}</p>
          <ol className="lesson-brief-task-list">{tasks.map((task, index) => <li key={index}><span className="lesson-brief-task-number">{index + 1}</span><span>{task}</span></li>)}</ol>
          <div className="lesson-brief-learning-tip"><span className="lesson-brief-learning-tip-icon" aria-hidden="true">i</span><div><h3>{tt('brief.learningTip')}</h3><p>{tt('brief.learningTipText')}</p></div></div>
        </section>}
      </div>
      <nav className="lesson-brief-nav" aria-label="Lesson introduction steps">
        <button type="button" className="lesson-brief-nav-button" onClick={back} disabled={!step}><span aria-hidden="true">&larr;</span><span>{tt('common.back')}</span></button>
        <div className="lesson-brief-dots">{[0,1].map((dot) => <button key={dot} type="button" className={`${dot === step ? 'is-active' : ''} ${dot <= furthest ? 'is-viewed' : 'is-locked'}`} disabled={dot > furthest} aria-label={tt('brief.section', { number: dot + 1 })} aria-current={dot === step ? 'step' : undefined} onClick={() => openViewed(dot)} />)}</div>
        <button type="button" className="lesson-brief-nav-button is-next" onClick={next} disabled={step === 1 && unlocked}><span>{step === 1 ? tt('common.done') : tt('common.next')}</span><span aria-hidden="true">&rarr;</span></button>
      </nav>
      </div>
      <ProgressSummary answered={answered} pct={pct} questions={c.items.length} category={tt(`domain.${area}`)} level={tt(`band.${masteryColor(score).band}`)} title={tt('brief.yourProgress')} labels={{ mastery: tt('common.mastery'), questions: tt('brief.questions'), category: tt('brief.category'), level: tt('brief.level') }} />
      <section className={`lesson-brief-entry ${unlocked ? 'is-unlocked' : 'is-locked'}`} aria-live="polite">
      <div className="lesson-brief-mode-grid">
        <Button color="mint" className="lesson-brief-mode-button" onClick={onEnter} disabled={!unlocked}>{!unlocked && <span className="lesson-brief-lock" aria-hidden="true" />}{tt('brief.enter2d')}</Button>
        <Button color="sky" className="lesson-brief-mode-button" onClick={onEnter3D} disabled={!unlocked}>{!unlocked && <span className="lesson-brief-lock" aria-hidden="true" />}{tt('brief.enter3d')}</Button>
      </div>
    </section>
      <SoundToggle className="lesson-brief-page-sound" lang={lang} />
    </main>
  </div>
}
function ProgressSummary({ answered, pct, questions, category, level, title, labels }) {
  const metrics = [
    { accent: 'mint', icon: 'M', value: answered ? `${pct}%` : '\u2014', label: labels.mastery },
    { accent: 'yellow', icon: '?', value: String(questions), label: labels.questions },
    { accent: 'blue', icon: '#', value: category, label: labels.category },
    { accent: 'pink', icon: 'L', value: level, label: labels.level },
  ]
  return (
    <section className="lesson-brief-progress-summary" aria-labelledby="lesson-progress-title">
      <h2 id="lesson-progress-title">{title}</h2>
      <div className="lesson-brief-progress-metrics">
        {metrics.map((metric) => (
          <div key={metric.label} className={`lesson-brief-progress-metric is-${metric.accent}`}>
            <span className="lesson-brief-progress-icon" aria-hidden="true">{metric.icon}</span>
            <span className="lesson-brief-progress-copy">
              <strong>{metric.value}</strong>
              <small>{metric.label}</small>
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
