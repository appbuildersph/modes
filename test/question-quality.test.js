import test from 'node:test'
import assert from 'node:assert/strict'
import { getAllContent } from '../src/lib/content-catalog.js'
import {
  hasLearnerFacingOptions,
  isLearnerFacingQuestion,
  isRubricText,
} from '../src/lib/question-quality.js'

const RUBRIC_SAMPLES = [
  'Any correctly labeled angle greater than 90° and less than 180°',
  'Any arrangement of 6 squares that folds into a cube',
  'Correctly labeled drawings',
  'Answers vary; e.g., tabletop or book cover',
]

test('marking-rubric prose is recognised', () => {
  for (const sample of RUBRIC_SAMPLES) assert.ok(isRubricText(sample), sample)
  for (const sample of ['acute angle', '42', '₱120', 'True']) {
    assert.ok(!isRubricText(sample), sample)
  }
})

test('a rubric option disqualifies a choice set', () => {
  const question = {
    q: { en: 'Classify an angle measuring 60°.' },
    answer: 'acute angle',
    type: 'mcq',
    options: ['right angle', '110° angle', RUBRIC_SAMPLES[0], 'acute angle'],
  }
  assert.equal(hasLearnerFacingOptions(question), false)
  assert.equal(isLearnerFacingQuestion(question), false)

  question.options = ['right angle', 'obtuse angle', 'straight angle', 'acute angle']
  assert.equal(hasLearnerFacingOptions(question), true)
  assert.equal(isLearnerFacingQuestion(question), true)
})

test('no bundled question shows rubric prose to a learner', () => {
  for (const competency of getAllContent()) {
    for (const item of competency.items) {
      assert.ok(!isRubricText(item.answer), `${competency.ref} has a rubric answer`)
      for (const option of item.options ?? []) {
        assert.ok(!isRubricText(option), `${competency.ref} has a rubric option: ${option}`)
      }
    }
  }
})

test('true/false items are not all True', () => {
  const items = getAllContent().flatMap((competency) => competency.items).filter((item) => item.type === 'true_false')
  assert.ok(items.length > 0)
  const falseCount = items.filter((item) => String(item.answer) === 'False').length
  // Always tapping one answer must not score well. A third of the pool is a
  // deliberately loose floor — the point is that neither answer is a free win.
  assert.ok(falseCount >= items.length / 3, `only ${falseCount} of ${items.length} true/false items are False`)
  assert.ok(items.length - falseCount >= items.length / 3, 'true/false pool has too few True items')
})

test('true/false comparison claims match their label', () => {
  for (const competency of getAllContent()) {
    for (const item of competency.items) {
      if (item.type !== 'true_false') continue
      const proposed = String(item.q.en ?? '').match(/Proposed answer:\s*(.+?)\s*$/i)
      if (!proposed) continue
      const relation = proposed[1].match(/^(.+?)\s*(>=|<=|>|<|=)\s*(.+)$/)
      if (!relation) continue
      const left = parseNumber(relation[1])
      const right = parseNumber(relation[3])
      if (left === null || right === null) continue
      const holds = relation[2] === '>' ? left > right
        : relation[2] === '<' ? left < right
          : relation[2] === '>=' ? left >= right
            : relation[2] === '<=' ? left <= right
              : left === right
      assert.equal(holds, String(item.answer) === 'True', `${competency.ref}: "${proposed[1]}" labelled ${item.answer}`)
    }
  }
})

test('tap-only items do not ask for written work', () => {
  const WRITTEN_WORK = /(?:Explain why your answer is reasonable|Explain your answer|Show your solution|Show your work)/i
  for (const competency of getAllContent()) {
    for (const item of competency.items) {
      if (item.type !== 'mcq' && item.type !== 'true_false') continue
      assert.ok(!WRITTEN_WORK.test(String(item.q.en ?? '')), `${competency.ref} asks for written work on a tap-only item`)
    }
  }
})

