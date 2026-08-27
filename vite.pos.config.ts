import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

/**
 * The portable till build.
 *
 * One entry, one chunk, one stylesheet, everything inlined — see
 * scripts/build-portable-pos.mjs, which folds the output into a single HTML
 * file that runs from a USB stick with no server and no internet.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist-pos',
    emptyOutDir: true,
    cssCodeSplit: false,
    // Everything has to end up in the one file, so nothing may be emitted as
    // a side-car asset.
    assetsInlineLimit: 100 * 1024 * 1024,
    rollupOptions: {
      input: 'pos-portable.html',
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'pos.js',
        assetFileNames: 'pos[extname]',
      },
    },
  },
});
