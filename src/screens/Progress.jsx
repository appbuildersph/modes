import { useEffect, useMemo, useState } from 'react'
import { Button, MasteryBar } from '../ui/Primitives.jsx'
import { Mascot } from '../ui/Mascot.jsx'
import OnlineBadge from '../ui/OnlineBadge.jsx'
import { hasAnswered, loadStreak } from '../lib/mastery.js'
import { loadHistory } from '../lib/history.js'
import { LANGS } from '../lib/lang.js'
import { makeT } from '../lib/i18n.js'
import './Progress.css'
import { isLessonCompleted, isLessonInProgress } from '../lib/progress.js'
import { GRADES } from '../lib/grades.js'

const DOMAIN_ROWS = [
  { key: 'measurement', label: 'Measurement & Geometry', tone: 'blue', matches: /measurement|geometry/i },
  { key: 'number', label: 'Number & Algebra', tone: 'mint', matches: /number|algebra/i },
  { key: 'statistics', label: 'Statistics & Probability', tone: 'purple', matches: /statistics|probability|data/i },
]

const ACHIEVEMENT_DEFS = [
  // Names and requirements resolve through i18n at render time.
  { key: 'shape', icon: 'shape', tone: 'mint' },
  { key: 'number', icon: 'number', tone: 'sky' },
  { key: 'data', icon: 'data', tone: 'rose' },
  { key: 'streak', icon: 'flame', tone: 'yellow' },
  { key: 'quiz', icon: 'quiz', tone: 'lavender' },
  { key: 'master', icon: 'trophy', tone: 'gold' },
]

