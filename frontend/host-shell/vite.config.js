import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // dev-only convenience; in prod the browser talks to svc-api-gateway directly
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
})
