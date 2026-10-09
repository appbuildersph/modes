import test from 'node:test'
import assert from 'node:assert/strict'
import { loadMode, saveMode } from '../src/lib/mode-pref.js'

// idb-keyval needs IndexedDB, which Node lacks: loadMode must fall back to the
// default instead of throwing, and saveMode must ignore unknown modes.
test('loadMode falls back to none when storage is unavailable', async () => {
  assert.equal(await loadMode(), 'none')
})

test('saveMode ignores unknown modes without touching storage', async () => {
  await saveMode('bogus')
})
