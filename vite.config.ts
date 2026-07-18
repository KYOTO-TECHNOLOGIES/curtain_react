import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // Listen on all local IP addresses
    proxy: {
      '/api': {
        target: 'http://187.127.171.93:8110/api/',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, ''), // Commented out to preserve the /api prefix
      }
    }
  },
})
