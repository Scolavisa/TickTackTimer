import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Serve the existing web icons from the root URL
  publicDir: 'assets/appicons/Web',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'TickTackTimer',
        short_name: 'TickTack',
        description: 'Clock precision meter for clock repair technicians',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable any'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,ico}']
      }
    })
  ]
})
