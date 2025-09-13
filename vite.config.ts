import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(async () => {
  const tailwindcss = (await import('@tailwindcss/vite')).default;

  return {
  root: 'src/frontend',
  publicDir: 'public',
  envDir: '../../',
  build: {
    outDir: '../../dist/frontend',
    emptyOutDir: true,
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/frontend/src'),
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
  };
});