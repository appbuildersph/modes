import test from 'node:test'
import assert from 'node:assert/strict'
import { edgeAvailable, edgeTutor, rememberEdgeBase, resolveEdgeBase, resetEdgeProbe, EDGE_BASE_KEY } from '../src/lib/edge-llm.js'
import { applyMode } from '../src/lib/tutor-modes.js'

function memoryStore(initial = {}) {
  const m = new Map(Object.entries(initial))
  return { get: async (k) => m.get(k), set: async (k, v) => void m.set(k, v), m }
}
const hang = (_u, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('timeout'))))

test('edgeAvailable pings /api/tutor host with the ngrok header', async () => {
  let call
  const fetchImpl = async (url, init) => { call = { url, init }; return { ok: true, status: 204 } }
  assert.equal(await edgeAvailable({ fetchImpl, base: 'https://hub.example' }), true)
  assert.equal(call.url, 'https://hub.example/api/ping')
  assert.equal(call.init.headers['ngrok-skip-browser-warning'], '1')
})

test('edgeAvailable is false on http errors, network errors, timeouts and no base', async () => {
  assert.equal(await edgeAvailable({ fetchImpl: async () => ({ ok: false }), base: '' }), false)
  assert.equal(await edgeAvailable({ fetchImpl: async () => { throw new Error('down') }, base: '' }), false)
  assert.equal(await edgeAvailable({ fetchImpl: hang, base: '', timeoutMs: 20 }), false)
  assert.equal(await edgeAvailable({ fetchImpl: async () => assert.fail('called'), base: null }), false)
})

test('edgeTutor posts question, ref, lang and mode, and returns the text', async () => {
  let call
  const fetchImpl = async (url, init) => {
    call = { url, init, body: JSON.parse(init.body) }
    return { ok: true, json: async () => ({ text: 'Add the ones.', source: 'edge' }) }
  }
  const text = await edgeTutor({ question: 'q', ref: 'r', lang: 'fil', mode: 'kalma', fetchImpl, base: '' })
  assert.equal(text, 'Add the ones.')
  assert.equal(call.url, '/api/tutor')
  assert.deepEqual(call.body, { question: 'q', ref: 'r', lang: 'fil', mode: 'kalma' })
  assert.equal(call.init.headers['ngrok-skip-browser-warning'], '1')
})

test('edgeTutor throws on http errors, timeouts and no base, and returns empty for missing text', async () => {
  const args = { question: 'q', ref: 'r', lang: 'en', mode: 'none' }
  await assert.rejects(edgeTutor({ ...args, fetchImpl: async () => ({ ok: false }), base: '' }))
  await assert.rejects(edgeTutor({ ...args, fetchImpl: hang, base: '', timeoutMs: 20 }))
  await assert.rejects(edgeTutor({ ...args, fetchImpl: async () => assert.fail('called'), base: null }))
  assert.equal(await edgeTutor({ ...args, fetchImpl: async () => ({ ok: true, json: async () => ({}) }), base: '' }), '')
})

test('?edge=<url> is remembered once and ignored when it is not http(s)', async () => {
  const store = memoryStore()
  assert.equal(await rememberEdgeBase({ search: '?edge=https://hub.example/', store }), 'https://hub.example')
  assert.equal(store.m.get(EDGE_BASE_KEY), 'https://hub.example')
  const other = memoryStore()
  assert.equal(await rememberEdgeBase({ search: '?edge=javascript:alert(1)', store: other }), null)
  assert.equal(await rememberEdgeBase({ search: '', store: other }), null)
  assert.equal(other.m.size, 0)
})

test('base resolves from stored override, then localhost, then env, else null', async () => {
  const stored = memoryStore({ [EDGE_BASE_KEY]: 'https://stored.example' })
  assert.equal(await resolveEdgeBase({ store: stored, env: { VITE_EDGE_BASE: 'https://env.example' }, hostname: 'localhost' }), 'https://stored.example')
  assert.equal(await resolveEdgeBase({ store: memoryStore(), env: { VITE_EDGE_BASE: 'https://env.example/' }, hostname: 'x.com' }), 'https://env.example')
  assert.equal(await resolveEdgeBase({ store: memoryStore(), env: {}, hostname: 'localhost' }), '')
  // A Vercel build (ngrok base baked in) served by the hub on localhost must use the hub itself.
  assert.equal(await resolveEdgeBase({ store: memoryStore(), env: { VITE_EDGE_BASE: 'https://env.example' }, hostname: 'localhost' }), '')
  assert.equal(await resolveEdgeBase({ store: memoryStore(), env: { VITE_EDGE_BASE: 'https://env.example' }, hostname: '127.0.0.1' }), '')
  assert.equal(await resolveEdgeBase({ store: memoryStore(), env: {}, hostname: '127.0.0.1' }), '')
  assert.equal(await resolveEdgeBase({ store: memoryStore(), env: {}, hostname: 'app.example.com', fetchImpl: async () => ({ ok: false }) }), null)
})

test('mode fixes: pakinig caps at four sentences, labels and greetings are stripped', () => {
  assert.equal(applyMode('pakinig', 'en', 'One. Two. Three. Four. Five.'), 'One. Two. Three. Four.')
  assert.equal(applyMode('hakbang', 'en', 'Add the ones. Check question: Do you see it?'), 'Add the ones. Do you see it?')
  assert.equal(applyMode('none', 'en', 'Hello! Add the ones first.'), 'Add the ones first.')
  assert.equal(applyMode('none', 'en', 'Hello!'), 'Hello!')
})

const probe = (fetchImpl) => resolveEdgeBase({ store: memoryStore(), env: {}, hostname: 'tunnel.example', fetchImpl })

test('a same-origin server that sends X-Edge-Hub: 1 is used as the hub', async () => {
  resetEdgeProbe()
  let call
  const fetchImpl = async (url, init) => { call = { url, init }; return { ok: true, headers: new Headers({ 'x-edge-hub': '1' }) } }
  assert.equal(await probe(fetchImpl), '')
  assert.equal(call.url, '/api/ping')
  assert.equal(call.init.headers['ngrok-skip-browser-warning'], '1')
})

test('a plain deployment without the header, or a failed probe, is not a hub', async () => {
  resetEdgeProbe()
  assert.equal(await probe(async () => ({ ok: true, headers: new Headers() })), null)
  assert.equal(await probe(async () => ({ ok: true, headers: new Headers({ 'x-edge-hub': '0' }) })), null)
  assert.equal(await probe(async () => ({ ok: false, headers: new Headers({ 'x-edge-hub': '1' }) })), null)
  assert.equal(await probe(async () => { throw new Error('down') }), null)
  assert.equal(await probe(hang), null)
})

test('a positive probe is cached for the page load, a negative one is not', async () => {
  resetEdgeProbe()
  let calls = 0
  const hub = async () => { calls++; return { ok: true, headers: new Headers({ 'x-edge-hub': '1' }) } }
  assert.equal(await probe(hub), '')
  assert.equal(await probe(hub), '')
  assert.equal(calls, 1)
  resetEdgeProbe()
  let tries = 0
  const flaky = async () => { tries++; return tries === 1 ? { ok: false } : { ok: true, headers: new Headers({ 'x-edge-hub': '1' }) } }
  assert.equal(await probe(flaky), null)
  assert.equal(await probe(flaky), '')
})
