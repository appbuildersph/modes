// One-button start for the edge AI stack (docs/EDGE_RUNBOOK.md section 2).
//
//   node scripts/launcher.mjs        then open http://127.0.0.1:8700
//   scripts/make-launcher-app.sh     builds a double-clickable "Edge AI Launcher.app"
//
// The big red button runs the runbook's start order, skipping anything already up:
// LM Studio server, load Gemma 4 E2B, the hub, keep-awake, the ngrok tunnel. Then it
// asks Gemma one question so "ready" means a real answer, not just open ports.
// Listens on 127.0.0.1 only. Logs go to ~/Library/Logs/edge-launcher/.

import http from 'node:http'
import { spawn, execFile } from 'node:child_process'
import { existsSync, mkdirSync, openSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { promisify } from 'node:util'

const run = promisify(execFile)
const ROOT = resolve(import.meta.dirname, '..')
const PORT = Number(process.env.LAUNCHER_PORT || 8700)
const LOGS = join(homedir(), 'Library/Logs/edge-launcher')
mkdirSync(LOGS, { recursive: true })

const MODEL = process.env.EDGE_MODEL || 'google/gemma-4-e2b'
const NGROK_URL = process.env.EDGE_NGROK_URL || 'tweed-thinner-quickly.ngrok-free.dev'
const ORIGINS = process.env.QUESTION_CORS_ORIGINS || 'https://math-companion-edge.vercel.app,https://hiyang.vercel.app'

// A .app starts with a bare PATH, so look in the usual install places.
const findTool = (name, extra = []) =>
  [...extra, `/opt/homebrew/bin/${name}`, `/usr/local/bin/${name}`, `/usr/bin/${name}`].find((p) => existsSync(p)) ?? name
const LMS = findTool('lms', [join(homedir(), '.lmstudio/bin/lms')])
const NGROK = findTool('ngrok')
const NODE = process.execPath
const NPM = findTool('npm', [join(dirname(NODE), 'npm')])
// npm's shebang runs `node` from PATH, which a .app does not have.
const BUILD_ENV = { ...process.env, PATH: `${dirname(NODE)}:${process.env.PATH ?? '/usr/bin:/bin'}` }

let busy = false
let steps = []
let test = null

function step(label) {
  const entry = { label, state: 'running', detail: '' }
  steps.push(entry)
  return {
    ok: (detail = '') => Object.assign(entry, { state: 'ok', detail }),
    fail: (detail = '') => Object.assign(entry, { state: 'fail', detail }),
  }
}

async function get(url, init = {}, timeoutMs = 2500) {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) })
  } catch {
    return null
  }
}

function detach(cmd, args, logName, env = {}) {
  const log = openSync(join(LOGS, logName), 'a')
  const child = spawn(cmd, args, { cwd: ROOT, detached: true, stdio: ['ignore', log, log], env: { ...process.env, ...env } })
  child.unref()
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function waitFor(check, timeoutMs) {
  const end = Date.now() + timeoutMs
  while (Date.now() < end) {
    if (await check()) return true
    await sleep(700)
  }
  return false
}

// --- status checks ----------------------------------------------------------
const lmServerUp = async () => Boolean((await get('http://127.0.0.1:1234/v1/models'))?.ok)
async function gemmaLoaded() {
  try {
    const { stdout } = await run(LMS, ['ps', '--json'], { timeout: 8000 })
    return JSON.parse(stdout).some((m) => m.modelKey === MODEL || m.identifier === MODEL)
  } catch {
    return false
  }
}
const hubUp = async () => (await get('http://127.0.0.1:8787/api/ping'))?.status === 204
async function tunnelUrl() {
  const res = await get('http://127.0.0.1:4040/api/tunnels')
  if (!res?.ok) return null
  const { tunnels = [] } = await res.json().catch(() => ({}))
  return tunnels.find((t) => t.public_url?.startsWith('https://'))?.public_url ?? null
}
async function awake() {
  try {
    await run('/usr/bin/pgrep', ['-x', 'caffeinate'])
    return true
  } catch {
    return false
  }
}
function voiceLine() {
  try {
    const lines = readFileSync(join(LOGS, 'hub.log'), 'utf8').split('\n')
    return lines.filter((l) => /Voice:|!!!/.test(l)).at(-1)?.replace(/^!+\s*/, '') ?? ''
  } catch {
    return ''
  }
}

async function status() {
  const [lm, gemma, hub, tunnel, keepAwake] = await Promise.all([lmServerUp(), gemmaLoaded(), hubUp(), tunnelUrl(), awake()])
  return {
    busy,
    steps,
    test,
    parts: [
      { label: 'LM Studio server', ok: lm, detail: '127.0.0.1:1234' },
      { label: 'Gemma 4 E2B loaded', ok: gemma, detail: MODEL },
      { label: 'Edge hub', ok: hub, detail: hub ? `127.0.0.1:8787  ${voiceLine()}` : '127.0.0.1:8787' },
      { label: 'Mac stays awake', ok: keepAwake, detail: 'caffeinate' },
      { label: 'Tunnel for phones', ok: Boolean(tunnel), detail: tunnel ?? `https://${NGROK_URL}` },
    ],
  }
}

// --- the big red button -------------------------------------------------------
async function askGemma() {
  const started = Date.now()
  const res = await get(
    'http://127.0.0.1:8787/api/tutor',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: '4NA-IIe-1', lang: 'en', mode: 'kalma', question: 'What is a mixed number?' }),
    },
    30_000,
  )
  const body = res ? await res.json().catch(() => ({})) : {}
  return { ok: res?.status === 200 && body.source === 'edge', ms: Date.now() - started, text: body.text ?? body.error ?? 'no answer' }
}

