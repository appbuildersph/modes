import { del, get, set } from 'idb-keyval'
import { DEFAULT_GRADE } from './grades.js'

const DEFAULT = 0

const masteryKey = (grade = DEFAULT_GRADE) => `gabay:mastery:g${grade}`
const dueKey = (grade = DEFAULT_GRADE) => `gabay:dueAt:g${grade}`

export async function migrateMastery() {
  const old = await get('gabay:mastery')
  if (old) {
    await set(masteryKey(6), old)
    await del('gabay:mastery')
  }
  const oldDue = await get('gabay:dueAt')
  if (oldDue) {
    await set(dueKey(6), oldDue)
    await del('gabay:dueAt')
  }
}

export async function loadMasteryForGrade(grade = DEFAULT_GRADE) {
  return (await get(masteryKey(grade))) ?? {}
}

export async function loadDueForGrade(grade = DEFAULT_GRADE) {
  return (await get(dueKey(grade))) ?? {}
}

// Backward-compatible aliases default to Grade 6.
export const loadMastery = () => loadMasteryForGrade(DEFAULT_GRADE)
export const loadDue = () => loadDueForGrade(DEFAULT_GRADE)

export async function hasAnswered(ref, grade = DEFAULT_GRADE) {
  const mastery = await loadMasteryForGrade(grade)
  return Object.prototype.hasOwnProperty.call(mastery, ref)
}

export async function clearMasteryForGrade(grade = DEFAULT_GRADE) {
  await Promise.all([del(masteryKey(grade)), del(dueKey(grade))])
}

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export async function updateStreak() {
  const today = new Date()
  const todayKey = localDateKey(today)
  const last = await get('gabay:lastAnswerDate')
  if (last === todayKey) return (await get('gabay:streak')) ?? 1

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const previous = (await get('gabay:streak')) ?? 0
  const streak = last === localDateKey(yesterday) ? previous + 1 : 1
  await Promise.all([set('gabay:streak', streak), set('gabay:lastAnswerDate', todayKey)])
  return streak
}

export async function loadStreak() {
  return (await get('gabay:streak')) ?? 0
}

function clamp(n) {
  return Math.max(0, Math.min(1, n))
}

export async function recordAnswer(ref, correct, grade = DEFAULT_GRADE) {
  const mastery = await loadMasteryForGrade(grade)
  const due = await loadDueForGrade(grade)
  const prev = mastery[ref] ?? DEFAULT
  mastery[ref] = clamp(prev + (correct ? 0.1 : -0.1))

  const tick = (due._tick ?? 0) + 1
  due._tick = tick
  due[ref] = correct ? tick + 6 : tick + 1

  await Promise.all([set(masteryKey(grade), mastery), set(dueKey(grade), due), updateStreak()])
  return mastery[ref]
}

export function pickNext(competencies, mastery, due) {
  let best = null
  let bestKey = Infinity
  for (const c of competencies) {
    const m = mastery[c.ref] ?? DEFAULT
    const d = due[c.ref] ?? 0
    const key = m * 100 + d * 0.01
    if (key < bestKey) {
      bestKey = key
      best = c
    }
  }
  return best
}

export function masteryBand(score) {
  const m = score ?? DEFAULT
  if (m >= 0.7) return 'green'
  if (m >= 0.4) return 'orange'
  return 'red'
}

// Band labels live in i18n.js under 'band.{red|orange|green}' — a second,
// hardcoded-Filipino copy here rendered the same text in English mode.
const BAND_BG = { red: 'bg-rose', orange: 'bg-peach', green: 'bg-mint' }
const BAND_FILL = { red: 'bg-rose', orange: 'bg-[#f7b955]', green: 'bg-mint' }

export function masteryColor(score) {
  const band = masteryBand(score)
  return { band, bg: BAND_BG[band], fill: BAND_FILL[band] }
}
