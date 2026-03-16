import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // No dev proxy needed when using a full VITE_BASE_URL (e.g. http://72.61.236.154:4132)
})