export default function Progress({ competencies, mastery, studentName = '', grade = 6, online = true, lang = 'taglish', onChangeGrade, onLang }) {
  const tt = makeT(lang)
  const [answered, setAnswered] = useState(new Set())
  const [streak, setStreak] = useState(0)
  const [history, setHistory] = useState([])
  const [showAllAchievements, setShowAllAchievements] = useState(false)
  const [revealedAchievement, setRevealedAchievement] = useState(null)
  const [expandedPreference, setExpandedPreference] = useState(null)
  const [pendingGrade, setPendingGrade] = useState(null)
  const [changingGrade, setChangingGrade] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      loadStreak(),
      loadHistory(),
      Promise.all(competencies.map(async (competency) => [competency.ref, await hasAnswered(competency.ref, grade)])),
    ]).then(([savedStreak, savedHistory, pairs]) => {
      if (cancelled) return
      setStreak(savedStreak)
      setHistory(savedHistory)
      setAnswered(new Set(pairs.filter(([, value]) => value).map(([ref]) => ref)))
    })
    return () => { cancelled = true }
  }, [competencies, grade, mastery])

  const answeredScores = competencies.filter((competency) => answered.has(competency.ref)).map((competency) => mastery[competency.ref] ?? 0)
  const average = answeredScores.length ? answeredScores.reduce((sum, value) => sum + value, 0) / answeredScores.length : 0
  const averagePct = Math.round(average * 100)
  const lessonsStarted = answered.size
  const lessonsInProgress = competencies.filter((competency) => isLessonInProgress(answered.has(competency.ref), mastery[competency.ref] ?? 0)).length
  const languageLabel = LANGS.find((language) => language.key === lang)?.label ?? 'English'

  const domainProgress = useMemo(() => DOMAIN_ROWS.map((row) => {
    const lessons = competencies.filter((competency) => row.matches.test(competency.domain || ''))
    const score = lessons.length ? lessons.reduce((sum, competency) => sum + (mastery[competency.ref] ?? 0), 0) / lessons.length : 0
    return { ...row, score, pct: Math.round(score * 100) }
  }), [competencies, mastery])

  const achievements = useMemo(() => {
    // "Complete the first lesson in this domain" means ANY lesson in it, not
    // just the domain's first competency.
    const firstLessonComplete = (matches) =>
      competencies.some((competency) => matches.test(competency.domain || '') && isLessonCompleted(mastery[competency.ref] ?? 0))
    const currentRefs = new Set(competencies.map((competency) => competency.ref))
    const unlocked = {
      shape: firstLessonComplete(/measurement|geometry/i),
      number: firstLessonComplete(/number|algebra/i),
      data: firstLessonComplete(/statistics|probability|data/i),
      streak: streak >= 2,
      quiz: hasPerfectQuiz(history, currentRefs),
      master: domainProgress.some((domain) => domain.pct >= 100),
    }
    return ACHIEVEMENT_DEFS
      .map((achievement) => ({ ...achievement, unlocked: unlocked[achievement.key] }))
      .sort((a, b) => Number(b.unlocked) - Number(a.unlocked))
  }, [competencies, domainProgress, history, mastery, streak])
  const unlockedAchievementCount = achievements.filter((achievement) => achievement.unlocked).length
  const achievementProgress = unlockedAchievementCount / ACHIEVEMENT_DEFS.length

  function togglePreference(section) {
    setPendingGrade(null)
    setExpandedPreference((current) => current === section ? null : section)
  }

  async function confirmGradeChange() {
    if (pendingGrade === null || pendingGrade === grade || changingGrade) return
    setChangingGrade(true)
    try {
      await onChangeGrade?.(pendingGrade)
      setPendingGrade(null)
      setExpandedPreference(null)
    } finally {
      setChangingGrade(false)
    }
  }

  return (
    <main className="profile-page profile-dashboard gb-shell">
      <section className="profile-dashboard-hero" aria-labelledby="profile-name">
        <div className="profile-dashboard-top">
          <div className="profile-dashboard-identity">
            <div className="profile-dashboard-avatar">
              <Mascot size={76} alt="Gabay" />
            </div>
            <div className="profile-dashboard-name">
              <p>{tt('profile.myProfile')}</p>
              <h1 id="profile-name">{studentName || 'Learner'}</h1>
              <span>{tt('onboarding.gradeLabel', { grade })}</span>
            </div>
          </div>
          <OnlineBadge online={online} className="profile-dashboard-online" />
        </div>
        <div className="profile-dashboard-mastery">
          <p>{tt('profile.overall')}</p>
          <strong>{averagePct}%</strong>
          <div className="profile-dashboard-overall-bar" role="progressbar" aria-label={tt('profile.overall')} aria-valuemin="0" aria-valuemax="100" aria-valuenow={averagePct}>
            <MasteryBar score={average} />
          </div>
        </div>
      </section>
      <section className="profile-dashboard-card profile-achievements-card" aria-labelledby="achievements-title">
        <div className="profile-achievements-heading">
          <div>
            <h2 id="achievements-title">{tt('profile.achievements')}</h2>
            <p>{tt('profile.achievementsUnlocked', { count: unlockedAchievementCount, total: ACHIEVEMENT_DEFS.length })}</p>
          </div>
          <button type="button" onClick={() => setShowAllAchievements((showing) => !showing)} aria-expanded={showAllAchievements}>
            {tt(showAllAchievements ? 'profile.showLess' : 'profile.viewAll')} <AchievementChevron expanded={showAllAchievements} />
          </button>
        </div>
        <div className="profile-achievements-progress" role="progressbar" aria-label={tt('profile.achievementProgress')} aria-valuemin="0" aria-valuemax="6" aria-valuenow={unlockedAchievementCount}>
          <span style={{ width: `${achievementProgress * 100}%` }} />
        </div>
        <div className={'profile-achievements-grid ' + (showAllAchievements ? 'is-expanded' : 'is-collapsed')}>
          {achievements.map((achievement, index) => (
            <button
              type="button"
              key={achievement.key}
              className={'profile-achievement-item ' + (achievement.unlocked ? 'is-unlocked ' : 'is-locked ') + (revealedAchievement === achievement.key ? 'is-revealed ' : '') + (index >= 3 ? 'is-extra' : '')}
              onClick={() => setRevealedAchievement((current) => current === achievement.key ? null : achievement.key)}
              title={tt(`achievement.${achievement.key}.req`)}
              aria-label={`${tt(`achievement.${achievement.key}.name`)}, ${tt(achievement.unlocked ? 'profile.unlocked' : 'progress.locked')}. ${tt(`achievement.${achievement.key}.req`)}`}
            >
              <span className={'profile-achievement-badge is-' + achievement.tone}>
                <AchievementIcon kind={achievement.icon} />
                <span className="profile-achievement-state" aria-hidden="true">
                  {achievement.unlocked ? <CheckIcon /> : <LockMiniIcon />}
                </span>
              </span>
              <strong>{tt(`achievement.${achievement.key}.name`)}</strong>
              <span className="profile-achievement-requirement">{tt(`achievement.${achievement.key}.req`)}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="profile-stat-grid" aria-label={tt('profile.learningSummary')}>
        <article className="profile-stat-card is-yellow">
          <span className="profile-stat-icon" aria-hidden="true"><FlameIcon /></span>
          <div className="profile-stat-copy">
            <small>{tt('profile.currentStreak')}</small>
            <strong>{tt(streak === 1 ? 'profile.dayCount' : 'profile.dayCountPlural', { count: streak })}</strong>
            <span>{tt('profile.keepGoing')}</span>
          </div>
        </article>
        <article className="profile-stat-card is-mint">
          <span className="profile-stat-icon" aria-hidden="true"><BookIcon /></span>
          <div className="profile-stat-copy">
            <small>{tt('progress.lessonsHeading')}</small>
            <strong>{tt(lessonsStarted === 1 ? 'profile.lessonCount' : 'profile.lessonCountPlural', { count: lessonsStarted })}</strong>
            <span>{tt('profile.inProgress', { count: lessonsInProgress })}</span>
          </div>
        </article>
      </section>
      <section className="profile-dashboard-card profile-preferences-card" aria-labelledby="preferences-title">
        <h2 id="preferences-title">{tt('profile.preferences')}</h2>
        <button type="button" className="profile-preference-row" onClick={() => togglePreference('grade')} aria-expanded={expandedPreference === 'grade'}>
          <span className="profile-preference-icon is-yellow" aria-hidden="true"><CapIcon /></span>
          <strong>{tt('profile.gradeLevel')}</strong><span className="profile-preference-value">{tt('onboarding.gradeLabel', { grade })}</span><ChevronIcon expanded={expandedPreference === 'grade'} />
        </button>
        {expandedPreference === 'grade' && (
          <div className="profile-option-grid is-grade" aria-label={tt('profile.chooseGrade')}>
            {GRADES.map((optionGrade) => (
              <button
                key={optionGrade}
                type="button"
                className={optionGrade === grade ? 'is-active' : ''}
                aria-pressed={optionGrade === grade}
                onClick={() => optionGrade !== grade && setPendingGrade(optionGrade)}
              >
                <span>{tt('onboarding.gradeLabel', { grade: optionGrade })}</span>{optionGrade === grade && <CheckIcon />}
              </button>
            ))}
          </div>
        )}
        <button type="button" className="profile-preference-row" onClick={() => togglePreference('language')} aria-expanded={expandedPreference === 'language'}>
          <span className="profile-preference-icon is-mint" aria-hidden="true"><GlobeIcon /></span>
          <strong>{tt('common.language')}</strong><span className="profile-preference-value">{languageLabel}</span><ChevronIcon expanded={expandedPreference === 'language'} />
        </button>
        {expandedPreference === 'language' && (
          <div className="profile-option-grid is-language" aria-label={tt('profile.chooseLanguage')}>
            {LANGS.map((language) => (
              <button key={language.key} type="button" onClick={() => onLang?.(language.key)} aria-pressed={lang === language.key} className={lang === language.key ? 'is-active' : ''}>
                <span>{language.label}</span>{lang === language.key && <CheckIcon />}
              </button>
            ))}
          </div>
        )}
      </section>
      {pendingGrade !== null && (
        <div className="profile-confirm-backdrop" role="presentation">
          <section className="profile-grade-confirm" role="alertdialog" aria-modal="true" aria-labelledby="profile-grade-confirm-title" aria-describedby="profile-grade-confirm-copy">
            <span className="profile-grade-warning" aria-hidden="true"><WarningIcon /></span>
            <h2 id="profile-grade-confirm-title">{tt('gradePicker.confirmTitle', { grade: pendingGrade })}</h2>
            <p id="profile-grade-confirm-copy">{tt('gradePicker.confirm')}</p>
            <div className="profile-grade-confirm-actions">
              <Button color="mint" onClick={confirmGradeChange} disabled={changingGrade}>
                <CheckIcon /> {tt('gradePicker.yesChange')}
              </Button>
              <Button color="white" onClick={() => setPendingGrade(null)} disabled={changingGrade}>
                <XIcon /> {tt('gradePicker.noKeep', { grade })}
              </Button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

function FlameIcon() {
  return <svg viewBox="0 0 48 56" width="42" height="46" aria-hidden="true"><path d="M27 3c3 10-2 13 5 20 4-4 4-8 3-11 8 7 11 16 9 25-2 10-10 16-20 16S5 46 4 36C3 26 9 18 16 10c0 8 3 11 5 13 5-7 5-13 6-20Z" fill="var(--gb-peach-hover)" stroke="var(--gb-outline)" strokeWidth="2.5" strokeLinejoin="round" /><path d="M24 27c5 6 8 10 6 16-1 4-4 7-8 7-5 0-8-4-8-9 0-4 3-8 7-12 0 4 1 5 3 7 2-3 1-6 0-9Z" fill="var(--gb-primary-soft)" /></svg>
}

function BookIcon() {
  return <svg viewBox="0 0 56 48" width="48" height="42" aria-hidden="true"><path d="M4 7h19c4 0 6 2 6 5v30c-2-3-5-4-9-4H4V7Z" fill="var(--gb-surface-strong)" stroke="var(--gb-outline)" strokeWidth="2.5" strokeLinejoin="round" /><path d="M52 7H33c-4 0-6 2-6 5v30c2-3 5-4 9-4h16V7Z" fill="var(--gb-surface-strong)" stroke="var(--gb-outline)" strokeWidth="2.5" strokeLinejoin="round" /><path d="M4 11H1v32h19c4 0 6 1 8 3 2-2 4-3 8-3h19V11h-3" fill="none" stroke="var(--gb-info)" strokeWidth="3" strokeLinejoin="round" /></svg>
}

function CapIcon() {
  return <svg viewBox="0 0 48 38" width="34" height="28" aria-hidden="true"><path d="m3 13 21-10 21 10-21 10L3 13Z" fill="var(--gb-outline)" stroke="var(--gb-outline)" strokeWidth="2" strokeLinejoin="round" /><path d="M12 18v9c7 6 17 6 24 0v-9" fill="var(--gb-outline)" stroke="var(--gb-outline)" strokeWidth="2" strokeLinejoin="round" /><path d="M44 14v12" stroke="var(--gb-outline)" strokeWidth="2.5" strokeLinecap="round" /><circle cx="44" cy="28" r="2.5" fill="var(--gb-primary)" stroke="var(--gb-outline)" strokeWidth="1.5" /></svg>
}

function GlobeIcon() {
  return <svg viewBox="0 0 24 24" width="27" height="27" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 4 6 4 9s-1 6-4 9c-3-3-4-6-4-9s1-6 4-9Z" /></svg>
}

function ChevronIcon({ expanded = false }) {
  return <svg className={expanded ? 'is-expanded' : ''} viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="m9 5 7 7-7 7" /></svg>
}

function CheckIcon() {
  return <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg>
}

function WarningIcon() {
  return <svg viewBox="0 0 48 48" width="46" height="46" aria-hidden="true"><path d="M24 5 44 40H4Z" fill="var(--gb-primary)" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" /><path d="M24 17v11m0 6v.5" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg>
}

function XIcon() {
  return <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor" /><path d="m8.5 8.5 7 7m0-7-7 7" fill="none" stroke="var(--gb-surface)" strokeWidth="2.3" strokeLinecap="round" /></svg>
}

function hasPerfectQuiz(history, currentRefs) {
  let activeRef = null
  let correctRun = 0
  for (const attempt of history) {
    if (!currentRefs.has(attempt.ref)) continue
    if (!attempt.correct) {
      activeRef = null
      correctRun = 0
      continue
    }
    if (attempt.ref === activeRef) correctRun += 1
    else {
      activeRef = attempt.ref
      correctRun = 1
    }
    if (correctRun >= 5) return true
  }
  return false
}

function AchievementChevron({ expanded = false }) {
  return <svg className={expanded ? 'is-expanded' : ''} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function LockMiniIcon() {
  return <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><rect x="6" y="10" width="12" height="10" rx="2" fill="currentColor" /><path d="M9 10V7.5a3 3 0 0 1 6 0V10" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="15" r="1.2" fill="var(--gb-surface-strong)" /></svg>
}

function AchievementIcon({ kind }) {
  if (kind === 'shape') {
    return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 52 29 15l19 37H10Z" fill="var(--gb-surface-strong)" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" /><path d="m18 46 11-21 11 21H18Z" fill="none" stroke="currentColor" strokeWidth="2.5" /><path d="M42 12h10v40H42Z" fill="var(--gb-primary)" stroke="currentColor" strokeWidth="2.5" transform="rotate(-12 47 32)" /><path d="M46 18h6m-6 7h4m-4 7h6m-6 7h4" stroke="currentColor" strokeWidth="1.6" /></svg>
  }
  if (kind === 'number') {
    return <svg viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="10" width="44" height="44" rx="8" fill="var(--gb-surface-strong)" stroke="currentColor" strokeWidth="3" /><rect x="17" y="17" width="30" height="12" rx="3" fill="var(--gb-sky)" stroke="currentColor" strokeWidth="2" /><path d="M19 38h26M26 32v20M38 32v20" stroke="currentColor" strokeWidth="2.5" /><circle cx="21" cy="43" r="2" fill="var(--gb-primary)" /><circle cx="33" cy="37" r="2" fill="var(--gb-secondary)" /><circle cx="43" cy="48" r="2" fill="var(--gb-rose)" /></svg>
  }
  if (kind === 'data') {
    return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 52h34M15 47V34h8v13m4 0V22h8v25m4 0V14h8v33" fill="var(--gb-primary)" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" /><circle cx="43" cy="39" r="11" fill="var(--gb-surface-strong)" stroke="currentColor" strokeWidth="3" /><path d="m51 47 8 8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg>
  }
  if (kind === 'flame') return <FlameIcon />
  if (kind === 'quiz') {
    return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="m32 7 7 15 17 2-12 12 3 17-15-8-15 8 3-17L8 24l17-2Z" fill="var(--gb-surface-strong)" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" /><path d="m23 33 6 6 13-14" fill="none" stroke="var(--gb-success)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg>
  }
  return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M18 11h28v13c0 11-6 19-14 19s-14-8-14-19V11Z" fill="var(--gb-primary)" stroke="currentColor" strokeWidth="3" /><path d="M18 16H9v7c0 7 5 11 12 11m25-18h9v7c0 7-5 11-12 11M32 43v8m-10 4h20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /><path d="m32 17 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" fill="var(--gb-surface-strong)" stroke="currentColor" strokeWidth="2" /></svg>
}
