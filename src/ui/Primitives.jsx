// Neo-brutalist building blocks: thick outlines, hard offset shadows, pills.
import { topicArea } from '../lib/topics.js'
import { masteryColor } from '../lib/mastery.js'
import { playButtonSfx } from '../lib/sound.js'

// Renders text with **bold** markup so feedback can emphasize the correct
// answer, a key formula, or an important reminder.
export function RichText({ children, className = '' }) {
  const parts = String(children ?? '').split(/(\*\*[^*]+\*\*)/g)
  return (
    <span className={className}>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') ? (
          <strong key={i} className="font-extrabold text-ink">
            {p.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </span>
  )
}

export function Button({ color = 'yellow', className = '', children, onClick, ...props }) {
  const colors = {
    yellow: 'bg-yellow',
    mint: 'bg-mint',
    sky: 'bg-sky',
    rose: 'bg-rose',
    peach: 'bg-peach',
    lavender: 'bg-lavender',
    white: 'bg-white',
  }
  // Every press plays a random recorded click sound (no-op when muted).
  const handleClick = (e) => {
    playButtonSfx()
    onClick?.(e)
  }
  return (
    <button className={`gb-btn ${colors[color] ?? colors.yellow} ${className}`} onClick={handleClick} {...props}>
      {children}
    </button>
  )
}

export function Card({ color = 'white', className = '', children, ...props }) {
  const colors = {
    white: 'bg-white',
    cream: 'bg-cream',
    mint: 'bg-mint',
    sky: 'bg-sky',
    rose: 'bg-rose',
    peach: 'bg-peach',
    yellow: 'bg-yellow',
    lavender: 'bg-lavender',
  }
  return (
    <div className={`gb-card ${colors[color] ?? colors.white} ${className}`} {...props}>
      {children}
    </div>
  )
}

export function Chip({ color = 'mint', active = false, className = '', children, ...props }) {
  const colors = {
    mint: 'bg-mint',
    sky: 'bg-sky',
    rose: 'bg-rose',
    peach: 'bg-peach',
    yellow: 'bg-yellow',
    lavender: 'bg-lavender',
    white: 'bg-white',
  }
  return (
    <button
      className={`gb-chip ${active ? colors[color] : 'bg-white'} ${
        active ? 'shadow-hard-sm' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

// MATATAG learning-area badge. Shows the child-friendly area name (e.g.
// "Number and Algebra") — no "Grade 6" / shortened code in the title.
export function RefBadge({ refId, domain }) {
  const area = topicArea(refId, domain || 'Number and Algebra')
  return (
    <span className="gb-chip bg-yellow shadow-hard-sm text-xs">{area}</span>
  )
}

// Progress bar colored by the shared 3-band system (red/orange/green).
export function MasteryBar({ score = 0 }) {
  const pct = Math.round((score ?? 0) * 100)
  const { fill } = masteryColor(score)
  return (
    <div className="w-full">
      <div className="h-4 w-full rounded-full border-[2.5px] border-outline bg-white overflow-hidden">
        <div
          className={`h-full ${fill} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// SVG doodles — drawn, not emoji (survives any text/emoji stripping).
export function Sparkle({ size = 20, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      <path
        d="M12 2 L14 9 L21 12 L14 15 L12 22 L10 15 L3 12 L10 9 Z"
        fill="var(--gb-primary)"
        stroke="var(--gb-outline)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Cloud({ size = 40, className = '' }) {
  return (
    <svg viewBox="0 0 64 40" width={size} height={size} className={className} aria-hidden="true">
      <path
        d="M16 32 a12 12 0 0 1 2-23 a14 14 0 0 1 27 3 a10 10 0 0 1 1 20 Z"
        fill="var(--gb-surface-strong)"
        stroke="var(--gb-outline)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Plant({ size = 28, className = '' }) {
  return (
    <svg viewBox="0 0 32 40" width={size} height={size} className={className} aria-hidden="true">
      <path d="M16 38 V20" stroke="var(--gb-outline)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M16 24 C8 22 6 14 10 10 C16 12 18 18 16 24 Z" fill="var(--gb-secondary)" stroke="var(--gb-outline)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M16 20 C24 18 26 10 22 6 C16 8 14 14 16 20 Z" fill="var(--gb-secondary)" stroke="var(--gb-outline)" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}

// Light background doodles (sparkles, clouds).
export function Doodles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <Sparkle className="absolute left-4 top-6 opacity-70" size={22} />
      <Cloud className="absolute right-5 top-14 opacity-70" size={40} />
      <Sparkle className="absolute right-8 bottom-44 opacity-60" size={16} />
      <Plant className="absolute left-6 bottom-20 opacity-70" size={28} />
    </div>
  )
}
