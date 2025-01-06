import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, // Use a different port than the main app
    strictPort: true, // Don't try other ports if 5174 is taken
    hmr: {
      overlay: false // Disable the error overlay
    }
  }
})
