import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss'

export default defineConfig({
  plugins: [
    react(),
  ],
  css: {
    postcss: {
      plugins: [
        tailwindcss(), 
      ],
    },
  },
  server: {
    allowedHosts: ['collide-imaginary-thermos.ngrok-free.dev'],
    // 🔥 Agregamos el Proxy
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Apunta a tu Next.js
        changeOrigin: true,
      }
    }
  }
})