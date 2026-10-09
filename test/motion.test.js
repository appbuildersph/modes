import test from 'node:test'
import assert from 'node:assert/strict'
import { motionProfile, sectionDelay, springEasing, SPRING } from '../src/lib/motion.js'

test('reduced motion turns every animation off', () => {
  assert.equal(motionProfile('none', true).enabled, false)
  assert.equal(motionProfile('kalma', true).enabled, false)
})

test('kalma gets soft fades with no overshoot, stagger or squash-and-stretch', () => {
  const p = motionProfile('kalma')
  assert.equal(p.bounce, false)
  assert.equal(p.section.max, 0)
  assert.equal(p.pop.from, 1)
  assert.ok(!p.screen.easing.startsWith('linear('))
  assert.notEqual(p.screen.easing, SPRING)
})

test('other modes bounce on a sampled spring curve', () => {
  for (const mode of ['none', 'pakinig', 'hakbang']) {
    const p = motionProfile(mode)
    assert.equal(p.bounce, true)
    assert.ok(p.press.release.easing.startsWith('linear('))
    assert.ok(p.section.easing.startsWith('linear('))
  }
})

test('without CSS linear() support the cubic-bezier spring is used instead', () => {
  const p = motionProfile('none', false, false)
  assert.equal(p.press.release.easing, SPRING)
  assert.equal(p.section.easing, SPRING)
})

test('spring curve starts at 0, ends exactly at 1, overshoots once and stays smooth', () => {
  const s = springEasing(38, 0.3)
  const stops = s.easing.slice(7, -1).split(', ').map(Number)
  assert.equal(stops[0], 0)
  assert.equal(stops.at(-1), 1)
  assert.ok(s.peak > 1.2 && s.peak < 1.45, `peak ${s.peak}`)
  // Fine enough that no single sample jumps more than a fifth of the travel.
  for (let i = 1; i < stops.length; i++) assert.ok(Math.abs(stops[i] - stops[i - 1]) < 0.2)
  assert.ok(s.ms > 300 && s.ms < 700, `ms ${s.ms}`)
})

test('section stagger is capped so long screens settle quickly', () => {
  const p = motionProfile('none')
  assert.equal(sectionDelay(0, p), 70)
  assert.equal(sectionDelay(50, p), sectionDelay(p.section.max, p))
  assert.ok(sectionDelay(50, p) < 1000)
})
