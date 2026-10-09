import { get, set } from 'idb-keyval'
import { DEFAULT_MODE, MODES } from './tutor-modes.js'

// Learning mode preference (Kalma / Pakinig / Hakbang), persisted offline in
// IndexedDB like the language preference. Default: no mode.

const KEY = 'pref:mode'

export async function loadMode() {
  try {
    const v = await get(KEY)
    return Object.hasOwn(MODES, v) ? v : DEFAULT_MODE
  } catch {
    return DEFAULT_MODE
  }
}

export async function saveMode(mode) {
  if (Object.hasOwn(MODES, mode)) await set(KEY, mode)
}
