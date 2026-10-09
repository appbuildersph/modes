import test, { beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import handler, { MODE_VOICE } from '../api/tts.js'

// A fake key: these tests never touch the real ElevenLabs account or .env.
const FAKE_KEY = 'test-key-not-a-real-secret'
const VOICE = 'VoiceId123'
const MP3 = Buffer.from([0x49, 0x44, 0x33, 1, 2, 3, 4])
const ENV_KEYS = [
  'TTS_PROVIDER', 'ELEVENLABS_API_KEY', 'ELEVENLABS_VOICE_ID', 'ELEVENLABS_MODEL',
  'ELEVENLABS_TIMEOUT_MS', 'GCP_SA_KEY',
  'ELEVENLABS_VOICE_ID_KALMA', 'ELEVENLABS_VOICE_ID_PAKINIG', 'ELEVENLABS_VOICE_ID_HAKBANG',
]

const realFetch = globalThis.fetch
const savedEnv = {}
let calls
let ip = 0

function mockResponse() {
  return {
    statusCode: null,
    body: null,
    sent: null,
    headers: {},
    setHeader(name, value) { this.headers[name] = value },
    status(code) { this.statusCode = code; return this },
    json(payload) { this.body = payload; return this },
    send(payload) { this.sent = payload; return this },
    end() { return this },
  }
}

// A fresh client IP per request so the per-IP rate limit never interferes.
const mockRequest = (body) => ({
  method: 'POST',
  headers: {},
  socket: { remoteAddress: `10.8.${Math.floor(++ip / 250)}.${(ip % 250) + 1}` },
  body,
})

const audioResponse = (buf = MP3, type = 'audio/mpeg') => ({
  ok: true,
  status: 200,
  headers: new Headers({ 'content-type': type }),
  arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
})

function stubFetch(impl) {
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init, body: init?.body ? JSON.parse(init.body) : null })
    return impl(url, init)
  }
}

function useElevenLabs() {
  process.env.TTS_PROVIDER = 'elevenlabs'
  process.env.ELEVENLABS_API_KEY = FAKE_KEY
  process.env.ELEVENLABS_VOICE_ID = VOICE
}

beforeEach(() => {
  calls = []
  for (const key of ENV_KEYS) savedEnv[key] = process.env[key]
  for (const key of ENV_KEYS) delete process.env[key]
})

afterEach(() => {
  globalThis.fetch = realFetch
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key]
    else process.env[key] = savedEnv[key]
  }
})

test('default provider (google) without credentials answers 501 so the client falls back', async () => {
  stubFetch(() => {
    throw new Error('no network call expected')
  })
  const res = mockResponse()
  await handler(mockRequest({ text: 'Kumusta', lang: 'fil' }), res)

  assert.equal(res.statusCode, 501)
  assert.deepEqual(res.body, { error: 'tts_unconfigured' })
  assert.equal(calls.length, 0)
})

test('elevenlabs without a key or without a voice answers 501 and calls nothing', async () => {
  process.env.TTS_PROVIDER = 'elevenlabs'
  stubFetch(() => {
    throw new Error('no network call expected')
  })

  let res = mockResponse()
  await handler(mockRequest({ text: 'Kumusta', lang: 'fil' }), res)
  assert.equal(res.statusCode, 501)

  process.env.ELEVENLABS_API_KEY = FAKE_KEY // key but no voice
  res = mockResponse()
  await handler(mockRequest({ text: 'Kumusta', lang: 'fil' }), res)
  assert.equal(res.statusCode, 501)
  assert.deepEqual(res.body, { error: 'tts_unconfigured' })
  assert.equal(calls.length, 0)
})

test('elevenlabs success returns the audio bytes as audio/mpeg', async () => {
  useElevenLabs()
  stubFetch(() => audioResponse())
  const res = mockResponse()
  await handler(mockRequest({ text: 'Magandang araw!', lang: 'taglish' }), res)

  assert.equal(res.statusCode, 200)
  assert.equal(res.headers['Content-Type'], 'audio/mpeg')
  assert.deepEqual(res.sent, MP3)
})

