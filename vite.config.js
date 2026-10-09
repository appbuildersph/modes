import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Offline-first: precache the whole built shell + bundled content.json.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png', 'maskable-512x512.png'],
      workbox: {
        cleanupOutdatedCaches: true,
        // mp4/webm: the silent Kalma mascot clip (~90 KB each).
        globPatterns: ['**/*.{js,css,html,json,png,svg,webp,wav,mp3,mp4,webm,webmanifest,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        // Without this, a reload while offline never reaches the precached
        // shell — the navigation request just falls through to the network.
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
      manifest: {
        name: 'SIBOL',
        short_name: 'SIBOL',
        description:
          'Offline-first math study companion for Filipino learners (DepEd MATATAG).',
        theme_color: '#F7D26A',
        background_color: '#FBF1DA',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  // On localhost the app treats /api as same-origin (resolveEdgeBase returns ''),
  // but Vite has no /api handlers, so TTS and the tutor silently fell back to the
  // on-device voice. Forward them to the edge hub (scripts/edge-hub.mjs).
  // changeOrigin must stay false: allowedOrigin() in api/_shared.js compares the
  // Origin with the Host, and the string shorthand rewrites Host (403 origin_not_allowed).
  server: { proxy: { '/api': { target: 'http://127.0.0.1:8787', changeOrigin: false } } },
  preview: { proxy: { '/api': { target: 'http://127.0.0.1:8787', changeOrigin: false } } },
})
