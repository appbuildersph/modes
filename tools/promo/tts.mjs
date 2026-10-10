// Generates VO (en, tl), SFX and music with ElevenLabs into ./audio.
// Key: ELEVENLABS_API_KEY from C:\dev\appbuildersph\modes\.env or the environment.
// Usage: node tts.mjs [vo|sfx|music|all] [--voice <id>]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const envFile = path.resolve(here, '../../.env')
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
const KEY = process.env.ELEVENLABS_API_KEY
if (!KEY) { console.error('ELEVENLABS_API_KEY missing (put it in the repo .env)'); process.exit(2) }
const H = { 'xi-api-key': KEY, 'Content-Type': 'application/json' }
const script = JSON.parse(fs.readFileSync(path.join(here, 'script.json'), 'utf8'))
const what = process.argv[2] || 'all'
const voiceArg = process.argv.indexOf('--voice')
let VOICE = voiceArg > -1 ? process.argv[voiceArg + 1] : process.env.PROMO_VOICE_ID
const dirArg = process.argv.indexOf('--audio-dir')
const AUDIO = dirArg > -1 ? process.argv[dirArg + 1] : 'audio'

async function pickVoice() {
  if (VOICE) return VOICE
  const r = await fetch('https://api.elevenlabs.io/v1/voices', { headers: H })
  const { voices } = await r.json()
  // Bright, young, clear American female: closest premade match to an Apple-assistant read.
  const prefer = ['Jessica', 'Sarah', 'Matilda', 'Alice', 'Rachel']
  for (const name of prefer) { const v = voices.find((x) => x.name === name); if (v) { console.log('voice', name, v.voice_id); return v.voice_id } }
  const f = voices.find((v) => /female/i.test(v.labels?.gender || '') && /young/i.test(v.labels?.age || ''))
  if (!f) throw new Error('no female voice found; pass --voice <id>')
  console.log('voice', f.name, f.voice_id); return f.voice_id
}

async function save(res, file) {
  if (!res.ok) throw new Error(`${file}: ${res.status} ${await res.text()}`)
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()))
  console.log('wrote', path.relative(here, file))
}

async function vo() {
  const voice = await pickVoice()
  for (const lang of ['en', 'tl']) {
    for (const b of script.beats) {
      const text = b[lang]
      if (!text) continue
      const file = path.join(here, AUDIO, lang, `${b.id}.mp3`)
      fs.mkdirSync(path.dirname(file), { recursive: true })
      if (fs.existsSync(file)) continue
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
        method: 'POST', headers: H,
        body: JSON.stringify({
          text, model_id: 'eleven_multilingual_v2',
          // Steady, clear, warm: assistant-style delivery. Mode beats stay in the same voice; pacing comes from the edit.
          voice_settings: { stability: 0.55, similarity_boost: 0.8, style: 0.25, use_speaker_boost: true, speed: b.id === 'kalma' ? 0.92 : 1.0 },
        }),
      })
      await save(res, file)
    }
  }
}

async function sfx() {
  for (const s of script.sfx) {
    const file = path.join(here, 'audio', 'sfx', `${s.id}.mp3`)
    if (fs.existsSync(file)) continue
    const res = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
      method: 'POST', headers: H,
      body: JSON.stringify({ text: s.prompt, duration_seconds: s.seconds, prompt_influence: 0.5 }),
    })
    await save(res, file)
  }
}

async function music() {
  const file = path.join(here, 'audio', 'music.mp3')
  if (fs.existsSync(file)) return
  let res = await fetch('https://api.elevenlabs.io/v1/music', {
    method: 'POST', headers: H,
    body: JSON.stringify({ prompt: script.music.prompt, music_length_ms: script.music.seconds * 1000 }),
  })
  if (!res.ok) {
    console.warn('music API failed', res.status, (await res.text()).slice(0, 200), '-> falling back to a 22 s looped pad')
    res = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
      method: 'POST', headers: H,
      body: JSON.stringify({ text: 'soft warm felt piano and ukulele loop, hopeful, calm, 96 bpm, seamless loop, no vocals', duration_seconds: 22, prompt_influence: 0.4 }),
    })
    await save(res, path.join(here, 'audio', 'music-loop.mp3'))
    return
  }
  await save(res, file)
}

if (what === 'vo' || what === 'all') await vo()
if (what === 'sfx' || what === 'all') await sfx()
if (what === 'music' || what === 'all') await music()
