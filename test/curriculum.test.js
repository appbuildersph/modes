import test from 'node:test'
import assert from 'node:assert/strict'
import { getAllContent, getContentByGrade } from '../src/lib/content-catalog.js'
import { DIFFICULTIES, difficultyFor } from '../src/lib/difficulty.js'

// Grades 4-6 only — Gabay's scope. Index 0 is Grade 4.
const EXPECTED = [54, 49, 52]
const FIRST_GRADE = 4
const SUPPORTED = new Set(['numeric', 'mcq', 'matching', 'true_false'])
const WEAK_OPTION = /alternative\s*\d|first category|second category|third category|answer choice|option\s*\d/i

function hasTiedExtremum(question) {
  if (!/\bwhich\b.+\bhas the\b.+\b(greatest|largest|highest|most|smallest|lowest|least|fewest)\b/i.test(question)) return false
  const values = [...question.matchAll(/=\s*(-?\d+(?:\.\d+)?)/g)].map((match) => Number(match[1]))
  if (values.length < 2) return false
  const target = /\b(greatest|largest|highest|most)\b/i.test(question) ? Math.max(...values) : Math.min(...values)
  return values.filter((value) => value === target).length > 1
}

test('every MATATAG grade catalog in scope is complete and traceable', () => {
  const all = getAllContent()
  assert.equal(all.length, EXPECTED.reduce((sum, value) => sum + value, 0))
  assert.equal(new Set(all.map((entry) => entry.ref)).size, all.length)
  EXPECTED.forEach((count, index) => {
    const grade = index + FIRST_GRADE
    const entries = getContentByGrade(grade)
    assert.equal(entries.length, count)
    for (const competency of entries) {
      assert.equal(competency.grade, grade)
      assert.ok(competency.source_trace.local_ref)
      assert.ok(competency.source_trace.quiz.endsWith('.md'))
      // Thirteen Statistics & Probability competencies are down to a single
      // item because most of their content was marking-rubric text
      // ("Correct display with values ... and complete labels") that a learner
      // cannot pick from a list. They need authored questions; shipping the
      // rubric as a tappable choice was the worse option.
      assert.ok(competency.items.length >= 1, competency.ref)
      assert.equal(new Set(competency.items.map((item) => JSON.stringify(item.q))).size, competency.items.length, competency.ref)
      assert.ok(competency.items.every((item) => item.answer !== undefined && item.solution && item.source?.path && SUPPORTED.has(item.type)), competency.ref)
      assert.ok(competency.items.every((item) => item.source.package === 'DepEd-MATATAG-Mathematics-Grades-1-6'), competency.ref)
      assert.ok(competency.items.every((item) => !/\[(?:Graph|Diagram|Image) placeholder/i.test(item.q.en)), `${competency.ref} exposes a source placeholder`)
      assert.ok(competency.items.every((item) => !/answer can be chosen without using the given mathematical information/i.test(item.q.en)), `${competency.ref} exposes a templated non-question`)
      assert.ok(competency.items.every((item) => !/\*\*/.test(item.q.en)), `${competency.ref} exposes raw markdown`)
      assert.ok(competency.items.every((item) => !hasTiedExtremum(item.q.en)), `${competency.ref} has an ambiguous extreme-value question`)
      for (const item of competency.items.filter((question) => question.options)) {
        assert.equal(new Set(item.options).size, item.options.length, `${competency.ref} has duplicate options`)
        assert.ok(item.options.includes(item.answer), `${competency.ref} answer missing from options`)
        assert.ok(item.options.every((option) => !WEAK_OPTION.test(option)), `${competency.ref} has placeholder options`)
        // Four options where the topic supports four. Some answers belong to a
        // closed set smaller than that — there are exactly three rigid
        // transformations, and a yes/no question has two answers — so those
        // items offer the real choices rather than padding with fillers.
        if (item.type === 'mcq') {
          assert.ok(
            item.options.length >= 2 && item.options.length <= 4,
            `${competency.ref} MCQ has ${item.options.length} options`,
          )
        }
      }
      assert.ok(competency.game_tags.length >= 1, competency.ref)
      assert.equal(competency.difficulty, difficultyFor(competency.competency), `${competency.ref} has a stale difficulty`)
    }
    for (const difficulty of DIFFICULTIES) {
      const share = entries.filter((entry) => entry.difficulty === difficulty).length / entries.length
      assert.ok(share >= 0.1, `Grade ${grade} has too few ${difficulty} lessons`)
      assert.ok(share <= 0.6, `Grade ${grade} has too many ${difficulty} lessons`)
    }
  })
})

test('difficulty is based on grade-relative thinking demand', () => {
  assert.equal(difficultyFor('Count up to 100.'), 'madali')
  assert.equal(difficultyFor('Compare two numbers up to 20.'), 'katamtaman')
  assert.equal(difficultyFor('Solve problems involving addition with sums up to 20.'), 'mahirap')
  assert.equal(difficultyFor('Identify and explain the uses of percentages.'), 'madali')
  assert.equal(difficultyFor('Divide decimals by whole numbers.'), 'katamtaman')
  assert.equal(difficultyFor('Solve problems involving ratio and proportion.'), 'mahirap')
})
