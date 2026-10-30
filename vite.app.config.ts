import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

/**
 * CoreCashier, built to be hosted and installed.
 *
 * Separate from the website build on purpose: this is the product a shop puts
 * on its counter, and it shares nothing with coreosai.netlify.app — not a
 * route, not a bundle, not a service worker. Drop `dist-app/` on any static
 * host over https and a tablet can install it.
 *
 * Relative paths throughout (`base: "./"`), so it runs from the root of a
 * domain or a folder inside one without being rebuilt.
 */
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  publicDir: 'app-public',
  define: {
    __EDITION__: JSON.stringify("offline"),
    __POS_BUILD__: JSON.stringify(new Date().toISOString().slice(0, 16).replace("T", " ")),
  },
  build: {
    outDir: 'dist-app',
    emptyOutDir: true,
    rollupOptions: {
      input: 'app-index.html',
    },
  },
});
