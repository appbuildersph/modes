import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'
import './index.css'
// Fonts are bundled and precached so the app looks the same offline (all SIL
// Open Font License 1.1). Atkinson Hyperlegible is Pakinig's reading font.
import '@fontsource/baloo-2/latin-500.css'
import '@fontsource/baloo-2/latin-600.css'
import '@fontsource/baloo-2/latin-700.css'
import '@fontsource/baloo-2/latin-800.css'
import '@fontsource/nunito/latin-400.css'
import '@fontsource/nunito/latin-600.css'
import '@fontsource/nunito/latin-700.css'
import '@fontsource/nunito/latin-800.css'
import '@fontsource/atkinson-hyperlegible/latin-400.css'
import '@fontsource/atkinson-hyperlegible/latin-700.css'
import './styles/modes.css'
import './styles/motion.css'
import { rememberEdgeBase } from './lib/edge-llm.js'
import { installMotion } from './lib/motion.js'

// Keep the offline shell fresh. Without this, an older installed PWA can keep
// serving a stale cached bundle while offline.
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true)
  },
  onRegisteredSW(_swUrl, registration) {
    // Rejects when the app starts offline; the next launch checks again.
    registration?.update().catch(() => {})
  },
})

// Pin the Teacher Gabay AI server from ?edge=<url> so the installed PWA keeps it.
rememberEdgeBase().catch(() => {})

// Installed before the first render so the splash gets the startup entrance.
installMotion(document.getElementById('root'))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
