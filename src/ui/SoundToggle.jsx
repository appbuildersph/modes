// Floating sound on/off button. Sits just above the bottom nav so it's
// reachable from every tabbed screen. Toggles the master mute (music + SFX).
import { useEffect, useState } from 'react'
import { isMuted, loadSoundPrefs, toggleMute, sfx } from '../lib/sound.js'
import { makeT } from '../lib/i18n.js'
import { DEFAULT_LANG } from '../lib/lang.js'

export default function SoundToggle({ embedded = false, className = '', lang = DEFAULT_LANG }) {
  const tt = makeT(lang)
  const [muted, setMuted] = useState(isMuted())

  useEffect(() => {
    let alive = true
    loadSoundPrefs().then((prefs) => {
      if (alive) setMuted(prefs.muted)
    })
    return () => {
      alive = false
    }
  }, [])

  function onClick() {
    const next = toggleMute()
    setMuted(next)
    if (!next) sfx('click') // little confirmation when turning sound back on
  }

  return (
    <button
      onClick={onClick}
      aria-label={tt(muted ? 'sound.unmute' : 'sound.mute')}
      aria-pressed={muted}
      className={`${embedded ? 'relative flex h-8 w-8 shrink-0' : 'app-sound-toggle fixed z-50 flex h-11 w-11'} ${className} items-center justify-center rounded-full border-[2.5px] border-outline bg-white shadow-hard-sm active:translate-y-0.5`}
    >
      {muted ? <MutedIcon /> : <SoundIcon />}
    </button>
  )
}

function SoundIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M4 9 h3 l4 -3 v12 l-4 -3 H4 Z" fill="var(--gb-outline)" stroke="var(--gb-outline)" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M15 9 a4 4 0 0 1 0 6 M17.5 7 a7 7 0 0 1 0 10" fill="none" stroke="var(--gb-outline)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function MutedIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M4 9 h3 l4 -3 v12 l-4 -3 H4 Z" fill="var(--gb-outline)" stroke="var(--gb-outline)" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M15 9 l5 6 M20 9 l-5 6" fill="none" stroke="var(--gb-outline)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
