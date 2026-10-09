import { test } from 'node:test'
import assert from 'node:assert/strict'
import { stripMarkdown } from '../src/lib/strip-markdown.js'

test('strips **bold** markers, preserving text', () => {
  assert.equal(
    stripMarkdown('**Acute angle** is less than 90 degrees.'),
    'Acute angle is less than 90 degrees.',
  )
})

test('strips *italic* markers, preserving text', () => {
  assert.equal(
    stripMarkdown('An *acute* angle measures less than 90 degrees.'),
    'An acute angle measures less than 90 degrees.',
  )
})

test('strips __bold__ markers', () => {
  assert.equal(stripMarkdown('__Important__: always measure carefully.'), 'Important: always measure carefully.')
})

test('strips _italic_ markers', () => {
  assert.equal(stripMarkdown('Use a _protractor_ to measure.'), 'Use a protractor to measure.')
})

test('strips `inline code` markers', () => {
  assert.equal(stripMarkdown('The formula is `a + b = c`.'), 'The formula is a + b = c.')
})

test('strips # header prefixes', () => {
  assert.equal(stripMarkdown('## Angle Types\nAngles can be acute, right, or obtuse.'), 'Angle Types\nAngles can be acute, right, or obtuse.')
})

test('strips - bullet list markers', () => {
  assert.equal(
    stripMarkdown('- Acute: less than 90\n- Right: exactly 90\n- Obtuse: more than 90'),
    'Acute: less than 90\nRight: exactly 90\nObtuse: more than 90',
  )
})

test('strips * bullet list markers', () => {
  assert.equal(
    stripMarkdown('* Acute angle\n* Right angle'),
    'Acute angle\nRight angle',
  )
})

test('strips numbered list markers', () => {
  assert.equal(
    stripMarkdown('1. Look at the angle.\n2. Compare to 90 degrees.'),
    'Look at the angle.\nCompare to 90 degrees.',
  )
})

test('handles mixed markdown in one AI response', () => {
  const input = '## Angle Types\n**Acute** angles are *less than* 90 degrees.\n- Use a protractor\n- Compare to a corner'
  const output = stripMarkdown(input)
  assert.ok(!output.includes('**'), 'no ** remaining')
  assert.ok(!output.includes('*'), 'no * remaining')
  assert.ok(!output.includes('##'), 'no ## remaining')
  assert.ok(!output.includes('- '), 'no bullet remaining')
  assert.ok(output.includes('Acute'), 'text preserved')
  assert.ok(output.includes('less than'), 'text preserved')
})

test('returns empty string for null/undefined', () => {
  assert.equal(stripMarkdown(null), '')
  assert.equal(stripMarkdown(undefined), '')
})

test('leaves plain text unchanged', () => {
  const plain = 'An acute angle is less than 90 degrees.'
  assert.equal(stripMarkdown(plain), plain)
})

test('trims leading/trailing whitespace', () => {
  assert.equal(stripMarkdown('  hello world  '), 'hello world')
})
