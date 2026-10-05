import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Landing page: fully static, independent Vite project. No backend proxy, no env coupling
// to the admin app -- see back-office/landing (Story 7.1).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5910,
    strictPort: true,
  },
})
