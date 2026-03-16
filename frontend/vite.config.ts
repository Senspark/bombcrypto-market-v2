import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3004,
    open: true,
    proxy: {
      // Open-Source Community: Pulse Dashboard Local Proxy
      // Bypasses browser CORS restrictions by routing requests through Vite
      // directly to the live production endpoint.
      '/pulse-api/bsc': {
        target: 'https://market.bombcrypto.io/api/bsc',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/pulse-api\/bsc/, ''),
        secure: true,
      },
      '/api/bsc': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bsc/, ''),
      },
      '/api/polygon': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/polygon/, ''),
      },
      '/local-api': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/local-api/, ''),
      },
      '/proxy-polygon': {
        target: 'https://market-api-polygon.bombcrypto.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy-polygon/, ''),
        secure: true,
      },
      '/proxy-bnb': {
        target: 'https://market-api.bombcrypto.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy-bnb/, ''),
        secure: true,
      },
    },
  },
  build: {
    outDir: 'build',
    sourcemap: true
  },
  define: {
    'process.env': {},
    'global': 'globalThis',
  },
  resolve: {
    alias: {
      process: 'process/browser',
      '@': path.resolve(__dirname, './src'),
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  }
})
