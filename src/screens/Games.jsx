import { useEffect, useRef, useState } from 'react'
import { get, set } from 'idb-keyval'
import { Button, Doodles, RefBadge, MasteryBar, RichText } from '../ui/Primitives.jsx'
import { Mascot } from '../ui/Mascot.jsx'
import OnlineBadge from '../ui/OnlineBadge.jsx'
import { LightbulbIcon } from '../ui/Icons.jsx'
import { checkAnswer, choiceOptions } from '../lib/check.js'
import { feedbackFor, vibrateCorrect, vibrateWrong } from '../lib/feedback.js'
import { recordAttempt } from '../lib/history.js'
import { makeT, localize, localizeChoice } from '../lib/i18n.js'
import { sfx, playButtonSfx } from '../lib/sound.js'
import StepScaffold from '../ui/StepScaffold.jsx'
import { prepareQuestionSession } from '../lib/question-session.js'
import { ChoiceVisual, QuestionVisual } from '../ui/LearningVisual.jsx'
import { GameIcon } from '../ui/BottomNav.jsx'
import { topicTitleLocalized } from '../lib/topics.js'
import './Games.css'

const COUNT_OPTIONS = [5, 10, 15, 20]

const GENERATING_SUB_KEYS = ['questions.generatingSub', 'questions.generatingSub2', 'questions.generatingSub3', 'questions.generatingSub4']
const GENERATING_SUB_STEP_MS = 3200

const GAMES = [
  {
    key: 'store',
    outer: 'bg-peach',
    accent: 'var(--gb-primary)',
    awning: ['bg-rose', 'bg-white', 'bg-yellow', 'bg-white', 'bg-rose'],
    Icon: ShopIcon,
    image: '/game-store.png',
    badgeKeys: ['number', 'percent', 'ratio'],
    gameTag: 'store',
  },
  {
    key: 'garden',
    outer: 'bg-mint',
    accent: 'var(--gb-secondary-soft)',
    awning: ['bg-mint', 'bg-white', 'bg-yellow', 'bg-white', 'bg-mint'],
    Icon: GardenIcon,
    image: '/game-garden.png',
    badgeKeys: ['geometry', 'area', 'perimeter'],
    gameTag: 'garden',
  },
  {
    key: 'house',
    outer: 'bg-sky',
    accent: 'var(--gb-sky)',
    awning: ['bg-sky', 'bg-white', 'bg-peach', 'bg-white', 'bg-sky'],
    Icon: HouseIcon,
    image: '/game-house.png',
    badgeKeys: ['geometry', 'angles', 'volume'],
    gameTag: 'house',
  },
  {
    key: 'fiesta',
    outer: 'bg-lavender',
    accent: 'var(--gb-lavender-soft)',
    awning: ['bg-lavender', 'bg-white', 'bg-rose', 'bg-white', 'bg-lavender'],
    Icon: FiestaIcon,
    image: '/game-fiesta.png',
    badgeKeys: ['data', 'stats', 'probability'],
    gameTag: 'fiesta',
  },
]

