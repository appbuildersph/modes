import { useEffect, useMemo, useState } from 'react'
import { Button, Card, MasteryBar } from '../ui/Primitives.jsx'
import LessonIcon from '../ui/LessonIcon.jsx'
import { Mascot } from '../ui/Mascot.jsx'
import OnlineBadge from '../ui/OnlineBadge.jsx'
import { hasAnswered, masteryColor } from '../lib/mastery.js'
import { topicTitleLocalized } from '../lib/topics.js'
import { makeT } from '../lib/i18n.js'
import { isLessonCompleted, isLessonInProgress } from '../lib/progress.js'
import './Home.css'
import './Progress.css'

const INITIAL_VISIBLE_LESSONS = 3

export default function Lessons({ competencies, mastery, next, studentName = '', grade = 6, online = true, lang = 'taglish', onPick }) {
  const tt = makeT(lang)
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('desc')
  const [answered, setAnswered] = useState(new Set())
  const [expandedDomains, setExpandedDomains] = useState(new Set())
  const [revealedDomains, setRevealedDomains] = useState(new Set())

  useEffect(() => {
    let cancelled = false
    Promise.all(competencies.map(async (competency) => [competency.ref, await hasAnswered(competency.ref, grade)]))
      .then((pairs) => {
        if (!cancelled) setAnswered(new Set(pairs.filter(([, value]) => value).map(([ref]) => ref)))
      })
    return () => {
      cancelled = true
    }
  }, [competencies, grade, mastery])

  useEffect(() => {
    const firstDomain = next?.domain || competencies[0]?.domain
    setExpandedDomains(firstDomain ? new Set([firstDomain]) : new Set())
  }, [competencies, grade, next?.domain])

  useEffect(() => {
    setRevealedDomains(new Set())
  }, [competencies, filter, grade])

  const lessonItems = useMemo(
    () => competencies.map((competency) => ({
      c: competency,
      s: mastery[competency.ref] ?? 0,
      answered: answered.has(competency.ref),
    })),
    [answered, competencies, mastery],
  )

  const ordered = useMemo(() => {
    const list = lessonItems.filter((lesson) => {
      if (filter === 'started') return isLessonInProgress(lesson.answered, lesson.s)
      if (filter === 'completed') return isLessonCompleted(lesson.s)
      return true
    })
    list.sort((a, b) => (sort === 'asc' ? a.s - b.s : b.s - a.s))
    return list
  }, [filter, lessonItems, sort])

  const groups = useMemo(() => {
    const byDomain = new Map()
    for (const item of lessonItems) {
      const domain = item.c.domain || 'Math Lessons'
      if (!byDomain.has(domain)) byDomain.set(domain, { allLessons: [], lessons: [] })
      byDomain.get(domain).allLessons.push(item)
    }
    for (const item of ordered) {
      const domain = item.c.domain || 'Math Lessons'
      byDomain.get(domain).lessons.push(item)
    }
    return Array.from(byDomain, ([domain, value]) => ({ domain, ...value }))
      .filter((group) => group.lessons.length)
  }, [lessonItems, ordered])

  useEffect(() => {
    const visibleDomains = new Set(groups.map((group) => group.domain))
    setExpandedDomains((current) => {
      if (Array.from(current).some((domain) => visibleDomains.has(domain))) return current
      return groups[0]?.domain ? new Set([groups[0].domain]) : new Set()
    })
  }, [groups])

  const nextTitle = next ? topicTitleLocalized(next.ref, next.competency, lang) : ''
  const nextStarted = next ? (mastery[next.ref] ?? 0) > 0 : false

  function toggleDomain(domain) {
    setExpandedDomains((current) => {
      const updated = new Set(current)
      if (updated.has(domain)) updated.delete(domain)
      else updated.add(domain)
      return updated
    })
  }

  function toggleDomainLessons(domain) {
    setRevealedDomains((current) => {
      const updated = new Set(current)
      if (updated.has(domain)) updated.delete(domain)
      else updated.add(domain)
      return updated
    })
  }

  return (
    <main className="lessons-page profile-page gb-shell">
      <header className="home-header">
        <div className="home-brand">
          <span className="home-brand-mark" aria-hidden="true"><Mascot size={42} /></span>
          <span>Gabay</span>
        </div>
        <OnlineBadge online={online} className="home-online-badge" />
      </header>

      <section className="home-welcome lessons-hero" aria-labelledby="lessons-greeting">
        <div className="home-hero">
          <div className="home-hero-content">
            <div className="home-greeting-row">
              <h1 id="lessons-greeting">
                {studentName ? tt('home.greetingName', { name: studentName }) : tt('home.greeting')}
              </h1>
            </div>
            <p className="home-subtitle">{tt('home.subtitle')}</p>
            <div className="home-hero-meta">
              <span className="home-grade-pill">{tt('home.grade', { grade })}</span>
              <span className="home-hallway-pill">{tt('home.hallwayTag')}</span>
            </div>
          </div>
        </div>
      </section>

      {next && (
        <Card color="yellow" className="profile-next-card gb-pop">
          <TopicArtwork lesson={next} title={nextTitle} />
          <div className="profile-next-main">
            <div className="profile-next-copy">
              <p><span>{tt('progress.nextUp')}</span></p>
              <h2>{nextTitle}</h2>
            </div>
            <Button color="white" className="profile-next-button" onClick={() => onPick(next)}>
              {tt(nextStarted ? 'progress.continue' : 'progress.start')} <ArrowIcon />
            </Button>
          </div>
        </Card>
      )}

      <section className="profile-lessons" aria-labelledby="lessons-title">
        <h1 id="lessons-title">{tt('progress.lessonsHeading')}</h1>
        <div className="profile-filter-tabs" role="group" aria-label={tt('progress.filterLabel')}>
          {['all', 'started', 'completed'].map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={filter === value}
              className={filter === value ? 'is-active' : ''}
              onClick={() => setFilter(value)}
            >
              {tt('progress.filter.' + value)}
            </button>
          ))}
        </div>
        {filter === 'started' && (
          <div className="profile-sort-row">
            <span>{tt('progress.sortBy')}</span>
            <div className="profile-sort-buttons">
              <button type="button" onClick={() => setSort('asc')} className={sort === 'asc' ? 'is-active' : ''} aria-label={tt('progress.asc')}>
                <SortArrowIcon direction="up" />
              </button>
              <button type="button" onClick={() => setSort('desc')} className={sort === 'desc' ? 'is-active' : ''} aria-label={tt('progress.desc')}>
                <SortArrowIcon direction="down" />
              </button>
            </div>
          </div>
        )}

        <div className="profile-domain-list">
          {!groups.length && (
            <Card color="cream" className="profile-filter-empty">
              <strong>{tt('progress.filterEmptyTitle')}</strong>
              <span>{tt('progress.filterEmptyBody')}</span>
            </Card>
          )}
          {groups.map(({ domain, lessons, allLessons }) => {
            const expanded = expandedDomains.has(domain)
            const revealed = revealedDomains.has(domain)
            const localizedDomain = tt('domain.' + domain)
            const domainLabel = localizedDomain.startsWith('domain.') ? domain : localizedDomain
            const completed = allLessons.filter((lesson) => isLessonCompleted(lesson.s)).length
            const domainScore = allLessons.length
              ? allLessons.reduce((sum, lesson) => sum + lesson.s, 0) / allLessons.length
              : 0
            const domainPct = Math.round(domainScore * 100)
            const domainTone = /measurement|geometry/i.test(domain)
              ? 'is-mint'
              : /probability|statistics|data/i.test(domain)
                ? 'is-rose'
                : 'is-sky'
            const visibleLessons = revealed ? lessons : lessons.slice(0, INITIAL_VISIBLE_LESSONS)
            const hiddenCount = Math.max(0, lessons.length - INITIAL_VISIBLE_LESSONS)

            return (
              <article key={domain} className={'profile-domain-card lesson-category-overlay ' + domainTone + ' ' + (expanded ? 'is-expanded' : '')}>
                <button type="button" className="profile-domain-toggle" onClick={() => toggleDomain(domain)} aria-expanded={expanded}>
                  <span className="lesson-category-meta">
                    <span className="lesson-category-status">{tt('home.open')}</span>
                    <span className="lesson-category-progress-pill">{domainPct}%</span>
                  </span>
                  <DomainArtwork domain={domain} />
                  <span className="profile-domain-copy">
                    <strong>{domainLabel}</strong>
                    <small>{tt('progress.completedCount', { completed, total: allLessons.length })}</small>
                    <span
                      className="profile-domain-progress"
                      role="progressbar"
                      aria-label={domainLabel + ' ' + tt('common.mastery')}
                      aria-valuemin="0"
                      aria-valuemax="100"
                      aria-valuenow={domainPct}
                    >
                      <MasteryBar score={domainScore} />
                    </span>
                  </span>
                  <span className="lesson-category-open">
                    <span>{tt('home.open')}</span>
                    <span aria-hidden="true">&rarr;</span>
                  </span>
                </button>

                {expanded && (
                  <div className="profile-domain-lessons">
                    {visibleLessons.map(({ c, s, answered: lessonAnswered }) => {
                      const color = masteryColor(s)
                      const recommended = next?.ref === c.ref
                      const completedLesson = isLessonCompleted(s)
                      // History-backed, so a wrong answer no longer flips a
                      // lesson back to "Not started".
                      const startedLesson = isLessonInProgress(lessonAnswered, s)
                      const pct = Math.round(s * 100)
                      const lessonTitle = topicTitleLocalized(c.ref, c.competency, lang)
                      const actionLabel = recommended
                        ? tt(startedLesson ? 'progress.continue' : 'progress.start')
                        : tt(completedLesson ? 'progress.reviewLesson' : startedLesson ? 'progress.continue' : 'progress.start')
                      return (
                        <button
                          type="button"
                          key={c.ref}
                          className={'profile-lesson-row ' + (recommended ? 'is-recommended ' : '') + (completedLesson ? 'is-completed' : '')}
                          onClick={() => onPick(c)}
                        >
                          <LessonArtwork lesson={c} title={lessonTitle} />
                          <span className="profile-lesson-copy">
                            <strong>{lessonTitle}</strong>
                            {recommended && <span className="profile-recommended-chip">{tt('progress.recommended')}</span>}
                            {!recommended && (
                              <small>
                                {completedLesson
                                  ? tt('progress.completed')
                                  : startedLesson
                                    ? tt('progress.lessonProgress', { pct })
                                    : tt('progress.notStarted')}
                              </small>
                            )}
                            {s > 0 && (
                              <span
                                className="profile-lesson-progress"
                                role="progressbar"
                                aria-label={lessonTitle + ' ' + tt('common.mastery')}
                                aria-valuemin="0"
                                aria-valuemax="100"
                                aria-valuenow={pct}
                              >
                                <MasteryBar score={s} />
                                <b>{pct}%</b>
                              </span>
                            )}
                          </span>
                          <span className={'profile-lesson-action ' + (recommended ? 'is-primary' : '')}>
                            {actionLabel}
                          </span>
                          {s > 0 && <span className={'profile-band-dot ' + color.bg} aria-hidden="true" />}
                        </button>
                      )
                    })}
                    {lessons.length > INITIAL_VISIBLE_LESSONS && (
                      <button
                        type="button"
                        className="profile-show-more"
                        aria-expanded={revealed}
                        onClick={() => toggleDomainLessons(domain)}
                      >
                        {revealed ? tt('progress.showLess') : tt('progress.showMore', { count: hiddenCount })}
                        <ChevronIcon expanded={revealed} />
                      </button>
                    )}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}

function TopicArtwork({ lesson, title }) {
  return (
    <div className="profile-topic-art" aria-hidden="true">
      <LessonIcon refId={lesson.ref} title={title} competency={lesson.competency} domain={lesson.domain} size={52} />
    </div>
  )
}

function DomainArtwork({ domain = '' }) {
  const icon = /probability|statistics|data/i.test(domain)
    ? '/ui-assets/statistics-probability.png'
    : /measurement|geometry/i.test(domain)
      ? '/ui-assets/measurement-geometry.png'
      : '/ui-assets/number-algebra.png'

  return (
    <span className="profile-domain-art" aria-hidden="true">
      <img src={icon} alt="" />
    </span>
  )
}

function LessonArtwork({ lesson, title }) {
  const palette = /SP|DP/.test(lesson.ref) ? 'rose' : /MG/.test(lesson.ref) ? 'mint' : 'yellow'
  return (
    <span className={'profile-lesson-art is-' + palette} aria-hidden="true">
      <LessonIcon refId={lesson.ref} title={title} competency={lesson.competency} domain={lesson.domain} size={28} />
    </span>
  )
}

function ChevronIcon({ expanded = false }) {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" className={'profile-chevron ' + (expanded ? 'is-expanded' : '')} aria-hidden="true">
      <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true">
      <path d="M4 12h15m-5-5 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SortArrowIcon({ direction = 'up' }) {
  const down = direction === 'down'
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d={down ? 'M12 4v16m-6-6 6 6 6-6' : 'M12 20V4m-6 6 6-6 6 6'}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
