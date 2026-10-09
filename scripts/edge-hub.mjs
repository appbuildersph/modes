// Edge AI hub (D-018): runs on the team's Mac next to LM Studio.
//
//   node scripts/edge-hub.mjs        listens on 127.0.0.1:8787 (EDGE_HUB_HOST to change)
//
// - POST /api/tutor  -> api/tutor.js with TUTOR_BACKEND=edge (Gemma 4 E2B via LM Studio)
// - POST /api/tts    -> api/tts.js (ElevenLabs when TTS_PROVIDER=elevenlabs). Billed per
//                       character, so requests arriving through the tunnel must carry an allowed
//                       Origin header and share an hourly cap (EDGE_TTS_MAX_PER_HOUR, default 300).
// - GET  /api/ping   -> connectivity probe, with CORS for the deployed PWA
// - GET  /*          -> the built app from dist/, but ONLY for local hosts
//                       (localhost / 127.0.0.1), so the Mac itself can use the
//                       model with no internet (or for every host when EDGE_SERVE_APP=1). Requests that arrive through the
//                       tunnel (any other Host) reach the two API routes and nothing else.
//
// LM Studio itself stays on 127.0.0.1:1234 and is never exposed. Origin allow-listing,
// size caps and rate limiting come from api/_shared.js guard(); allow the deployed PWA
// with QUESTION_CORS_ORIGINS=https://your-pwa.example (comma-separated).

import http from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize, resolve } from 'node:path'

process.env.TUTOR_BACKEND ||= 'edge'

const ROOT = resolve(import.meta.dirname, '..')
const DIST = join(ROOT, 'dist')
const PORT = Number(process.env.EDGE_HUB_PORT || 8787)
// 127.0.0.1 by default. EDGE_HUB_HOST=0.0.0.0 lets a phone on the same Wi-Fi or hotspot
// reach the hub with no internet at all (pair it with EDGE_SERVE_APP=1). Opt-in only:
// it exposes the app and both API routes to everyone on that network.
const HOST = process.env.EDGE_HUB_HOST || '127.0.0.1'
const MAX_BODY_BYTES = 64_000

const { default: tutorHandler } = await import('../api/tutor.js')
const { default: pingHandler } = await import('../api/ping.js')
const { default: ttsHandler } = await import('../api/tts.js')
const { cors } = await import('../api/_shared.js')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
}

const isLocalHost = (host = '') => /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host)

// Spend guard for tunnelled /api/tts calls (ElevenLabs bills per character).
const TTS_TUNNEL_MAX_PER_HOUR = Number(process.env.EDGE_TTS_MAX_PER_HOUR || 300)
let ttsWindow = { start: Date.now(), count: 0 }
function ttsTunnelBudgetLeft() {
  const now = Date.now()
  if (now - ttsWindow.start >= 3_600_000) ttsWindow = { start: now, count: 0 }
  ttsWindow.count += 1
  return ttsWindow.count <= TTS_TUNNEL_MAX_PER_HOUR
}

// Adapt Node's req/res to the small Vercel-style surface the handlers use.
function adapt(res) {
  res.status = (code) => {
    res.statusCode = code
    return res
  }
  res.send = (body) => res.end(body)
  res.json = (value) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(value))
  }
  return res
}

function readBody(req) {
  return new Promise((resolveBody, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new Error('payload_too_large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolveBody(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

async function serveStatic(req, res, pathname) {
  const rel = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '')
  let file = join(DIST, rel)
  if (!file.startsWith(DIST)) return res.writeHead(403).end()
  try {
    const info = await stat(file)
    if (info.isDirectory()) file = join(file, 'index.html')
  } catch {
    // Unknown path without an extension: single-page app navigation.
    if (extname(rel)) return res.writeHead(404).end('Not found')
    file = join(DIST, 'index.html')
  }
  try {
    const body = await readFile(file)
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' })
    res.end(req.method === 'HEAD' ? undefined : body)
  } catch {
    res.writeHead(404).end('Run `npm run build` first: dist/ is missing.')
  }
}

const server = http.createServer(async (req, res) => {
  adapt(res)
  const host = req.headers.host || ''
  const { pathname } = new URL(req.url, 'http://hub.local')

  // One line per API call (route, host, status, time); never the request body.
  if (pathname.startsWith('/api/')) {
    // Lets the PWA recognise a hub at its own origin (and across origins) without ?edge=.
    res.setHeader('X-Edge-Hub', '1')
    res.setHeader('Access-Control-Expose-Headers', 'X-Edge-Hub')
    const started = Date.now()
    res.on('finish', () => {
      console.log(`${new Date().toLocaleTimeString('en-GB')} ${req.method} ${pathname} ${res.statusCode} ${Date.now() - started}ms host=${host} origin=${req.headers.origin || '-'} edgeClient=${req.headers['ngrok-skip-browser-warning'] ? 'yes' : 'no'}`)
    })
  }

  try {
    if (pathname === '/api/tutor') {
      if (req.method === 'POST') {
        const raw = await readBody(req)
        req.body = raw
      }
      return await tutorHandler(req, res)
    }

    if (pathname === '/api/tts') {
      if (!isLocalHost(host) && req.method === 'POST') {
        // api/_shared.js lets requests without an Origin header through; a billed
        // endpoint reached over the tunnel must name an origin (guard() then checks it).
        if (!req.headers.origin) return res.status(403).json({ error: 'origin_required' })
        if (!ttsTunnelBudgetLeft()) return res.status(429).json({ error: 'tts_budget_exhausted' })
      }
      if (req.method === 'POST') req.body = await readBody(req)
      return await ttsHandler(req, res)
    }

    if (pathname === '/api/ping') {
      // api/ping.js sets no CORS headers; the deployed PWA probes this cross-origin.
      cors(req, res)
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      if (req.method === 'OPTIONS') return res.status(204).end()
      return await pingHandler(req, res)
    }

    // EDGE_SERVE_APP=1 also serves the app to tunnel hosts, so a phone can open the
    // tunnel URL itself (app and API on one origin) without a separate Vercel deploy.
    if ((isLocalHost(host) || process.env.EDGE_SERVE_APP === '1') && (req.method === 'GET' || req.method === 'HEAD')) {
      return await serveStatic(req, res, pathname)
    }

    return res.status(404).json({ error: 'not_found' })
  } catch (error) {
    if (!res.headersSent) {
      res.status(error?.message === 'payload_too_large' ? 413 : 500).json({ error: 'hub_error' })
    } else {
      res.end()
    }
  }
})

server.listen(PORT, HOST, () => {
  console.log(`Edge hub on http://${HOST}:${PORT}  (TUTOR_BACKEND=${process.env.TUTOR_BACKEND})`)
  console.log(`LM Studio expected at ${process.env.EDGE_LLM_URL || 'http://127.0.0.1:1234'}`)
  console.log(`Allowed cross-origin PWA: ${process.env.QUESTION_CORS_ORIGINS || '(none; same-origin only)'}`)
})
