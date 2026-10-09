import test from 'node:test'
import assert from 'node:assert/strict'
import {
  isLessonCompleted,
  isLessonInProgress,
  isLessonStarted,
  summarizeLessons,
} from '../src/lib/progress.js'

test('a wrong answer does not reset a lesson to Not started', () => {
  // Mastery drops back to 0 after a wrong answer. History still says the
  // learner has been here, and that is what "started" must follow.
  assert.equal(isLessonStarted(true, 0), true)
  assert.equal(isLessonInProgress(true, 0), true)
  assert.equal(isLessonStarted(false, 0), false)
})

test('completed means full mastery, not merely answered', () => {
  assert.equal(isLessonCompleted(0.1), false)
  assert.equal(isLessonCompleted(0.99), false)
  assert.equal(isLessonCompleted(1), true)
  assert.equal(isLessonInProgress(true, 1), false)
})

test('mastery above zero counts as started even without history', () => {
  assert.equal(isLessonStarted(false, 0.4), true)
})

test('summary agrees across screens for the same learner state', () => {
  const entries = [
    { answered: true, score: 0 },      // answered, then got one wrong
    { answered: true, score: 0.5 },    // partway
    { answered: true, score: 1 },      // finished
    { answered: false, score: 0 },     // untouched
  ]
  const summary = summarizeLessons(entries)
  assert.equal(summary.total, 4)
  assert.equal(summary.started, 3)
  assert.equal(summary.completed, 1)
  assert.equal(summary.inProgress, 2)
  assert.equal(summary.averageStartedMastery, 0.5)
})

test('an untouched catalog summarises to zero without dividing by zero', () => {
  const summary = summarizeLessons([{ answered: false, score: 0 }])
  assert.equal(summary.started, 0)
  assert.equal(summary.averageStartedMastery, 0)
})
