import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(async ({ mode }) => {
  const tailwindcss = (await import('@tailwindcss/vite')).default;

  // Load environment variables from project root
  const env = loadEnv(mode, __dirname, 'VITE_');

  // Debug environment variables
  console.log('Vite config environment variables:', {
    VITE_CANISTER_ID_BACKEND: env.VITE_CANISTER_ID_BACKEND,
    VITE_DFX_NETWORK: env.VITE_DFX_NETWORK,
    VITE_CANISTER_ID_MOCK_CKTESTBTC_LEDGER: env.VITE_CANISTER_ID_MOCK_CKTESTBTC_LEDGER,
    VITE_CANISTER_ID_MOCK_CKTESTBTC_MINTER: env.VITE_CANISTER_ID_MOCK_CKTESTBTC_MINTER,
    VITE_CANISTER_ID_MOCK_ICP_LEDGER: env.VITE_CANISTER_ID_MOCK_ICP_LEDGER,
  });

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
    // Required for auto-generated backend declarations
    // These declarations use process.env and cannot be modified per CLAUDE.md
    'process.env.CANISTER_ID_BACKEND': JSON.stringify(env.VITE_CANISTER_ID_BACKEND),
    'process.env.DFX_NETWORK': JSON.stringify(env.VITE_DFX_NETWORK),
    // Mock canister environment variables for DFX-generated declarations
    'process.env.CANISTER_ID_MOCK_CKTESTBTC_LEDGER': JSON.stringify(env.VITE_CANISTER_ID_MOCK_CKTESTBTC_LEDGER),
    'process.env.CANISTER_ID_MOCK_CKTESTBTC_MINTER': JSON.stringify(env.VITE_CANISTER_ID_MOCK_CKTESTBTC_MINTER),
    'process.env.CANISTER_ID_MOCK_ICP_LEDGER': JSON.stringify(env.VITE_CANISTER_ID_MOCK_ICP_LEDGER),
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