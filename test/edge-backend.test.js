import test, { beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import handler from '../api/tutor.js'
import { getAllContent } from '../src/lib/content-catalog.js'
import { buildTutorPrompt } from '../src/lib/tutor-prompt.js'

const REF = '4MG-Ia-1'
const VALID = { question: 'Paano ko sasagutan ito?', ref: REF, lang: 'fil' }
const COMPETENCY = getAllContent().find((c) => c.ref === REF).competency
const ENV_KEYS = ['TUTOR_BACKEND', 'EDGE_LLM_URL', 'EDGE_MODEL', 'EDGE_TIMEOUT_MS']

const realFetch = globalThis.fetch
const savedEnv = {}
let calls
let ip = 0

function mockResponse() {
  return {
    statusCode: null,
    body: null,
    headers: {},
    setHeader(name, value) { this.headers[name] = value },
    status(code) { this.statusCode = code; return this },
    json(payload) { this.body = payload; return this },
    end() { return this },
  }
}

// A fresh client IP per request so the per-IP rate limit never interferes.
const mockRequest = (body) => ({
  method: 'POST',
  headers: {},
  socket: { remoteAddress: `10.9.${Math.floor(++ip / 250)}.${(ip % 250) + 1}` },
  body,
})

const completion = (content) => ({
  ok: true,
  status: 200,
  json: async () => ({ choices: [{ message: { content } }] }),
})

// Stub global fetch; every call is recorded in `calls`.
function stubFetch(impl) {
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init, body: init?.body ? JSON.parse(init.body) : null })
    return impl(url, init)
  }
}

beforeEach(() => {
  calls = []
  for (const key of ENV_KEYS) savedEnv[key] = process.env[key]
  for (const key of ENV_KEYS) delete process.env[key]
  process.env.TUTOR_BACKEND = 'edge'
})

afterEach(() => {
  globalThis.fetch = realFetch
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key]
    else process.env[key] = savedEnv[key]
  }
})

test('edge backend returns the model reply with source "edge"', async () => {
  stubFetch(() => completion('  Kumusta! Subukan natin. '))
  const res = mockResponse()
  await handler(mockRequest(VALID), res)

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, { text: 'Kumusta! Subukan natin.', source: 'edge' })
})

test('edge request uses the documented defaults and reasoning_effort "none"', async () => {
  stubFetch(() => completion('Sige.'))
  await handler(mockRequest(VALID), mockResponse())

  assert.equal(calls.length, 1)
  const [call] = calls
  assert.equal(call.url, 'http://127.0.0.1:1234/v1/chat/completions')
  assert.equal(call.init.method, 'POST')
  assert.equal(call.body.model, 'google/gemma-4-e2b')
  assert.equal(call.body.temperature, 0.4)
  assert.equal(call.body.max_tokens, 300)
  // Without this Gemma 4 spends every token on reasoning and returns empty content.
  assert.equal(call.body.reasoning_effort, 'none')
  assert.deepEqual(call.body.messages.map((m) => m.role), ['system', 'user'])
  assert.equal(call.body.messages[1].content, VALID.question)
  assert.ok(call.init.signal instanceof AbortSignal)
})

test('EDGE_LLM_URL and EDGE_MODEL override the defaults, trailing slash tolerated', async () => {
  process.env.EDGE_LLM_URL = 'http://192.168.1.20:5000//'
  process.env.EDGE_MODEL = 'some/other-model'
  stubFetch(() => completion('Okay.'))
  await handler(mockRequest(VALID), mockResponse())

  assert.equal(calls[0].url, 'http://192.168.1.20:5000/v1/chat/completions')
  assert.equal(calls[0].body.model, 'some/other-model')
})

test('empty or malformed content becomes 502 edge_failed', async () => {
  for (const payload of [completion(''), completion('   \n'), completion(null), { ok: true, json: async () => ({}) }]) {
    stubFetch(() => payload)
    const res = mockResponse()
    await handler(mockRequest(VALID), res)
    assert.equal(res.statusCode, 502)
    assert.deepEqual(res.body, { error: 'edge_failed' })
  }
})

