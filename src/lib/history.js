// Per-attempt review log for "Aking Progreso > Pagsasanay". Stores the question,
// the learner's answer, the correct answer, and feedback — so kids can review
// what happened and how to improve. Persisted offline in IndexedDB (no
// localStorage, per app constraint). Capped so it never grows without bound.

import { get, set } from 'idb-keyval'
import { isLearnerFacingQuestion } from './question-quality.js'

const KEY = 'gabay:history'
const CAP = 200
export function isReviewableAttempt(entry) {
  return Boolean(entry && isLearnerFacingQuestion(entry))
}

export async function loadHistory() {
  const history = (await get(KEY)) ?? []
  const reviewable = history.filter(isReviewableAttempt)
  if (reviewable.length !== history.length) {
    const validRefs = new Set(reviewable.map((entry) => entry.ref).filter(Boolean))
    const legacyOnlyRefs = [...new Set(history.filter((entry) => !isReviewableAttempt(entry)).map((entry) => entry.ref).filter((ref) => ref && !validRefs.has(ref)))]
    const grades = [...new Set(legacyOnlyRefs.map((ref) => Number(String(ref).match(/^\d+/)?.[0])).filter((grade) => grade >= 1 && grade <= 6))]
    await Promise.all([
      set(KEY, reviewable),
      ...grades.map(async (grade) => {
        const masteryKey = `gabay:mastery:g${grade}`
        const dueKey = `gabay:dueAt:g${grade}`
        const [mastery, due] = await Promise.all([get(masteryKey), get(dueKey)])
        const refs = legacyOnlyRefs.filter((ref) => Number(String(ref).match(/^\d+/)?.[0]) === grade)
        for (const ref of refs) {
          if (mastery) delete mastery[ref]
          if (due) delete due[ref]
        }
        await Promise.all([mastery && set(masteryKey, mastery), due && set(dueKey, due)])
      }),
    ])
  }
  return reviewable
}

// entry: { ref, q, your, answer, correct, feedback, source }
export async function recordAttempt(entry) {
  if (!isReviewableAttempt(entry)) return
  const h = await loadHistory()
  h.unshift({ ...entry, at: Date.now() })
  await set(KEY, h.slice(0, CAP))
}

export async function clearHistory() {
  await set(KEY, [])
}
