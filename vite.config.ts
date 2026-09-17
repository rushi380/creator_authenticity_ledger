import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import path from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    // The Midnight SDK ships wasm-bindgen ES modules that import their .wasm
    // binary directly (including symbols like __wbindgen_start); this plugin
    // wires those imports up correctly in the browser bundle.
    wasm(),
    // The Midnight SDK (indexer provider, scale-codec, level) leans on node
    // builtins; polyfill them so the browser bundle runs without shims that
    // throw at runtime.
    nodePolyfills({
      globals: { Buffer: true, global: true, process: true },
      protocolImports: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@managed/contract': path.resolve(__dirname, 'managed/contract/index.js'),
      // isomorphic-ws resolves to a browser build without the named WebSocket
      // export the indexer provider imports; map it straight to the global.
      'isomorphic-ws': path.resolve(__dirname, 'src/polyfills/ws.ts'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1600,
    // es2022 (top-level await) is required by the wasm-bindgen ESM glue.
    target: 'es2022',
  },
  // Required for Midnight SDK WASM modules
  optimizeDeps: {
    exclude: [
      '@midnight-ntwrk/compact-runtime',
      '@midnight-ntwrk/onchain-runtime-v3',
      '@midnight-ntwrk/ledger-v8',
    ],
  },
  assetsInclude: ['**/*.wasm'],
});