export default function Games({ online = true, grade = 6, competencies = [], mastery = {}, lang = 'taglish', onAnswered = async () => {} }) {
  const tt = makeT(lang)
  const [gameKey, setGameKey] = useState(null)
  const [started, setStarted] = useState(false)
  const [count, setCount] = useState(10)
  const [questions, setQuestions] = useState([])
  const [idx, setIdx] = useState(0)
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [fb, setFb] = useState(null)
  const [coins, setCoins] = useState(0)
  const [streak, setStreak] = useState(0)
  const [answered, setAnswered] = useState(0)
  const [log, setLog] = useState([])
  const [feedbackReady, setFeedbackReady] = useState(false)
  const [attemptRecorded, setAttemptRecorded] = useState(false)
  const [stepsDone, setStepsDone] = useState(true)
  const [showCorrectOverlay, setShowCorrectOverlay] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [questionSource, setQuestionSource] = useState('bundled')
  const [generatingElapsedMs, setGeneratingElapsedMs] = useState(0)
  const completionSaved = useRef(false)
  const inputRef = useRef(null)
  const startingRef = useRef(false)

  // Rotate status messages and show real elapsed-time progress, since AI
  // question generation genuinely takes several seconds.
  useEffect(() => {
    if (!generating) return
    setGeneratingElapsedMs(0)
    const start = performance.now()
    const timer = setInterval(() => setGeneratingElapsedMs(performance.now() - start), 200)
    return () => clearInterval(timer)
  }, [generating])

  const game = GAMES.find((g) => g.key === gameKey) ?? null
  const round = questions[idx]
  const roundOptions = choiceOptions(round)
  const done = started && questions.length > 0 && idx >= questions.length
  const score = round?.ref ? mastery[round.ref] ?? 0 : 0

  // Victory jingle when a game finishes (summary appears).
  useEffect(() => {
    if (!done || completionSaved.current) return
    completionSaved.current = true
    sfx('finish')
    ;(async () => set('gabay:gamesPlayed', ((await get('gabay:gamesPlayed')) ?? 0) + 1))()
  }, [done])

  async function startGame() {
    if (!game || startingRef.current) return
    startingRef.current = true
    setGenerating(true)
    try {
      const session = await prepareQuestionSession({
        grade,
        mode: 'game',
        scope: { key: `game:${game.key}`, game: game.gameTag },
        count,
        language: lang,
        mastery,
        connectivity: online,
        competencies,
      })
      const nextQuestions = session.questions
      setQuestions(nextQuestions)
      setQuestionSource(session.source)
      setStarted(true)
      setIdx(0)
      setInput('')
      setResult(null)
      setFb(null)
      setCoins(0)
      setStreak(0)
      setAnswered(0)
      setLog([])
      setFeedbackReady(false)
      setShowCorrectOverlay(false)
      setAttemptRecorded(false)
      setStepsDone(!(nextQuestions[0]?.steps?.length > 0))
      completionSaved.current = false
    } finally {
      startingRef.current = false
      setGenerating(false)
    }
  }

  function backToPicker() {
    setGameKey(null)
    setStarted(false)
  }

  async function submit() {
    if (result !== null || !input.trim()) return
    const locRound = { ...round, q: localize(round.q, lang), solution: localize(round.solution, lang) }
    const ok = checkAnswer(round, input)
    const f = feedbackFor(locRound, ok, lang, idx)
    setResult(ok)
    setFb(f)
    sfx(ok ? 'correct' : 'wrong')
    if (ok) vibrateCorrect()
    else vibrateWrong()
    if (ok) sfx('coin')
    if (ok) {
      setShowCorrectOverlay(true)
      window.setTimeout(() => setShowCorrectOverlay(false), 1500)
    }
    setCoins((n) => n + (ok ? 1 : 0))
    setStreak((n) => (ok ? n + 1 : 0))
    setFeedbackReady(false)
    window.setTimeout(() => setFeedbackReady(true), 2000)
    if (!attemptRecorded) {
      setAttemptRecorded(true)
      setAnswered((n) => n + 1)
      setLog((l) => [...l, { q: locRound.q, your: input.trim(), answer: round.answer, correct: ok, solution: locRound.solution }])
      recordAttempt({ ref: round.ref, q: locRound.q, your: input.trim(), answer: round.answer, correct: ok, feedback: ok ? f.headline : f.body, source: round.source ?? questionSource })
      await onAnswered(round.ref, ok)
    }
  }

  function nextRound() {
    setIdx((i) => {
      const next = i + 1
      setStepsDone(!(questions[next]?.steps?.length > 0))
      return next
    })
    setInput('')
    setResult(null)
    setFb(null)
    setFeedbackReady(false)
    setAttemptRecorded(false)
  }

  function tryAgain() {
    setInput('')
    setResult(null)
    setFb(null)
    setFeedbackReady(false)
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

  // ---- Game picker ----
  if (!game) {
    return (
      <div className="games-picker-page gb-shell relative min-h-screen px-5">
        <Doodles />
        <Header online={online} tt={tt} />

        <div className="games-picker-intro relative z-10">
          <h1 className="games-picker-title font-display font-extrabold">{tt('games.pick')}</h1>
          <p className="games-picker-description font-bold text-ink/70">{tt('games.pickSub')}</p>
        </div>

        <aside className="games-picker-note relative z-10" role="note">
          <span className="games-picker-note-icon" aria-hidden="true"><GameIcon /></span>
          <p>{tt('games.pickNote')}</p>
        </aside>

        <div className="games-picker-grid relative z-10">
          {GAMES.map((g) => (
            <button
              key={g.key}
              onClick={() => {
                playButtonSfx()
                setGameKey(g.key)
              }}
              className={`game-picker-card rounded-card border-outline ${g.outer} text-left`}
            >
              <span className="game-picker-icon bg-cream">
                <img src={g.image} alt="" aria-hidden="true" />
              </span>
              <span className="game-picker-copy min-w-0">
                <span className="game-picker-name block font-display font-extrabold leading-tight">{tt(`games.${g.key}.name`)}</span>
                <span className="game-picker-tagline block font-bold text-ink/70">{tt(`games.${g.key}.tagline`)}</span>
                <GameBadges game={g} tt={tt} className="game-picker-badges" />
              </span>
              <span className="game-picker-arrow bg-white" aria-hidden="true">&rarr;</span>
            </button>
          ))}
        </div>
      </div>
    )
  }
  if (generating) {
    const subKey = GENERATING_SUB_KEYS[Math.min(GENERATING_SUB_KEYS.length - 1, Math.floor(generatingElapsedMs / GENERATING_SUB_STEP_MS))]
    // Decelerating curve so the bar keeps visibly inching forward on slow AI
    // responses instead of sitting frozen at a fixed width.
    const progress = 12 + 83 * (1 - Math.exp(-generatingElapsedMs / 9000))
    return (
      <div className={`game-generating-page game-generating-${game?.key ?? 'default'} gb-shell relative flex min-h-screen flex-col items-center justify-center px-6 pb-28 text-center`}>
        <div className="relative z-10 nova-idle"><Mascot size={132} /></div>
        <h1 className="relative z-10 mt-4 font-display text-3xl font-extrabold">{tt('questions.generating')}</h1>
        <p className="relative z-10 mt-2 font-bold text-ink/65">{tt(subKey)}</p>
        <div className="relative z-10 mt-5 h-3 w-48 overflow-hidden rounded-full border-2 border-outline bg-white">
          <div
            className="h-full rounded-full bg-mint transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    )
  }

  // ---- Start screen ----
  if (!started) {
    return (
      <div
        className={`game-setup-page game-setup-${game.key} gb-shell relative min-h-screen px-5 pb-28 pt-6`}
        style={{ '--game-accent': game.accent }}
      >
        <Header online={online} tt={tt} />
        <button
          type="button"
          onClick={() => {
            playButtonSfx()
            backToPicker()
          }}
          className="game-setup-back relative z-10"
        >
          <BackArrowIcon />
          <span>{tt('games.chooseAnother')}</span>
        </button>
        <section className={`game-setup-hero relative z-10 ${game.outer}`}>
          <div
            className="game-setup-hero-inner"
            style={{ backgroundColor: game.accent }}
          >
            <div className="game-setup-copy">
              <h1 className="font-display">{tt(`games.${game.key}.name`)}</h1>
              <p>{tt(`games.${game.key}.tagline`)}</p>
            </div>
            <div className="game-setup-artwork" aria-hidden="true">
              <img src={game.image} alt="" />
            </div>
            <GameBadges game={game} tt={tt} className="game-setup-badges" />
          </div>
        </section>

        {/* number of questions (5–20) */}
        <section className="game-setup-challenge relative z-10" aria-labelledby="game-challenge-title">
          <div className="game-setup-challenge-heading">
            <span className="game-setup-challenge-icon" aria-hidden="true"><ChallengeIcon /></span>
            <div>
              <h2 id="game-challenge-title" className="font-display">{tt('games.challenge')}</h2>
              <p>{tt('games.howMany')}</p>
            </div>
          </div>
          <div className="game-setup-counts" role="group" aria-label={tt('games.howMany')}>
            {COUNT_OPTIONS.map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => {
                  playButtonSfx()
                  setCount(n)
                }}
                aria-pressed={count === n}
                className={count === n ? 'is-selected' : ''}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="game-setup-helper">{tt('games.minMax')}</p>
        </section>

        <Button color="white" className="game-setup-start relative z-10 disabled:opacity-50" onClick={startGame} disabled={generating}>
          <span className="game-setup-start-icon" aria-hidden="true"><game.Icon /></span>
          <span className="game-setup-start-label">{tt(`games.${game.key}.start`)}</span>
          <span className="game-setup-start-arrow" aria-hidden="true"><StartArrowIcon /></span>
        </Button>
      </div>
    )
  }

  // ---- Summary ----
  if (done) {
    const correct = log.filter((l) => l.correct).length
    const wrong = log
      .map((entry, index) => ({ ...entry, sessionQuestion: questions[index] }))
      .filter((entry) => !entry.correct)
    const accuracy = log.length ? Math.round((correct / log.length) * 100) : 0
    const summaryKey = accuracy === 100 ? 'perfect' : accuracy >= 70 ? 'great' : 'practice'
    const practicedTopics = Array.from(new Set(
      questions.map((question) => resultTopic(question, competencies, lang)).filter(Boolean),
    ))
    return (
      <div
        className={`game-results-page game-results-${game.key} gb-shell relative flex min-h-screen flex-col px-5 pb-44 pt-6`}
        style={{ '--game-accent': game.accent }}
      >
        <Header online={online} tt={tt} />

        <GameResultsSummary
          game={game}
          tt={tt}
          summaryKey={summaryKey}
          topics={practicedTopics}
          coins={coins}
          answered={log.length}
          correct={correct}
          wrong={wrong.length}
          accuracy={accuracy}
        />

        <section className="game-results-review relative z-10">
          {wrong.length > 0 ? (
            <>
              <div className="game-results-review-heading">
                <h2 className="font-display">{tt('class.reviewMissed')}</h2>
                <p>{tt('games.results.reviewSubtitle')}</p>
              </div>
              <div className="game-results-review-list">
                {wrong.map((answer, index) => (
                  <MissedAnswerCard
                    key={`${answer.sessionQuestion?.ref ?? 'question'}-${index}`}
                    answer={answer}
                    topic={resultTopic(answer.sessionQuestion, competencies, lang)}
                    lang={lang}
                    tt={tt}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="game-results-perfect">
              <ResultCheckIcon />
              <p>{tt('games.summary.perfect')}</p>
            </div>
          )}
        </section>

        <div className="game-results-actions relative z-10">
          <Button color="white" className="game-results-action is-primary" onClick={() => setStarted(false)}>
            <ReplayIcon />
            <span>{tt('games.playAgain')}</span>
          </Button>
          <Button color="white" className="game-results-action is-secondary" onClick={backToPicker}>
            <GridIcon />
            <span>{tt('games.chooseAnother')}</span>
          </Button>
        </div>
      </div>
    )
  }

  // ---- Play ----
  return (
    <div
      className={`game-play-page game-play-${game.key} gb-shell relative min-h-screen overflow-x-hidden px-5 pb-40 pt-6`}
      style={{ '--game-accent': game.accent }}
    >
      <Header online={online} tt={tt} />

      <div className="game-play-meta relative z-10">
        <button
          type="button"
          className="game-play-back"
          onClick={() => {
            playButtonSfx()
            backToPicker()
          }}
          aria-label={tt('common.back')}
          title={tt('common.back')}
        >
          <BackArrowIcon />
          <span>{tt('common.back')}</span>
        </button>
        <RefBadge refId={round.ref} domain={tt(`domain.${round.domain || 'Number and Algebra'}`)} />
        <span className="game-play-meta-spacer" aria-hidden="true" />
        <span className="game-play-coins gb-chip bg-yellow shadow-hard-sm text-sm">{tt('games.coins')} {coins}</span>
      </div>

      {round?.ref && Object.prototype.hasOwnProperty.call(mastery, round.ref) && (
        <div className="game-play-mastery relative z-10">
          <div className="mb-1 flex justify-between text-sm font-extrabold text-ink/60">
            <span>{tt('common.mastery')}</span>
            <span>{Math.round(score * 100)}%</span>
          </div>
          <MasteryBar score={score} />
        </div>
      )}
      <GameQuestionCard
        round={round}
        game={game}
        lang={lang}
        tt={tt}
        currentIndex={idx}
        total={questions.length}
        result={result}
        feedback={fb}
      />

      {!stepsDone ? (
        <div className="game-play-support relative z-10">
          <StepScaffold item={round} lang={lang} tt={tt} onComplete={() => setStepsDone(true)} />
        </div>
      ) : (
        <GameAnswerCard
          round={round}
          options={roundOptions}
          input={input}
          inputRef={inputRef}
          result={result}
          lang={lang}
          tt={tt}
          onInputChange={(event) => setInput(event.target.value)}
          onInputKeyDown={(event) => event.key === 'Enter' && result === null && submit()}
          onOptionSelect={(option) => {
            playButtonSfx()
            setInput(option)
          }}
        >
          {result === null ? (
            <Button color="white" className="game-play-action is-primary" onClick={submit}>
              {tt(`games.${game.key}.action`)}
            </Button>
          ) : feedbackReady ? result ? (
            <Button color="white" className="game-play-action is-primary" onClick={nextRound}>
              {idx + 1 >= questions.length ? tt('common.finish') : tt('common.next')} →
            </Button>
          ) : (
            <Button color="rose" className="game-play-action is-retry" onClick={tryAgain}>{tt('classroom.retry')}</Button>
          ) : <span className="game-play-reading gb-chip justify-center bg-yellow">{tt('classroom.readSolution')}</span>}
        </GameAnswerCard>
      )}


      {showCorrectOverlay && (
        <div className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center bg-mint/90 px-6 text-center">
          <p className="nova-correct font-display text-5xl font-extrabold text-ink">{tt('classroom.correctOverlay')}</p>
        </div>
      )}
    </div>
  )
}

// Single Online label only — no duplicate at the bottom.
function Header({ online = true, tt }) {
  return (
    <div className="games-header relative z-10 flex items-center justify-between gap-2">
      <div className="games-header-brand flex min-w-0 items-center gap-2">
        <Mascot size={32} />
        <span className="font-display text-xl font-extrabold">{tt('games.title')}</span>
      </div>
      <OnlineBadge online={online} className="shrink-0" />
    </div>
  )
}

function GameBadges({ game, tt, className = '' }) {
  return (
    <span className={`flex flex-wrap gap-1.5 ${className}`}>
      {(game.badgeKeys ?? []).map((key) => (
        <span key={key} className="rounded-full border-2 border-outline bg-white px-2 py-1 text-[11px] font-extrabold uppercase leading-none text-ink/70 shadow-hard-sm">
          {tt('games.badge.' + key)}
        </span>
      ))}
    </span>
  )
}

function parseStatementQuestion(text) {
  const match = text.match(/^Is this (?:solution|statement) correct\? (.+?)\s+Proposed answer:\s+(.+)$/)
  if (!match) return null
  const body = match[1].replace(/\.$/, '')
  const answer = match[2]
  let statement = buildStatement(body, answer)
  return { statement }
}

function buildStatement(body, answer) {
  // "Compute [mentally]: X" → "X = answer"
  const computeLeadMatch = body.match(/^Compute(?: mentally)?:\s*(.+)/)
  if (computeLeadMatch) return `${computeLeadMatch[1]} = ${answer}`

  // "..., compute X" embedded (e.g. "At a sari-sari store, compute ₱72.46 - ₱17.37")
  const computeEmbedMatch = body.match(/,\s*compute\s+(.+)$/i)
  if (computeEmbedMatch) return `${computeEmbedMatch[1]} = ${answer}`

  // "Name [thing]" → "The [answer] is [thing]."
  const nameMatch = body.match(/^Name (.+)/)
  if (nameMatch) return `The ${answer} is ${nameMatch[1].toLowerCase().replace(/\.$/, '')}.`

  // "Find/Calculate/Estimate [property]" → body = answer
  const findMatch = body.match(/^(?:Find|Calculate|Estimate)\s+(.+)/i)
  if (findMatch) return `${body.replace(/\.$/, '')} = ${answer}`

  // Question-form body (ends with "?") → drop only the trailing question, keep any leading context
  if (body.trim().endsWith('?')) {
    const sentences = body.trim().split(/(?<=[.!?])\s+/)
    const context = sentences.slice(0, -1).join(' ')
    return context ? `${context} ${answer}` : answer
  }

  // "What is [X]?" / "Which [X]?" / "Does [X]?" → "[Answer]" (concise)
  const whatMatch = body.match(/(?:What|Which|How|Does|Do|Is|Are|Can)\s+.+\?/)
  if (whatMatch) return answer

  // Math-result verbs → body = answer
  const mathVerbMatch = body.match(/^(?:Round|Convert|Divide|Evaluate|Reduce|Express|Rewrite)\s+.+/i)
  if (mathVerbMatch) return `${body.replace(/[.!]$/, '')} = ${answer}`

  // Default: body as context + answer as statement (always readable)
  return `${body.replace(/[.!]$/, '')}. ${answer}`
}

function GameQuestionCard({ round, game, lang, tt, currentIndex, total, result, feedback }) {
  const question = localize(round.q, lang)
  const title = localize(round.title, lang)
  const parsed = parseStatementQuestion(question)

  return (
    <section className={`game-question-card gb-pop relative z-10 ${result === false ? 'answer-shake' : ''}`}>
      <div className="game-question-progress">
        <p>{tt('common.question')} {currentIndex + 1} / {total}</p>
      </div>

      <div className="game-question-title-row">
        {title && (
          <>
            <p className="game-question-objective-label">{tt('games.learningObjective')}</p>
            <h1>{title}</h1>
          </>
        )}
      </div>

      <div className="game-question-supporting">
        <p className="game-question-actor">{tt(`games.${game.key}.actor`)}</p>
        <div className="game-question-copy">
          {parsed ? (
            <>
              <p className="font-bold">Is this statement correct?</p>
              <p>{parsed.statement}</p>
            </>
          ) : (
            <RichText>{question}</RichText>
          )}
        </div>
        <QuestionVisual question={question} className="game-question-visual" />
      </div>

      {result !== null && feedback && (
        <div className={`game-question-feedback ${result ? 'is-correct' : 'is-incorrect'}`} role="status">
          <p className="font-display">{feedback.headline}</p>
          {round.solution && (
            <div>
              <RichText>{localize(round.solution, lang)}</RichText>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function GameAnswerCard({
  round,
  options,
  input,
  inputRef,
  result,
  lang,
  tt,
  onInputChange,
  onInputKeyDown,
  onOptionSelect,
  children,
}) {
  return (
    <section className="game-answer-card relative z-10">
      <h2 className="font-display">{tt('class.pickAnswer')}</h2>

      {!options ? (
        <input
          ref={inputRef}
          value={input}
          onChange={onInputChange}
          onKeyDown={onInputKeyDown}
          disabled={result !== null}
          inputMode="decimal"
          pattern="[0-9.]*"
          type="text"
          placeholder={tt('common.answerPlaceholder')}
          className={`game-answer-input ${result === true ? 'is-correct' : result === false ? 'is-incorrect' : ''}`}
        />
      ) : (
        <div className="game-answer-options">
          {options.map((option, index) => {
            const selected = input === option
            const correctOption = result !== null && checkAnswer(round, option)
            const incorrectSelection = result === false && selected && !correctOption

            return (
              <button
                type="button"
                key={`${String(option)}-${index}`}
                onClick={() => onOptionSelect(option)}
                disabled={result !== null}
                aria-pressed={selected}
                className={[
                  'game-answer-option',
                  selected ? 'is-selected' : '',
                  correctOption ? 'is-correct' : '',
                  incorrectSelection ? 'is-incorrect' : '',
                ].filter(Boolean).join(' ')}
              >
                <span className="game-answer-marker" aria-hidden="true" />
                <ChoiceVisual value={option} className="game-answer-visual" />
                <span>{localizeChoice(option, lang)}</span>
              </button>
            )
          })}
        </div>
      )}

      <div className="game-answer-action">{children}</div>
    </section>
  )
}

function GameResultsSummary({ game, tt, summaryKey, topics, coins, answered, correct, wrong, accuracy }) {
  const Icon = game.Icon

  return (
    <section className="game-results-summary gb-pop relative z-10">
      <div className="game-results-icon" aria-hidden="true"><Icon /></div>
      <h1 className="font-display">{tt(`games.${game.key}.closed`)}</h1>
      <p className="game-results-message">{tt('games.summary.' + summaryKey)}</p>
      <p className="game-results-practiced">{tt('games.summaryPracticed', { game: tt(`games.${game.key}.name`) })}</p>

      <div className="game-results-topics">
        {topics.map((topic) => <span key={topic}>{topic}</span>)}
      </div>

      <div className="game-results-reward">
        <ResultCoinIcon />
        <span>{tt('games.results.coinsEarned', { coins })}</span>
      </div>

      <div className="game-results-stats">
        <ResultStat label={tt('games.answered')} value={answered} tone="answered" />
        <ResultStat label={tt('common.correct')} value={correct} tone="correct" />
        <ResultStat label={tt('common.wrong')} value={wrong} tone="wrong" />
        <ResultStat label={tt('games.accuracy')} value={`${accuracy}%`} tone="accuracy" />
      </div>
    </section>
  )
}

function ResultStat({ label, value, tone }) {
  return (
    <div className={`game-results-stat is-${tone}`}>
      <p className="font-display">{value}</p>
      <span>{label}</span>
    </div>
  )
}

function MissedAnswerCard({ answer, topic, lang, tt }) {
  return (
    <article className="game-results-missed-card">
      <div className="game-results-missed-top">
        <span className="game-results-needs-review"><ResultXIcon />{tt('games.results.needsReview')}</span>
        {topic && <span className="game-results-topic-chip">{topic}</span>}
      </div>

      <div className="game-results-missed-question">
        <p>{tt('common.question')}</p>
        <div><RichText>{answer.q}</RichText></div>
      </div>

      <div className="game-results-answer-rows">
        <div className="game-results-answer-row is-user">
          <span>{tt('common.yourAnswer')}</span>
          <strong><ResultXIcon />{answer.your ? localizeChoice(answer.your, lang) : '—'}</strong>
        </div>
        <div className="game-results-answer-row is-correct">
          <span>{tt('common.correctAnswer')}</span>
          <strong><ResultCheckIcon />{localizeChoice(answer.answer, lang)}</strong>
        </div>
      </div>

      {answer.solution && (
        <div className="game-results-explanation">
          <span aria-hidden="true"><LightbulbIcon size={28} /></span>
          <div>
            <p>{tt('common.explanation')}</p>
            <div><RichText>{answer.solution}</RichText></div>
          </div>
        </div>
      )}
    </article>
  )
}

function resultTopic(question, competencies, lang) {
  if (!question) return ''
  const competency = competencies.find((item) => item.ref === question.ref)
  const competencyText = localize(competency?.competency ?? question.title, lang)
  return topicTitleLocalized(question.ref, competencyText, lang)
}

function BackArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChallengeIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect x="12" y="9" width="24" height="32" rx="4" fill="var(--gb-surface)" stroke="var(--gb-outline)" strokeWidth="3" />
      <rect x="18" y="5" width="12" height="8" rx="3" fill="var(--gb-primary)" stroke="var(--gb-outline)" strokeWidth="3" />
      <path d="m18 22 3 3 6-7M18 32h12" fill="none" stroke="var(--gb-outline)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}


function StartArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h13M13 7l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function ResultCoinIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="13" fill="var(--gb-primary)" stroke="currentColor" strokeWidth="2.2" />
      <path d="m16 8.7 2.1 4.3 4.8.7-3.5 3.4.8 4.8-4.2-2.3-4.2 2.3.8-4.8-3.5-3.4 4.8-.7Z" fill="var(--gb-primary-soft)" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

function ResultXIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="m8.5 8.5 7 7m0-7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function ResultCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="m7.8 12.2 2.7 2.7 5.8-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ReplayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 8.5V4l-2 2a8 8 0 1 0 2.2 8.2" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="6" height="6" rx="1.2" fill="currentColor" />
      <rect x="14" y="4" width="6" height="6" rx="1.2" fill="currentColor" />
      <rect x="4" y="14" width="6" height="6" rx="1.2" fill="currentColor" />
      <rect x="14" y="14" width="6" height="6" rx="1.2" fill="currentColor" />
    </svg>
  )
}

function ShopIcon() {
  return (
    <svg viewBox="0 0 80 80" width="50" height="50" aria-hidden="true">
      <path d="M12 30 L17 14 h46 l5 16 Z" fill="var(--gb-peach)" stroke="var(--gb-outline)" strokeWidth="4" strokeLinejoin="round" />
      <rect x="18" y="30" width="44" height="34" rx="3" fill="var(--gb-sky)" stroke="var(--gb-outline)" strokeWidth="4" />
      <rect x="32" y="42" width="16" height="22" fill="var(--gb-surface-strong)" stroke="var(--gb-outline)" strokeWidth="4" />
    </svg>
  )
}

function GardenIcon() {
  return (
    <svg viewBox="0 0 80 80" width="50" height="50" aria-hidden="true">
      <path d="M40 46 V66" stroke="var(--gb-outline)" strokeWidth="4" strokeLinecap="round" />
      <path d="M40 50 C24 46 20 30 30 22 C44 26 48 42 40 50 Z" fill="var(--gb-secondary)" stroke="var(--gb-outline)" strokeWidth="4" strokeLinejoin="round" />
      <path d="M40 42 C56 38 60 22 50 14 C36 18 32 34 40 42 Z" fill="var(--gb-secondary)" stroke="var(--gb-outline)" strokeWidth="4" strokeLinejoin="round" />
      <path d="M24 66 h32 l-4 8 H28 Z" fill="var(--gb-peach)" stroke="var(--gb-outline)" strokeWidth="4" strokeLinejoin="round" />
    </svg>
  )
}

function HouseIcon() {
  return (
    <svg viewBox="0 0 80 80" width="50" height="50" aria-hidden="true">
      <path d="M12 38 L40 14 L68 38 Z" fill="var(--gb-peach)" stroke="var(--gb-outline)" strokeWidth="4" strokeLinejoin="round" />
      <rect x="20" y="38" width="40" height="28" fill="var(--gb-sky)" stroke="var(--gb-outline)" strokeWidth="4" />
      <rect x="34" y="48" width="12" height="18" fill="var(--gb-surface-strong)" stroke="var(--gb-outline)" strokeWidth="4" />
    </svg>
  )
}

function FiestaIcon() {
  return (
    <svg viewBox="0 0 80 80" width="50" height="50" aria-hidden="true">
      <circle cx="40" cy="42" r="22" fill="var(--gb-surface-strong)" stroke="var(--gb-outline)" strokeWidth="4" />
      <path d="M40 42 L40 20 A22 22 0 0 1 61 44 Z" fill="var(--gb-lavender)" stroke="var(--gb-outline)" strokeWidth="4" strokeLinejoin="round" />
      <path d="M40 42 L61 44 A22 22 0 0 1 28 61 Z" fill="var(--gb-primary)" stroke="var(--gb-outline)" strokeWidth="4" strokeLinejoin="round" />
    </svg>
  )
}
