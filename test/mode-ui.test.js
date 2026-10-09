import test from 'node:test'
import assert from 'node:assert/strict'
import { modeUi } from '../src/lib/mode-ui.js'

test('standard mode keeps today\'s behaviour', () => {
  const ui = modeUi('none')
  assert.equal(ui.music, true)
  assert.equal(ui.celebrate, true)
  assert.equal(ui.autoRead, false)
  assert.equal(ui.bigSteps, false)
})

test('kalma turns off music, flash, shake and sound effects and shows the counter', () => {
  const ui = modeUi('kalma')
  assert.equal(ui.music, false)
  assert.equal(ui.celebrate, false)
  assert.equal(ui.shake, false)
  assert.equal(ui.sfx, false)
  assert.equal(ui.questionCounter, true)
})

test('pakinig reads aloud with highlighting at a slower rate; hakbang enlarges steps', () => {
  assert.equal(modeUi('pakinig').autoRead, true)
  assert.equal(modeUi('pakinig').highlight, true)
  assert.equal(modeUi('pakinig').readRate, 0.8)
  assert.equal(modeUi('hakbang').bigSteps, true)
})

test('unknown modes fall back to standard', () => {
  assert.deepEqual(modeUi('bogus'), modeUi('none'))
  assert.deepEqual(modeUi(undefined), modeUi('none'))
})
