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

test('the learning mode is sent in the request body so the server can pick the voice', async () => {
  for (const mode of ['kalma', 'pakinig', 'hakbang']) {
    const { fetchImpl, calls } = fakeFetch(() => audio())
    await fetchCloudAudio('Sige.', 'fil', { fetchImpl, resolveBase: async () => HUB, mode })
    assert.deepEqual(calls[0].body, { text: 'Sige.', lang: 'fil', mode })
  }
})

test('no mode, or "none", keeps the original {text, lang} body', async () => {
  for (const mode of [undefined, 'none']) {
    const { fetchImpl, calls } = fakeFetch(() => audio())
    await fetchCloudAudio('Sige.', 'fil', { fetchImpl, resolveBase: async () => HUB, mode })
    assert.deepEqual(calls[0].body, { text: 'Sige.', lang: 'fil' })
  }
})

// --- word timing helper (read-aloud highlighting follows the audio clock) ---------
import { wordStartTimes, wordIndexAtTime } from '../src/lib/speech.js'

test('wordStartTimes spreads the audio duration over the words, in order', () => {
  const words = ['Magaling', 'ka', 'talaga', 'ngayon']
  const starts = wordStartTimes(words, 8)
  assert.equal(starts.length, words.length)
  assert.equal(starts[0], 0)
  for (let i = 1; i < starts.length; i++) assert.ok(starts[i] > starts[i - 1])
  assert.ok(starts.at(-1) < 8) // the last word starts before the end
})

test('longer words get more time, and a sentence pause pushes the next word later', () => {
  const [a, b, c] = wordStartTimes(['po', 'kumusta', 'po'], 6)
  assert.ok(c - b > b - a) // 'kumusta' takes longer than 'po'
  const plain = wordStartTimes(['Hello', 'po'], 4)
  const pause = wordStartTimes(['Hello.', 'po'], 4)
  assert.ok(pause[1] > plain[1]) // the full stop leaves room before the next word
})

test('the schedule scales with the duration and is independent of any playback rate', () => {
  const words = ['Isa', 'dalawa', 'tatlo']
  const short = wordStartTimes(words, 3)
  const long = wordStartTimes(words, 6)
  short.forEach((t, i) => assert.ok(Math.abs(long[i] - t * 2) < 1e-9))
})

test('wordStartTimes gives no schedule for no words or an unusable duration', () => {
  assert.deepEqual(wordStartTimes([], 5), [])
  for (const d of [0, -1, NaN, Infinity, undefined]) assert.deepEqual(wordStartTimes(['a', 'b'], d), [])
})

test('wordIndexAtTime picks the last word whose start has passed', () => {
  const starts = [0, 1, 2.5]
  assert.equal(wordIndexAtTime(starts, 0), 0)
  assert.equal(wordIndexAtTime(starts, 0.99), 0)
  assert.equal(wordIndexAtTime(starts, 1), 1)
  assert.equal(wordIndexAtTime(starts, 2.49), 1)
  assert.equal(wordIndexAtTime(starts, 99), 2)
  assert.equal(wordIndexAtTime(starts, -1), 0)
  assert.equal(wordIndexAtTime([], 1), -1)
})
