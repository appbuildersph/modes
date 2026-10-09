// Draws the README benchmark charts from a bench-edge.mjs result file.
//
//   node scripts/bench-charts.mjs [docs/benchmarks/edge-2026-10-10.json]
//
// Writes a light and a dark SVG per chart next to the JSON, so the README can
// switch them with <picture> and prefers-color-scheme. Every mark comes from the
// raw rows in the JSON; nothing is typed in by hand, so the charts cannot drift
// from the measured numbers.

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const SRC = process.argv[2] || 'docs/benchmarks/edge-2026-10-10.json'
const OUT_DIR = dirname(SRC)
const report = JSON.parse(readFileSync(SRC, 'utf8'))
const rows = report.direct.rows

// GitHub's page colours, so the charts sit on the README without a visible box.
// Series blue validated against both surfaces (dataviz validate_palette.js: all checks pass).
const THEMES = {
  light: { surface: '#ffffff', ink: '#1f2328', ink2: '#59636e', muted: '#6e7781', grid: '#e1e0d9', axis: '#c3c2b7', series: '#2a78d6', band: 'rgba(42,120,214,0.10)' },
  dark: { surface: '#0d1117', ink: '#f0f6fc', ink2: '#c3c2b7', muted: '#9198a1', grid: '#262c34', axis: '#3d444d', series: '#3987e5', band: 'rgba(57,135,229,0.16)' },
}
const FONT = `system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
const fmt = (n, d = 2) => n.toFixed(d)

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

function svg(width, height, t, body, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}" font-family="${FONT}">
<title>${esc(title)}</title>
<rect width="${width}" height="${height}" fill="${t.surface}"/>
<g transform="translate(12 0)">
${body}
</g>
</svg>
`
}

// A bar with only its data end (right) rounded, anchored square on the baseline.
function bar(x0, y, w, h, r, fill) {
  r = Math.min(r, w, h / 2)
  return `<path d="M${x0},${y} H${x0 + w - r} Q${x0 + w},${y} ${x0 + w},${y + r} V${y + h - r} Q${x0 + w},${y + h} ${x0 + w - r},${y + h} H${x0} Z" fill="${fill}"/>`
}

// Chart 1: full reply time per mode, median bar with the min-max range as a whisker.
function replyTimeChart(t) {
  const modes = [
    ['hakbang', 'Hakbang'],
    ['kalma', 'Kalma'],
    ['pakinig', 'Pakinig'],
    ['none', 'No mode'],
  ]
  const W = 720
  const left = 96
  const right = 52
  const top = 64
  const rowH = 44
  const barH = 18
  const plotW = W - left - right
  const maxX = 6
  const x = (v) => left + (v / maxX) * plotW
  const H = top + modes.length * rowH + 40
  let body = ''
  body += `<text x="0" y="22" font-size="16" font-weight="600" fill="${t.ink}">Time for a full tutor reply, by learning mode</text>`
  body += `<text x="0" y="44" font-size="13" fill="${t.ink2}">Gemma 4 E2B on the edge Mac. Bar: median of 6 replies. Line: fastest to slowest.</text>`
  for (let s = 0; s <= maxX; s++) {
    body += `<line x1="${x(s)}" y1="${top - 6}" x2="${x(s)}" y2="${top + modes.length * rowH}" stroke="${s ? t.grid : t.axis}" stroke-width="1"/>`
    body += `<text x="${x(s)}" y="${top + modes.length * rowH + 20}" font-size="12" fill="${t.muted}" text-anchor="middle" style="font-variant-numeric: tabular-nums">${s} s</text>`
  }
  modes.forEach(([id, label], i) => {
    const times = rows.filter((r) => r.mode === id).map((r) => r.totalSec)
    const med = median(times)
    const lo = Math.min(...times)
    const hi = Math.max(...times)
    const cy = top + i * rowH + rowH / 2
    body += `<text x="${left - 12}" y="${cy + 4}" font-size="13" fill="${t.ink}" text-anchor="end">${label}</text>`
    body += bar(x(0), cy - barH / 2, x(med) - x(0), barH, 4, t.series)
    body += `<line x1="${x(lo)}" y1="${cy}" x2="${x(hi)}" y2="${cy}" stroke="${t.ink2}" stroke-width="2"/>`
    body += `<line x1="${x(lo)}" y1="${cy - 5}" x2="${x(lo)}" y2="${cy + 5}" stroke="${t.ink2}" stroke-width="2"/>`
    body += `<line x1="${x(hi)}" y1="${cy - 5}" x2="${x(hi)}" y2="${cy + 5}" stroke="${t.ink2}" stroke-width="2"/>`
    const labelX = Math.max(x(hi), x(med)) + 8
    const anchorEnd = labelX > W - 60
    body += `<text x="${anchorEnd ? x(med) - 8 : labelX}" y="${anchorEnd ? cy - barH / 2 - 6 : cy + 4}" font-size="13" font-weight="600" fill="${t.ink}" text-anchor="${anchorEnd ? 'end' : 'start'}">${fmt(med)} s</text>`
  })
  return { W, H, body, title: 'Median full tutor reply time per learning mode, with fastest-to-slowest range' }
}

