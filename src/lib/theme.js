// Persisted 3D classroom "renovation" theme. Stored offline in IndexedDB so the
// learner's chosen surroundings stick across sessions. Color tables + the picker
// list live in three/scene.js (THEMES / THEME_LIST).

import { get, set } from 'idb-keyval'

const KEY = 'pref:theme3d'
export const DEFAULT_THEME = 'classic'

export async function loadTheme() {
  return (await get(KEY)) ?? DEFAULT_THEME
}

export async function saveTheme(t) {
  await set(KEY, t)
}
