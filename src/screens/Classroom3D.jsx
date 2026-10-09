import { useEffect, useRef, useState } from 'react'
import { get, set } from 'idb-keyval'
import { buildClassroom, THEME_LIST } from '../three/scene.js'
import { Button, RefBadge, RichText } from '../ui/Primitives.jsx'
import OnlineBadge from '../ui/OnlineBadge.jsx'
import { Mascot } from '../ui/Mascot.jsx'
import { checkAnswer, choiceOptions } from '../lib/check.js'
import { speak, stopSpeaking, isSpeechSupported } from '../lib/speech.js'
import { askTeacherGabay, SOURCE } from '../lib/tutor.js'
import { createRecognizer, isRecognitionSupported, createGeminiRecorder, isMediaRecorderSupported } from '../lib/voicein.js'
import { EarIcon } from '../ui/Icons.jsx'
import { feedbackFor } from '../lib/feedback.js'
import { recordAttempt } from '../lib/history.js'
import { topicFull } from '../lib/topics.js'
import { loadTheme, saveTheme, DEFAULT_THEME } from '../lib/theme.js'
import { makeT, localize, localizeChoice } from '../lib/i18n.js'
import { speechLang } from '../lib/lang.js'
import { sfx, primeAudio } from '../lib/sound.js'
import { ChoiceVisual, QuestionVisual } from '../ui/LearningVisual.jsx'

const SOURCE_KEY = {
  [SOURCE.NANO]: 'class.source.nano',
  [SOURCE.ONLINE]: 'class.source.online',
  [SOURCE.CACHED]: 'class.source.cached',
}

// One margin for the whole HUD, so nothing sits against the phone bezel.
const HUD_INSET =
  'left-[max(1rem,env(safe-area-inset-left))] right-[max(1rem,env(safe-area-inset-right))] ' +
  'top-[max(1rem,env(safe-area-inset-top))] bottom-[max(1rem,env(safe-area-inset-bottom))]'

// Strip **bold** markup before reading aloud.
function plain(s) {
  return String(s ?? '').replace(/\*\*/g, '')
}