test('elevenlabs request: documented URL, xi-api-key header, default model, no language_code', async () => {
  useElevenLabs()
  stubFetch(() => audioResponse())
  await handler(mockRequest({ text: 'Magandang araw!', lang: 'fil' }), mockResponse())

  assert.equal(calls.length, 1)
  const [call] = calls
  assert.equal(call.url, `https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_64`)
  assert.equal(call.init.method, 'POST')
  assert.equal(call.init.headers['xi-api-key'], FAKE_KEY)
  assert.equal(call.init.headers['Content-Type'], 'application/json')
  assert.deepEqual(call.body, { text: 'Magandang araw!', model_id: 'eleven_flash_v2_5' })
  assert.ok(call.init.signal instanceof AbortSignal)
})

test('ELEVENLABS_MODEL overrides the model and the voice id is URL-encoded', async () => {
  useElevenLabs()
  process.env.ELEVENLABS_MODEL = 'eleven_multilingual_v2'
  process.env.ELEVENLABS_VOICE_ID = 'a/b?c'
  stubFetch(() => audioResponse())
  await handler(mockRequest({ text: 'Sige.', lang: 'en' }), mockResponse())

  assert.equal(calls[0].body.model_id, 'eleven_multilingual_v2')
  assert.ok(calls[0].url.startsWith('https://api.elevenlabs.io/v1/text-to-speech/a%2Fb%3Fc?'))
})

test('long text is clipped to 800 characters before it is sent', async () => {
  useElevenLabs()
  stubFetch(() => audioResponse())
  await handler(mockRequest({ text: 'a'.repeat(1500), lang: 'en' }), mockResponse())

  assert.equal(calls[0].body.text.length, 800)
})

test('request validation still applies under elevenlabs and no upstream call is made', async () => {
  useElevenLabs()
  stubFetch(() => audioResponse())

  let res = mockResponse()
  await handler(mockRequest({ text: '   ', lang: 'fil' }), res)
  assert.equal(res.statusCode, 400)
  assert.deepEqual(res.body, { error: 'no_text' })

  res = mockResponse()
  await handler(mockRequest({ text: 'Hello', lang: 'de' }), res)
  assert.equal(res.statusCode, 400)
  assert.deepEqual(res.body, { error: 'invalid_language' })

  assert.equal(calls.length, 0)
})

test('an upstream error becomes 502 tts_failed and neither upstream text nor the key is echoed', async () => {
  useElevenLabs()
  stubFetch(() => ({
    ok: false,
    status: 401,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => ({ detail: { message: `bad key ${FAKE_KEY} for account someone@example.com` } }),
    text: async () => `bad key ${FAKE_KEY}`,
    arrayBuffer: async () => new ArrayBuffer(0),
  }))
  const res = mockResponse()
  await handler(mockRequest({ text: 'Kumusta', lang: 'fil' }), res)

  assert.equal(res.statusCode, 502)
  assert.deepEqual(res.body, { error: 'tts_failed' })
  assert.ok(!JSON.stringify([res.body, res.headers]).includes(FAKE_KEY))
})

test('a non-audio or empty 200 response is treated as a failure', async () => {
  useElevenLabs()
  for (const payload of [audioResponse(MP3, 'application/json'), audioResponse(Buffer.alloc(0))]) {
    stubFetch(() => payload)
    const res = mockResponse()
    await handler(mockRequest({ text: 'Kumusta', lang: 'fil' }), res)
    assert.equal(res.statusCode, 502)
    assert.deepEqual(res.body, { error: 'tts_failed' })
  }
})

test('a network failure becomes 502 tts_failed', async () => {
  useElevenLabs()
  stubFetch(() => {
    throw new TypeError('fetch failed')
  })
  const res = mockResponse()
  await handler(mockRequest({ text: 'Kumusta', lang: 'fil' }), res)

  assert.equal(res.statusCode, 502)
  assert.deepEqual(res.body, { error: 'tts_failed' })
})

test('a stalled upstream is aborted by ELEVENLABS_TIMEOUT_MS and becomes 502', async () => {
  useElevenLabs()
  process.env.ELEVENLABS_TIMEOUT_MS = '40'
  stubFetch(
    (url, init) =>
      new Promise((resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(init.signal.reason))
      }),
  )
  const started = Date.now()
  const res = mockResponse()
  await handler(mockRequest({ text: 'Kumusta', lang: 'fil' }), res)

  assert.equal(res.statusCode, 502)
  assert.ok(Date.now() - started < 5_000)
})

