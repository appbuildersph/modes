import test from 'node:test'
import assert from 'node:assert/strict'
import { getAllContent } from '../src/lib/content-catalog.js'
import { topicFull, topicTitle, topicTitleLocalized } from '../src/lib/topics.js'

test('every curriculum topic has a concise one-to-three-word title', () => {
  for (const competency of getAllContent()) {
    const title = topicTitle(competency.ref, competency.competency)
    const wordCount = title.trim().split(/\s+/).length
    assert.ok(wordCount >= 1 && wordCount <= 3, `${competency.ref}: ${title}`)
    assert.notEqual(title, competency.competency)
    assert.doesNotMatch(title, /\b(?:Any \d|Of Two|Two Numbers)\b/, `${competency.ref}: ${title}`)
  }
})

test('representative competencies receive clear topic labels', () => {
  assert.equal(topicTitle('1MG-Ia-1', 'Identify simple 2-dimensional shapes.'), '2D Shapes')
  assert.equal(topicTitle('1NA-Id-1', 'Recognize and represent numbers up to 100 using pictorial models.'), 'Number Models')
  assert.equal(topicTitle('6SP-IIIg-1', 'Interpret data presented in a pie graph.'), 'Reading Pie Graphs')
})

test('ambiguous competency wording is labeled by its primary skill', () => {
  assert.equal(topicTitle('1NA-IIc-1', 'Decompose any 2-digit number into tens and ones.'), 'Tens and Ones')
  assert.equal(topicTitle('2NA-IIIc-1', 'Illustrate division as repeated subtraction.'), 'Division')
  assert.equal(topicTitle('4NA-IIg-1', 'Represent dissimilar fractions using models.'), 'Modeling Dissimilar Fractions')
  assert.equal(topicTitle('5NA-IIc-1', 'Solve problems involving addition and subtraction of decimals.'), 'Decimal Operation Problems')
  assert.equal(topicTitle('6MG-IIIb-2', 'Approximate pi as the ratio of circumference to diameter.'), 'Understanding Pi')
  assert.equal(topicTitle('5MG-IIIi-1', 'Solve problems involving the surface area of solid figures.'), 'Surface Area Problems')
})

test('Grade 4-6 lessons have distinct titles within each category', () => {
  const seen = new Map()
  for (const competency of getAllContent().filter(({ ref }) => /^[456]/.test(ref))) {
    const title = topicTitle(competency.ref, competency.competency)
    const grade = competency.ref.match(/^\d+/)?.[0]
    const key = `${grade}::${competency.domain}::${title}`
    assert.ok(!seen.has(key), `${competency.ref} duplicates ${seen.get(key)} as ${title}`)
    seen.set(key, competency.ref)
  }
})

test('Filipino mode localizes learner-facing Grade 1 topic labels', () => {
  assert.equal(topicTitleLocalized('1NA-Ia-1', 'Count up to 100.', 'fil'), 'Pagbilang ng mga Numero')
  assert.equal(topicTitleLocalized('1MG-Ia-3', 'Compose and decompose triangles, squares, and rectangles.', 'fil'), 'Pagbuo ng mga Hugis')
  assert.equal(
    topicFull('1MG-Ia-3', 'Compose and decompose triangles, squares, and rectangles.', 'Measurement and Geometry', 'fil'),
    'Pagsukat at Heometriya – Pagbuo ng mga Hugis',
  )
})