// Embed harness: hosts codex's Three.js classroom inside React.
// React owns the DOM shell + lesson modal + content/mastery/voice bridge.
// Three.js owns the canvas. The whole scene lives in three/scene.js -> buildClassroom(),
// so codex's richer geometry can replace that one function without touching this file.
export default function Classroom3D({ competency, questions, questionSource = 'bundled', score, online, lang = 'taglish', onAnswered, onExit, onFallback2D }) {
  const c = { ...competency, items: questions?.length ? questions : competency.items }
  const tt = makeT(lang)
  const mountRef = useRef(null)
  const sceneRef = useRef(null)

  const [ready, setReady] = useState(false)
  const [sceneError, setSceneError] = useState(false)
  const [atBoard, setAtBoard] = useState(false)
  const [modal, setModal] = useState(false)
  const [idx, setIdx] = useState(0)
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [fb, setFb] = useState(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [answers, setAnswers] = useState([])
  const [done, setDone] = useState(false)
  const [theme, setTheme] = useState(DEFAULT_THEME)
  const [themeOpen, setThemeOpen] = useState(false)
  const [nudge, setNudge] = useState(null) // 'needAnswer' | 'needNumber' | null — gentle input validation
  const [coachStep, setCoachStep] = useState(null)
  // Teacher Gabay — the mascot is the way in, same tutor as the 2D classroom.
  const [askOpen, setAskOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [reply, setReply] = useState(null)
  const [thinking, setThinking] = useState(false)
  const [listening, setListening] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const recRef = useRef(null)

  const item = c.items[idx]
  const itemOptions = choiceOptions(item)
  const itemRef = useRef(item)

  useEffect(() => {
    itemRef.current = item
  }, [item])

  useEffect(() => {
    get('gabay:3d-coached').then((coached) => setCoachStep(coached ? null : 1))
  }, [])

  useEffect(() => () => recRef.current?.stop(), [])

  useEffect(() => {
    if (coachStep !== 1) return
    const onMoveKey = (event) => {
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(event.key.toLowerCase())) {
        setCoachStep(2)
      }
    }
    window.addEventListener('keydown', onMoveKey)
    return () => window.removeEventListener('keydown', onMoveKey)
  }, [coachStep])

  useEffect(() => {
    if (!atBoard || coachStep !== 2) return
    setCoachStep(null)
    set('gabay:3d-coached', true)
  }, [atBoard, coachStep])

  // Boot the Three.js scene once.
  useEffect(() => {
    if (!mountRef.current) return
    let api
    try {
      api = buildClassroom({
        mount: mountRef.current,
        competency: c,
        boardText: localize(c.items?.[0]?.q, lang),
        labels: { correct: tt('3d.board.correct'), tryAgain: tt('3d.board.tryAgain'), ready: tt('3d.board.ready') },
        // fired when the player walks into the blackboard zone
        onNearBoard: (near) => setAtBoard(near),
        onInteract: () => openBoard(),
      })
    } catch (error) {
      console.warn('3D classroom unavailable; offering 2D fallback.', error)
      mountRef.current.replaceChildren()
      setSceneError(true)
      return undefined
    }
    sceneRef.current = api
    setReady(true)
    return () => {
      stopSpeaking()
      api.dispose()
      sceneRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Teacher greeting on entry (voice-out, offline-safe).
  useEffect(() => {
    if (ready) speak(tt('class.welcome3d'), { lang })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  // Load the saved "renovation" theme, then apply it once the scene is live.
  useEffect(() => {
    loadTheme().then(setTheme)
  }, [])
  useEffect(() => {
    if (ready) sceneRef.current?.setTheme(theme)
  }, [ready, theme])

  function changeTheme(key) {
    setTheme(key)
    saveTheme(key)
    sceneRef.current?.setTheme(key)
  }

  // The mascot opens the tutor: pointer lock and walking must stop first so the
  // learner can type, and the scene resumes when the sheet closes.
  function openAsk() {
    setThemeOpen(false)
    primeAudio()
    sceneRef.current?.setMove(0, 0)
    sceneRef.current?.setControls(false)
    setAskOpen(true)
  }

  function closeAsk() {
    recRef.current?.stop()
    setListening(false)
    setTranscribing(false)
    stopSpeaking()
    setAskOpen(false)
    if (!modal && !done) sceneRef.current?.setControls(true)
  }

  async function askGabay(q) {
    const text = (q ?? question).trim()
    if (!text || thinking) return
    setThinking(true)
    setReply(null)
    stopSpeaking()
    try {
      const r = await askTeacherGabay(text, c.ref, lang)
      setReply(r)
      speak(plain(r.text), { lang })
    } catch {
      setReply({ text: tt('class.askError'), source: SOURCE.CACHED })
    } finally {
      setThinking(false)
    }
  }

  function startWebSpeech() {
    const rec = createRecognizer({
      lang: speechLang(lang),
      onResult: (text) => {
        setQuestion(text)
        askGabay(text)
      },
      onError: () => setListening(false),
      onEnd: () => setListening(false),
    })
    if (!rec) {
      setListening(false)
      return
    }
    recRef.current = rec
    setListening(true)
    rec.start()
  }

  function toggleMic() {
    if (listening) {
      setTranscribing(true)
      speak(tt('class.listeningShort'), { lang })
      recRef.current?.stop()
      return
    }
    if (online && isMediaRecorderSupported()) {
      const rec = createGeminiRecorder({
        onStart: () => setListening(true),
        onResult: (text) => {
          setTranscribing(false)
          setQuestion(text)
          askGabay(text)
        },
        onError: (err) => {
          setTranscribing(false)
          if (err === 'stt-unconfigured' || err === 'stt-failed') startWebSpeech()
        },
        onEnd: () => {
          setListening(false)
          setTranscribing(false)
        },
      })
      if (rec) {
        recRef.current = rec
        rec.start()
        return
      }
    }
    startWebSpeech()
  }

  function openBoard() {
    setThemeOpen(false)
    primeAudio() // tapping the board is a user gesture — unlock audio here too
    sceneRef.current?.setControls(false) // release pointer lock while answering
    setModal(true)
    speak(localize(itemRef.current.q, lang), { lang })
  }

  function submit() {
    if (result !== null) return
    // Validation: don't let an empty / meaningless answer count as an attempt.
    if (!input.trim()) {
      setNudge('needAnswer')
      return
    }
    if (!itemOptions && item.type === 'numeric' && !/\d/.test(input)) {
      setNudge('needNumber')
      return
    }
    setNudge(null)
    const locItem = { ...item, q: localize(item.q, lang), solution: localize(item.solution, lang) }
    const ok = checkAnswer(item, input)
    const f = feedbackFor(locItem, ok, lang, idx)
    setResult(ok)
    setFb(f)
    sfx(ok ? 'correct' : 'wrong')
    if (ok) setCorrectCount((n) => n + 1)
    setAnswers((a) => [...a, { q: locItem.q, your: input.trim(), answer: item.answer, correct: ok, solution: locItem.solution }])
    recordAttempt({ ref: item.ref ?? c.ref, q: locItem.q, your: input.trim(), answer: item.answer, correct: ok, feedback: ok ? f.headline : f.body, source: item.source ?? questionSource })
    onAnswered(c.ref, ok)
    speak(ok ? f.headline : `${f.headline} ${plain(f.body)}`, { lang })
    sceneRef.current?.markBoard(ok)
  }

  function next() {
    if (idx + 1 >= c.items.length) {
      setDone(true)
      setModal(false)
      sfx('finish')
      speak(tt('class.bubble.done', { correct: correctCount, total: c.items.length }), { lang })
      return
    }
    const n = idx + 1
    setIdx(n)
    setInput('')
    setResult(null)
    setFb(null)
    setNudge(null)
    sceneRef.current?.setBoardText(localize(c.items[n].q, lang))
    speak(localize(c.items[n].q, lang), { lang })
  }

  function closeModal() {
    setModal(false)
    setResult(null)
    setFb(null)
    setNudge(null)
    // the tutor may still be open on top; it re-enables the scene when it closes
    if (!askOpen) sceneRef.current?.setControls(true)
  }

  if (sceneError) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[var(--gb-secondary-dark)] p-5">
        <section className="gb-card max-w-md bg-cream p-6 text-center">
          <Mascot className="mx-auto h-28 w-28" />
          <h1 className="mt-3 font-display text-2xl">{tt('3d.unavailable.title')}</h1>
          <p className="mt-2 font-semibold text-ink/70">{tt('3d.unavailable.body')}</p>
          <div className="mt-5 grid gap-3">
            <Button className="w-full" onClick={onFallback2D}>{tt('3d.unavailable.action')}</Button>
            <button className="font-extrabold underline" onClick={onExit}>{tt('common.exit')}</button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <div className="classroom3d-root relative h-full max-h-full w-full overflow-hidden bg-[var(--gb-secondary-dark)]">
      {/* Three.js canvas mounts here */}
      <div ref={mountRef} className="absolute inset-0" />

      {/* HUD safe area — the app is framed like a phone, so no control ever
          touches the bezel; everything inside is placed against this box. */}
      <div className={`pointer-events-none absolute z-10 ${HUD_INSET}`}>
      {/* top HUD — exit + badges on one row, topic title on its own row below */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <button className="pointer-events-auto gb-chip shrink-0 bg-white" onClick={onExit}>{tt('common.exit')}</button>
          <div className="pointer-events-auto flex shrink-0 items-center gap-1.5">
            <OnlineBadge online={online} />
            <RefBadge refId={c.ref} domain={tt(`domain.${c.domain}`)} />
          </div>
        </div>
        {/* full child-friendly topic title */}
        <div className="flex justify-center">
          <span className="gb-chip max-w-full bg-white/90 text-xs">
            <span className="truncate">{topicFull(c.ref, c.competency, c.domain, lang)}</span>
          </span>
        </div>
      </div>

      {/* room controls — one grouped, labelled toolbar so the icons read as a set */}
      <div className={`pointer-events-auto absolute right-0 top-[5.75rem] ${modal || done ? 'hidden' : ''}`}>
        <div className="gb-card flex flex-col items-center gap-1.5 bg-white/95 p-1.5">
          <HudButton glyph="+" label={tt('3d.zoomIn')} onClick={() => sceneRef.current?.zoom(-8)} />
          <HudButton glyph={'\u2212'} label={tt('3d.zoomOut')} onClick={() => sceneRef.current?.zoom(8)} />
          <span className="h-[2px] w-8 rounded-full bg-outline/25" aria-hidden="true" />
          {/* renovation / theme switcher */}
          <HudButton glyph={'\u25D0'} label={tt('3d.theme')} color="bg-lavender" onClick={() => setThemeOpen(true)} />
        </div>
      </div>

      {/* on-screen joystick — easy movement on touch (and mouse) */}
      {ready && !modal && !done && (
        <div className="pointer-events-none absolute bottom-[7.5rem] left-0 flex w-28 justify-center">
          <span className="gb-chip bg-white/90 px-2.5 py-0.5 text-[0.7rem] shadow-hard-sm">{tt('3d.move')}</span>
        </div>
      )}
      {ready && !modal && !done && (
        <Joystick label={tt('3d.joystick')} onMove={(x, y) => {
          sceneRef.current?.setMove(x, y)
          if (coachStep === 1 && (x !== 0 || y !== 0)) setCoachStep(2)
        }} />
      )}

      {ready && !modal && !done && (
        <div className="absolute bottom-[3.5rem] right-0 flex w-20 flex-col items-center gap-1">
          <button
            type="button"
            className="pointer-events-auto flex h-[68px] w-[68px] items-center justify-center rounded-full transition-transform active:translate-y-[2px]"
            onClick={openAsk}
            aria-label={tt('class.raiseHand')}
            title={tt('class.raiseHand')}
          >
            <Mascot size={60} className="drop-shadow-xl" />
          </button>
          <span className="gb-chip pointer-events-none bg-white/90 px-2.5 py-0.5 text-[0.7rem] shadow-hard-sm">{tt('3d.help')}</span>
        </div>
      )}

      {/* answer trigger when near board */}
      {ready && atBoard && !modal && !done && (
        <div className="pointer-events-auto absolute bottom-[8rem] left-1/2 -translate-x-1/2">
          <Button color="mint" className="min-h-[56px] px-8 text-xl" onClick={openBoard}>
            {tt('3d.answerBoard')}
          </Button>
        </div>
      )}

      {/* done card — score summary with correct/wrong + explanations */}
      {done && (
        <div className="absolute inset-0 z-40 flex items-center justify-center overflow-hidden bg-black/50 p-4">
          <div className="gb-card bg-white gb-pop max-h-full w-full max-w-sm overflow-y-auto p-5 text-center">
            <p className="font-display text-2xl font-extrabold">{tt('summary.done')}</p>
            <p className="mt-1 text-lg font-bold">
              {tt('summary.scoreLine', { correct: correctCount, total: c.items.length })}
            </p>
            <div className="mt-2 flex justify-center gap-2 text-sm font-bold">
              <span className="gb-chip bg-mint">{tt('common.correct')}: {correctCount}</span>
              <span className="gb-chip bg-rose">{tt('common.wrong')}: {c.items.length - correctCount}</span>
            </div>
            {answers.some((a) => !a.correct) && (
              <div className="mt-4 text-left">
                <p className="mb-2 text-sm font-extrabold text-ink/70">{tt('class.reviewMissed')}</p>
                <div className="flex flex-col gap-2">
                  {answers.filter((a) => !a.correct).map((a, i) => (
                    <div key={i} className="rounded-card border-2 border-outline bg-cream p-3 text-sm">
                      <p className="font-bold"><span className="text-ink/60">{tt('common.question')}:</span> {a.q}</p>
                      <p className="mt-1 font-bold"><span className="text-ink/60">{tt('common.yourAnswer')}:</span> <span className="text-rose-700">{a.your ? localizeChoice(a.your, lang) : '—'}</span></p>
                      <p className="mt-1 font-bold"><span className="text-ink/60">{tt('common.correctAnswer')}:</span> <span className="text-green-700">{localizeChoice(a.answer, lang)}</span></p>
                      {a.solution && <p className="mt-1"><span className="font-bold text-ink/60">{tt('common.explanation')}:</span> <RichText>{a.solution}</RichText></p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Button color="mint" className="mt-4 w-full text-lg" onClick={onExit}>{tt('common.done')}</Button>
          </div>
        </div>
      )}

      {ready && coachStep && !done && (
        <div className="pointer-events-none absolute left-0 right-[6rem] top-[5.75rem] z-20">
          <div className="gb-card gb-pop bg-white p-4 text-center font-extrabold">
            {tt(coachStep === 1 ? '3d.coach.move' : '3d.coach.board')}
          </div>
        </div>
      )}

      </div>
      {/* end HUD safe area */}

      {/* theme picker — a full sheet with big targets instead of a tiny popover */}
      {themeOpen && !modal && !done && (
        <div className="absolute inset-0 z-30 flex items-end justify-center overflow-hidden bg-black/40 p-4 sm:items-center" onClick={() => setThemeOpen(false)}>
          <div className="gb-card gb-pop max-h-full w-full max-w-sm overflow-y-auto bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="font-display text-lg font-extrabold">{tt('3d.changeRoom')}</p>
              <button className="gb-chip min-h-[44px] min-w-[44px] bg-white text-lg" onClick={() => setThemeOpen(false)} aria-label={tt('common.exit')}>x</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {THEME_LIST.map((t) => (
                <button
                  key={t.key}
                  onClick={() => {
                    changeTheme(t.key)
                    setThemeOpen(false)
                  }}
                  className={`min-h-[56px] rounded-card border-[2.5px] border-outline px-3 py-2 font-display text-base font-extrabold shadow-hard-sm ${
                    theme === t.key ? 'bg-yellow' : 'bg-white'
                  }`}
                >
                  {tt('theme.' + t.key)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Teacher Gabay — the mascot opens it as a bottom sheet while walking around */}
      {askOpen && !modal && !done && (
        <div className="absolute inset-0 z-[45] flex items-end justify-center overflow-hidden bg-black/30 p-3" onClick={closeAsk}>
          <div className="gb-card gb-pop max-h-[62%] w-full max-w-md overflow-y-auto bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <AskPanel
              tt={tt}
              lang={lang}
              online={online}
              question={question}
              setQuestion={setQuestion}
              askGabay={askGabay}
              toggleMic={toggleMic}
              listening={listening}
              transcribing={transcribing}
              thinking={thinking}
              reply={reply}
              onClose={closeAsk}
            />
          </div>
        </div>
      )}

      {/* lesson modal - reuses content items + auto-check + mastery + voice */}
      {modal && !done && (
        <div className="absolute inset-0 z-30 flex items-end justify-center overflow-hidden bg-black/40 p-4 sm:items-center">
          <div className="gb-card bg-white gb-pop max-h-full w-full max-w-md overflow-y-auto p-4 sm:p-6">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-ink/60">
                {tt('common.question')} {idx + 1} / {c.items.length}
              </span>
              <div className="flex items-center gap-2">
                {/* the same Teacher Gabay the mascot opens — stuck learners can ask mid-question */}
                <button
                  type="button"
                  className={`gb-chip min-h-[44px] gap-1.5 pl-1.5 pr-3 text-sm shadow-hard-sm ${askOpen ? 'bg-yellow' : 'bg-lavender'}`}
                  onClick={() => (askOpen ? closeAsk() : openAsk())}
                  aria-label={tt('class.raiseHand')}
                  title={tt('class.raiseHand')}
                >
                  <Mascot size={28} />
                  <span>{tt('3d.help')}</span>
                </button>
                <button className="gb-chip min-h-[44px] min-w-[44px] bg-white text-lg" onClick={closeModal} aria-label={tt('common.exit')}>x</button>
              </div>
            </div>
            {/* immediate feedback at the top of the question */}
            {result !== null && fb && (
              <div className={`mb-3 rounded-card border-2 border-outline p-3 ${fb.ok ? 'bg-mint' : 'bg-yellow'}`}>
                <p className="font-display text-lg font-extrabold">{fb.headline}</p>
                {!fb.ok && (
                  <p className="mt-1 text-sm font-bold leading-snug">
                    <RichText>{fb.body}</RichText>
                  </p>
                )}
              </div>
            )}

            <p className="font-display text-2xl font-bold leading-snug">{localize(item.q, lang)}</p>
            <QuestionVisual question={localize(item.q, lang)} />

            {itemOptions && (
              <div className="mt-3 flex flex-wrap gap-2">
                {itemOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setInput(opt)
                      setNudge(null)
                    }}
                    className={`gb-chip ${input === opt ? 'bg-sky shadow-hard-sm' : 'bg-white'}`}
                  >
                    <ChoiceVisual value={opt} />
                    {localizeChoice(opt, lang)}
                  </button>
                ))}
              </div>
            )}

            {/* choices carry their own prompt; the input speaks for itself */}
            {itemOptions && (
              <p className="mt-4 px-1 text-sm font-bold text-ink/70">{tt('class.pickAnswer')}</p>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              {!itemOptions && (
                <input
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value)
                    if (nudge) setNudge(null)
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && (result === null ? submit() : next())}
                  placeholder={tt('common.answerPlaceholder')}
                  inputMode="decimal"
                  className="min-h-[56px] min-w-0 rounded-full border-[2.5px] border-outline px-5 py-3 text-lg font-bold outline-none focus:bg-cream"
                />
              )}
              {result === null ? (
                <Button
                  color="mint"
                  className={`min-h-[56px] px-6 text-lg disabled:opacity-50 ${itemOptions ? 'w-full' : ''}`}
                  onClick={submit}
                  disabled={!input.trim()}
                >
                  {tt('class.answer')}
                </Button>
              ) : (
                <Button color="sky" className={`min-h-[56px] px-6 text-lg ${itemOptions ? 'w-full' : ''}`} onClick={next}>
                  {idx + 1 >= c.items.length ? tt('common.finish') : tt('common.next')}
                </Button>
              )}
            </div>

            {nudge && (
              <p className="mt-2 px-1 text-sm font-extrabold text-[var(--gb-danger)]">{tt('common.' + nudge)}</p>
            )}

            {/* Teacher Gabay, inline under the question — the question stays usable */}
            {askOpen && (
              <div className="gb-pop mt-4 rounded-card border-[2.5px] border-outline bg-cream p-3">
                <AskPanel
                  tt={tt}
                  lang={lang}
                  online={online}
                  question={question}
                  setQuestion={setQuestion}
                  askGabay={askGabay}
                  toggleMic={toggleMic}
                  listening={listening}
                  transcribing={transcribing}
                  thinking={thinking}
                  reply={reply}
                  onClose={closeAsk}
                  replyClass="bg-white"
                />
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  )
}

// Teacher Gabay ask form. Rendered inline under an open question, or inside the
// bottom sheet the mascot opens while the learner is walking around.
function AskPanel({ tt, lang, online, question, setQuestion, askGabay, toggleMic, listening, transcribing, thinking, reply, onClose, replyClass = 'bg-cream' }) {
  return (
    <>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Mascot size={36} />
          <p className="truncate font-display text-base font-extrabold">{tt('class.raiseHand')}</p>
        </div>
        <button className="gb-chip min-h-[44px] min-w-[44px] shrink-0 bg-white text-lg" onClick={onClose} aria-label={tt('common.exit')}>x</button>
      </div>
      <p className="mb-3 text-sm font-bold text-ink/70">{tt('class.helpPrompt')}</p>

      <div className="flex items-center gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && askGabay()}
          placeholder={tt('class.askPlaceholder')}
          className="min-h-[52px] min-w-0 flex-1 rounded-full border-[2.5px] border-outline bg-white px-4 py-2 text-base font-bold outline-none focus:bg-cream"
        />
        {(isRecognitionSupported() || isMediaRecorderSupported()) && (
          <button
            type="button"
            onClick={toggleMic}
            disabled={!online}
            title={online ? tt('class.speak') : tt('class.micOfflineTitle')}
            className={`gb-chip min-h-[52px] shrink-0 bg-rose text-base ${listening ? 'animate-pulse' : ''} disabled:opacity-40`}
          >
            {listening ? tt('class.micStop') : transcribing ? '...' : tt('class.mic')}
          </button>
        )}
        <Button color="mint" className="min-h-[52px] shrink-0 px-5" onClick={() => askGabay()} disabled={thinking}>
          {thinking ? '...' : tt('class.ask')}
        </Button>
      </div>

      {transcribing && <p className="mt-2 text-sm font-bold text-ink/60">{tt('class.listening')}</p>}
      {!online && <p className="mt-2 text-sm font-bold text-ink/60">{tt('class.offlineNote')}</p>}

      {reply && (
        <div className={`mt-3 rounded-card border-[2.5px] border-outline p-3 ${replyClass}`}>
          <p className="mb-1 text-xs font-bold text-ink/60">
            {(reply.source && tt(SOURCE_KEY[reply.source])) || ''}{reply.fromCache ? ' - cached' : ''}
          </p>
          <p className="text-base leading-snug">{plain(reply.text)}</p>
          {isSpeechSupported() && (
            <button
              type="button"
              className="mt-2 flex h-11 w-11 items-center justify-center rounded-full border-[2.5px] border-outline bg-white shadow-hard-sm"
              onClick={() => speak(plain(reply.text), { lang })}
              aria-label={tt('class.listenAgain')}
              title={tt('class.listenAgain')}
            >
              <EarIcon size={22} />
            </button>
          )}
        </div>
      )}
    </>
  )
}

// Square icon+label button used by the room toolbar. Children read the label,
// not the glyph, so every control carries one.
function HudButton({ glyph, label, onClick, color = 'bg-white' }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`flex w-[4rem] flex-col items-center gap-0.5 rounded-card border-[2.5px] border-outline ${color} px-1 py-2 shadow-hard-sm transition-transform active:translate-x-[2px] active:translate-y-[2px]`}
    >
      <span className="font-display text-xl font-extrabold leading-none" aria-hidden="true">{glyph}</span>
      <span className="text-[0.65rem] font-extrabold leading-tight text-ink/70">{label}</span>
    </button>
  )
}

// On-screen thumbstick. Pointer (touch or mouse) drags the knob; the normalized
// offset (-1..1 on each axis) is fed to the Three.js scene via setMove().
function Joystick({ onMove, label }) {
  const baseRef = useRef(null)
  const activeRef = useRef(false)
  const [thumb, setThumb] = useState({ x: 0, y: 0 })

  function track(e) {
    const el = baseRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const max = r.width / 2
    let dx = e.clientX - cx
    let dy = e.clientY - cy
    const dist = Math.hypot(dx, dy)
    if (dist > max) {
      dx = (dx / dist) * max
      dy = (dy / dist) * max
    }
    setThumb({ x: dx, y: dy })
    onMove(dx / max, dy / max)
  }

  function start(e) {
    // Keep joystick drags off the canvas, which would also swing the camera.
    e.stopPropagation()
    activeRef.current = true
    e.currentTarget.setPointerCapture?.(e.pointerId)
    track(e)
  }
  function move(e) {
    e.stopPropagation()
    if (activeRef.current) track(e)
  }
  function end(e) {
    e?.stopPropagation()
    activeRef.current = false
    setThumb({ x: 0, y: 0 })
    onMove(0, 0)
  }

  return (
    <div
      ref={baseRef}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      aria-label={label}
      className="pointer-events-auto absolute bottom-0 left-0 h-28 w-28 touch-none select-none rounded-full border-[2.5px] border-outline bg-white/30 backdrop-blur-sm"
    >
      <span
        className="absolute left-1/2 top-1/2 h-14 w-14 rounded-full border-[2.5px] border-outline bg-yellow shadow-hard-sm"
        style={{ transform: `translate(-50%, -50%) translate(${thumb.x}px, ${thumb.y}px)` }}
      />
    </div>
  )
}
