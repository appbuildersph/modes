import test from 'node:test'
import assert from 'node:assert/strict'
import {
  bundledPool,
  nextBundledBatch,
  prepareQuestionSession,
  questionIdentity,
  validateQuestionBatch,
} from '../src/lib/question-session.js'

function memoryStore() {
  const data = new Map()
  return { data, get: async (key) => data.get(key), set: async (key, value) => data.set(key, structuredClone(value)) }
}

const competencies = [{
  grade: 2,
  ref: '2NA-Ia-1',
  domain: 'Number and Algebra',
  competency: 'Count objects.',
  game_tags: ['store'],
  items: Array.from({ length: 3 }, (_, index) => ({
    q: { en: `Question ${index}`, fil: `Tanong ${index}`, taglish: `Tanong ${index}` },
    solution: { en: 'Solution', fil: 'Sagot', taglish: 'Solution' },
    answer: String(index),
    type: 'numeric',
  })),
}]

test('offline rotation exhausts a pool and avoids a boundary repeat', async () => {
  const store = memoryStore()
  const pool = bundledPool(competencies, { refs: ['2NA-Ia-1'] })
  const args = { grade: 2, mode: 'quiz', scopeKey: 'lesson:2NA-Ia-1', pool, store, random: () => 0 }
  const first = await nextBundledBatch({ ...args, count: 3 })
  const second = await nextBundledBatch({ ...args, count: 3 })
  assert.equal(new Set(first.map(questionIdentity)).size, 3)
  assert.equal(new Set(second.map(questionIdentity)).size, 3)
  assert.notEqual(questionIdentity(first.at(-1)), questionIdentity(second[0]))
})

test('rotation survives reload, isolates scopes, and supports counts larger than the pool', async () => {
  const store = memoryStore()
  const pool = bundledPool(competencies, {})
  const common = { grade: 2, mode: 'game', pool, store, random: () => 0 }
  const large = await nextBundledBatch({ ...common, scopeKey: 'game:store', count: 8 })
  assert.equal(large.length, 8)
  for (let index = 1; index < large.length; index++) assert.notEqual(questionIdentity(large[index - 1]), questionIdentity(large[index]))
  await nextBundledBatch({ ...common, scopeKey: 'game:house', count: 1 })
  assert.equal(store.data.size, 2)
  const resumed = await nextBundledBatch({ ...common, scopeKey: 'game:store', count: 1 })
  assert.equal(resumed.length, 1)
})

test('bundled game pools collapse identical stems across competencies', () => {
  const duplicate = structuredClone(competencies[0])
  duplicate.ref = '2NA-Ia-2'
  duplicate.items = [structuredClone(competencies[0].items[0])]
  const pool = bundledPool([...competencies, duplicate], { game: 'store' })
  assert.equal(pool.length, 3)
  assert.equal(new Set(pool.map((question) => JSON.stringify(question.q))).size, pool.length)
})

function aiQuestion(index = 0) {
  return {
    ref: '2NA-Ia-1',
    q: { en: `AI question ${index}`, fil: `AI tanong ${index}`, taglish: `AI question ${index}` },
    solution: { en: '2 + 2 = 4', fil: '2 + 2 = 4', taglish: '2 + 2 = 4' },
    answer: '4',
    type: 'mcq',
    options: ['2', '3', '4', '5'],
  }
}

test('online sessions send the adaptive request and do not write AI questions to rotation state', async () => {
  const store = memoryStore()
  let request
  const fetchImpl = async (url, init) => {
    if (url.endsWith('/api/ping')) return { ok: true }
    request = JSON.parse(init.body)
    return { ok: true, json: async () => ({ source: 'ai', questions: Array.from({ length: 5 }, (_, index) => aiQuestion(index)) }) }
  }
  const session = await prepareQuestionSession({
    grade: 2, mode: 'quiz', scope: { key: 'lesson:2NA-Ia-1', refs: ['2NA-Ia-1'] }, count: 5,
    language: 'fil', mastery: { '2NA-Ia-1': 0.2, ignored: 1 }, connectivity: true, competencies, fetchImpl, store,
  })
  assert.equal(session.source, 'ai')
  assert.deepEqual(request.mastery, { '2NA-Ia-1': 0.2 })
  assert.equal(store.data.size, 0)
})

test('HTTP errors, malformed batches, and timeouts fall back to bundled questions', async () => {
  const cases = [
    async () => ({ ok: false, status: 500 }),
    async () => ({ ok: true, json: async () => ({ source: 'ai', questions: [] }) }),
    async (_url, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')))),
  ]
  for (const fetchImpl of cases) {
    const session = await prepareQuestionSession({
      grade: 2, mode: 'quiz', scope: { key: `fallback:${Math.random()}`, refs: ['2NA-Ia-1'] }, count: 5,
      language: 'en', connectivity: true, competencies, fetchImpl, store: memoryStore(), timeoutMs: 5, reachabilityTimeoutMs: 5,
    })
    assert.equal(session.source, 'bundled')
    assert.equal(session.fallback, true)
    assert.equal(session.questions.length, 5)
  }
})

test('client schema validation rejects duplicate and invalid MCQ batches', () => {
  const valid = { source: 'ai', questions: Array.from({ length: 5 }, (_, index) => aiQuestion(index)) }
  assert.equal(validateQuestionBatch(valid, 5, new Set(['2NA-Ia-1'])), true)
  valid.questions[1] = structuredClone(valid.questions[0])
  assert.equal(validateQuestionBatch(valid, 5, new Set(['2NA-Ia-1'])), false)
})

test('client validation rejects curriculum-metadata prompts', () => {
  const batch = { source: 'ai', questions: Array.from({ length: 5 }, (_, index) => aiQuestion(index)) }
  batch.questions[0].q = {
    en: 'Which learning task belongs to 2NA-Ia-1?',
    fil: 'Which learning task belongs to 2NA-Ia-1?',
    taglish: 'Which learning task belongs to 2NA-Ia-1?',
  }
  assert.equal(validateQuestionBatch(batch, 5, new Set(['2NA-Ia-1'])), false)
})
