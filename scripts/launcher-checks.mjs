// Health sections for the Edge AI Launcher (scripts/launcher.mjs): one card per part of
// SIBOL, so the team can see before and during the demo that every feature still works.
//
// Two kinds of check:
// - Watch checks run while the window is open. They only read local state (the hub log,
//   files, the Mac) or make cheap free requests, and they are cached so the 1.5 s poll
//   never waits on them.
// - The live check (CHECK EVERYTHING) asks Gemma one question per learning mode and
//   language, plays one short voice line per mode, and runs the unit tests. It sends 6
//   tutor requests (the hub allows 10 a minute per client) and about 40 ElevenLabs
//   characters, so it only runs when pressed.
//
// Row states: ok, warn, fail, running, info (nothing to judge), idle (not checked yet).

import { execFile } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { cpus, loadavg, totalmem, uptime } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { getAllContent } from '../src/lib/content-catalog.js'
import { isLearnerFacingQuestion } from '../src/lib/question-quality.js'
import { lessonTeaching } from '../src/lib/lesson-teaching.js'
import { applyMode, isValidReply } from '../src/lib/tutor-modes.js'
import { RULES } from './mode-rules.mjs'

const run = promisify(execFile)
const HUB = 'http://127.0.0.1:8787'
const row = (state, label, detail = '') => ({ state, label, detail: String(detail) })
const fmtMs = (ms) => (ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.round(ms)} ms`)
const mb = (bytes) => `${(bytes / 1e6).toFixed(1)} MB`

async function get(url, init = {}, timeoutMs = 4000) {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) })
  } catch {
    return null
  }
}

// Stale-while-revalidate: the first call waits, later calls return the last value at once
// and refresh in the background once it is older than ttlMs.
function cached(ttlMs, fn) {
  let value = null
  let at = 0
  let pending = null
  const read = async () => {
    if ((!at || Date.now() - at > ttlMs) && !pending) {
      pending = Promise.resolve()
        .then(fn)
        .then((v) => {
          value = v
          at = Date.now()
        })
        .catch(() => {})
        .finally(() => (pending = null))
    }
    if (value === null && pending) await pending
    return value
  }
  read.expire = () => (at = 0)
  return read
}

// --- hub log ------------------------------------------------------------------
// edge-hub.mjs writes one line per API call:
//   14:02:11 POST /api/tutor 200 812ms host=tweed-....ngrok-free.dev origin=https://hiyang.vercel.app edgeClient=yes
const LINE = /^(\d\d):(\d\d):(\d\d) (\w+) (\/api\/\S+) (\d{3}) (\d+)ms host=(\S*)/

export function parseHubLog(text) {
  const lines = text.split('\n')
  // Only the current run: everything after the last startup banner.
  const start = lines.findLastIndex((l) => l.startsWith('Edge hub on '))
  const current = start === -1 ? lines : lines.slice(start)
  const calls = []
  for (const l of current) {
    const m = LINE.exec(l)
    if (!m) continue
    const [, h, mi, s, method, path, status, ms, host] = m
    calls.push({
      secs: Number(h) * 3600 + Number(mi) * 60 + Number(s),
      time: `${h}:${mi}:${s}`,
      method,
      path,
      status: Number(status),
      ms: Number(ms),
      local: /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host),
    })
  }
  const voice = current.filter((l) => /Voice:|!!!/.test(l)).at(-1)?.replace(/^!+\s*/, '').trim() ?? ''
  return { started: start !== -1, calls, voice }
}

const percentile = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))]
// The log has times of day only, so "the last hour" wraps at midnight.
const secsAgo = (secs, now) => (now - secs + 86_400) % 86_400

export function trafficRows({ calls }, nowSecs, ttsPerHour = 300) {
  const tutor = calls.filter((c) => c.path === '/api/tutor' && c.method === 'POST')
  const tts = calls.filter((c) => c.path === '/api/tts' && c.method === 'POST')
  const pings = calls.filter((c) => c.path === '/api/ping' && c.method === 'GET')
  const rows = []

  if (!tutor.length) rows.push(row('info', 'Tutor questions', 'none yet since the hub started'))
  else {
    const ok = tutor.filter((c) => c.status === 200).length
    const failed = tutor.filter((c) => c.status >= 500).length
    const limited = tutor.filter((c) => c.status === 429).length
    rows.push(row(failed ? 'fail' : limited ? 'warn' : 'ok', 'Tutor questions answered by Gemma', `${ok} of ${tutor.length}`))
    const times = tutor.filter((c) => c.status === 200).map((c) => c.ms).sort((a, b) => a - b)
    if (times.length) {
      const p50 = percentile(times, 0.5)
      rows.push(row(p50 <= 6000 ? 'ok' : 'warn', 'Answer time', `typical ${fmtMs(p50)}, 9 in 10 under ${fmtMs(percentile(times, 0.9))}, slowest ${fmtMs(times.at(-1))}`))
    }
    rows.push(row(failed ? 'fail' : 'ok', 'Gemma failures (502)', failed ? `${failed}: phones fell back to the bundled explanation` : 'none'))
    rows.push(row(limited ? 'warn' : 'ok', 'Rate limited (429)', limited ? `${limited}: a client asked more than 10 a minute` : 'none'))
    const phones = tutor.filter((c) => !c.local).length
    rows.push(row('info', 'Who asked', `${phones} through the tunnel (phones), ${tutor.length - phones} on this Mac`))
    const last = tutor.at(-1)
    rows.push(row(last.status === 200 ? 'ok' : 'warn', 'Last question', `${last.time}, ${last.status === 200 ? `answered in ${fmtMs(last.ms)}` : `HTTP ${last.status}`}`))
  }

  if (!tts.length) rows.push(row('info', 'Voice lines played', 'none yet'))
  else {
    const ok = tts.filter((c) => c.status === 200).length
    const fellBack = tts.length - ok
    rows.push(row(fellBack ? 'warn' : 'ok', 'Voice lines played', `${ok} of ${tts.length}${fellBack ? `; ${fellBack} fell back to the device voice` : ''}`))
    const hour = tts.filter((c) => !c.local && secsAgo(c.secs, nowSecs) < 3600).length
    rows.push(row(hour > ttsPerHour * 0.8 ? 'warn' : 'ok', 'Voice budget through the tunnel', `about ${hour} of ${ttsPerHour} this hour`))
  }
  rows.push(row('info', 'Connection checks (ping)', `${pings.length}`))
  return rows
}

// --- .env (read, never shown) ---------------------------------------------------
function readEnv(root) {
  try {
    return Object.fromEntries(
      readFileSync(join(root, '.env'), 'utf8')
        .split('\n')
        .map((l) => /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(l))
        .filter(Boolean)
        .map(([, k, v]) => [k, v.replace(/^(['"])(.*)\1$/, '$2')]),
    )
  } catch {
    return {}
  }
}

// --- the live check --------------------------------------------------------------
const REF = '4NA-IIe-1' // Grade 4 fractions, the same topic as scripts/edge-mode-check.mjs
const QUESTION = {
  en: 'What is 3/4 + 1/4? And is 5/4 an improper fraction?',
  fil: 'Ano ang 3/4 + 1/4? At ang 5/4 ba ay improper fraction?',
  taglish: 'Ano ang 3/4 + 1/4? Tapos, improper fraction ba ang 5/4?',
}
const MODE_NAMES = { none: 'Standard', kalma: 'Kalma (calm)', pakinig: 'Pakinig (listen)', hakbang: 'Hakbang (step)' }
const LANG_NAMES = { en: 'English', fil: 'Tagalog', taglish: 'Taglish' }

async function askTutor(mode, lang) {
  const started = Date.now()
  const res = await get(
    `${HUB}/api/tutor`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ref: REF, lang, mode, question: QUESTION[lang] }) },
    45_000,
  )
  const body = res ? await res.json().catch(() => ({})) : {}
  const ms = Date.now() - started
  if (!res) return row('fail', '', 'no answer from the hub')
  if (res.status !== 200) return row('fail', '', `HTTP ${res.status} ${body.error ?? ''}`.trim())
  if (body.source !== 'edge') return row('fail', '', `answered by ${body.source}, not Gemma`)
  const text = applyMode(mode, lang, String(body.text ?? ''))
  const problems = [isValidReply(text) || 'unusable reply', ...RULES[mode](text)].filter((x) => x !== true)
  const snippet = text.length > 140 ? `${text.slice(0, 140)}…` : text
  return row(problems.length ? 'warn' : 'ok', '', `${fmtMs(ms)}${problems.length ? ` (${problems.join('; ')})` : ''}: ${snippet}`)
}

async function sayLine(mode) {
  const started = Date.now()
  const res = await get(
    `${HUB}/api/tts`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'Kumusta!', lang: 'fil', mode }) },
    20_000,
  )
  if (!res) return row('fail', '', 'no answer from the hub')
  if (res.status === 501) return row('warn', '', 'voice not configured: phones use the device voice')
  if (res.status !== 200) return row('fail', '', `HTTP ${res.status}: phones fall back to the device voice`)
  const bytes = (await res.arrayBuffer()).byteLength
  return row(bytes > 1000 ? 'ok' : 'warn', '', `${res.headers.get('x-tts-provider') ?? 'voice'}, ${(bytes / 1024).toFixed(0)} KB of audio in ${fmtMs(Date.now() - started)}`)
}

async function unitTests(root, npm, env) {
  const started = Date.now()
  let out = ''
  let failedRun = false
  try {
    out = (await run(npm, ['test'], { cwd: root, env, timeout: 120_000, maxBuffer: 8e6 })).stdout
  } catch (error) {
    out = `${error.stdout ?? ''}`
    failedRun = true
  }
  const n = (key) => Number(new RegExp(`^ℹ ${key} (\\d+)`, 'm').exec(out)?.[1] ?? NaN)
  const [tests, pass, fail] = [n('tests'), n('pass'), n('fail')]
  if (Number.isNaN(tests)) return row('fail', 'Unit tests (npm test)', 'the test run did not finish')
  return row(fail || failedRun ? 'fail' : 'ok', 'Unit tests (npm test)', `${pass} of ${tests} passed in ${fmtMs(Date.now() - started)}${fail ? `, ${fail} failed` : ''}`)
}

// --- RAM ----------------------------------------------------------------------------
// Sampled in the background every few seconds, so peaks are caught even while nobody
// watches the window. Gemma's weights live in an LM Studio worker process whose memory
// `ps` does not count (MLX allocates it on the GPU side), so the LM Studio figure comes
// from `footprint`, the same number Activity Monitor shows as Memory.
const RAM_EVERY_MS = 3000
const RAM_HISTORY = 200 // 10 minutes
const gb = (bytes) => bytes / 1024 ** 3

// "Memory Used" as Activity Monitor counts it: app memory + wired + compressed.
export function parseVmStat(text) {
  const page = Number(/page size of (\d+) bytes/.exec(text)?.[1] ?? 16384)
  const pages = (name) => Number(new RegExp(`^${name}:\\s+(\\d+)`, 'm').exec(text)?.[1] ?? 0)
  return (pages('Anonymous pages') - pages('Pages purgeable') + pages('Pages wired down') + pages('Pages occupied by compressor')) * page
}

const UNIT = { KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 }
export function parseFootprint(text) {
  const m = /Footprint:\s+([\d.]+)\s+(KB|MB|GB)/.exec(text)
  return m ? Number(m[1]) * UNIT[m[2]] : 0
}

async function sampleRam() {
  const out = async (cmd, args) => (await run(cmd, args, { timeout: 4000 }).catch(() => ({ stdout: '' }))).stdout
  const [vm, swap, procs] = await Promise.all([
    out('/usr/bin/vm_stat', []),
    out('/usr/sbin/sysctl', ['-n', 'vm.swapusage']),
    out('/bin/ps', ['-axo', 'pid=,command=']),
  ])
  const pids = procs.split('\n').filter((l) => /LM Studio|\.lmstudio/.test(l)).map((l) => l.trim().split(/\s+/)[0]).filter(Boolean)
  const sizes = await Promise.all(pids.map(async (pid) => parseFootprint(await out('/usr/bin/footprint', [pid]))))
  const swapMb = Number(/used = ([\d.]+)M/.exec(swap)?.[1] ?? 0)
  return { at: Date.now(), mac: gb(parseVmStat(vm)), lm: gb(sizes.reduce((a, b) => a + b, 0)), swap: swapMb / 1024 }
}

function ramMonitor() {
  const since = Date.now()
  const history = []
  let peak = null
  let lmPeak = null
  const tick = async () => {
    const s = await sampleRam().catch(() => null)
    if (!s?.mac) return
    history.push(s)
    if (history.length > RAM_HISTORY) history.shift()
    if (!peak || s.mac > peak.mac) peak = s
    if (!lmPeak || s.lm > lmPeak.lm) lmPeak = s
  }
  tick()
  setInterval(tick, RAM_EVERY_MS).unref()

  return (total, freePct) => {
    const now = history.at(-1)
    if (!now) return { title: 'Memory (RAM)', rows: [row('running', 'RAM', 'measuring…')] }
    const time = (t) => new Date(t).toLocaleTimeString('en-GB')
    const recent = history.reduce((a, b) => (b.mac > a.mac ? b : a))
    const pct = (v) => Math.round((v / total) * 100)
    const rows = [
      row(pct(now.mac) > 90 ? 'warn' : 'ok', 'RAM used now', `${now.mac.toFixed(1)} of ${total.toFixed(0)} GB (${pct(now.mac)}%)`),
      row(pct(recent.mac) > 95 ? 'warn' : 'ok', 'Peak, last 10 minutes', `${recent.mac.toFixed(1)} GB at ${time(recent.at)}`),
      row(pct(peak.mac) > 95 ? 'warn' : 'ok', `Peak since ${time(since)}`, `${peak.mac.toFixed(1)} GB at ${time(peak.at)}`),
      now.lm
        ? row('ok', 'LM Studio with Gemma now', `${now.lm.toFixed(2)} GB; peak ${lmPeak.lm.toFixed(2)} GB at ${time(lmPeak.at)}`)
        : row('info', 'LM Studio with Gemma now', 'LM Studio is not running'),
      row(now.swap > 1 ? 'warn' : 'ok', 'Swap (RAM spilled to disk)', `${now.swap.toFixed(1)} GB${now.swap > 1 ? ': answers may slow down; close other apps' : ''}`),
    ]
    if (!Number.isNaN(freePct)) rows.push(row(freePct < 15 ? 'warn' : 'ok', 'Memory pressure', `${freePct}% free as macOS counts it${freePct < 15 ? ': close other apps' : ''}`))
    return {
      title: 'Memory (RAM)',
      note: `Sampled every ${RAM_EVERY_MS / 1000} s, also while this window is closed. The chart shows the last 10 minutes.`,
      rows,
      chart: {
        max: total,
        unit: 'GB',
        series: [
          { label: 'Mac', values: history.map((h) => Number(h.mac.toFixed(2))) },
          { label: 'LM Studio + Gemma', values: history.map((h) => Number(h.lm.toFixed(2))) },
        ],
      },
    }
  }
}

// --- the monitor -------------------------------------------------------------------
export function healthMonitor({ root, logs, lms, model, npm, buildEnv, origins, tunnel }) {
  const hubLog = join(logs, 'hub.log')
  const ram = ramMonitor()
  const totalGb = gb(totalmem())
  let live = { running: false, at: null, modes: null, langs: null, voices: null, tests: null }

  const hubUp = cached(3000, async () => (await get(`${HUB}/api/ping`, {}, 2000))?.status === 204)

  // Traffic: read the whole log; it is a few hundred KB after a long day.
  const traffic = cached(3000, () => {
    if (!existsSync(hubLog)) return [row('info', 'No hub log', 'the hub was started outside the launcher, so its traffic is not visible here')]
    const parsed = parseHubLog(readFileSync(hubLog, 'utf8'))
    const d = new Date()
    const env = readEnv(root)
    return trafficRows(parsed, d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds(), Number(env.EDGE_TTS_MAX_PER_HOUR || 300))
  })

  const gemma = cached(5000, async () => {
    try {
      const { stdout } = await run(lms, ['ps', '--json'], { timeout: 8000 })
      const m = JSON.parse(stdout).find((x) => x.modelKey === model || x.identifier === model)
      if (!m) return [row('fail', 'Gemma in memory', `${model} is not loaded`)]
      return [
        row('ok', 'Gemma in memory', `${m.displayName ?? model}, ${m.paramsString ?? ''} ${m.quantization?.name ?? ''}, ${(m.sizeBytes / 1e9).toFixed(2)} GB`),
        row(m.status === 'generating' ? 'running' : 'ok', 'Model state', `${m.status ?? 'unknown'}${m.queued ? `, ${m.queued} waiting` : ''}, context ${m.contextLength ?? '?'} tokens, ${m.parallel ?? 1} at a time`),
      ]
    } catch {
      return [row('fail', 'Gemma in memory', 'LM Studio did not answer (lms ps)')]
    }
  })

  const voice = cached(300_000, async () => {
    const env = readEnv(root)
    const rows = []
    const eleven = env.TTS_PROVIDER?.toLowerCase() !== 'google' && Boolean(env.ELEVENLABS_API_KEY)
    if (eleven && env.ELEVENLABS_VOICE_ID) rows.push(row('ok', 'Voice out', 'ElevenLabs (from .env)'))
    else if (eleven) rows.push(row('warn', 'Voice out', 'ElevenLabs key set but ELEVENLABS_VOICE_ID missing: phones use the device voice'))
    else rows.push(row('warn', 'Voice out', 'no ElevenLabs key in .env: phones use the device voice'))
    const own = ['KALMA', 'PAKINIG', 'HAKBANG'].filter((m) => env[`ELEVENLABS_VOICE_ID_${m}`])
    rows.push(row('info', 'Voice per mode', own.length ? `own voice for ${own.map((m) => m[0] + m.slice(1).toLowerCase()).join(', ')}; the rest share the main voice` : 'all modes share the main voice (each mode still has its own pace and tone)'))
    if (eleven) {
      const res = await get('https://api.elevenlabs.io/v1/user/subscription', { headers: { 'xi-api-key': env.ELEVENLABS_API_KEY } }, 5000)
      if (!res) rows.push(row('info', 'ElevenLabs quota', 'not checked: no internet'))
      else if (!res.ok) rows.push(row('fail', 'ElevenLabs quota', `key check answered ${res.status}`))
      else {
        const { character_count: used, character_limit: limit } = await res.json()
        const left = limit - used
        rows.push(row(left < 2000 ? 'warn' : 'ok', 'ElevenLabs quota', `${left.toLocaleString('en-US')} of ${limit.toLocaleString('en-US')} characters left`))
      }
    }
    rows.push(row('info', 'Offline voice', 'the phone’s own speech voice takes over when ElevenLabs is unreachable'))
    rows.push(row('info', 'Voice in (microphone)', 'the hub has no speech-to-text; phones use Web Speech, then typing'))
    return rows
  })

  // Newest modification time under a folder (skipping heavy or generated folders).
  function newest(dir) {
    let latest = 0
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
      const p = join(dir, entry.name)
      latest = Math.max(latest, entry.isDirectory() ? newest(p) : statSync(p).mtimeMs)
    }
    return latest
  }
  function size(dir) {
    let total = 0
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name)
      total += entry.isDirectory() ? size(p) : statSync(p).size
    }
    return total
  }

  const app = cached(15_000, async () => {
    const dist = join(root, 'dist')
    const index = join(dist, 'index.html')
    if (!existsSync(index)) return [row('fail', 'Built app (dist/)', 'missing: run npm run build')]
    const built = statSync(index).mtimeMs
    const rows = [row('ok', 'Built app (dist/)', `${mb(size(dist))}, built ${new Date(built).toLocaleString('en-GB')}`)]
    const changed = Math.max(newest(join(root, 'src')), newest(join(root, 'public')), statSync(join(root, 'index.html')).mtimeMs)
    rows.push(changed > built
      ? row('warn', 'Build is up to date', `source changed ${new Date(changed).toLocaleString('en-GB')}, after the build: run npm run build`)
      : row('ok', 'Build is up to date', 'no source change since the build'))
    const sw = join(dist, 'sw.js')
    if (existsSync(sw)) {
      const entries = (readFileSync(sw, 'utf8').match(/url:"/g) ?? []).length
      rows.push(row(entries ? 'ok' : 'warn', 'Offline cache (service worker)', `${entries} files saved on the phone for offline use`))
    } else rows.push(row('fail', 'Offline cache (service worker)', 'dist/sw.js missing: the app will not work offline'))
    try {
      const manifest = JSON.parse(readFileSync(join(dist, 'manifest.webmanifest'), 'utf8'))
      rows.push(row(manifest.icons?.length ? 'ok' : 'warn', 'Install to home screen (manifest)', `${manifest.name}, ${manifest.display}, ${manifest.icons?.length ?? 0} icons`))
    } catch {
      rows.push(row('fail', 'Install to home screen (manifest)', 'dist/manifest.webmanifest missing or broken'))
    }
    if (await hubUp()) {
      const res = await get(`${HUB}/`, {}, 3000)
      const html = res?.ok && /text\/html/.test(res.headers.get('content-type') ?? '')
      rows.push(row(html ? 'ok' : 'fail', 'App on this Mac (no internet needed)', html ? `${HUB.replace('127.0.0.1', 'localhost')} serves the app` : `HTTP ${res?.status ?? 'no answer'}`))
    } else rows.push(row('idle', 'App on this Mac (no internet needed)', 'hub is off'))
    return rows
  })

  // Static: the bundled curriculum only changes with the code, so check it once.
  const content = cached(Infinity, () => {
    const all = getAllContent()
    const rows = []
    for (const grade of [4, 5, 6]) {
      const topics = all.filter((c) => c.grade === grade)
      const items = topics.reduce((n, c) => n + (c.items?.length ?? 0), 0)
      rows.push(row(topics.length && items ? 'ok' : 'fail', `Grade ${grade}`, `${topics.length} topics, ${items} practice questions`))
    }
    const items = all.flatMap((c) => c.items ?? [])
    const unsafe = items.filter((q) => !isLearnerFacingQuestion(q)).length
    rows.push(row(unsafe ? 'warn' : 'ok', 'Questions safe for children', unsafe ? `${unsafe} of ${items.length} show curriculum codes or rubric text (filtered out in the app)` : `all ${items.length} pass the quality filter`))
    const explained = all.filter((c) => c.explanation?.en).length
    const examples = all.filter((c) => c.worked_example).length
    rows.push(row(explained === all.length ? 'ok' : 'warn', 'Offline explanation (tutor fallback)', `${explained} of ${all.length} topics`))
    rows.push(row(examples === all.length ? 'ok' : 'warn', 'Worked examples', `${examples} of ${all.length} topics`))
    let lessons = 0
    for (const c of all) {
      try {
        if (lessonTeaching(c)?.explanation) lessons += 1
      } catch {}
    }
    rows.push(row(lessons === all.length ? 'ok' : 'fail', 'Lesson pages build', `${lessons} of ${all.length} topics`))
    const untranslated = items.filter((q) => q.q?.fil && q.q.fil === q.q.en).length
    rows.push(row(untranslated ? 'warn' : 'ok', 'Tagalog question text', untranslated ? `${untranslated} of ${items.length} questions still in English (lesson text and UI are translated)` : 'translated'))
    return rows
  })

  const online = cached(30_000, async () => {
    const rows = []
    const net = await get('https://www.gstatic.com/generate_204', {}, 3000)
    if (net?.status !== 204) {
      rows.push(row('info', 'Internet', 'offline: the Mac still teaches; phones need the tunnel, which needs internet'))
      return rows
    }
    rows.push(row('ok', 'Internet', 'online'))
    const t = await tunnel()
    for (const origin of origins) {
      const started = Date.now()
      const page = await get(origin, {}, 6000)
      rows.push(row(page?.ok ? 'ok' : 'fail', `${origin.replace('https://', '')}`, page?.ok ? `app is up (${fmtMs(Date.now() - started)})` : `HTTP ${page?.status ?? 'no answer'}`))
      if (!t) continue
      const pre = await get(`${t}/api/tutor`, {
        method: 'OPTIONS',
        headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type,ngrok-skip-browser-warning', 'ngrok-skip-browser-warning': '1' },
      }, 8000)
      const allowed = pre?.headers.get('access-control-allow-origin') === origin
      rows.push(row(allowed ? 'ok' : 'fail', `  … may call the hub (CORS)`, allowed ? 'allowed through the tunnel' : 'blocked: add it to QUESTION_CORS_ORIGINS and restart the hub'))
    }
    if (t) {
      const res = await get(`${t}/`, { headers: { 'ngrok-skip-browser-warning': '1' } }, 8000)
      const html = res?.ok && /text\/html/.test(res.headers.get('content-type') ?? '')
      rows.push(row(html ? 'ok' : 'warn', 'App straight from the tunnel', html ? `${t.replace('https://', '')} serves the app too` : 'only the API (hub started without EDGE_SERVE_APP=1)'))
    } else rows.push(row('idle', 'Tunnel checks', 'no tunnel open'))
    return rows
  })

  let freePct = NaN
  const mac = cached(10_000, async () => {
    const rows = []
    const out = async (cmd, args) => (await run(cmd, args, { timeout: 5000 }).catch(() => ({ stdout: '' }))).stdout
    const batt = await out('/usr/bin/pmset', ['-g', 'batt'])
    const pct = Number(/(\d+)%/.exec(batt)?.[1] ?? NaN)
    const onAC = /AC Power/.test(batt)
    rows.push(row(!onAC && pct < 30 ? 'warn' : 'ok', 'Power', onAC ? `plugged in${Number.isNaN(pct) ? '' : `, battery ${pct}%`}` : `on battery, ${pct}%: plug in for the demo`))
    freePct = Number(/percentage: (\d+)%/.exec(await out('/usr/bin/memory_pressure', ['-Q']))?.[1] ?? NaN)
    const [load] = loadavg()
    const cores = cpus().length
    rows.push(row(load > cores ? 'warn' : 'ok', 'CPU load', `${load.toFixed(1)} on ${cores} cores`))
    const therm = await out('/usr/bin/pmset', ['-g', 'therm'])
    const limit = Number(/CPU_Speed_Limit\s*=\s*(\d+)/.exec(therm)?.[1] ?? 100)
    rows.push(row(limit < 100 ? 'warn' : 'ok', 'Heat', limit < 100 ? `CPU slowed to ${limit}% by heat` : 'no heat slowdown'))
    const df = (await out('/bin/df', ['-k', '/'])).trim().split('\n').at(-1)?.split(/\s+/)
    const freeGb = df ? Number(df[3]) / 1e6 : NaN
    if (!Number.isNaN(freeGb)) rows.push(row(freeGb < 5 ? 'warn' : 'ok', 'Disk free', `${freeGb.toFixed(0)} GB`))
    const h = Math.floor(uptime() / 3600)
    rows.push(row('info', 'Mac up for', h >= 24 ? `${Math.floor(h / 24)} d ${h % 24} h` : `${h} h ${Math.floor((uptime() % 3600) / 60)} min`))
    return rows
  })

  const code = cached(15_000, async () => {
    const git = async (...args) => (await run('/usr/bin/git', args, { cwd: root, timeout: 5000 }).catch(() => ({ stdout: '' }))).stdout.trim()
    const [branch, dirty, last] = await Promise.all([git('branch', '--show-current'), git('status', '--porcelain'), git('log', '-1', '--format=%h %s (%cr)')])
    const changed = dirty ? dirty.split('\n').length : 0
    return [
      row('info', 'Git', `${branch || 'detached'}, ${changed ? `${changed} uncommitted change${changed === 1 ? '' : 's'}` : 'clean'}`),
      row('info', 'Last commit', last),
    ]
  })

  const logFiles = cached(10_000, () =>
    ['hub.log', 'ngrok.log', 'caffeinate.log']
      .filter((f) => existsSync(join(logs, f)))
      .map((f) => {
        const s = statSync(join(logs, f))
        return row('info', f, `${(s.size / 1024).toFixed(0)} KB, last written ${new Date(s.mtimeMs).toLocaleTimeString('en-GB')}`)
      })
      .concat(row('info', 'Folder', logs)))

  // Rows of the live check, or placeholders until it has run.
  function liveRows(key, labels) {
    return Object.entries(labels).map(([id, label]) => {
      const done = live[key]?.[id]
      if (done) return { ...done, label }
      return row(live.running ? 'running' : 'idle', label, live.running ? 'checking…' : 'press CHECK EVERYTHING')
    })
  }

  async function sections() {
    const [trafficR, gemmaR, voiceR, appR, contentR, onlineR, macR, codeR, logR] = await Promise.all([
      traffic(), gemma(), voice(), app(), content(), online(), mac(), code(), logFiles(),
    ])
    const tests = live.tests ?? row(live.running ? 'running' : 'idle', 'Unit tests (npm test)', live.running ? 'running…' : 'press CHECK EVERYTHING')
    return [
      { title: 'Gemma on this Mac', rows: gemmaR ?? [] },
      ram(totalGb, freePct),
      { title: 'Tutor traffic since the hub started', rows: trafficR ?? [] },
      { title: 'Learning modes (live)', note: 'Gemma answers one fractions question per mode; the reply must follow docs/TUTOR_MODES.md.', rows: liveRows('modes', MODE_NAMES) },
      { title: 'Languages (live)', note: 'Checks that Gemma answers; Tagalog and Taglish wording has not been reviewed by a Filipino reader.', rows: liveRows('langs', LANG_NAMES) },
      { title: 'Voice', rows: [...(voiceR ?? []), ...liveRows('voices', Object.fromEntries(Object.entries(MODE_NAMES).map(([k, v]) => [k, `Voice test: ${v}`])))] },
      { title: 'App and offline mode', rows: appR ?? [] },
      { title: 'Learning content (bundled, works offline)', rows: contentR ?? [] },
      { title: 'Online app for phones', rows: onlineR ?? [] },
      { title: 'This Mac', rows: macR ?? [] },
      { title: 'Code', rows: [tests, ...(codeR ?? [])] },
      { title: 'Logs', rows: logR ?? [] },
    ]
  }

  async function runLive() {
    if (live.running) return
    live = { running: true, at: null, modes: {}, langs: {}, voices: {}, tests: null }
    try {
      const up = await get(`${HUB}/api/ping`, {}, 2000)
      if (up?.status !== 204) {
        const off = row('fail', '', 'hub is off: press START first')
        for (const id of Object.keys(MODE_NAMES)) live.modes[id] = live.voices[id] = off
        for (const id of Object.keys(LANG_NAMES)) live.langs[id] = off
      } else {
        for (const mode of Object.keys(MODE_NAMES)) live.modes[mode] = await askTutor(mode, 'en')
        live.langs.en = live.modes.none
        for (const lang of ['fil', 'taglish']) live.langs[lang] = await askTutor('none', lang)
        for (const mode of Object.keys(MODE_NAMES)) live.voices[mode] = await sayLine(mode)
      }
      live.tests = await unitTests(root, npm, buildEnv)
      for (const c of [traffic, voice, app, online]) c.expire()
    } finally {
      live.running = false
      live.at = Date.now()
    }
  }

  return {
    sections,
    runLive,
    liveState: () => ({ running: live.running, at: live.at }),
  }
}
