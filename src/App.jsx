import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { get, set } from 'idb-keyval'
import { loadContentByGrade } from './lib/content.js'
import {
  loadDueForGrade,
  loadMasteryForGrade,
  clearMasteryForGrade,
  migrateMastery,
  pickNext,
  recordAnswer,
} from './lib/mastery.js'
import { initVoices } from './lib/speech.js'
import { loadLang, saveLang, DEFAULT_LANG } from './lib/lang.js'
import { loadMode, saveMode } from './lib/mode-pref.js'
import { DEFAULT_MODE } from './lib/tutor-modes.js'
import { screenAfterSplash } from './lib/onboarding-flow.js'
import { modeUi } from './lib/mode-ui.js'
import ModeTransition from './ui/ModeTransition.jsx'
import { t } from './lib/i18n.js'
import Splash from './screens/Splash.jsx'
import Onboarding from './screens/Onboarding.jsx'
import Lessons from './screens/Lessons.jsx'
import TopicPicker from './screens/TopicPicker.jsx'
import LessonBrief from './screens/LessonBrief.jsx'
import Classroom from './screens/Classroom.jsx'
import Progress from './screens/Progress.jsx'
import Games from './screens/Games.jsx'
import Generating from './screens/Generating.jsx'
import BottomNav from './ui/BottomNav.jsx'
import SoundToggle from './ui/SoundToggle.jsx'
import { loadSoundPrefs, pauseBgm, primeAudio, resumeBgm, startBgm, stopBgm } from './lib/sound.js'
import { prepareQuestionSession } from './lib/question-session.js'
import { DEFAULT_GRADE, isSupportedGrade } from './lib/grades.js'
import { apiUrl } from './lib/api-base.js'

const Classroom3D = lazy(() => import('./screens/Classroom3D.jsx'))

