import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

/**
 * The Cloud build.
 *
 * The subscription edition. It signs in to a CoreOs account, keeps the shop's
 * books in the office database as well as on the tablet, and can be stopped
 * from a desk. It carries on working with the connection out — that is most
 * of the day in these shops — but it will not run as a free offline copy.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __EDITION__: JSON.stringify("cloud"),
    __POS_BUILD__: JSON.stringify(new Date().toISOString().slice(0, 16).replace("T", " ")),
  },
  build: {
    outDir: 'dist-cloud',
    emptyOutDir: true,
    cssCodeSplit: false,
    // Everything has to end up in the one file, so nothing may be emitted as
    // a side-car asset.
    assetsInlineLimit: 100 * 1024 * 1024,
    rollupOptions: {
      input: 'cloud-portable.html',
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'cloud.js',
        assetFileNames: 'cloud[extname]',
      },
    },
  },
});
