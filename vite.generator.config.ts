import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

/**
 * The code generator, built the same way as the till: one entry, one chunk,
 * everything inlined by scripts/build-portable-pos.mjs into a single file.
 *
 * Built separately and deliberately never part of the site bundle. This is
 * the tool that signs licences; it belongs on the owner's own machine, beside
 * the key file, and nowhere else.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __POS_BUILD__: JSON.stringify(new Date().toISOString().slice(0, 16).replace("T", " ")),
  },
  build: {
    outDir: 'dist-gen',
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: 100 * 1024 * 1024,
    rollupOptions: {
      input: 'generator-portable.html',
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'gen.js',
        assetFileNames: 'gen[extname]',
      },
    },
  },
});
