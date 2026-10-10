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
import { healthMonitor } from './launcher-checks.mjs'

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

// Feature-by-feature health cards below the status list (scripts/launcher-checks.mjs).
const health = healthMonitor({
  root: ROOT,
  logs: LOGS,
  lms: LMS,
  model: MODEL,
  npm: NPM,
  buildEnv: BUILD_ENV,
  origins: ORIGINS.split(',').map((o) => o.trim()).filter(Boolean),
  tunnel: () => tunnelUrl(),
})

let busy = false
// 'start' or 'stop' while busy, so each button can show its own spinner.
let action = null
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
async function httpsTunnel() {
  const res = await get('http://127.0.0.1:4040/api/tunnels')
  if (!res?.ok) return null
  const { tunnels = [] } = await res.json().catch(() => ({}))
  return tunnels.find((t) => t.public_url?.startsWith('https://')) ?? null
}
const tunnelUrl = async () => (await httpsTunnel())?.public_url ?? null
async function ngrokRunning() {
  try {
    await run('/usr/bin/pgrep', ['-x', 'ngrok'])
    return true
  } catch {
    return false
  }
}

// An open tunnel in ngrok's local API does not prove phones can reach the hub, so
// ping the hub through the public URL, the way a phone would. Cached because the
// window polls every 1.5 s and each probe is a round trip through ngrok's servers.
const PROBE_EVERY_MS = 10_000
let probe = { url: null, at: 0, ok: false, ms: 0, detail: '' }
let probing = null
async function probeTunnel(url) {
  const started = Date.now()
  const res = await get(`${url}/api/ping`, { headers: { 'ngrok-skip-browser-warning': '1' } }, 8000)
  const ok = res?.status === 204 && res.headers.get('x-edge-hub') === '1'
  const detail = ok ? '' : res ? `answered ${res.status}, not the hub` : 'no answer through the tunnel'
  probe = { url, at: Date.now(), ok, ms: Date.now() - started, detail }
}
function freshProbe(url) {
  if (url && (probe.url !== url || Date.now() - probe.at > PROBE_EVERY_MS) && !probing) {
    probing = probeTunnel(url).finally(() => (probing = null))
  }
  return probe.url === url ? probe : null
}

