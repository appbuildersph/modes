import { useEffect, useRef, useState } from 'react'

const BACK_ONLINE_MS = 2500

// App-wide connection panel. The per-screen badge is small, and a learner who
// loses signal mid-lesson should see at once that Gabay keeps teaching offline.
// `online` comes from App.jsx (OS events plus the /api/ping probe).
export default function OfflineBanner({ online, tt }) {
  const [state, setState] = useState(online ? 'hidden' : 'offline')
  const wasOffline = useRef(!online)

  useEffect(() => {
    if (!online) {
      wasOffline.current = true
      setState('offline')
      return undefined
    }
    if (!wasOffline.current) return undefined
    wasOffline.current = false
    setState('back')
    const timer = setTimeout(() => setState('hidden'), BACK_ONLINE_MS)
    return () => clearTimeout(timer)
  }, [online])

  if (state === 'hidden') return null
  const back = state === 'back'

  return (
    <div className={`offline-banner ${back ? 'is-back' : ''}`} role="status" aria-live="polite" data-no-motion>
      <span className="offline-banner-dot" aria-hidden="true" />
      <span className="offline-banner-text">
        <strong>{tt(back ? 'offline.backTitle' : 'offline.title')}</strong>
        {!back && <span>{tt('offline.body')}</span>}
      </span>
    </div>
  )
}
