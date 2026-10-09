import test from 'node:test'
import assert from 'node:assert/strict'
import { fetchCloudAudio } from '../src/lib/speech.js'

const HUB = 'https://gabay-hub.example.ngrok-free.app'
const AUDIO = new Uint8Array([0x49, 0x44, 0x33, 1, 2, 3])

const audio = (init = {}) =>
  new Response(AUDIO, { status: 200, headers: { 'content-type': 'audio/mpeg' }, ...init })

// Records every request and answers with `reply(url, init)`.
function fakeFetch(reply) {
  const calls = []
  const fetchImpl = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) })
    return reply(url, init)
  }
  return { fetchImpl, calls }
}

test('a hub base routes the request to the hub and sends the ngrok header', async () => {
  const { fetchImpl, calls } = fakeFetch(() => audio())
  const blob = await fetchCloudAudio('Kumusta po!', 'taglish', { fetchImpl, resolveBase: async () => HUB })

  assert.ok(blob instanceof Blob)
  assert.equal(blob.size, AUDIO.length)
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, `${HUB}/api/tts`)
  assert.equal(calls[0].init.method, 'POST')
  assert.equal(calls[0].init.headers['ngrok-skip-browser-warning'], '1')
  assert.equal(calls[0].init.headers['Content-Type'], 'application/json')
  assert.deepEqual(calls[0].body, { text: 'Kumusta po!', lang: 'taglish' })
})

test('a same-origin hub (empty base) still uses /api/tts with the header', async () => {
  const { fetchImpl, calls } = fakeFetch(() => audio())
  const blob = await fetchCloudAudio('Sige.', 'fil', { fetchImpl, resolveBase: async () => '' })

  assert.ok(blob)
  assert.equal(calls[0].url, '/api/tts')
  assert.equal(calls[0].init.headers['ngrok-skip-browser-warning'], '1')
})

test('no hub base falls back to this host\'s own /api/tts, without the ngrok header', async () => {
  const { fetchImpl, calls } = fakeFetch(() => audio())
  const blob = await fetchCloudAudio('Sige.', 'en', { fetchImpl, resolveBase: async () => null })

  assert.ok(blob)
  assert.equal(calls[0].url, '/api/tts') // API_BASE is empty outside a Vite build
  assert.equal('ngrok-skip-browser-warning' in calls[0].init.headers, false)
  assert.deepEqual(calls[0].body, { text: 'Sige.', lang: 'en' })
})

test('a failing base lookup still tries this host instead of throwing', async () => {
  const { fetchImpl, calls } = fakeFetch(() => audio())
  const blob = await fetchCloudAudio('Sige.', 'en', {
    fetchImpl,
    resolveBase: async () => {
      throw new Error('storage unavailable')
    },
  })

  assert.ok(blob)
  assert.equal(calls[0].url, '/api/tts')
})

test('a 501 (voice not configured) resolves null so the caller uses speechSynthesis', async () => {
  const { fetchImpl } = fakeFetch(() => Response.json({ error: 'tts_unconfigured' }, { status: 501 }))
  assert.equal(await fetchCloudAudio('Sige.', 'fil', { fetchImpl, resolveBase: async () => HUB }), null)
})

test('a 502 from the hub resolves null', async () => {
  const { fetchImpl } = fakeFetch(() => Response.json({ error: 'tts_failed' }, { status: 502 }))
  assert.equal(await fetchCloudAudio('Sige.', 'fil', { fetchImpl, resolveBase: async () => HUB }), null)
})

test('a 200 that is not audio (for example an ngrok warning page) resolves null', async () => {
  const { fetchImpl } = fakeFetch(
    () => new Response('<html>ngrok warning</html>', { status: 200, headers: { 'content-type': 'text/html' } }),
  )
  assert.equal(await fetchCloudAudio('Sige.', 'fil', { fetchImpl, resolveBase: async () => HUB }), null)
})

test('an empty audio body resolves null', async () => {
  const { fetchImpl } = fakeFetch(
    () => new Response(new Uint8Array(0), { status: 200, headers: { 'content-type': 'audio/mpeg' } }),
  )
  assert.equal(await fetchCloudAudio('Sige.', 'fil', { fetchImpl, resolveBase: async () => HUB }), null)
})

test('a network error resolves null and never throws', async () => {
  const fetchImpl = async () => {
    throw new TypeError('fetch failed')
  }
  assert.equal(await fetchCloudAudio('Sige.', 'fil', { fetchImpl, resolveBase: async () => HUB }), null)
})

test('a stalled hub is aborted by the timeout and resolves null', async () => {
  const fetchImpl = (url, init) =>
    new Promise((resolve, reject) => {
      init.signal.addEventListener('abort', () => reject(init.signal.reason))
    })
  const started = Date.now()
  const result = await fetchCloudAudio('Sige.', 'fil', { fetchImpl, resolveBase: async () => HUB, timeoutMs: 40 })

  assert.equal(result, null)
  assert.ok(Date.now() - started < 5_000)
})
