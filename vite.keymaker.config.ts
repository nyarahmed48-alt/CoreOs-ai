import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

/**
 * The Key Maker, built the same way as the till: one entry, one chunk,
 * everything inlined by scripts/build-portable-pos.mjs into a single file
 * that works with no server and no internet.
 *
 * Never part of the site bundle, never hosted, never shipped to a shop. This
 * is the only thing that can mint a technician key.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __EDITION__: JSON.stringify("offline"),
    __POS_BUILD__: JSON.stringify(new Date().toISOString().slice(0, 16).replace("T", " ")),
  },
  build: {
    outDir: 'dist-keys',
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: 100 * 1024 * 1024,
    rollupOptions: {
      input: 'keymaker-portable.html',
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'keys.js',
        assetFileNames: 'keys[extname]',
      },
    },
  },
});
