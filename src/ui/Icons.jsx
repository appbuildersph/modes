// Shared line icons in the app's bold-outline style (ink var(--gb-outline), ~2.2 stroke).
// Used by the Classroom voice controls so the buttons read as friendly glyphs
// instead of text. Each icon is sized via the `size` prop (default 24).

const INK = 'var(--gb-outline)'

// Ear with three sound curves — replaces the "Listen again" text button.
export function EarIcon({ size = 24, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      {/* ear */}
      <path
        d="M8.5 9.2a3.4 3.4 0 0 1 6.8 0c0 2.1-2 2.9-2.6 4.3-.4 1-.2 2.2-1.5 2.6a1.7 1.7 0 0 1-2.2-1.6"
        fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
      <circle cx="11.8" cy="9.2" r="0.7" fill={INK} />
      {/* three sound curves */}
      <path d="M16.6 7.1a4 4 0 0 1 0 5.6" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18.4 5.4a6.6 6.6 0 0 1 0 9" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M20.1 3.8a9 9 0 0 1 0 12.2" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

// Play triangle inside a circle container.
export function PlayCircleIcon({ size = 24, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" fill="none" stroke={INK} strokeWidth="2.2" />
      <path d="M10 8.4 L16 12 L10 15.6 Z" fill={INK} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}

// Pause bars inside a circle container.
export function PauseCircleIcon({ size = 24, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" fill="none" stroke={INK} strokeWidth="2.2" />
      <line x1="10" y1="8.5" x2="10" y2="15.5" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      <line x1="14" y1="8.5" x2="14" y2="15.5" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

// Person raising a hand inside a circle container.
export function RaiseHandIcon({ size = 24, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" fill="none" stroke={INK} strokeWidth="2.2" />
      {/* head */}
      <circle cx="11" cy="9" r="1.9" fill="none" stroke={INK} strokeWidth="1.8" />
      {/* body + lowered arm */}
      <path d="M7.7 17.2c0-2.4 1.5-3.9 3.3-3.9 1.4 0 2.5.8 3 2.1" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
      {/* raised arm */}
      <path d="M13.2 13.6 L15.4 8.6" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="15.7" cy="7.7" r="1.1" fill={INK} />
    </svg>
  )
}

export function LightbulbIcon({ size = 24, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      <path d="M8.2 14.2a6 6 0 1 1 7.6 0c-1.1.8-1.5 1.7-1.6 2.8H9.8c-.1-1.1-.5-2-1.6-2.8Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.7 20h4.6M10 17h4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 1V0M4.2 4.2l-.8-.8M19.8 4.2l.8-.8M2 11H1M23 11h-1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
