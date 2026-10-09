import assert from 'node:assert/strict'
import { access } from 'node:fs/promises'
import test from 'node:test'

import { VISUAL_ASSETS, visualForChoice, visualForQuestion, visualKeyForCompetency } from '../src/lib/visual-assets.js'

test('shape and solid choices resolve to centralized visual assets', () => {
  assert.equal(visualForChoice('square'), VISUAL_ASSETS.square)
  assert.equal(visualForChoice('Half-Circle'), VISUAL_ASSETS.halfCircle)
  assert.equal(visualForChoice('one whole circle'), VISUAL_ASSETS.circle)
  assert.equal(visualForChoice('cube'), VISUAL_ASSETS.cube)
  assert.equal(visualForChoice('not a shape'), null)
})

test('familiar Filipino contexts resolve without guessing the answer', () => {
  assert.equal(
    visualForQuestion('Which basic shape best models the face of a classroom door?'),
    VISUAL_ASSETS.classroomDoor,
  )
  assert.equal(visualForQuestion('A triangular banderitas has how many sides?'), VISUAL_ASSETS.banderitasTriangle)
  assert.equal(visualForQuestion('A whole bilao is circular.'), VISUAL_ASSETS.bilao)
  assert.equal(visualForQuestion('What is 7 + 5?'), null)
  assert.equal(visualForQuestion('Continue the count: 28, 30, 32, __, __.'), VISUAL_ASSETS.skipCounting)
  assert.equal(visualForQuestion('At the sari-sari store, add the amounts.'), VISUAL_ASSETS.sariSariStore)
})

test('the expanded number-sense pack is centrally registered', () => {
  const expected = [
    'jeepney', 'equalSharingCupcakes', 'sariSariStore', 'gardenRowsIllustrated',
    'countingTen', 'skipCounting', 'tensOnes', 'numberModel', 'compareNumbers',
    'orderingCards', 'ordinalLine', 'numberBond', 'patternStrip',
    'additionTenFrame', 'subtractionTakeaway', 'commutativeAddition',
    'numberSentence', 'multiplicationArray', 'missingFactor', 'evenOdd',
    'elapsedTime', 'numberTools',
  ]

  for (const key of expected) assert.ok(VISUAL_ASSETS[key], `${key} is not registered`)
})

test('every registered UI visual exists under public', async () => {
  await Promise.all(
    Object.values(VISUAL_ASSETS).map(({ src }) => access(new URL(`../public${src}`, import.meta.url))),
  )
})

test('every in-scope competency has an example visual', async () => {
  for (const grade of [4, 5, 6]) {
    const curriculum = (await import(`../src/curriculum/grade${grade}.json`, { with: { type: 'json' } })).default
    for (const competency of curriculum) {
      const key = visualKeyForCompetency(competency)
      assert.ok(VISUAL_ASSETS[key], `${competency.ref} has no registered example visual`)
    }
  }
})
