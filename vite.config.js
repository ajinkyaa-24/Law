import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    proxy: {
      '/api/news-topstories': {
        target: 'https://legal.economictimes.indiatimes.com/rss/topstories',
        changeOrigin: true,
        rewrite: () => ''
      },
      '/api/news-litigation': {
        target: 'https://legal.economictimes.indiatimes.com/rss/litigation',
        changeOrigin: true,
        rewrite: () => ''
      },
      '/api/news-policy': {
        target: 'https://legal.economictimes.indiatimes.com/rss/law-policy',
        changeOrigin: true,
        rewrite: () => ''
      },
      '/api/ml': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ml/, '/api')
      }
    }
  }
})
