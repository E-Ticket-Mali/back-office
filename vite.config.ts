import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: Number(process.env.PORT) || 5900,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target:
          process.env.VITE_BACKEND_URL ||
          'http://bukdj0lqd5p38mw4ne3x6dfg.178.105.169.55.sslip.io',
        changeOrigin: true,
      },
    },
  },
})
