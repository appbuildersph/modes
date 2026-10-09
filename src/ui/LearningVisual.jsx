import { VISUAL_ASSETS, visualForChoice, visualForQuestion } from '../lib/visual-assets.js'

export function ChoiceVisual({ value, className = '' }) {
  const visual = visualForChoice(value)
  if (!visual) return null

  return (
    <img
      src={visual.src}
      alt=""
      aria-hidden="true"
      className={`h-9 w-9 shrink-0 object-contain ${className}`}
      loading="lazy"
      decoding="async"
    />
  )
}

export function QuestionVisual({ question, assetKey, dark = false, className = '' }) {
  const visual = (assetKey && VISUAL_ASSETS[assetKey]) || visualForQuestion(question)
  if (!visual) return null

  return (
    <figure
      className={`mt-3 flex min-h-28 items-center justify-center overflow-hidden rounded-card border-2 p-3 ${
        dark ? 'border-cream/60 bg-white/95' : 'border-outline bg-cream'
      } ${className}`}
    >
      <img
        src={visual.src}
        alt={visual.alt}
        className="max-h-32 w-auto max-w-full object-contain"
        loading="lazy"
        decoding="async"
      />
    </figure>
  )
}
