import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3004, // client port
    open: true,
    proxy: {
      // Local server proxy
      '/local-api': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/local-api/, ''),
      },
      // Production proxies
      '/proxy-polygon': {
        target: 'https://market.bombcrypto.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy-polygon/, '/api/polygon'),
        secure: true,
      },
      '/proxy-bnb': {
        target: 'https://market.bombcrypto.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy-bnb/, '/api/bsc'),
        secure: true,
      },
    },
  },
  build: {
    outDir: 'build',
    sourcemap: true
  },
  define: {
    // Polyfills for Node.js globals used by web3 and other libraries
    'process.env': {},
    'global': 'globalThis',
  },
  resolve: {
    alias: {
      // Some packages look for process/browser
      process: 'process/browser',
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis'
      }
    }
  }
})