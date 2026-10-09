import assert from 'node:assert/strict'
import test from 'node:test'

import { lessonTeaching } from '../src/lib/lesson-teaching.js'

test('every Grade 1-3 lesson has teachable explanation and a solved example structure', async () => {
  for (const grade of [1, 2, 3]) {
    const curriculum = (await import(`../src/curriculum/grade${grade}.json`, { with: { type: 'json' } })).default
    for (const competency of curriculum) {
      const teaching = lessonTeaching(competency)
      assert.notEqual(teaching.explanation.en, competency.competency, `${competency.ref} repeats its competency`)
      assert.notEqual(teaching.explanation.taglish, teaching.explanation.en, `${competency.ref} has no Taglish teaching copy`)
      assert.ok(teaching.example.prompt?.en, `${competency.ref} has no example prompt`)
      assert.ok(teaching.example.steps.length > 0, `${competency.ref} has no worked step`)
      assert.ok(teaching.example.answer?.en, `${competency.ref} has no resolved answer`)
      assert.ok(teaching.example.teacherLine?.taglish, `${competency.ref} has no concise teacher line`)
    }
  }
})
