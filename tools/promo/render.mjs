// Deterministic render: Chrome virtual time advances 1/30 s per frame, each frame is screenshotted
// and piped to ffmpeg, then VO + SFX + music are mixed in. Videos inside the page are seeked per frame.
// Usage: node render.mjs en|tl [vert] [--no-audio] [--seconds N]
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import { spawn, execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const { chromium } = createRequire(import.meta.url)('playwright')
const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.dirname(here)
const lang = process.argv[2] === 'tl' ? 'tl' : 'en'
const vert = process.argv.includes('vert')
const noAudio = process.argv.includes('--no-audio')
const secArg = process.argv.indexOf('--seconds')
const script = JSON.parse(fs.readFileSync(path.join(here, 'script.json'), 'utf8'))
const END = secArg > -1 ? Number(process.argv[secArg + 1]) : script.beats.at(-1).end
const FPS = 30
const W = vert ? 1080 : 1920, H = vert ? 1920 : 1080
const out = path.join(here, 'out'); fs.mkdirSync(out, { recursive: true })
const sufArg = process.argv.indexOf('--suffix')
const suffix = sufArg > -1 ? process.argv[sufArg + 1] : ''
const audioOnly = process.argv.includes('--audio-only')
const voArg = process.argv.indexOf('--vo-dir')
const VO_DIR = voArg > -1 ? process.argv[voArg + 1] : 'audio'
const name = `sibol-promo-${lang}${vert ? '-9x16' : '-16x9'}`

const MIME = { '.html': 'text/html', '.json': 'application/json', '.webm': 'video/webm', '.mp4': 'video/mp4', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg' }
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end() }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' })
  fs.createReadStream(p).pipe(res)
}).listen(0)
const port = server.address().port

const raw = path.join(out, `${name}.raw.mp4`)
if (!audioOnly) {
const browser = await chromium.launch(process.env.PROMO_CHROME ? { executablePath: process.env.PROMO_CHROME } : {})
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
await page.goto(`http://127.0.0.1:${port}/${path.basename(here)}/comp.html?lang=${lang}&v=${vert ? 1 : 0}`)
await page.waitForFunction(() => window.__ready, null, { timeout: 60000 })

const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'fast', '-crf', '16', '-pix_fmt', 'yuv420p', raw], { stdio: ['pipe', 'inherit', 'inherit'] })
const frames = Math.round(END * FPS)
const t0 = Date.now()
for (let i = 0; i < frames; i++) {
  const t = i / FPS
  await page.evaluate((t) => window.__frame(t), t)
  const buf = await page.screenshot({ type: 'jpeg', quality: 92, animations: 'allow', caret: 'initial' })
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r))
  if (i % 150 === 0) console.log(name, 'frame', i, '/', frames, ((Date.now() - t0) / 1000).toFixed(0) + 's')
}
ff.stdin.end()
await new Promise((r) => ff.on('close', r))
await browser.close(); server.close()
console.log('frames done', raw)
} else { server.close() }

const a = path.join(here, 'audio')
const inputs = ['-i', raw]
const filters = []
const mixes = []
let n = 1
function add(file, atSec, vol = 1, pre = '') {
  if (!fs.existsSync(file)) { console.warn('missing audio', path.relative(here, file)); return }
  inputs.push('-i', file)
  filters.push(`[${n}:a]${pre}adelay=${Math.round(atSec * 1000)}|${Math.round(atSec * 1000)},volume=${vol}[a${n}]`)
  mixes.push(`[a${n}]`); n++
}
if (!noAudio) {
  const B = Object.fromEntries(script.beats.map((b) => [b.id, b]))
  // Voice lines are sped up 8 percent so the longest Tagalog line still fits its beat.
  for (const b of script.beats) if (b[lang]) add(path.join(here, VO_DIR, lang, `${b.id}.mp3`), b.start + 0.35, 1, 'atempo=1.08,')
  const sfx = (id) => path.join(a, 'sfx', `${id}.mp3`)
  add(sfx('hit'), 2.4, 0.9)
  add(sfx('whoosh'), B.problem.start, 0.5)
  add(sfx('tap'), B.splash.start + 3.9, 0.8)
  add(sfx('whoosh'), B.local.start, 0.5)
  add(sfx('hit'), B.question.start, 0.7)
  add(sfx('note'), B.kalma.start, 0.8)
  add(sfx('whoosh'), B.pakinig.start, 0.5)
  add(sfx('tap'), B.hakbang.start + 1.2, 0.7); add(sfx('tap'), B.hakbang.start + 2.4, 0.7); add(sfx('tap'), B.hakbang.start + 3.6, 0.7)
  add(sfx('chime'), B.proof.start + 0.2, 0.8)
  add(sfx('chime'), B.end.start + 0.3, 0.9)
  const music = fs.existsSync(path.join(a, 'music.mp3')) ? path.join(a, 'music.mp3') : path.join(a, 'music-loop.mp3')
  if (fs.existsSync(music)) {
    inputs.push('-stream_loop', '3', '-i', music)
    filters.push(`[${n}:a]atrim=0:${END},volume='if(between(t,${B.kalma.start},${B.kalma.end}),0.045,0.1)':eval=frame,afade=t=out:st=${END - 2.5}:d=2.5[a${n}]`)
    mixes.push(`[a${n}]`); n++
  }
}
const final = path.join(out, `${name}${suffix}.mp4`)
if (mixes.length) {
  filters.push(`${mixes.join('')}amix=inputs=${mixes.length}:normalize=0:dropout_transition=0,alimiter=limit=0.95[aout]`)
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', filters.join(';'), '-map', '0:v', '-map', '[aout]', '-t', String(END), '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', final], { stdio: 'inherit' })
} else {
  fs.copyFileSync(raw, final)
}
console.log('done', final)
