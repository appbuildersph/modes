// Rasterize the mascot SVG into PWA PNG icons (192/512 + maskable).
// Run: node scripts/generate-icons.mjs
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(resolve(root, 'public/mascot.svg'))

// Maskable needs a filled safe area; mascot.svg already paints a full bg rect.
const out = [
  ['public/pwa-192x192.png', 192],
  ['public/pwa-512x512.png', 512],
  ['public/maskable-512x512.png', 512],
]

for (const [file, size] of out) {
  await sharp(src, { density: 384 })
    .resize(size, size, { fit: 'cover', background: '#FBF1DA' })
    .png()
    .toFile(resolve(root, file))
  console.log('wrote', file)
}