async function tunnelStatus() {
  const [running, t] = await Promise.all([ngrokRunning(), httpsTunnel()])
  const url = t?.public_url ?? null
  // The first probe of a new URL runs inline so the section never shows "checking" for long.
  if (url && probe.url !== url && !probing) await (probing = probeTunnel(url).finally(() => (probing = null)))
  const p = freshProbe(url)
  return {
    running,
    url,
    reachable: url ? (p ? p.ok : null) : false,
    ms: p?.ms ?? null,
    checkedAgoS: p ? Math.round((Date.now() - p.at) / 1000) : null,
    problem: p?.detail ?? '',
    requests: t?.metrics?.http?.count ?? 0,
    openConns: t?.metrics?.conns?.gauge ?? 0,
  }
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
  const [lm, gemma, hub, tunnelInfo, keepAwake, sections] = await Promise.all([
    lmServerUp(), gemmaLoaded(), hubUp(), tunnelStatus(), awake(), health.sections(),
  ])
  const tunnel = tunnelInfo.url
  return {
    busy,
    action: busy ? action : null,
    tunnel: tunnelInfo,
    steps,
    test,
    sections,
    live: health.liveState(),
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
  action = 'start'
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
  action = 'stop'
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
  :root { --ink:#3a2e2a; --cream:#fbf1da; --card:#fffaf0; --red:#e5484d; --amber:#f0a12c; --mint:#8ed8b4; --rose:#f4c3d0 }
  * { box-sizing: border-box }
  body { margin:0; min-height:100vh; display:grid; place-items:center; background:var(--cream); color:var(--ink);
         font:600 16px/1.4 ui-rounded, 'SF Pro Rounded', system-ui, sans-serif; padding:24px 16px }
  main { width:min(100%, 34rem); text-align:center }
  h1 { margin:0 0 4px; font-size:1.6rem } p.sub { margin:0 0 28px; opacity:.7 }
  .pair { display:flex; gap:32px; justify-content:center; flex-wrap:wrap; padding:14px 0 6px }
  .big { --halo:var(--amber); position:relative; width:160px; height:160px; border-radius:50%; border:6px solid var(--ink);
         color:#fff; font-family:inherit; font-size:1.45rem; font-weight:900; line-height:1.1; letter-spacing:.04em; cursor:pointer;
         box-shadow:0 12px 0 var(--ink); transition:transform .08s, box-shadow .08s, filter .3s, background .4s }
  .big:active:not(:disabled) { transform:translateY(10px); box-shadow:0 2px 0 var(--ink) }
  .big:disabled { filter:saturate(.35) brightness(1.05); cursor:not-allowed }
  .big.busy:disabled { filter:none; cursor:progress }
  .big .icon { display:block; font-size:1.6rem; margin-bottom:2px }
  #go { background:radial-gradient(circle at 35% 30%, #ffd98a, var(--amber) 55%, #b8650f) }
  #go.ready { --halo:#3fb37f; background:radial-gradient(circle at 35% 30%, #b9f0d3, #3fb37f 55%, #23784f); animation:glow 2.4s ease-in-out infinite }
  #stop { --halo:var(--red); background:radial-gradient(circle at 35% 30%, #ff8a8d, var(--red) 55%, #b4272c) }
  /* idle START: two ripples invite the press */
  .big.idle::before, .big.idle::after { content:''; position:absolute; inset:-8px; border-radius:50%; border:4px solid var(--halo);
         animation:ripple 2s ease-out infinite; pointer-events:none }
  .big.idle::after { animation-delay:1s }
  /* busy: a spinning arc around the button that is working */
  .big.busy::before { content:''; position:absolute; inset:-18px; border-radius:50%; border:7px solid transparent;
         border-top-color:var(--halo); border-right-color:var(--halo); animation:spin .9s linear infinite; pointer-events:none }
  .big.pop { animation:pop .5s cubic-bezier(.3,1.6,.5,1) }
  .big.ready.pop { animation:pop .5s cubic-bezier(.3,1.6,.5,1), glow 2.4s ease-in-out .5s infinite }
  @keyframes ripple { from { transform:scale(1); opacity:.6 } to { transform:scale(1.4); opacity:0 } }
  @keyframes spin { to { transform:rotate(360deg) } }
  @keyframes pop { 0% { transform:scale(.82) } 60% { transform:scale(1.08) } 100% { transform:scale(1) } }
  @keyframes glow { 50% { box-shadow:0 12px 0 var(--ink), 0 0 34px 8px rgba(63,179,127,.55) } }
  ul { list-style:none; padding:0; margin:14px 0 0; text-align:left; display:grid; gap:8px }
  li { display:flex; gap:10px; align-items:flex-start; background:var(--card); border:2.5px solid var(--ink); border-radius:16px; padding:10px 14px;
       box-shadow:3px 3px 0 var(--ink); animation:rowIn .35s ease-out both }
  li:nth-child(2) { animation-delay:.04s } li:nth-child(3) { animation-delay:.08s } li:nth-child(4) { animation-delay:.12s }
  li:nth-child(5) { animation-delay:.16s } li:nth-child(6) { animation-delay:.2s }
  @keyframes rowIn { from { opacity:0; transform:translateY(-6px) } }
  .dot { flex:none; width:14px; height:14px; margin-top:4px; border-radius:50%; border:2px solid var(--ink); background:var(--rose); transition:background .4s }
  .dot.ok { background:#3fb37f } .dot.running { background:#f7d26a; animation:pulse 1s infinite }
  @keyframes pulse { 50% { opacity:.35 } }
  small { display:block; opacity:.65; font-weight:600; word-break:break-all }
  #reply { margin-top:20px; text-align:left; background:#fff7cc; border:2.5px solid var(--ink); border-radius:16px; padding:12px 14px; display:none; animation:rowIn .35s ease-out }
  h2 { font-size:1rem; margin:26px 0 0; text-align:left }
  .tun { margin-top:10px; text-align:left; background:var(--card); border:2.5px solid var(--ink); border-radius:18px; padding:14px 16px; box-shadow:3px 3px 0 var(--ink) }
  .tun .head { display:flex; align-items:center; gap:10px; flex-wrap:wrap }
  .badge { display:inline-flex; align-items:center; gap:7px; border:2px solid var(--ink); border-radius:999px; padding:3px 12px 3px 9px; font-weight:900; font-size:.85rem; letter-spacing:.06em; background:var(--rose); transition:background .4s }
  .badge.on { background:#bfeed6 } .badge.wait { background:#fbe3a0 }
  .live { position:relative; width:10px; height:10px; border-radius:50%; background:var(--ink) }
  .badge.on .live { background:#2e9a69 }
  .badge.on .live::after { content:''; position:absolute; inset:-4px; border-radius:50%; border:2px solid #2e9a69; animation:ripple 1.6s ease-out infinite }
  .badge.wait .live { background:#c98a12; animation:pulse 1s infinite }
  .tun a { color:inherit; font-weight:800; word-break:break-all }
  .tun dl { display:grid; grid-template-columns:auto 1fr; gap:6px 14px; margin:12px 0 0; font-size:.92rem }
  .tun dt { opacity:.65 } .tun dd { margin:0; font-weight:800 }
  .dot.warn { background:#f7d26a } .dot.fail { background:var(--red) } .dot.info { background:#b9d4ee } .dot.idle { background:transparent }
  .checkbar { display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin:30px 0 0; text-align:left }
  .checkbar h2 { margin:0; flex:1 }
  #check { font:inherit; font-weight:900; letter-spacing:.05em; color:var(--ink); background:#bfe3ff; border:2.5px solid var(--ink); border-radius:999px;
           padding:8px 18px; box-shadow:0 4px 0 var(--ink); cursor:pointer; transition:transform .08s, box-shadow .08s }
  #check:active:not(:disabled) { transform:translateY(3px); box-shadow:0 1px 0 var(--ink) }
  #check:disabled { cursor:progress; background:#fbe3a0; animation:pulse 1s infinite }
  .summary { margin:8px 0 0; text-align:left; font-size:.92rem; opacity:.75 }
  .sec h3 { display:flex; justify-content:space-between; gap:10px; font-size:.95rem; margin:20px 0 0; text-align:left }
  .sec h3 .count { font-size:.8rem; border:2px solid var(--ink); border-radius:999px; padding:0 9px; background:#bfeed6 }
  .sec h3 .count.warn { background:#fbe3a0 } .sec h3 .count.fail { background:var(--rose) }
  .sec p { margin:4px 0 0; text-align:left; font-size:.85rem; opacity:.65 }
  /* values here change every few seconds, so no entry animation on every repaint */
  .sec li { animation:none }
  .chart { margin-top:10px; background:var(--card); border:2.5px solid var(--ink); border-radius:16px; padding:10px 12px 8px; box-shadow:3px 3px 0 var(--ink) }
  .chart svg { display:block; width:100%; height:110px }
  .legend { display:flex; gap:14px; flex-wrap:wrap; font-size:.8rem; text-align:left }
  .legend i { display:inline-block; width:12px; height:4px; border-radius:2px; margin-right:6px; vertical-align:middle }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation:none !important; transition:none !important } }
</style></head>
<body><main>
  <h1>Edge AI</h1><p class="sub">Gemma 4 E2B on this Mac, for the app and the phones</p>
  <div class="pair">
    <button id="go" class="big"></button>
    <button id="stop" class="big"></button>
  </div>
  <div id="reply"></div>
  <h2>Tunnel for phones</h2>
  <div class="tun">
    <div class="head"><span id="tBadge" class="badge"><span class="live"></span><span id="tWord">…</span></span><a id="tUrl" target="_blank" rel="noopener"></a></div>
    <dl><dt>ngrok</dt><dd id="tRun"></dd><dt>Reaches the hub</dt><dd id="tReach"></dd><dt>Traffic</dt><dd id="tTraffic"></dd></dl>
  </div>
  <h2>Status</h2><ul id="parts"></ul>
  <h2 id="stepsTitle" hidden>Last run</h2><ul id="steps"></ul>
  <div class="checkbar"><h2>Every part of SIBOL</h2><button id="check">CHECK EVERYTHING</button></div>
  <p class="summary" id="summary"></p>
  <div id="sections"></div>
</main>
<script>
  const $ = (id) => document.getElementById(id)
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]))
  const row = (state, label, detail) => '<li><span class="dot ' + state + '"></span><span>' + esc(label) + '<small>' + esc(detail) + '</small></span></li>'
  // Only touch the DOM when something changed, so the entry animations play once, not every poll.
  const put = (el, html) => { if (el.innerHTML !== html) el.innerHTML = html }
  const label = (icon, text) => '<span class="icon">' + icon + '</span>' + text
  let wasReady = null
  function pop(el) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop') }
  async function refresh() {
    const s = await fetch('/status').then((r) => r.json()).catch(() => null)
    if (!s) return
    const ready = s.parts.every((p) => p.ok) && !s.busy
    const anyUp = s.parts.some((p) => p.ok)
    const starting = s.busy && s.action !== 'stop'
    const stopping = s.busy && s.action === 'stop'
    const go = $('go'), stop = $('stop')
    go.disabled = s.busy
    go.className = 'big' + (ready ? ' ready' : '') + (starting ? ' busy' : '') + (!ready && !s.busy ? ' idle' : '')
    put(go, starting ? label('&#9203;', 'STARTING…') : ready ? label('&#10003;', 'READY') : label('&#9211;', 'START'))
    stop.disabled = s.busy || !anyUp
    stop.className = 'big' + (stopping ? ' busy' : '')
    put(stop, stopping ? label('&#9203;', 'STOPPING…') : anyUp ? label('&#9632;', 'STOP') : label('&#9632;', 'OFF'))
    if (wasReady === false && ready) pop(go)
    if (wasReady === true && !ready && !s.busy) pop(stop)
    wasReady = ready
    const t = s.tunnel
    if (t) {
      // Text only, so the badge's ripple is not restarted by every poll.
      const state = !t.running || !t.url ? 'off' : t.reachable === null ? 'wait' : t.reachable ? 'on' : 'off'
      $('tBadge').className = 'badge ' + (state === 'off' ? '' : state)
      $('tWord').textContent = { on:'ACTIVE', wait:'CHECKING', off: !t.running ? 'NGROK OFF' : !t.url ? 'NO TUNNEL' : 'NOT REACHABLE' }[state]
      $('tUrl').textContent = t.url ? t.url.replace('https://', '') : ''
      if (t.url) $('tUrl').href = t.url
      $('tRun').textContent = t.running ? 'running' : 'not running'
      $('tReach').textContent = (t.reachable === null ? 'checking…' : t.reachable ? 'yes, hub answered in ' + t.ms + ' ms' : (t.problem || 'no'))
        + (t.url && t.checkedAgoS !== null ? '  (' + t.checkedAgoS + ' s ago)' : '')
      $('tTraffic').textContent = t.requests + ' requests, ' + t.openConns + ' open now'
    }
    put($('parts'), s.parts.map((p) => row(p.ok ? 'ok' : '', p.label, p.detail)).join(''))
    $('stepsTitle').hidden = !s.steps.length
    put($('steps'), s.steps.map((x) => row(x.state, x.label, x.detail)).join(''))
    $('reply').style.display = s.test ? 'block' : 'none'
    if (s.test) put($('reply'), '<b>' + (s.test.ok ? 'Gemma answered' : 'No answer') + '</b><br>' + esc(s.test.text))
    renderSections(s)
  }
  // One card list per feature; the badge counts problems so a glance down the page is enough.
  function renderSections(s) {
    const live = s.live || {}
    $('check').disabled = !!live.running
    $('check').textContent = live.running ? 'CHECKING…' : 'CHECK EVERYTHING'
    const rows = (s.sections || []).flatMap((x) => x.rows)
    const n = (st) => rows.filter((r) => r.state === st).length
    $('summary').textContent = n('ok') + ' fine, ' + n('warn') + ' to watch, ' + n('fail') + ' broken'
      + (live.at ? '. Live check ' + new Date(live.at).toLocaleTimeString('en-GB') : '. Live checks not run yet')
    put($('sections'), (s.sections || []).map((sec) => {
      const bad = sec.rows.filter((r) => r.state === 'fail').length, warn = sec.rows.filter((r) => r.state === 'warn').length
      const badge = bad ? '<span class="count fail">' + bad + ' broken</span>' : warn ? '<span class="count warn">' + warn + ' to watch</span>'
        : sec.rows.some((r) => r.state === 'ok') ? '<span class="count">OK</span>' : ''
      return '<section class="sec"><h3><span>' + esc(sec.title) + '</span>' + badge + '</h3>' + (sec.note ? '<p>' + esc(sec.note) + '</p>' : '')
        + (sec.chart ? chart(sec.chart) : '') + '<ul>' + sec.rows.map((r) => row(r.state, r.label, r.detail)).join('') + '</ul></section>'
    }).join(''))
  }
  const COLORS = ['#2f6fb0', '#e08a12']
  // Line chart of the RAM history, scaled to the Mac's total memory, with the 90% line dashed.
  function chart(c) {
    const W = 300, H = 100, n = Math.max(2, ...c.series.map((x) => x.values.length))
    const y = (v) => (H - 4 - (v / c.max) * (H - 8)).toFixed(1)
    const line = (vals, i) => '<polyline fill="none" stroke="' + COLORS[i] + '" stroke-width="2.2" stroke-linejoin="round" points="'
      + vals.map((v, j) => ((j / (n - 1)) * W).toFixed(1) + ',' + y(v)).join(' ') + '"/>'
    const grid = [0.5, 0.9].map((f) => '<line x1="0" x2="' + W + '" y1="' + y(c.max * f) + '" y2="' + y(c.max * f) + '" stroke="#3a2e2a" stroke-opacity=".25" stroke-dasharray="' + (f === 0.9 ? '4 3' : '1 3') + '"/>'
      + '<text x="2" y="' + (y(c.max * f) - 2) + '" font-size="8" fill="#3a2e2a" fill-opacity=".55">' + Math.round(c.max * f) + ' ' + c.unit + '</text>').join('')
    return '<div class="chart"><svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="RAM used over the last 10 minutes">'
      + grid + c.series.map((x, i) => line(x.values, i)).join('') + '</svg><div class="legend">'
      + c.series.map((x, i) => '<span><i style="background:' + COLORS[i] + '"></i>' + esc(x.label) + ' ' + (x.values.at(-1) ?? 0) + ' ' + c.unit + '</span>').join('')
      + '</div></div>'
  }
  $('check').onclick = () => fetch('/check', { method: 'POST' }).then(refresh)
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
  if (req.method === 'POST' && req.url === '/check') {
    health.runLive().catch(() => {})
    return res.writeHead(202).end()
  }
  if (req.method === 'POST' && req.url === '/stop') {
    stopAll().catch(() => {})
    return res.writeHead(202).end()
  }
  res.writeHead(404).end()
})

server.listen(PORT, '127.0.0.1', () => console.log(`Edge AI Launcher on http://127.0.0.1:${PORT}`))
