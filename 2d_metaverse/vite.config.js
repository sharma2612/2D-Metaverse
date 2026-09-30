import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Split the heaviest libraries into their own chunks so the browser
        // caches them independently of app code. A deploy only invalidates the
        // app chunk, not React itself.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', '@firebase/auth'],
          livekit: ['livekit-client'],
          motion: ['framer-motion', 'react-scroll-parallax'],
        },
      },
    },
  },
})