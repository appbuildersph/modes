// Rasterize the SIBOL logo into PWA PNG icons (192/512 + maskable + iOS).
// Run: node scripts/generate-icons.mjs
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
// Full-resolution source stays in src/assets (not imported), so the large
// original is never precached by the service worker.
const src = resolve(root, 'src/assets/sibol/sibol-icon-source.png')
// Sampled from the logo's blue edge, so padding (maskable, og) blends in.
const bg = '#0066FE'

const out = [
  ['public/pwa-192x192.png', 192, 1],
  ['public/pwa-512x512.png', 512, 1],
  // iOS ignores manifest icons when apple-touch-icon is present; 180 is its size.
  ['public/apple-touch-icon.png', 180, 1],
  // Maskable crops to an 80% circle, so shrink the badge into the safe zone.
  ['public/maskable-512x512.png', 512, 0.8],
]

for (const [file, size, scale] of out) {
  const inner = Math.round(size * scale)
  const pad = Math.floor((size - inner) / 2)
  await sharp(src)
    .resize(inner, inner, { fit: 'cover' })
    .extend({ top: pad, bottom: size - inner - pad, left: pad, right: size - inner - pad, background: bg })
    .flatten({ background: bg })
    .png()
    .toFile(resolve(root, file))
  console.log('wrote', file)
}

// Link preview image (X, LinkedIn): the logo centred on its own blue.
const og = { w: 1200, h: 630 }
const logo = await sharp(src).resize(og.h, og.h).png().toBuffer()
await sharp({ create: { width: og.w, height: og.h, channels: 3, background: bg } })
  .composite([{ input: logo, left: Math.round((og.w - og.h) / 2), top: 0 }])
  .png()
  .toFile(resolve(root, 'public/og.png'))
console.log('wrote public/og.png')
