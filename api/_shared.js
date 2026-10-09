// Shared request-guard helpers for every Gabay serverless function.
//
// Each handler used to roll its own CORS / rate limiting, which meant
// /api/tts and /api/transcribe shipped with NO limit at all while
// /api/questions had a durable one. Everything now funnels through here so a
// new endpoint gets the same floor for free.

const rateLimitBuckets = new Map()
// Prune ceiling for the in-memory fallback. Serverless instances are recycled
// often, but a long-lived one must not grow an unbounded IP map.
const MAX_TRACKED_IPS = 10_000

export function allowedOrigin(origin) {
  if (!origin) return true
  const configured = (process.env.QUESTION_CORS_ORIGINS || 'https://gabay-sage.vercel.app')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  return configured.includes(origin)
    || /^https:\/\/[a-z0-9-]+\.openai\.site$/i.test(origin)
    || /^https:\/\/gabay(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(origin)
}

export function cors(req, res) {
  const origin = req.headers.origin
  if (origin && allowedOrigin(origin)) res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
}

export function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
    .split(',')[0]
    .trim()
}

// Upstash/Vercel KV counter. Returns null when unconfigured so the caller can
// fall back to the per-instance map.
async function durableRateLimit(bucket, ip, limit) {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  if (!url || !token) return null
  const key = `gabay:${bucket}:rate:${Math.floor(Date.now() / 60_000)}:${ip}`
  const response = await fetch(`${url.replace(/\/$/, '')}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([['INCR', key], ['EXPIRE', key, 65, 'NX']]),
  })
  if (!response.ok) throw new Error('rate_limit_store_unavailable')
  const result = await response.json()
  return Number(result?.[0]?.result) <= limit
}

function memoryRateLimit(bucket, ip, limit) {
  const now = Date.now()
  const key = `${bucket}:${ip}`
  const previous = rateLimitBuckets.get(key)
  const entry = !previous || now >= previous.resetAt ? { count: 0, resetAt: now + 60_000 } : previous
  entry.count += 1
  rateLimitBuckets.set(key, entry)
  if (rateLimitBuckets.size > MAX_TRACKED_IPS) {
    for (const [existingKey, value] of rateLimitBuckets) {
      if (now >= value.resetAt) rateLimitBuckets.delete(existingKey)
    }
  }
  return entry.count <= limit
}

export async function withinRateLimit(bucket, ip, limit) {
  const durable = await durableRateLimit(bucket, ip, limit)
  return durable !== null ? durable : memoryRateLimit(bucket, ip, limit)
}

// Single entry point: method + CORS + origin + size + rate limit.
// Returns true when the handler already responded and should stop.
export async function guard(req, res, { bucket, limit, maxBytes }) {
  cors(req, res)
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return true
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({ error: 'method_not_allowed' })
    return true
  }
  if (!allowedOrigin(req.headers.origin)) {
    res.status(403).json({ error: 'origin_not_allowed' })
    return true
  }
  if (Number(req.headers['content-length'] || 0) > maxBytes) {
    res.status(413).json({ error: 'payload_too_large' })
    return true
  }
  try {
    if (!(await withinRateLimit(bucket, clientIp(req), limit))) {
      res.status(429).json({ error: 'rate_limited' })
      return true
    }
  } catch {
    res.status(503).json({ error: 'rate_limit_unavailable' })
    return true
  }
  return false
}

// Body parsing shared by every handler. Returns { body } or { error }.
export function parseBody(req, maxBytes) {
  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      return { error: 'invalid_json' }
    }
  }
  if (JSON.stringify(body ?? {}).length > maxBytes) return { error: 'payload_too_large' }
  return { body: body || {} }
}
