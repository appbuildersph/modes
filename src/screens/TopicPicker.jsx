import { useEffect, useMemo, useState } from 'react'
import { Card, Chip, Doodles, MasteryBar, Button } from '../ui/Primitives.jsx'
import { Mascot } from '../ui/Mascot.jsx'
import OnlineBadge from '../ui/OnlineBadge.jsx'
import { hasAnswered, masteryColor } from '../lib/mastery.js'
import { topicIcon, topicTitle, topicTitleLocalized } from '../lib/topics.js'
import { makeT } from '../lib/i18n.js'
import { difficultyFor } from '../lib/difficulty.js'
import { LightbulbIcon } from '../ui/Icons.jsx'
import './TopicPicker.css'
import { isLessonStarted, summarizeLessons } from '../lib/progress.js'

const ICON_BG = ['bg-mint', 'bg-sky', 'bg-rose', 'bg-peach', 'bg-yellow', 'bg-lavender']
const ALL = '__all__'
const DIFFICULTIES = [ALL, 'madali', 'katamtaman', 'mahirap']
const DIFFICULTY_COLOR = { madali: 'bg-mint', katamtaman: 'bg-yellow', mahirap: 'bg-peach' }

export default function TopicPicker({
  competencies,
  mastery,
  due = {},
  grade = 6,
  mode = 'browse',
  online = true,
  lang = 'taglish',
  onPick,
  onBack,
  onBrowse,
}) {
  const tt = makeT(lang)
  const [difficulty, setDifficulty] = useState(ALL)
  const [search, setSearch] = useState('')
  const [answered, setAnswered] = useState(new Set())
  const [openDomains, setOpenDomains] = useState(new Set())

  useEffect(() => {
    let live = true
    Promise.all(competencies.map(async (c) => [c.ref, await hasAnswered(c.ref, grade)])).then((pairs) => {
      if (live) setAnswered(new Set(pairs.filter(([, value]) => value).map(([ref]) => ref)))
    })
    return () => { live = false }
  }, [competencies, grade, mastery])

  const shown = useMemo(() => {
    const query = search.trim().toLowerCase()
    const list = competencies.filter((c) => {
      const title = `${topicTitle(c.ref, c.competency)} ${topicTitleLocalized(c.ref, c.competency, lang)}`.toLowerCase()
      const practiceMatch = mode !== 'practice' || (answered.has(c.ref) && (mastery[c.ref] ?? 0) < 0.8)
      return practiceMatch &&
        (difficulty === ALL || difficultyFor(c.competency) === difficulty) &&
        (!query || title.includes(query) || c.competency.toLowerCase().includes(query))
    })
    if (mode === 'practice') list.sort((a, b) => (due[a.ref] ?? Infinity) - (due[b.ref] ?? Infinity))
    return list
  }, [answered, competencies, difficulty, due, lang, mastery, mode, search])

  const groups = useMemo(() => {
    const byDomain = new Map()
    for (const competency of shown) {
      if (!byDomain.has(competency.domain)) byDomain.set(competency.domain, [])
      byDomain.get(competency.domain).push(competency)
    }
    return [...byDomain.entries()].map(([name, lessons]) => ({ name, lessons }))
  }, [shown])

  const searching = Boolean(search.trim())

  function toggleDomain(name) {
    setOpenDomains((current) => {
      const next = new Set(current)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const noPracticeDue = mode === 'practice' && !search.trim() && shown.length === 0

  return (
    <div className={'gb-shell topic-picker-page relative flex min-h-screen flex-col px-5 pb-28 pt-6 ' + (mode === 'practice' ? 'topic-picker-practice' : '')}>
      <Doodles />
      <div className="topic-picker-header mb-4 flex items-center justify-between">
        <button className="gb-chip topic-picker-back bg-white" onClick={onBack}>{tt('common.back')}</button>
        <div className="topic-picker-brand flex items-center gap-2">
          <OnlineBadge online={online} />
          <Mascot size={36} />
          <span className="font-display text-xl font-extrabold">Gabay</span>
        </div>
      </div>

      <h1 className="topic-picker-title font-display text-3xl font-extrabold leading-tight">
        {tt(mode === 'practice' ? 'topics.practiceHeading' : 'topics.heading')}
      </h1>
      <p className="topic-picker-subtitle mb-4 text-base font-bold text-ink/70">
        {tt(mode === 'practice' ? 'topics.practiceSub' : 'topics.sub')}
      </p>

      {mode === 'practice' && (
        <aside className="topic-picker-tip">
          <LightbulbIcon className="topic-picker-tip-icon" />
          <span>{tt('topics.practiceTip')}</span>
        </aside>
      )}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        inputMode="search"
        type="search"
        placeholder={tt('topics.search')}
        aria-label={tt('topics.search')}
        className="topic-picker-search relative z-10 mb-4 min-h-[50px] rounded-full border-[2.5px] border-outline bg-white px-5 text-base font-bold outline-none focus:bg-yellow/20"
      />

      <div className="topic-picker-filters mb-5 flex flex-wrap gap-2">
        {DIFFICULTIES.map((value) => (
          <Chip className="topic-picker-filter" key={value} color={value === 'madali' ? 'mint' : value === 'katamtaman' ? 'yellow' : 'peach'} active={difficulty === value} onClick={() => setDifficulty(value)}>
            {value === ALL ? tt('topics.all') : tt(`difficulty.${value}`)}
          </Chip>
        ))}
      </div>

      {noPracticeDue ? (
        <Card color="cream" className="topic-picker-empty gb-pop p-6 text-center">
          <div className="topic-picker-empty-art"><Mascot size={120} float className="topic-picker-empty-mascot mx-auto" /></div>
          <p className="topic-picker-empty-message mt-3 font-display text-xl font-extrabold">{tt('topics.nothingDue')}</p>
          <Button color="mint" className="topic-picker-empty-cta mt-4 w-full" onClick={onBrowse}>{tt('topics.browseNew')}</Button>
        </Card>
      ) : shown.length === 0 ? (
        <Card color="cream" className="p-6 text-center font-extrabold">{tt('topics.noResults')}</Card>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group, groupIndex) => {
            const isOpen = searching || openDomains.has(group.name)
            // "completed" means 100% mastery — answering once only makes a
            // lesson started. These used to be the same number here, which is
            // why Practice reported lessons Lessons still called Not started.
            const groupSummary = summarizeLessons(
              group.lessons.map((lesson) => ({
                answered: answered.has(lesson.ref),
                score: mastery[lesson.ref] ?? 0,
              })),
            )
            const completed = groupSummary.completed
            const started = groupSummary.started
            const average = groupSummary.averageStartedMastery
            return (
              <Card key={group.name} className="gb-pop overflow-hidden p-0">
                <button
                  type="button"
                  className={`w-full p-4 text-left ${isOpen ? 'bg-yellow/35' : 'bg-white'} focus:outline-none focus-visible:ring-4 focus-visible:ring-sky`}
                  aria-expanded={isOpen}
                  aria-controls={`topic-group-${groupIndex}`}
                  onClick={() => toggleDomain(group.name)}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block font-display text-xl font-extrabold leading-tight">{tt(`domain.${group.name}`)}</span>
                      <span className="mt-1 block text-sm font-bold text-ink/65">
                        {tt(group.lessons.length === 1 ? 'topics.lessonCountOne' : 'topics.lessonCount', { count: group.lessons.length })} · {tt('topics.completedCount', { count: completed })}
                        {started > completed && <> · {tt('topics.startedCount', { count: started - completed })}</>}
                      </span>
                    </span>
                    <span className={`gb-chip shrink-0 ${isOpen ? 'bg-white' : 'bg-yellow'} shadow-hard-sm text-xs`}>
                      {tt(isOpen ? 'topics.hideLessons' : 'topics.showLessons')}
                    </span>
                  </span>
                  {started > 0 && <span className="mt-3 block"><MasteryBar score={average} /></span>}
                </button>

                {isOpen && (
                  <div id={`topic-group-${groupIndex}`} className="border-t-[2.5px] border-outline bg-cream/50 p-3">
                    <div className="overflow-hidden rounded-2xl border-[2.5px] border-outline bg-white">
                      {group.lessons.map((c, lessonIndex) => {
                        const isAnswered = isLessonStarted(answered.has(c.ref), mastery[c.ref] ?? 0)
                        const score = mastery[c.ref] ?? 0
                        const color = masteryColor(score)
                        const lessonDifficulty = difficultyFor(c.competency)
                        return (
                          <button
                            key={c.ref}
                            type="button"
                            className={`flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-yellow/20 focus:bg-yellow/20 focus:outline-none ${lessonIndex ? 'border-t-2 border-outline/20' : ''}`}
                            onClick={() => onPick(c)}
                          >
                            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-outline ${ICON_BG[(groupIndex + lessonIndex) % ICON_BG.length]} text-lg font-extrabold`}>
                              {topicIcon(c.ref)}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block font-display text-base font-bold leading-tight">{topicTitleLocalized(c.ref, c.competency, lang)}</span>
                              <span className="mt-1 flex flex-wrap items-center gap-1.5">
                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${DIFFICULTY_COLOR[lessonDifficulty] ?? 'bg-white'}`}>
                                  {tt(`difficulty.${lessonDifficulty}`)}
                                </span>
                                {isAnswered && <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${color.bg}`}>{Math.round(score * 100)}%</span>}
                              </span>
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