test('the google provider path never calls ElevenLabs', async () => {
  process.env.TTS_PROVIDER = 'google'
  process.env.ELEVENLABS_API_KEY = FAKE_KEY
  process.env.ELEVENLABS_VOICE_ID = VOICE
  stubFetch(() => {
    throw new Error('ElevenLabs must not be called on the google provider')
  })
  const res = mockResponse()
  await handler(mockRequest({ text: 'Kumusta', lang: 'fil' }), res)

  assert.equal(res.statusCode, 501) // no GCP credentials in the test environment
  assert.equal(calls.length, 0)
})

test('each learning mode sends its own voice settings to ElevenLabs, and they differ', async () => {
  useElevenLabs()
  const sent = {}
  for (const mode of ['kalma', 'pakinig', 'hakbang']) {
    calls.length = 0
    stubFetch(() => audioResponse())
    const res = mockResponse()
    await handler(mockRequest({ text: 'Subukan natin.', lang: 'taglish', mode }), res)
    assert.equal(res.statusCode, 200, mode)
    assert.deepEqual(calls[0].body.voice_settings, MODE_VOICE[mode], mode)
    sent[mode] = calls[0].body.voice_settings
  }
  // Kalma is the steadiest and Hakbang the most expressive; Pakinig sits between.
  assert.ok(sent.kalma.stability > sent.pakinig.stability)
  assert.ok(sent.pakinig.stability > sent.hakbang.stability)
  assert.ok(sent.hakbang.style > sent.kalma.style)
  // Speed is deliberately left to the client's read rate, so the two never stack.
  for (const settings of Object.values(sent)) assert.equal('speed' in settings, false)
})

test('no mode, "none" and an absent mode all leave the voice at its saved settings', async () => {
  useElevenLabs()
  for (const body of [{ text: 'Sige.' }, { text: 'Sige.', mode: 'none' }]) {
    calls.length = 0
    stubFetch(() => audioResponse())
    await handler(mockRequest({ ...body, lang: 'en' }), mockResponse())
    assert.equal('voice_settings' in calls[0].body, false)
  }
})

test('an unknown mode is a 400 invalid_mode and nothing is sent upstream', async () => {
  useElevenLabs()
  stubFetch(() => audioResponse())
  for (const mode of ['zen', 'KALMA', null, 3]) {
    const res = mockResponse()
    await handler(mockRequest({ text: 'Sige.', lang: 'en', mode }), res)
    assert.equal(res.statusCode, 400, String(mode))
    assert.deepEqual(res.body, { error: 'invalid_mode' })
  }
  assert.equal(calls.length, 0)
})

test('a per-mode voice id overrides the shared voice, other modes keep the shared one', async () => {
  useElevenLabs()
  process.env.ELEVENLABS_VOICE_ID_HAKBANG = 'WarmVoice9'
  stubFetch(() => audioResponse())

  await handler(mockRequest({ text: 'Una.', lang: 'fil', mode: 'hakbang' }), mockResponse())
  await handler(mockRequest({ text: 'Una.', lang: 'fil', mode: 'kalma' }), mockResponse())
  await handler(mockRequest({ text: 'Una.', lang: 'fil' }), mockResponse())

  assert.match(calls[0].url, /\/text-to-speech\/WarmVoice9\?/)
  assert.match(calls[1].url, new RegExp(`/text-to-speech/${VOICE}\\?`))
  assert.match(calls[2].url, new RegExp(`/text-to-speech/${VOICE}\\?`))
})

test('a per-mode voice alone is enough to be configured for that mode only', async () => {
  process.env.TTS_PROVIDER = 'elevenlabs'
  process.env.ELEVENLABS_API_KEY = FAKE_KEY
  process.env.ELEVENLABS_VOICE_ID_KALMA = 'CalmVoice1' // no shared voice id at all
  stubFetch(() => audioResponse())

  let res = mockResponse()
  await handler(mockRequest({ text: 'Dahan-dahan.', lang: 'fil', mode: 'kalma' }), res)
  assert.equal(res.statusCode, 200)

  res = mockResponse()
  await handler(mockRequest({ text: 'Dahan-dahan.', lang: 'fil', mode: 'hakbang' }), res)
  assert.equal(res.statusCode, 501) // nothing configured for that mode
})

test('the google provider accepts a mode but does not use it, and still validates it', async () => {
  process.env.TTS_PROVIDER = 'google'
  stubFetch(() => {
    throw new Error('no network call expected')
  })
  const res = mockResponse()
  await handler(mockRequest({ text: 'Sige.', lang: 'fil', mode: 'kalma' }), res)
  assert.equal(res.statusCode, 501) // no GCP credentials in the test environment
  assert.equal(calls.length, 0)
})
