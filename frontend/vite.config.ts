import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    open: true,
    proxy: {
      '/api/bsc': {
        // target: 'http://localhost:8200',
        target: 'http://192.168.1.102:9022',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bsc/, ''),
      },
      '/api/polygon': {
        // target: 'http://localhost:8200',
        target: 'http://192.168.1.102:9023',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/polygon/, ''),
      },
      '/api/rpc/bsc': {
        target: 'http://localhost:8105',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/api/rpc/polygon': {
        target: 'http://localhost:8105',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
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
