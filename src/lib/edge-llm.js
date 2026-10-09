import { get, set } from 'idb-keyval'

// Edge AI hub client (D-018): the PWA asks a Teacher Gabay server running on the
// team's Mac (LM Studio, Gemma 4 E2B behind it) over the network, so no model
// has to fit inside the phone's browser. The server builds the system prompt
// from ref + lang + mode itself; this client never sends one. Injectable like
// question-session.js so Node tests can drive it with a fake fetch and store.

export const EDGE_BASE_KEY = 'pref:edgeBase'
export const EDGE_AVAILABILITY_TIMEOUT_MS = 2_000
export const EDGE_TUTOR_TIMEOUT_MS = 20_000

// ngrok interposes a browser warning page unless this header is present.
const EDGE_HEADERS = { 'ngrok-skip-browser-warning': '1' }

const defaultStore = { get, set }

function cleanBase(value) {
  try {
    const url = new URL(String(value))
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    return url.origin + url.pathname.replace(/\/+$/, '')
  } catch {
    return null
  }
}

// Remember `?edge=<url>` once so the installed PWA, which opens without the
// query string, keeps pointing at the hub.
export async function rememberEdgeBase({ search = globalThis.location?.search ?? '', store = defaultStore } = {}) {
  const value = new URLSearchParams(search).get('edge')
  const base = value ? cleanBase(value) : null
  if (base) await store.set(EDGE_BASE_KEY, base)
  return base
}

// The hub marks every /api/* response with X-Edge-Hub: 1, so a tunnel that
// serves the app and hub on one origin is recognised without ?edge=. A plain
// deployment (e.g. Vercel) returns no such header and must not count as a hub.
// Only a positive answer is cached, and only for this page load.
let sameOriginHub = false

export function resetEdgeProbe() {
  sameOriginHub = false
}

async function probeSameOriginHub(fetchImpl, timeoutMs) {
  if (sameOriginHub) return true
  try {
    const res = await fetchImpl('/api/ping', {
      cache: 'no-store',
      headers: EDGE_HEADERS,
      signal: AbortSignal.timeout(timeoutMs),
    })
    sameOriginHub = res.ok && res.headers?.get('x-edge-hub') === '1'
  } catch {
    sameOriginHub = false
  }
  return sameOriginHub
}

// Order: stored override, build-time VITE_EDGE_BASE, same origin on localhost,
// same origin when it identifies itself as the hub.
// Returns null when there is nowhere to ask, so the chain skips the provider.
export async function resolveEdgeBase({
  store = defaultStore,
  env = import.meta.env,
  hostname = globalThis.location?.hostname,
  fetchImpl = globalThis.fetch,
  probeTimeoutMs = EDGE_AVAILABILITY_TIMEOUT_MS,
} = {}) {
  let stored = null
  try {
    stored = await store.get(EDGE_BASE_KEY)
  } catch {
    /* storage unavailable: fall through */
  }
  const override = stored ? cleanBase(stored) : null
  if (override) return override
  const built = env?.VITE_EDGE_BASE ? cleanBase(env.VITE_EDGE_BASE) : null
  if (built) return built
  if (hostname === 'localhost' || hostname === '127.0.0.1') return ''
  // No window (Node tests, workers without a location) means no same origin to probe.
  if (hostname && (await probeSameOriginHub(fetchImpl, probeTimeoutMs))) return ''
  return null
}

export async function edgeAvailable({
  fetchImpl = globalThis.fetch,
  base,
  timeoutMs = EDGE_AVAILABILITY_TIMEOUT_MS,
} = {}) {
  try {
    const root = base ?? (await resolveEdgeBase())
    if (root === null) return false
    const res = await fetchImpl(`${root}/api/ping`, {
      cache: 'no-store',
      headers: EDGE_HEADERS,
      signal: AbortSignal.timeout(timeoutMs),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function edgeTutor({
  question,
  ref,
  lang,
  mode,
  fetchImpl = globalThis.fetch,
  base,
  timeoutMs = EDGE_TUTOR_TIMEOUT_MS,
}) {
  const root = base ?? (await resolveEdgeBase())
  if (root === null) throw new Error('edge_unconfigured')
  const res = await fetchImpl(`${root}/api/tutor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...EDGE_HEADERS },
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify({ question, ref, lang, mode }),
  })
  if (!res.ok) throw new Error('edge_http')
  return (await res.json())?.text ?? ''
}
