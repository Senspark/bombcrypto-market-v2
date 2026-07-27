import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    open: true,
    proxy: {
      // House rental API, served by the marketplace backend (market-api).
      // The trailing slash matters: without it this prefix would also swallow
      // the client-side page routes /rentals and /rentals/mine.
      '/rental/': {
        target: process.env.VITE_MARKET_API_TARGET ?? 'http://localhost:3000',
        changeOrigin: true,
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
      '/api/rpc/bsc': {
        target: 'http://localhost:8302',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/api/rpc/polygon': {
        target: 'http://localhost:8302',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },

      '/local-api': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/local-api/, '/api/polygon'),
      },
      '/proxy-polygon': {
        target: 'https://market.bombcrypto.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy-polygon/, '/api/bsc'),
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