// Chart 2: decode speed against reply length, one dot per measured reply.
function speedChart(t) {
  const W = 720
  const left = 56
  const right = 36
  const top = 84
  const plotH = 220
  const plotW = W - left - right
  const maxX = 300
  const maxY = 120
  const x = (v) => left + (v / maxX) * plotW
  const y = (v) => top + plotH - (v / maxY) * plotH
  const H = top + plotH + 52
  const long = rows.filter((r) => r.completionTokens >= 100).map((r) => r.decodeTokPerSec)
  const bandLo = Math.min(...long)
  const bandHi = Math.max(...long)
  let body = ''
  body += `<text x="0" y="22" font-size="16" font-weight="600" fill="${t.ink}">Generation speed settles at about ${Math.round(bandLo)}–${Math.round(bandHi)} tokens per second</text>`
  body += `<text x="0" y="44" font-size="13" fill="${t.ink2}">One dot per reply (${rows.length} replies). Short replies finish in tenths of a second, so their speed is timing noise.</text>`
  for (let v = 0; v <= maxY; v += 20) {
    body += `<line x1="${left}" y1="${y(v)}" x2="${W - right}" y2="${y(v)}" stroke="${v ? t.grid : t.axis}" stroke-width="1"/>`
    body += `<text x="${left - 8}" y="${y(v) + 4}" font-size="12" fill="${t.muted}" text-anchor="end" style="font-variant-numeric: tabular-nums">${v}</text>`
  }
  for (let v = 0; v <= maxX; v += 50) {
    body += `<text x="${x(v)}" y="${top + plotH + 18}" font-size="12" fill="${t.muted}" text-anchor="middle" style="font-variant-numeric: tabular-nums">${v}</text>`
  }
  body += `<text x="${left + plotW / 2}" y="${top + plotH + 40}" font-size="12" fill="${t.ink2}" text-anchor="middle">Reply length (tokens)</text>`
  body += `<text x="${left - 8}" y="${top - 12}" font-size="12" fill="${t.ink2}" text-anchor="end">tok/s</text>`
  body += `<rect x="${x(100)}" y="${y(bandHi)}" width="${x(maxX) - x(100)}" height="${y(bandLo) - y(bandHi)}" fill="${t.band}"/>`
  body += `<text x="${x(maxX) - 4}" y="${y(bandHi) - 8}" font-size="12" fill="${t.ink2}" text-anchor="end">Replies of 100+ tokens: ${fmt(bandLo, 1)}–${fmt(bandHi, 1)} tok/s</text>`
  for (const r of rows) {
    body += `<circle cx="${fmt(x(r.completionTokens), 1)}" cy="${fmt(y(r.decodeTokPerSec), 1)}" r="4.5" fill="${t.series}" stroke="${t.surface}" stroke-width="2"/>`
  }
  return { W, H, body, title: 'Decode speed in tokens per second against reply length, one dot per reply' }
}

for (const [name, chart] of [['reply-time', replyTimeChart], ['decode-speed', speedChart]]) {
  for (const [mode, t] of Object.entries(THEMES)) {
    const { W, H, body, title } = chart(t)
    const file = join(OUT_DIR, `${name}-${mode}.svg`)
    writeFileSync(file, svg(W, H, t, body, title))
    console.log(file)
  }
}
