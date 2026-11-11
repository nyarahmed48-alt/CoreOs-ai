import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

/**
 * CoreOS Device Check as one portable file.
 *
 * The same single-file treatment as the till, for the same reason twice over:
 * it has to run from a USB stick with no server and no internet, and it has
 * to open on a tablet where CoreCashier itself will not start.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __EDITION__: JSON.stringify("offline"),
    __POS_BUILD__: JSON.stringify(new Date().toISOString().slice(0, 16).replace("T", " ")),
  },
  build: {
    outDir: 'dist-check',
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: 100 * 1024 * 1024,
    rollupOptions: {
      input: 'check-portable.html',
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'check.js',
        assetFileNames: 'check[extname]',
      },
    },
  },
});
