import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, createLogger } from 'vite'

const isDev = process.env.NODE_ENV !== 'production'

// --- Optional lightweight error console in dev only ---
const investorIQErrorOverlay = {
  name: 'investoriq-error-overlay',
  apply: 'serve',
  transformIndexHtml(html) {
    if (!isDev) return html
    const script = `
      window.addEventListener('error', (e) => {
        console.error('[InvestorIQ Runtime Error]', e.message, e.filename, e.lineno);
      });
      window.addEventListener('unhandledrejection', (e) => {
        console.error('[InvestorIQ Promise Error]', e.reason);
      });
    `
    return {
      html,
      tags: [
        {
          tag: 'script',
          attrs: { type: 'module' },
          children: script,
          injectTo: 'head',
        },
      ],
    }
  },
}

// --- Custom logger: suppress noisy PostCSS warnings ---
const logger = createLogger()
const originalError = logger.error
logger.error = (msg, options) => {
  if (options?.error?.toString().includes('CssSyntaxError: [postcss]')) return
  originalError(msg, options)
}

// --- MAIN CONFIG EXPORT ---
export default defineConfig({
  customLogger: logger,
  plugins: [react(), investorIQErrorOverlay],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
    },
    extensions: ['.jsx', '.js', '.tsx', '.ts', '.json'],
  },

  server: {
    port: 5173,
    cors: true,
    open: true,
    allowedHosts: true,
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },

  preview: {
    port: 4173,
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: { manualChunks: undefined },
      external: [],
    },
  },

  // 🔥 THIS IS THE FIX FOR BLANK PAGE ON VERCEL
  base: '',

  define: {
    'process.env': process.env,
  },
})
