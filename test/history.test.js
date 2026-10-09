import test from 'node:test'
import assert from 'node:assert/strict'
import { isReviewableAttempt } from '../src/lib/history.js'

test('legacy curriculum-metadata prompts are removed from attempt history', () => {
  assert.equal(isReviewableAttempt({ q: 'Which learning task belongs to 1NA-Id-1?' }), false)
  assert.equal(isReviewableAttempt({ q: 'Which goal is aligned with this Grade 1 lesson?' }), false)
  assert.equal(isReviewableAttempt({ q: 'What is 7 + 5?' }), true)
  assert.equal(isReviewableAttempt({ q: 'Which competency is aligned with this lesson?' }), false)
  assert.equal(isReviewableAttempt({ q: 'What does 1NA-Id-1 teach?' }), false)
})
