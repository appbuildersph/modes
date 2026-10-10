// Live check of the edge tutor (D-018) in every learning mode.
//
//   node scripts/edge-mode-check.mjs [hubUrl]     default http://127.0.0.1:8787
//
// Sends one question per mode and language to the hub's /api/tutor, runs the reply
// through applyMode() exactly as the app does (src/lib/tutor-chain.js), and checks
// the per-mode rules from docs/TUTOR_MODES.md. Every request goes to the hub on this
// Mac, and the hub only talks to LM Studio on 127.0.0.1, so running this with Wi-Fi
// off is the zero-connectivity test (docs/EDGE_RUNBOOK.md).
//
// The hub rate-limits /api/tutor to 10 requests a minute per client; this sends 8.

import { applyMode, isValidReply } from '../src/lib/tutor-modes.js'
import { RULES } from './mode-rules.mjs'

const HUB = (process.argv[2] || 'http://127.0.0.1:8787').replace(/\/$/, '')
const REF = '4NA-IIe-1' // Grade 4: proper fractions, improper fractions, mixed numbers
const QUESTION = {
  en: 'What is 3/4 + 1/4? And is 5/4 an improper fraction?',
  fil: 'Ano ang 3/4 + 1/4? At ang 5/4 ba ay improper fraction?',
}

async function ask(mode, lang) {
  const started = Date.now()
  const res = await fetch(`${HUB}/api/tutor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ref: REF, lang, mode, question: QUESTION[lang] }),
  })
  const body = await res.json().catch(() => ({}))
  return { status: res.status, raw: String(body.text ?? body.reply ?? ''), ms: Date.now() - started, error: body.error }
}

const ping = await fetch(`${HUB}/api/ping`).catch((error) => ({ ok: false, error }))
if (!ping.ok && ping.status !== 204) {
  console.error(`Hub not reachable at ${HUB}. Start it: node --env-file=.env scripts/edge-hub.mjs`)
  process.exit(1)
}

let failures = 0
for (const mode of ['none', 'kalma', 'pakinig', 'hakbang']) {
  for (const lang of ['en', 'fil']) {
    const { status, raw, ms, error } = await ask(mode, lang)
    const text = applyMode(mode, lang, raw)
    const problems = status !== 200
      ? [`HTTP ${status}${error ? ` ${error}` : ''}`]
      : [isValidReply(text) || 'invalid reply', ...RULES[mode](text)].filter((x) => x !== true)
    if (problems.length) failures += 1
    console.log(`\n[${problems.length ? 'FAIL' : 'PASS'}] ${mode}/${lang} ${ms}ms${problems.length ? `  (${problems.join('; ')})` : ''}`)
    console.log(`  ${text || '(empty)'}`)
  }
}

console.log(`\n${failures ? `${failures} check(s) failed` : 'All mode checks passed'} against ${HUB}`)
process.exit(failures ? 1 : 0)
