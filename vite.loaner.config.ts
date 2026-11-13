import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

/**
 * The loaner build.
 *
 * A complete till that never asks for a licence, for the tablet handed to a
 * shop while their own is being repaired. Unlike the demo, nothing it prints
 * is stamped and nothing about it is pretend: the shop trades on it for real
 * and takes its records home afterwards.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __EDITION__: JSON.stringify("loaner"),
    __POS_BUILD__: JSON.stringify(new Date().toISOString().slice(0, 16).replace("T", " ")),
  },
  build: {
    outDir: 'dist-loaner',
    emptyOutDir: true,
    cssCodeSplit: false,
    // Everything has to end up in the one file, so nothing may be emitted as
    // a side-car asset.
    assetsInlineLimit: 100 * 1024 * 1024,
    rollupOptions: {
      input: 'loaner-portable.html',
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'loaner.js',
        assetFileNames: 'loaner[extname]',
      },
    },
  },
});
