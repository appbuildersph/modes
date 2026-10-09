// Canonical lesson-progress vocabulary.
//
// Lessons, Practice, and Profile each used to derive "started" and "completed"
// differently, so the same learner state read three ways: Lessons said "Not
// started", Profile said "1 in progress", Practice said "1 completed". Every
// screen imports from here now.
//
//   started   -> the learner has answered at least once (history-backed, so a
//                wrong answer cannot flip a lesson back to "Not started")
//   completed -> mastery has reached 100%
//   inProgress-> started but not yet completed

export const MASTERY_COMPLETE = 1

export function isLessonCompleted(score) {
  return Math.round((score ?? 0) * 100) >= MASTERY_COMPLETE * 100
}

export function isLessonStarted(answered, score) {
  return Boolean(answered) || (score ?? 0) > 0
}

export function isLessonInProgress(answered, score) {
  return isLessonStarted(answered, score) && !isLessonCompleted(score)
}

// Counts for a list of { answered, score } entries.
export function summarizeLessons(entries) {
  let started = 0
  let completed = 0
  let masterySum = 0
  for (const entry of entries) {
    const score = entry.score ?? 0
    if (isLessonCompleted(score)) completed += 1
    if (isLessonStarted(entry.answered, score)) {
      started += 1
      masterySum += score
    }
  }
  return {
    total: entries.length,
    started,
    completed,
    inProgress: started - completed,
    averageStartedMastery: started ? masterySum / started : 0,
  }
}