export default function App() {
  const [screen, setScreen] = useState('splash')
  const [mastery, setMastery] = useState({})
  const [due, setDue] = useState({})
  const [grade, setGrade] = useState(6)
  const [studentName, setStudentName] = useState('')
  const [active, setActive] = useState(null)
  const [current, setCurrent] = useState(null)
  const [topicMode, setTopicMode] = useState('browse')
  const [online, setOnline] = useState(navigator.onLine)
  const [lang, setLangState] = useState(DEFAULT_LANG)
  const [mode, setModeState] = useState(DEFAULT_MODE)
  const [modeSwitch, setModeSwitch] = useState(null) // { to, id } while the switch cover shows
  const [questionSession, setQuestionSession] = useState(null)
  const [content, setContent] = useState([])
  const classroomStartRef = useRef(false)
  const next = pickNext(content, mastery, due)

  async function refreshLearning(nextGrade = grade) {
    const [nextMastery, nextDue] = await Promise.all([
      loadMasteryForGrade(nextGrade),
      loadDueForGrade(nextGrade),
    ])
    setMastery(nextMastery)
    setDue(nextDue)
  }

  useEffect(() => {
    initVoices()
    ;(async () => {
      await migrateMastery()
      const [savedLang, savedMode, savedGrade, savedName] = await Promise.all([
        loadLang(),
        loadMode(),
        get('gabay:selectedGrade'),
        get('gabay:studentName'),
      ])
      // A learner onboarded before the scope narrowed to Grades 4-6 can still
      // have 1-3 stored; fall back rather than loading an empty catalog.
      const storedGrade = Number(savedGrade)
      const initialGrade = isSupportedGrade(storedGrade) ? storedGrade : DEFAULT_GRADE
      if (storedGrade !== initialGrade) await set('gabay:selectedGrade', initialGrade)
      setLangState(savedLang)
      setModeState(savedMode)
      setGrade(initialGrade)
      setStudentName(savedName ?? '')
      setContent(await loadContentByGrade(initialGrade))
      await refreshLearning(initialGrade)
    })()
    loadSoundPrefs()
  }, [])

  useEffect(() => {
    const onVis = () => (document.hidden ? pauseBgm() : resumeBgm())
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  useEffect(() => {
    let cancelled = false
    // navigator.onLine and the online/offline events only reflect the OS-level
    // network state — DevTools' Network throttling "Offline" preset blocks
    // requests without flipping either, so poll a no-op endpoint to catch that.
    async function probe() {
      try {
        const res = await fetch(apiUrl('/api/ping'), { cache: 'no-store', signal: AbortSignal.timeout(4000) })
        if (!cancelled) setOnline(res.ok)
      } catch {
        if (!cancelled) setOnline(false)
      }
    }
    const off = () => setOnline(false)
    window.addEventListener('online', probe)
    window.addEventListener('offline', off)
    probe()
    const interval = setInterval(probe, 8000)
    return () => {
      cancelled = true
      clearInterval(interval)
      window.removeEventListener('online', probe)
      window.removeEventListener('offline', off)
    }
  }, [])

  function changeLang(nextLang) {
    setLangState(nextLang)
    saveLang(nextLang)
  }

  function applyMode(nextMode) {
    setModeState(nextMode)
    saveMode(nextMode)
    // Kalma is music-free; switching in or out takes effect right away.
    if (screen === 'splash') return
    if (modeUi(nextMode).music) startBgm()
    else stopBgm()
  }

  // Switching mode shows a full-page cover; the new look is applied under it.
  function changeMode(nextMode) {
    if (nextMode === mode && !modeSwitch) return
    setModeSwitch({ to: nextMode, id: Date.now() })
  }

  function navTo(key) {
    if (key === 'lessons') setScreen('start')
    else if (key === 'practice') {
      setTopicMode('practice')
      setScreen('topics')
    } else if (key === 'games') setScreen('games')
    else if (key === 'profile') setScreen('progress')
  }

  // One hook for every screen: src/styles/modes.css keys off <html data-mode>.
  useEffect(() => {
    document.documentElement.dataset.mode = mode
  }, [mode])

  function withNav(activeKey, node, showSound = true) {
    return (
      <>
        {node}
        {showSound && modeUi(mode).music && <SoundToggle lang={lang} />}
        <BottomNav active={activeKey} onNav={navTo} lang={lang} />
      </>
    )
  }

  function goBrief(competency) {
    if (!competency) return
    setActive(competency)
    setCurrent(competency)
    setScreen('brief')
  }

  async function enterClassroom(kind) {
    if (!active || classroomStartRef.current) return
    classroomStartRef.current = true
    setScreen('generating')
    try {
      const session = await prepareQuestionSession({
        grade,
        mode: 'quiz',
        scope: { key: `lesson:${active.ref}`, refs: [active.ref] },
        count: 5,
        language: lang,
        mastery,
        connectivity: online,
        competencies: content,
      })
      setQuestionSession(session)
      setScreen(kind === '3d' ? 'classroom3d' : 'classroom')
    } catch {
      setScreen('brief')
    } finally {
      classroomStartRef.current = false
    }
  }

  async function handleAnswered(ref, correct) {
    await recordAnswer(ref, correct, grade)
    await refreshLearning(grade)
  }

  async function handleGradeChanged(nextGrade, destination = 'home') {
    setGrade(nextGrade)
    setActive(null)
    setCurrent(null)
    const [nextContent] = await Promise.all([loadContentByGrade(nextGrade), refreshLearning(nextGrade)])
    setContent(nextContent)
    setScreen(destination)
  }

  async function handleProfileGradeChanged(nextGrade) {
    await clearMasteryForGrade(grade)
    await set('gabay:selectedGrade', nextGrade)
    await handleGradeChanged(nextGrade, 'progress')
  }

  const modeCover = modeSwitch && (
    <ModeTransition
      key={modeSwitch.id}
      to={modeSwitch.to}
      lang={lang}
      tt={(key, vars) => t(key, lang, vars)}
      onApply={() => applyMode(modeSwitch.to)}
      onDone={() => setModeSwitch(null)}
    />
  )

  return (
    <>
      {renderScreen()}
      {modeCover}
    </>
  )

  function renderScreen() {
  switch (screen) {
    case 'splash':
      return (
        <Splash
          lang={lang}
          onStart={async () => {
            primeAudio()
            if (modeUi(mode).music) startBgm()
            const name = await get('gabay:studentName')
            setScreen(screenAfterSplash(name))
          }}
        />
      )

    case 'onboarding':
      return (
        <Onboarding
          lang={lang}
          onDone={async ({ name, grade: selectedGrade, mode: selectedMode }) => {
            setStudentName(name)
            changeMode(selectedMode ?? DEFAULT_MODE)
            setGrade(selectedGrade)
            const [nextContent] = await Promise.all([loadContentByGrade(selectedGrade), refreshLearning(selectedGrade)])
            setContent(nextContent)
            setScreen('home')
          }}
        />
      )

    case 'home':
    case 'start':
      return withNav('lessons', (
        <Lessons
          lang={lang}
          competencies={content}
          mastery={mastery}
          next={next}
          studentName={studentName}
          grade={grade}
          online={online}
          onPick={goBrief}
        />
      ))

    case 'topics':
      return withNav(topicMode === 'practice' ? 'practice' : 'lessons', (
        <TopicPicker
          online={online}
          lang={lang}
          competencies={content}
          mastery={mastery}
          due={due}
          grade={grade}
          mode={topicMode}
          onBrowse={() => setTopicMode('browse')}
          onPick={goBrief}
          onBack={() => setScreen(topicMode === 'practice' ? 'home' : 'start')}
        />
      ))

    case 'brief':
      return withNav('practice', (
        <LessonBrief
          online={online}
          lang={lang}
          competency={active}
          score={mastery[active.ref] ?? 0}
          answered={Object.prototype.hasOwnProperty.call(mastery, active.ref)}
          onEnter={() => enterClassroom('2d')}
          onEnter3D={() => enterClassroom('3d')}
          onBack={() => setScreen('topics')}
        />
      ), false)

    case 'classroom':
      return (
        <Classroom
          competency={active}
          questions={questionSession?.questions}
          questionSource={questionSession?.source}
          score={mastery[active.ref] ?? 0}
          answered={Object.prototype.hasOwnProperty.call(mastery, active.ref)}
          online={online}
          lang={lang}
          mode={mode}
          onLang={changeLang}
          onAnswered={handleAnswered}
          onExit={() => setScreen('progress')}
        />
      )

    case 'classroom3d':
      return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[var(--gb-secondary-dark)] font-display text-xl text-cream">{t('3d.preparing', lang)}</div>}>
          <Classroom3D
            competency={active}
            questions={questionSession?.questions}
            questionSource={questionSession?.source}
            score={mastery[active.ref] ?? 0}
            online={online}
            lang={lang}
            mode={mode}
            onAnswered={handleAnswered}
            onExit={() => setScreen('progress')}
            onFallback2D={() => setScreen('classroom')}
          />
        </Suspense>
      )

    case 'generating':
      return <Generating lang={lang} />

    case 'progress':
      return withNav('profile', (
        <Progress
          online={online}
          lang={lang}
          competencies={content}
          mastery={mastery}
          grade={grade}
          studentName={studentName}
          onChangeGrade={handleProfileGradeChanged}
          onLang={changeLang}
          mode={mode}
          onMode={changeMode}
        />
      ))

    case 'games':
      return withNav('games', (
        <Games online={online} grade={grade} competencies={content} mastery={mastery} lang={lang} onAnswered={handleAnswered} />
      ))

    default:
      return withNav('lessons', (
        <Lessons
          lang={lang}
          competencies={content}
          mastery={mastery}
          next={next}
          studentName={studentName}
          grade={grade}
          online={online}
          onPick={goBrief}
        />
      ))
  }
  }
}
