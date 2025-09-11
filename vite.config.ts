import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: 'src/frontend',
  publicDir: 'public',
  envDir: '../../',
  build: {
    outDir: '../../dist/frontend',
    emptyOutDir: true,
  },
  plugins: [
    react(),
  ],
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  resolve: {
    alias: {
      'declarations': path.resolve(__dirname, 'src/declarations'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4943',
        changeOrigin: true,
      },
    },
  },
});