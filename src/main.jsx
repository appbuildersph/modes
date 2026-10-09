import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'
import './index.css'
import { rememberEdgeBase } from './lib/edge-llm.js'

// Keep the offline shell fresh. Without this, an older installed PWA can keep
// serving a stale cached bundle while offline.
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true)
  },
  onRegisteredSW(_swUrl, registration) {
    registration?.update()
  },
})

// Pin the Teacher Gabay AI server from ?edge=<url> so the installed PWA keeps it.
rememberEdgeBase().catch(() => {})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
