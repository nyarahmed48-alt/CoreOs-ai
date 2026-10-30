import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

/**
 * The demonstration build.
 *
 * The same till in every respect but two: it never asks for a licence, and
 * everything it prints is stamped. It is the copy that goes on a tablet in a
 * bag and gets opened on a shopkeeper's counter.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __EDITION__: JSON.stringify("demo"),
    __POS_BUILD__: JSON.stringify(new Date().toISOString().slice(0, 16).replace("T", " ")),
  },
  build: {
    outDir: 'dist-demo',
    emptyOutDir: true,
    cssCodeSplit: false,
    // Everything has to end up in the one file, so nothing may be emitted as
    // a side-car asset.
    assetsInlineLimit: 100 * 1024 * 1024,
    rollupOptions: {
      input: 'demo-portable.html',
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'demo.js',
        assetFileNames: 'demo[extname]',
      },
    },
  },
});
