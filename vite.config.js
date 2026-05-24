import { defineConfig } from 'vite'

export default defineConfig({
  base: '/Verdant/',
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
  },
})
