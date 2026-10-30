import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

/**
 * The owner's console, built the same way as the till: one entry, one chunk,
 * everything inlined by scripts/build-portable-pos.mjs into a single file.
 *
 * It is built separately and deliberately never enters the site bundle — this
 * is the file that decides which tablets may sell, and it belongs on one
 * phone, not on a web server.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __EDITION__: JSON.stringify("offline"),
    __POS_BUILD__: JSON.stringify(new Date().toISOString().slice(0, 16).replace("T", " ")),
  },
  build: {
    outDir: 'dist-ceo',
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: 100 * 1024 * 1024,
    rollupOptions: {
      input: 'ceo-portable.html',
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'ceo.js',
        assetFileNames: 'ceo[extname]',
      },
    },
  },
});
