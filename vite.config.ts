import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: './', // Use a relative path for all assets to ensure correct loading in Electron
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'UCAS 讲座周历',
        short_name: 'UCAS Calendar',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'favicon.svg',
            type: 'image/svg+xml'
          }
        ]
      }
    }),
  ],
})
