import { normalizeMode } from './tutor-modes.js'

// What each learning mode changes on screen (docs/DESIGN.md section 8). Screens
// read these flags instead of checking mode ids; styling is in src/styles/modes.css.
const BASE = {
  music: true,
  celebrate: true,
  shake: true,
  sfx: true,
  questionCounter: false,
  autoRead: false,
  highlight: false,
  readRate: undefined,
  bigSteps: false,
}

const UI = {
  none: BASE,
  kalma: { ...BASE, music: false, celebrate: false, shake: false, sfx: false, questionCounter: true },
  pakinig: { ...BASE, autoRead: true, highlight: true, readRate: 0.8 },
  hakbang: { ...BASE, bigSteps: true },
}

export const READ_SPEEDS = [0.8, 0.65, 1]

export function modeUi(mode) {
  return UI[normalizeMode(mode)]
}
