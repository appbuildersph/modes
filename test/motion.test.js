import test from 'node:test'
import assert from 'node:assert/strict'
import { motionProfile, sectionDelay, SPRING } from '../src/lib/motion.js'

test('reduced motion turns every animation off', () => {
  assert.equal(motionProfile('none', true).enabled, false)
  assert.equal(motionProfile('kalma', true).enabled, false)
})

test('kalma gets soft fades with no overshoot, stagger or squash-and-stretch', () => {
  const p = motionProfile('kalma')
  assert.equal(p.bounce, false)
  assert.ok(p.press.release.every((s) => s <= 1))
  assert.equal(p.section.max, 0)
  assert.notEqual(p.screen.easing, SPRING)
  assert.equal(p.pop.from, 1)
})

test('other modes bounce: release overshoots past 1 and entrances use the spring', () => {
  for (const mode of ['none', 'pakinig', 'hakbang']) {
    const p = motionProfile(mode)
    assert.equal(p.bounce, true)
    assert.ok(Math.max(...p.press.release) > 1)
    assert.equal(p.press.release.at(-1), 1)
    assert.equal(p.section.easing, SPRING)
  }
})

test('section stagger is capped so long screens settle quickly', () => {
  const p = motionProfile('none')
  assert.equal(sectionDelay(0, p), 70)
  assert.equal(sectionDelay(50, p), sectionDelay(p.section.max, p))
  assert.ok(sectionDelay(50, p) < 1000)
})