test('competency text has no unmatched trailing quote', () => {
  for (const competency of getAllContent()) {
    assert.ok(!/"\s*\.?\s*$/.test(competency.competency), `${competency.ref} ends with a stray quote`)
  }
})

const parseNumber = (text) => {
  const cleaned = String(text).replace(/[₱$,\s]/g, '').replace(/(cm|mm|km|m|kg|g|mL|L|°|%)$/i, '')
  return /^-?\d+(?:\.\d+)?$/.test(cleaned) ? Number(cleaned) : null
}

function relationIsTrue(text) {
  const match = String(text).match(/^(.+?)\s*(>=|<=|>|<|=)\s*(.+)$/)
  if (!match) return null
  const left = parseNumber(match[1])
  const right = parseNumber(match[3])
  if (left === null || right === null) return null
  switch (match[2]) {
    case '>': return left > right
    case '<': return left < right
    case '>=': return left >= right
    case '<=': return left <= right
    default: return left === right
  }
}

const answerShape = (value) => (
  /^[₱$]?-?[\d.,\s]+(?:cm|mm|m|km|kg|g|L|mL|°|%)?\.?$/i.test(String(value).trim()) ? 'numeric' : 'words'
)

test('a multiple-choice answer is never the only option of its shape', () => {
  for (const competency of getAllContent()) {
    for (const item of competency.items) {
      if (item.type !== 'mcq' || !Array.isArray(item.options)) continue
      const distractors = item.options.map(String).filter((option) => option !== String(item.answer))
      if (!distractors.length) continue
      const shape = answerShape(item.answer)
      assert.ok(
        distractors.some((option) => answerShape(option) === shape),
        `${competency.ref}: answer ${JSON.stringify(item.answer)} is the only ${shape} option in ${JSON.stringify(item.options)}`,
      )
    }
  }
})

test('comparison items have exactly one true option', () => {
  for (const competency of getAllContent()) {
    for (const item of competency.items) {
      if (item.type !== 'mcq' || !Array.isArray(item.options)) continue
      if (relationIsTrue(item.answer) !== true) continue
      const alsoTrue = item.options
        .map(String)
        .filter((option) => option !== String(item.answer))
        .filter((option) => relationIsTrue(option) === true)
      assert.deepEqual(alsoTrue, [], `${competency.ref} has more than one correct comparison`)
    }
  }
})

test('every choice set is free of duplicates and contains its answer', () => {
  for (const competency of getAllContent()) {
    for (const item of competency.items) {
      if (!Array.isArray(item.options) || !item.options.length) continue
      const options = item.options.map(String)
      assert.equal(new Set(options).size, options.length, `${competency.ref} has duplicate options`)
      assert.ok(options.includes(String(item.answer)), `${competency.ref} answer missing from options`)
    }
  }
})

const FILLER_OPTION = /^(?:a different value|cannot be determined|none of (?:these|the above)|all of the above|not enough information|no answer|other)\.?$/i

test('no choice set is padded with filler options', () => {
  for (const competency of getAllContent()) {
    for (const item of competency.items) {
      for (const option of item.options ?? []) {
        assert.ok(!FILLER_OPTION.test(String(option).trim()), `${competency.ref} offers filler: ${option}`)
      }
    }
  }
})

test('the answer is never flagged by its currency symbol alone', () => {
  const hasCurrency = (value) => /[₱$]/.test(String(value))
  for (const competency of getAllContent()) {
    for (const item of competency.items) {
      if (item.type !== 'mcq' || !Array.isArray(item.options)) continue
      const distractors = item.options.map(String).filter((option) => option !== String(item.answer))
      if (!distractors.length) continue
      const answerHas = hasCurrency(item.answer)
      assert.ok(
        distractors.some((option) => hasCurrency(option) === answerHas),
        `${competency.ref}: currency formatting singles out the answer in ${JSON.stringify(item.options)}`,
      )
    }
  }
})

const CLOSED_FAMILIES = [
  { key: 'weekday', test: /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i },
  { key: 'solid', test: /^(cube|rectangular prism|triangular prism|sphere|cylinder|cone|pyramid|square pyramid)$/i },
  { key: 'plane-shape', test: /^(square|rectangle|triangle|circle|rhombus|trapezoid|parallelogram|pentagon|hexagon|octagon|quadrilateral)$/i },
  { key: 'angle', test: /^(acute|obtuse|right|straight|reflex)( angle)?$/i },
  { key: 'yes-no', test: /^(yes|no)$/i },
]
const familyOf = (value) => CLOSED_FAMILIES.find((family) => family.test.test(String(value).trim()))?.key ?? null

test('closed-set answers get distractors from the same family', () => {
  for (const competency of getAllContent()) {
    for (const item of competency.items) {
      if (item.type !== 'mcq' || !Array.isArray(item.options)) continue
      const family = familyOf(item.answer)
      if (!family) continue
      for (const option of item.options) {
        assert.equal(
          familyOf(option),
          family,
          `${competency.ref}: ${JSON.stringify(option)} is not a ${family} alongside ${JSON.stringify(item.answer)}`,
        )
      }
    }
  }
})