async function startAll() {
  if (busy) return
  busy = true
  steps = []
  test = null
  try {
    let s = step('Start LM Studio server')
    if (await lmServerUp()) s.ok('already running')
    else {
      await run(LMS, ['server', 'start', '--port', '1234'], { timeout: 60_000 }).catch(() => {})
      ;(await waitFor(lmServerUp, 30_000)) ? s.ok('started') : s.fail('did not start: open the LM Studio app once, then press again')
    }

    s = step('Load Gemma 4 E2B')
    if (await gemmaLoaded()) s.ok('already loaded')
    else {
      await run(LMS, ['load', MODEL, '--yes'], { timeout: 180_000 }).catch(() => {})
      ;(await gemmaLoaded()) ? s.ok('loaded') : s.fail(`could not load ${MODEL}: is it downloaded in LM Studio?`)
    }

    s = step('Start the edge hub')
    if (await hubUp()) s.ok('already running')
    else {
      if (!existsSync(join(ROOT, 'dist/index.html'))) await run(NPM, ['run', 'build'], { cwd: ROOT, env: BUILD_ENV, timeout: 240_000 }).catch(() => {})
      detach(NODE, ['--env-file=.env', 'scripts/edge-hub.mjs'], 'hub.log', { EDGE_SERVE_APP: '1', QUESTION_CORS_ORIGINS: ORIGINS })
      ;(await waitFor(hubUp, 15_000)) ? s.ok(voiceLine()) : s.fail('see ~/Library/Logs/edge-launcher/hub.log')
    }

    s = step('Keep the Mac awake')
    if (await awake()) s.ok('already on')
    else {
      detach('/usr/bin/caffeinate', ['-dis'], 'caffeinate.log')
      s.ok('on until you press Stop')
    }

    s = step('Open the tunnel for phones')
    if (await tunnelUrl()) s.ok(await tunnelUrl())
    else {
      detach(NGROK, ['http', `--url=${NGROK_URL}`, '8787'], 'ngrok.log')
      const up = await waitFor(async () => Boolean(await tunnelUrl()), 15_000)
      up ? s.ok(await tunnelUrl()) : s.fail('ngrok did not start (is it logged in?); the Mac itself still works')
    }

    s = step('Ask Gemma a test question')
    test = await askGemma()
    test.ok ? s.ok(`answered in ${(test.ms / 1000).toFixed(1)} s`) : s.fail(test.text)
  } finally {
    busy = false
  }
}

async function stopAll() {
  if (busy) return
  busy = true
  steps = []
  test = null
  try {
    const s = step('Stop everything')
    const pids = async (port) => (await run('/usr/sbin/lsof', ['-tiTCP:' + port, '-sTCP:LISTEN']).catch(() => ({ stdout: '' }))).stdout.split('\n').filter(Boolean)
    for (const pid of await pids(8787)) process.kill(Number(pid))
    await run('/usr/bin/pkill', ['-x', 'ngrok']).catch(() => {})
    await run('/usr/bin/pkill', ['-x', 'caffeinate']).catch(() => {})
    await run(LMS, ['unload', '--all'], { timeout: 30_000 }).catch(() => {})
    await run(LMS, ['server', 'stop'], { timeout: 30_000 }).catch(() => {})
    s.ok('hub, tunnel, keep-awake and LM Studio server stopped')
  } finally {
    busy = false
  }
}

