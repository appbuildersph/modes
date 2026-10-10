import test from 'node:test'
import assert from 'node:assert/strict'
import { parseHubLog, trafficRows } from '../scripts/launcher-checks.mjs'
import { RULES } from '../scripts/mode-rules.mjs'

const LOG = `Edge hub on http://127.0.0.1:8787  (TUTOR_BACKEND=edge)
09:00:00 POST /api/tutor 200 900ms host=127.0.0.1:8787 origin=- edgeClient=no
Edge hub on http://127.0.0.1:8787  (TUTOR_BACKEND=edge)
Voice: ElevenLabs, 33,536 of 39,749 characters left this period
10:00:01 GET /api/ping 204 1ms host=tweed.ngrok-free.dev origin=https://hiyang.vercel.app edgeClient=yes
10:00:02 POST /api/tutor 200 1200ms host=tweed.ngrok-free.dev origin=https://hiyang.vercel.app edgeClient=yes
10:00:05 POST /api/tutor 502 30000ms host=tweed.ngrok-free.dev origin=https://hiyang.vercel.app edgeClient=yes
10:00:09 POST /api/tutor 200 800ms host=localhost:8787 origin=- edgeClient=no
10:00:10 POST /api/tts 200 300ms host=tweed.ngrok-free.dev origin=https://hiyang.vercel.app edgeClient=yes
10:00:11 POST /api/tts 502 300ms host=tweed.ngrok-free.dev origin=https://hiyang.vercel.app edgeClient=yes`

test('the hub log is read from the last startup only', () => {
  const { calls, voice, started } = parseHubLog(LOG)
  assert.equal(started, true)
  assert.equal(calls.length, 6)
  assert.equal(voice, 'Voice: ElevenLabs, 33,536 of 39,749 characters left this period')
  assert.deepEqual(calls.map((c) => c.local), [false, false, false, true, false, false])
})

test('traffic rows flag Gemma failures and voice fallbacks', () => {
  const rows = trafficRows(parseHubLog(LOG), 10 * 3600 + 60)
  const byLabel = Object.fromEntries(rows.map((r) => [r.label, r]))
  assert.equal(byLabel['Tutor questions answered by Gemma'].state, 'fail')
  assert.equal(byLabel['Tutor questions answered by Gemma'].detail, '2 of 3')
  assert.equal(byLabel['Who asked'].detail, '2 through the tunnel (phones), 1 on this Mac')
  assert.equal(byLabel['Voice lines played'].state, 'warn')
  assert.match(byLabel['Voice budget through the tunnel'].detail, /about 2 of 300/)
})

test('an empty log reports no traffic instead of failing', () => {
  const rows = trafficRows(parseHubLog(''), 0)
  assert.equal(rows.find((r) => r.label === 'Tutor questions').state, 'info')
})

test('mode rules catch a Kalma reply that is too long or excited', () => {
  assert.deepEqual(RULES.kalma('One. Two.').filter((x) => x !== true), [])
  assert.equal(RULES.kalma('One! Two. Three.').filter((x) => x !== true).length, 2)
  assert.deepEqual(RULES.hakbang('Add the tops. What is 3 plus 1?').filter((x) => x !== true), [])
})
