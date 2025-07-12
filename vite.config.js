import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      '/api/cycling': {
        target: 'https://cycling-scrapes.s3.us-east-1.amazonaws.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/cycling/, ''),
        secure: true
      }
    }
  }
})