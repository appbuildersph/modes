import { Card, Button, Doodles, MasteryBar } from '../ui/Primitives.jsx'
import { Mascot } from '../ui/Mascot.jsx'
import OnlineBadge from '../ui/OnlineBadge.jsx'
import { topicTitleLocalized } from '../lib/topics.js'
import { makeT } from '../lib/i18n.js'
import './StartChoice.css'

// Start choice - design basis: Stitch "Gabay - Start Choice".
export default function StartChoice({ next, mastery, online = true, lang = 'taglish', grade = 6, onAuto, onBrowse, onBack }) {
  const tt = makeT(lang)
  const answered = next ? Object.prototype.hasOwnProperty.call(mastery, next.ref) : false
  const score = next ? mastery[next.ref] ?? 0 : 0
  const pct = Math.round(score * 100)
  const title = next ? topicTitleLocalized(next.ref, next.competency, lang) : ''

  return (
    <div className="start-choice-page gb-shell relative flex min-h-screen flex-col px-5">
      <Doodles />

      {/* header */}
      <div className="start-choice-header flex items-center justify-between">
        <button className="start-choice-back gb-chip bg-white" onClick={onBack}>
          <span aria-hidden="true">&lsaquo;</span> {tt('common.back')}
        </button>
        <div className="start-choice-brand flex items-center gap-2">
          <OnlineBadge online={online} className="start-choice-online" />
          <Mascot size={30} />
          <span className="font-display font-extrabold">Gabay</span>
        </div>
      </div>

      <main className="start-choice-content">
        <h1 className="start-choice-title font-display font-extrabold leading-tight">
          {tt('start.heading')}
        </h1>
        <p className="start-choice-subtitle text-sm font-bold text-ink/70">
          {tt('start.sub')}
        </p>

        {/* 01 - CONTINUE */}
        {next && (
          <Card color="mint" className="start-choice-card start-choice-card--continue">
            <span className="start-choice-step gb-chip bg-white text-[10px] uppercase tracking-wide">
              {tt('start.continueTag')}
            </span>
            <h2 className="start-choice-card-title font-display font-extrabold leading-tight">
              {tt('start.continueTitle')}
            </h2>

            <div className="start-choice-topic rounded-card border-outline bg-white">
              <p className="font-bold leading-snug">{title}</p>
              {answered && (
                <>
                  <p className="mt-2 text-xs font-bold text-ink/60">{tt('start.masteryProgress')}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <MasteryBar score={score} />
                    <span className="text-xs font-bold">{pct}%</span>
                  </div>
                </>
              )}
            </div>

            <Button color="yellow" className="start-choice-action w-full" onClick={() => onAuto(next)}>
              {tt('start.startNow')} &rarr;
            </Button>
          </Card>
        )}

        {/* 02 - BROWSE */}
        <Card color="sky" className="start-choice-card start-choice-card--browse">
          <span className="start-choice-step gb-chip bg-white text-[10px] uppercase tracking-wide">
            {tt('start.browseTag')}
          </span>
          <h2 className="start-choice-card-title font-display font-extrabold leading-tight">
            {tt('start.browseTitle')}
          </h2>
          <p className="start-choice-card-copy text-sm font-bold text-ink/70">
            {tt('start.browseSubGrade', { grade })}
          </p>
          <Button color="white" className="start-choice-action start-choice-action--browse w-full" onClick={onBrowse}>
            {tt('start.viewList')} &rarr;
          </Button>
        </Card>
      </main>
    </div>
  )
}