// --- page ---------------------------------------------------------------------
const PAGE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Edge AI Launcher</title>
<style>
  :root { --ink:#3a2e2a; --cream:#fbf1da; --card:#fffaf0; --red:#e5484d; --mint:#8ed8b4; --rose:#f4c3d0; }
  * { box-sizing: border-box }
  body { margin:0; min-height:100vh; display:grid; place-items:center; background:var(--cream); color:var(--ink);
         font:600 16px/1.4 ui-rounded, 'SF Pro Rounded', system-ui, sans-serif; padding:24px 16px }
  main { width:min(100%, 34rem); text-align:center }
  h1 { margin:0 0 4px; font-size:1.6rem } p.sub { margin:0 0 24px; opacity:.7 }
  #go { width:220px; height:220px; border-radius:50%; border:6px solid var(--ink); background:radial-gradient(circle at 35% 30%, #ff8a8d, var(--red) 55%, #b4272c);
        color:#fff; font-family:inherit; font-size:2rem; font-weight:900; line-height:1.1; letter-spacing:.04em; cursor:pointer; box-shadow:0 12px 0 var(--ink); transition:transform .08s, box-shadow .08s }
  #go:active:not(:disabled) { transform:translateY(10px); box-shadow:0 2px 0 var(--ink) }
  #go:disabled { filter:saturate(.4); cursor:progress }
  #go.ready { background:radial-gradient(circle at 35% 30%, #b9f0d3, #3fb37f 55%, #23784f) }
  ul { list-style:none; padding:0; margin:28px 0 0; text-align:left; display:grid; gap:8px }
  li { display:flex; gap:10px; align-items:flex-start; background:var(--card); border:2.5px solid var(--ink); border-radius:16px; padding:10px 14px; box-shadow:3px 3px 0 var(--ink) }
  .dot { flex:none; width:14px; height:14px; margin-top:4px; border-radius:50%; border:2px solid var(--ink); background:var(--rose) }
  .dot.ok { background:#3fb37f } .dot.running { background:#f7d26a; animation:pulse 1s infinite }
  @keyframes pulse { 50% { opacity:.35 } }
  small { display:block; opacity:.65; font-weight:600; word-break:break-all }
  #reply { margin-top:16px; text-align:left; background:#fff7cc; border:2.5px solid var(--ink); border-radius:16px; padding:12px 14px; display:none }
  #stop { margin-top:22px; background:none; border:2px solid var(--ink); border-radius:999px; padding:8px 18px; font-family:inherit; font-size:.95rem; font-weight:800; color:var(--ink); cursor:pointer }
  h2 { font-size:1rem; margin:26px 0 0; text-align:left }
</style></head>
<body><main>
  <h1>Edge AI</h1><p class="sub">Gemma 4 E2B on this Mac, for the app and the phones</p>
  <button id="go">START</button>
  <div id="reply"></div>
  <h2>Status</h2><ul id="parts"></ul>
  <h2 id="stepsTitle" hidden>Last run</h2><ul id="steps"></ul>
  <button id="stop">Stop everything</button>
</main>
<script>
  const $ = (id) => document.getElementById(id)
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]))
  const row = (state, label, detail) => '<li><span class="dot ' + state + '"></span><span>' + esc(label) + '<small>' + esc(detail) + '</small></span></li>'
  async function refresh() {
    const s = await fetch('/status').then((r) => r.json()).catch(() => null)
    if (!s) return
    const ready = s.parts.every((p) => p.ok)
    $('go').disabled = s.busy
    $('go').classList.toggle('ready', ready && !s.busy)
    $('go').textContent = s.busy ? 'STARTING…' : ready ? 'READY' : 'START'
    $('parts').innerHTML = s.parts.map((p) => row(p.ok ? 'ok' : '', p.label, p.detail)).join('')
    $('stepsTitle').hidden = !s.steps.length
    $('steps').innerHTML = s.steps.map((x) => row(x.state, x.label, x.detail)).join('')
    $('reply').style.display = s.test ? 'block' : 'none'
    if (s.test) $('reply').innerHTML = '<b>' + (s.test.ok ? 'Gemma answered' : 'No answer') + '</b><br>' + esc(s.test.text)
  }
  $('go').onclick = () => fetch('/start', { method: 'POST' }).then(refresh)
  $('stop').onclick = () => confirm('Stop Gemma, the hub and the tunnel? Phones will lose the AI.') && fetch('/stop', { method: 'POST' }).then(refresh)
  refresh(); setInterval(refresh, 1500)
</script></body></html>`

const server = http.createServer(async (req, res) => {
  // Same-origin only: the page's own POSTs carry this host's Origin.
  const origin = req.headers.origin
  if (req.method === 'POST' && origin && origin !== `http://127.0.0.1:${PORT}` && origin !== `http://localhost:${PORT}`) {
    return res.writeHead(403).end()
  }
  if (req.method === 'GET' && req.url === '/') return res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(PAGE)
  if (req.method === 'GET' && req.url === '/status') {
    return res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(await status()))
  }
  if (req.method === 'POST' && req.url === '/start') {
    startAll().catch(() => {})
    return res.writeHead(202).end()
  }
  if (req.method === 'POST' && req.url === '/stop') {
    stopAll().catch(() => {})
    return res.writeHead(202).end()
  }
  res.writeHead(404).end()
})

server.listen(PORT, '127.0.0.1', () => console.log(`Edge AI Launcher on http://127.0.0.1:${PORT}`))
