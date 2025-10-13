import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/api/sbdb': {
        target: 'https://ssd-api.jpl.nasa.gov',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/sbdb/, '/sbdb.api'),
      },
      '/api/neo': {
        target: 'https://api.nasa.gov/neo/rest/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/neo/, ''),
      },
    },
  },
})
