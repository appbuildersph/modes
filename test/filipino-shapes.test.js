import assert from 'node:assert/strict'
import test from 'node:test'

import { localizeChoice } from '../src/lib/i18n.js'

test('Filipino shape choices are translated without changing stored answers', () => {
  assert.equal(localizeChoice('square', 'fil'), 'parisukat')
  assert.equal(localizeChoice('triangle', 'fil'), 'tatsulok')
  assert.equal(localizeChoice('rectangle', 'fil'), 'parihaba')
  assert.equal(localizeChoice('circle', 'fil'), 'bilog')
  assert.equal(localizeChoice('True', 'fil'), 'Tama')
  assert.equal(localizeChoice('3 sides and 3 corners', 'fil'), '3 gilid at 3 sulok')
  assert.equal(localizeChoice('two triangles', 'fil'), 'dalawang tatsulok')
  assert.equal(localizeChoice('4', 'fil'), '4')
})
