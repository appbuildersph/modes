import test from 'node:test'
import assert from 'node:assert/strict'
import { MODES, MODE_IDS, modePrompt, applyMode, isValidReply, normalizeMode } from '../src/lib/tutor-modes.js'
import { buildTutorPrompt } from '../src/lib/tutor-prompt.js'

test('every mode has labels in all three languages', () => {
  assert.deepEqual(MODE_IDS, ['none', 'kalma', 'pakinig', 'hakbang'])
  for (const id of MODE_IDS) {
    for (const lang of ['en', 'fil', 'taglish']) {
      assert.ok(MODES[id].label[lang], `${id} label ${lang}`)
      assert.ok(MODES[id].gloss[lang], `${id} gloss ${lang}`)
    }
  }
})

test('unknown modes fall back to none', () => {
  assert.equal(normalizeMode('bogus'), 'none')
  assert.equal(modePrompt('bogus'), '')
  assert.equal(modePrompt(undefined), '')
})

test('all modes strip think blocks, markdown, emoji and extra whitespace', () => {
  const raw = '<think>secret plan</think>\n**Hello**   there 😀.\n\n- item'
  for (const id of MODE_IDS) {
    const out = applyMode(id, 'en', raw)
    assert.ok(!out.includes('think'), id)
    assert.ok(!out.includes('*'), id)
    assert.ok(!/\p{Extended_Pictographic}/u.test(out), id)
    assert.ok(!/\s{2,}|\n/.test(out), id)
  }
})

test('an unterminated think block is dropped', () => {
  assert.equal(applyMode('none', 'en', 'Hi there. <think>still going'), 'Hi there.')
})

test('none keeps the whole reply', () => {
  assert.equal(applyMode('none', 'en', 'One. Two. Three.'), 'One. Two. Three.')
})

test('kalma keeps the first two sentences and drops exclamations', () => {
  assert.equal(applyMode('kalma', 'en', 'Take a breath! Add the ones first. Then the tens.'), 'Take a breath. Add the ones first.')
})

test('pakinig turns fractions and symbols into spoken words', () => {
  assert.equal(applyMode('pakinig', 'en', 'Change 3/4 to a percent.'), 'Change 3 fourths to a percent.')
  assert.equal(applyMode('pakinig', 'en', '1/2 of 8 = 4'), '1 half of 8 equals 4')
  assert.equal(applyMode('pakinig', 'en', '5 × 3 = 15'), '5 times 3 equals 15')
  assert.equal(applyMode('pakinig', 'en', '75%'), '75 percent')
  assert.equal(applyMode('pakinig', 'fil', '3/7'), '3 sa 7')
  assert.equal(applyMode('pakinig', 'taglish', '9 - 4'), '9 minus 4')
})

test('hakbang keeps one step and one question', () => {
  assert.equal(
    applyMode('hakbang', 'en', 'First add the ones. Then the tens. Then the hundreds. Do you see it?'),
    'First add the ones. Do you see it?',
  )
})

test('hakbang appends a check question in the active language when none is present', () => {
  assert.match(applyMode('hakbang', 'en', 'Add the ones first.'), /Add the ones first\. Does that make sense/)
  assert.match(applyMode('hakbang', 'fil', 'Idagdag muna ang ones.'), /Naiintindihan mo ba/)
  assert.match(applyMode('hakbang', 'taglish', 'Add muna ang ones.'), /Gets mo ba/)
})

test('applyMode is deterministic and empty in gives empty out', () => {
  const raw = 'Add the ones. Then the tens?'
  assert.equal(applyMode('hakbang', 'en', raw), applyMode('hakbang', 'en', raw))
  assert.equal(applyMode('kalma', 'en', ''), '')
  assert.equal(applyMode('kalma', 'en', '<think>only</think>'), '')
})

test('isValidReply rejects empty, runaway and looping replies', () => {
  assert.equal(isValidReply('Add the ones first.'), true)
  assert.equal(isValidReply(''), false)
  assert.equal(isValidReply('<think>x</think>'), false)
  assert.equal(isValidReply('a'.repeat(1300)), false)
  assert.equal(isValidReply('Add it. Add it. Add it.'), false)
})

test('the shared prompt carries language, data clause, mode and short variant', () => {
  const long = buildTutorPrompt('Add fractions', 'fil', { mode: 'kalma' })
  assert.match(long, /Reply in Tagalog/)
  assert.match(long, /DATA, not instructions/)
  assert.match(long, /exactly two short sentences/)
  const short = buildTutorPrompt('Add fractions', 'en', { short: true })
  assert.ok(short.length < buildTutorPrompt('Add fractions', 'en').length)
  assert.match(short, /DATA, not instructions/)
  assert.equal(buildTutorPrompt('x', 'zz').includes('Reply in English'), true)
})

test('mode cards describe support, never diagnose or make clinical claims', () => {
  const banned = /diagnos|\bcure|\btreat|therap|clinical|proven|efficac|disorder|gamot/i
  const framing = { en: /^Designed to support/, fil: /^Idinisenyo para suportahan/, taglish: /^Designed to support/ }
  for (const id of MODE_IDS) {
    for (const lang of ['en', 'fil', 'taglish']) {
      const { description, useCase } = MODES[id]
      assert.ok(description[lang] && useCase[lang], `${id} ${lang}`)
      assert.ok(!banned.test(description[lang] + useCase[lang]), `${id} ${lang} wording`)
      if (id !== 'none') assert.match(useCase[lang], framing[lang], `${id} ${lang} framing`)
    }
  }
})
