import test from 'node:test'
import assert from 'node:assert/strict'
import { runTutorChain } from '../src/lib/tutor-chain.js'

function memoryStore() {
  const m = new Map()
  return { get: async (k) => m.get(k), set: async (k, v) => void m.set(k, v), m }
}
const floor = () => ({ text: 'floor', source: 'cached', fromCache: false })
const provider = (source, run, available = async () => true) => ({ source, available, run })
const base = { cacheKey: 'k', mode: 'none', lang: 'en', floor }

test('the first available provider answers and the reply is cached', async () => {
  const store = memoryStore()
  const r = await runTutorChain({ ...base, store, providers: [provider('local', async () => 'Add the ones.')] })
  assert.deepEqual(r, { text: 'Add the ones.', source: 'local', fromCache: false })
  assert.equal(store.m.get('k').source, 'local')
})

test('a cached reply is returned without calling any provider', async () => {
  const store = memoryStore()
  await store.set('k', { text: 'old', source: 'online' })
  const r = await runTutorChain({ ...base, store, providers: [provider('local', async () => assert.fail('called'))] })
  assert.deepEqual(r, { text: 'old', source: 'online', fromCache: true })
})

test('unavailable, throwing and invalid providers fall through in order', async () => {
  const r = await runTutorChain({
    ...base,
    store: memoryStore(),
    providers: [
      provider('nano', async () => 'x', async () => false),
      provider('local', async () => { throw new Error('boom') }),
      provider('local2', async () => '<think>only</think>'),
      provider('online', async () => 'Use place value.'),
    ],
  })
  assert.equal(r.source, 'online')
  assert.equal(r.text, 'Use place value.')
})

test('mode rules are applied to every provider', async () => {
  const r = await runTutorChain({
    ...base,
    mode: 'kalma',
    store: memoryStore(),
    providers: [provider('local', async () => 'One! Two. Three.')],
  })
  assert.equal(r.text, 'One. Two.')
})

test('the floor is returned and not cached when every provider fails', async () => {
  const store = memoryStore()
  const r = await runTutorChain({ ...base, store, providers: [provider('local', async () => '')] })
  assert.equal(r.source, 'cached')
  assert.equal(store.m.size, 0)
})