test('an upstream error becomes 502 and the upstream text is not echoed', async () => {
  stubFetch(() => ({
    ok: false,
    status: 500,
    json: async () => ({ error: 'secret path /Users/someone/models/gemma' }),
    text: async () => 'secret path /Users/someone/models/gemma',
  }))
  const res = mockResponse()
  await handler(mockRequest(VALID), res)

  assert.equal(res.statusCode, 502)
  assert.deepEqual(res.body, { error: 'edge_failed' })
  assert.ok(!JSON.stringify(res.body).includes('secret'))
})

test('a network failure (server down) becomes 502 edge_failed', async () => {
  stubFetch(() => {
    throw new TypeError('fetch failed: connect ECONNREFUSED 127.0.0.1:1234')
  })
  const res = mockResponse()
  await handler(mockRequest(VALID), res)

  assert.equal(res.statusCode, 502)
  assert.deepEqual(res.body, { error: 'edge_failed' })
})

test('a stalled upstream is aborted by the timeout and becomes 502', async () => {
  process.env.EDGE_TIMEOUT_MS = '40'
  stubFetch(
    (url, init) =>
      new Promise((resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(init.signal.reason))
      }),
  )
  const started = Date.now()
  const res = mockResponse()
  await handler(mockRequest(VALID), res)

  assert.equal(res.statusCode, 502)
  assert.deepEqual(res.body, { error: 'edge_failed' })
  assert.ok(Date.now() - started < 5_000, 'should abort near the configured timeout')
})

test('an unknown mode is rejected before the model is called', async () => {
  stubFetch(() => completion('should not be reached'))
  const res = mockResponse()
  await handler(mockRequest({ ...VALID, mode: 'zen' }), res)

  assert.equal(res.statusCode, 400)
  assert.deepEqual(res.body, { error: 'invalid_mode' })
  assert.equal(calls.length, 0)
})

test('the mode reaches the compact system prompt', async () => {
  stubFetch(() => completion('Una, hatiin natin.'))
  await handler(mockRequest({ ...VALID, mode: 'hakbang' }), mockResponse())

  const system = calls[0].body.messages[0].content
  assert.equal(system, buildTutorPrompt(COMPETENCY, 'fil', { mode: 'hakbang', short: true }))
  assert.match(system, /single step/)
})

test('without a mode the prompt carries no mode fragment', async () => {
  stubFetch(() => completion('Sige.'))
  await handler(mockRequest(VALID), mockResponse())

  const system = calls[0].body.messages[0].content
  assert.equal(system, buildTutorPrompt(COMPETENCY, 'fil', { short: true }))
  assert.doesNotMatch(system, /single step|two short sentences|Write for listening/)
})

test('the edge prompt is the compact one, shorter than the full cloud prompt', async () => {
  stubFetch(() => completion('Sige.'))
  await handler(mockRequest({ ...VALID, mode: 'kalma' }), mockResponse())

  const system = calls[0].body.messages[0].content
  assert.ok(system.length < buildTutorPrompt(COMPETENCY, 'fil', { mode: 'kalma' }).length)
})

test('vertex path is unchanged: no edge call and the placeholder without credentials', async () => {
  for (const backend of [undefined, 'vertex']) {
    if (backend === undefined) delete process.env.TUTOR_BACKEND
    else process.env.TUTOR_BACKEND = backend
    stubFetch(() => {
      throw new Error('the edge server must not be called on the vertex backend')
    })
    const res = mockResponse()
    await handler(mockRequest({ ...VALID, mode: 'kalma' }), res)

    assert.equal(res.statusCode, 200)
    assert.equal(res.body.source, 'placeholder')
    assert.equal(calls.length, 0)
  }
})
