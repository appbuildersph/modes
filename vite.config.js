import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Offline-first: precache the whole built shell + bundled content.json.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['nova.png', 'favicon.svg', 'mascot.svg', 'pwa-192x192.png', 'pwa-512x512.png', 'maskable-512x512.png'],
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,json,png,svg,webp,wav,mp3,webmanifest}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        // Without this, a reload while offline never reaches the precached
        // shell — the navigation request just falls through to the network.
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
      manifest: {
        name: 'Gabay',
        short_name: 'Gabay',
        description:
          'Offline-first math study companion for Filipino learners (DepEd MATATAG).',
        theme_color: '#F7D26A',
        background_color: '#FBF1DA',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'nova.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'nova.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'nova.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'mascot.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
    }),
  ],
})
