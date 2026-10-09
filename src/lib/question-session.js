import { get, set } from 'idb-keyval'
import { isLearnerFacingQuestion } from './question-quality.js'
import { API_BASE, apiUrl } from './api-base.js'

export const ROTATION_VERSION = 'v1'
export const QUESTION_TIMEOUT_MS = 90_000
// The `connectivity` flag is only as fresh as the app's last periodic probe
// (up to 8s stale). Re-check right before committing to the 90s AI timeout,
// so a session started right after going offline fails fast into the
// bundled pool instead of sitting on the generating screen.
export const REACHABILITY_TIMEOUT_MS = 3_000
export const QUESTION_API_BASE = API_BASE

async function isReachable(fetchImpl, timeoutMs) {
  try {
    const res = await fetchImpl(apiUrl('/api/ping'), { cache: 'no-store', signal: AbortSignal.timeout(timeoutMs) })
    return res.ok
  } catch {
    return false
  }
}

const defaultStore = { get, set }

export function questionIdentity(question) {
  return `${question.ref}:${question._poolIndex ?? JSON.stringify(question.q)}`
}

export function shuffleQuestions(items, random = Math.random) {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1))
    ;[result[index], result[other]] = [result[other], result[index]]
  }
  return result
}

export function bundledPool(competencies, scope = {}) {
  const refs = new Set(scope.refs ?? [])
  const selected = competencies.filter((competency) => {
    if (refs.size) return refs.has(competency.ref)
    if (scope.game) return competency.game_tags?.includes(scope.game)
    return true
  })
  const source = selected.length ? selected : competencies
  const questions = source.flatMap((competency) =>
    (competency.items ?? []).map((item, index) => ({
      ...item,
      ref: competency.ref,
      domain: competency.domain,
      title: competency.competency,
      source: 'bundled',
      _poolIndex: index,
    })),
  )
  const seen = new Set()
  return questions.filter((question) => {
    if (!isLearnerFacingQuestion(question)) return false
    const signature = JSON.stringify(question.q).toLowerCase().replace(/\s+/g, ' ')
    if (seen.has(signature)) return false
    seen.add(signature)
    return true
  })
}

export async function nextBundledBatch({
  grade,
  mode,
  scopeKey,
  count,
  pool,
  store = defaultStore,
  random = Math.random,
}) {
  if (!pool.length) throw new Error('No bundled questions are available for this scope')
  const key = `gabay:question-rotation:${ROTATION_VERSION}:${grade}:${mode}:${scopeKey}`
  const byId = new Map(pool.map((question) => [questionIdentity(question), question]))
  const saved = (await store.get(key)) ?? {}
  let queue = Array.isArray(saved.queue) ? saved.queue.filter((id) => byId.has(id)) : []
  let last = saved.last && byId.has(saved.last) ? saved.last : null
  const chosen = []

  while (chosen.length < count) {
    if (!queue.length) {
      queue = shuffleQuestions([...byId.keys()], random)
      if (last && queue.length > 1 && queue[0] === last) {
        ;[queue[0], queue[1]] = [queue[1], queue[0]]
      }
    }
    const id = queue.shift()
    chosen.push(byId.get(id))
    last = id
  }

  await store.set(key, { queue, last, poolSize: pool.length, updatedAt: Date.now() })
  return chosen.map(({ _poolIndex, ...question }) => question)
}

export function validateQuestionBatch(value, count, allowedRefs) {
  if (!value || value.source !== 'ai' || !Array.isArray(value.questions) || value.questions.length !== count) return false
  const seen = new Set()
  for (const question of value.questions) {
    if (!question || !allowedRefs.has(question.ref) || !['numeric', 'mcq', 'matching', 'true_false'].includes(question.type)) return false
    if (!question.q || !question.solution || String(question.answer ?? '').trim() === '') return false
    if (!isLearnerFacingQuestion(question)) return false
    const signature = JSON.stringify(question.q).toLowerCase().replace(/\s+/g, ' ')
    if (seen.has(signature)) return false
    seen.add(signature)
    if (question.type === 'mcq') {
      if (!Array.isArray(question.options) || question.options.length !== 4) return false
      const options = question.options.map(String)
      if (new Set(options).size !== 4 || !options.includes(String(question.answer))) return false
    }
    if ((question.steps || question.step_answers) && question.steps?.length !== question.step_answers?.length) return false
  }
  return true
}

async function requestAiBatch({ mode, grade, count, language, refs, mastery, theme, fetchImpl, timeoutMs }) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetchImpl(`${QUESTION_API_BASE}/api/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, grade, count, language, refs, mastery, ...(theme ? { theme } : {}) }),
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`Question service returned ${response.status}`)
    const body = await response.json()
    if (!validateQuestionBatch(body, count, new Set(refs))) throw new Error('Question service returned an invalid batch')
    return body.questions.map((question) => ({ ...question, source: 'ai' }))
  } finally {
    clearTimeout(timer)
  }
}

export async function prepareQuestionSession({
  grade,
  mode,
  scope,
  count,
  language,
  mastery = {},
  connectivity = true,
  competencies,
  fetchImpl = globalThis.fetch,
  store = defaultStore,
  random = Math.random,
  timeoutMs = QUESTION_TIMEOUT_MS,
  reachabilityTimeoutMs = REACHABILITY_TIMEOUT_MS,
}) {
  const pool = bundledPool(competencies, scope)
  const refs = [...new Set(pool.map((question) => question.ref))]
  const relevantMastery = Object.fromEntries(refs.map((ref) => [ref, Number(mastery[ref] ?? 0)]))

  if (connectivity && typeof fetchImpl === 'function' && (await isReachable(fetchImpl, reachabilityTimeoutMs))) {
    try {
      const questions = await requestAiBatch({ mode, grade, count, language, refs, mastery: relevantMastery, theme: scope.game, fetchImpl, timeoutMs })
      const details = new Map(competencies.map((competency) => [competency.ref, competency]))
      return {
        source: 'ai',
        questions: questions.map((question) => ({
          ...question,
          title: details.get(question.ref)?.competency,
          domain: details.get(question.ref)?.domain,
        })),
        fallback: false,
      }
    } catch {
      // Offline rotation is the reliable floor for every remote failure.
    }
  }

  const questions = await nextBundledBatch({
    grade,
    mode,
    scopeKey: scope.key,
    count,
    pool,
    store,
    random,
  })
  return { source: 'bundled', questions, fallback: Boolean(connectivity) }
}
