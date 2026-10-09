import test from 'node:test'
import assert from 'node:assert/strict'
import { ONBOARDING_STEPS, screenAfterSplash } from '../src/lib/onboarding-flow.js'
import { thinkingClass } from '../src/lib/thinking.js'
import { t } from '../src/lib/i18n.js'

test('a returning learner with a name skips onboarding; a new one starts it', () => {
  assert.equal(screenAfterSplash('Ana'), 'home')
  assert.equal(screenAfterSplash(undefined), 'onboarding')
  assert.equal(screenAfterSplash(''), 'onboarding')
})

test('the step counter reads the real number of steps in every language', () => {
  assert.equal(ONBOARDING_STEPS, 5)
  for (const lang of ['en', 'fil', 'taglish']) {
    const label = t('onboarding.step', lang, { step: 3, total: ONBOARDING_STEPS })
    assert.match(label, /3/)
    assert.match(label, /5/)
    assert.ok(!label.includes('{'), label)
  }
})

test('the thinking indicator is calm in Kalma and has text in every language', () => {
  assert.equal(thinkingClass('kalma'), 'gb-thinking is-calm')
  for (const mode of ['none', 'pakinig', 'hakbang', undefined]) assert.equal(thinkingClass(mode), 'gb-thinking')
  for (const lang of ['en', 'fil', 'taglish']) assert.match(t('class.thinking', lang), /Teacher Gabo/)
})
