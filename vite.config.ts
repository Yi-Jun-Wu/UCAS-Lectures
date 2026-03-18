import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: './', // Use a relative path for all assets to ensure correct loading in Electron
  plugins: [
    react(),
    tailwindcss(),
  ],
})
