// Latency and throughput benchmark for the edge tutor (D-018).
//
//   node scripts/bench-edge.mjs [--runs 3] [--hub http://127.0.0.1:8787] [--out file.json]
//
// Part 1 talks straight to LM Studio with the exact prompt and settings that
// api/tutor.js sends (compact prompt, temperature 0.4, max_tokens 300,
// reasoning_effort 'none'), but streamed, so time to first token and decode speed
// can be measured. Token counts come from the server's usage field, not estimates.
// Part 2 times the real request path (hub /api/tutor, then LM Studio), one request
// per mode and language, which stays under the hub's 10-per-minute rate limit.
//
// Numbers are only valid for the machine this runs on. They say nothing about a
// phone: in the demo the phone only sends the question and shows the reply.

import { writeFileSync } from 'node:fs'
import os from 'node:os'
import { getAllContent } from '../src/lib/content-catalog.js'
import { buildTutorPrompt } from '../src/lib/tutor-prompt.js'
import { MODE_IDS } from '../src/lib/tutor-modes.js'

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 ? process.argv[i + 1] : fallback
}
const RUNS = Number(arg('runs', 3))
const HUB = arg('hub', 'http://127.0.0.1:8787').replace(/\/$/, '')
const LLM = (process.env.EDGE_LLM_URL || 'http://127.0.0.1:1234').replace(/\/$/, '')
const MODEL = process.env.EDGE_MODEL || 'google/gemma-4-e2b'
const OUT = arg('out')

const REF = '4NA-IIe-1'
const competency = getAllContent().find((c) => c.ref === REF)?.competency
if (!competency) throw new Error(`unknown ref ${REF}`)
const QUESTION = {
  en: 'What is 3/4 + 1/4? And is 5/4 an improper fraction?',
  fil: 'Ano ang 3/4 + 1/4? At ang 5/4 ba ay improper fraction?',
}

async function streamOnce(mode, lang) {
  const started = performance.now()
  const res = await fetch(`${LLM}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.4,
      max_tokens: 300,
      reasoning_effort: 'none',
      stream: true,
      stream_options: { include_usage: true },
      messages: [
        { role: 'system', content: buildTutorPrompt(competency, lang, { mode, short: true }) },
        { role: 'user', content: QUESTION[lang] },
      ],
    }),
  })
  if (!res.ok) throw new Error(`LM Studio ${res.status}`)
  let firstToken = null
  let usage = null
  let text = ''
  let buffer = ''
  const decoder = new TextDecoder()
  for await (const chunk of res.body) {
    buffer += decoder.decode(chunk, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()
    for (const line of lines) {
      const data = line.replace(/^data:\s*/, '').trim()
      if (!data || data === '[DONE]') continue
      const event = JSON.parse(data)
      const delta = event.choices?.[0]?.delta?.content
      if (delta) {
        if (firstToken === null) firstToken = performance.now()
        text += delta
      }
      if (event.usage) usage = event.usage
    }
  }
  const ended = performance.now()
  const tokens = usage?.completion_tokens ?? null
  const decodeSec = firstToken ? (ended - firstToken) / 1000 : null
  return {
    mode,
    lang,
    ttftSec: firstToken ? (firstToken - started) / 1000 : null,
    totalSec: (ended - started) / 1000,
    promptTokens: usage?.prompt_tokens ?? null,
    completionTokens: tokens,
    // First token excluded: its time is prefill, counted in ttft.
    decodeTokPerSec: tokens > 1 && decodeSec ? (tokens - 1) / decodeSec : null,
    chars: text.length,
  }
}

async function hubOnce(mode, lang) {
  const started = performance.now()
  const res = await fetch(`${HUB}/api/tutor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ref: REF, lang, mode, question: QUESTION[lang] }),
  })
  const body = await res.json().catch(() => ({}))
  return { mode, lang, status: res.status, source: body.source ?? null, totalSec: (performance.now() - started) / 1000 }
}

const median = (xs) => {
  const s = xs.filter((x) => typeof x === 'number').sort((a, b) => a - b)
  if (!s.length) return null
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
const range = (xs) => {
  const s = xs.filter((x) => typeof x === 'number')
  return s.length ? [Math.min(...s), Math.max(...s)] : null
}
const summarize = (rows, keys) =>
  Object.fromEntries(keys.map((k) => [k, { median: median(rows.map((r) => r[k])), range: range(rows.map((r) => r[k])) }]))

// One untimed request so model load or a cold cache is not counted as latency.
await streamOnce('none', 'en')

const direct = []
for (let run = 0; run < RUNS; run++) {
  for (const mode of MODE_IDS) {
    for (const lang of ['en', 'fil']) direct.push({ run, ...(await streamOnce(mode, lang)) })
  }
}

let hub = []
const ping = await fetch(`${HUB}/api/ping`).catch(() => null)
if (ping && (ping.ok || ping.status === 204)) {
  for (const mode of MODE_IDS) {
    for (const lang of ['en', 'fil']) hub.push(await hubOnce(mode, lang))
  }
} else {
  hub = null
}

const keys = ['ttftSec', 'totalSec', 'completionTokens', 'decodeTokPerSec']
const report = {
  measuredAt: new Date().toISOString(),
  machine: { cpu: os.cpus()[0]?.model, memoryGB: Math.round(os.totalmem() / 2 ** 30), platform: `${os.platform()} ${os.release()}`, node: process.version },
  server: { url: LLM, model: MODEL, settings: { temperature: 0.4, max_tokens: 300, reasoning_effort: 'none', prompt: 'compact (short: true)' } },
  question: { ref: REF, ...QUESTION },
  runsPerModeAndLang: RUNS,
  direct: {
    overall: summarize(direct, keys),
    byMode: Object.fromEntries(MODE_IDS.map((m) => [m, summarize(direct.filter((r) => r.mode === m), keys)])),
    rows: direct,
  },
  hub: hub && {
    url: HUB,
    overall: summarize(hub.filter((r) => r.status === 200), ['totalSec']),
    statuses: hub.map((r) => r.status),
    rows: hub,
  },
}

const json = JSON.stringify(report, null, 2)
if (OUT) writeFileSync(OUT, json + '\n')
console.log(json)
