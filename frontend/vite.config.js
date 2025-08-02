import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
  // ✅ This handles client-side routing fallback on Render
  // (and locally when testing with `npm run preview`)
  preview: {
    // Required for SPA (single-page app) fallback on refresh
    fallback: true,
  },
});
