import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: { manualChunks: (id) => (/node_modules\/(three|@react-three|three-stdlib|troika|camera-controls|maath|meshline|stats)/.test(id) ? 'three' : /node_modules\/(react|react-dom|scheduler)\//.test(id) ? 'react' : undefined) },
    },
  },
})
