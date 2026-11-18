/**
 * Builds LUNAR COMMAND as ONE self-contained HTML file (JS and CSS inlined)
 * that opens directly from disk: `npm run build:lunar` → dist-lunar/LunarCommand.html
 */
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, type Plugin } from "vite";

function inlineEverything(): Plugin {
  return {
    name: "lunar-inline",
    enforce: "post",
    generateBundle(_opts, bundle) {
      const html = Object.values(bundle).find((f) => f.fileName.endsWith(".html"));
      if (!html || html.type !== "asset") return;
      let src = String(html.source);
      for (const [name, file] of Object.entries(bundle)) {
        if (file.type === "chunk" && name.endsWith(".js")) {
          const code = file.code.replace(/<\/script/g, "<\\/script");
          src = src.replace(new RegExp(`<script[^>]*src="[^"]*${path.basename(name).replace(/\./g, "\\.")}"[^>]*></script>`), () => `<script type="module">${code}</script>`);
          delete bundle[name];
        } else if (file.type === "asset" && name.endsWith(".css")) {
          src = src.replace(new RegExp(`<link[^>]*href="[^"]*${path.basename(name).replace(/\./g, "\\.")}"[^>]*>`), () => `<style>${String(file.source)}</style>`);
          delete bundle[name];
        }
      }
      html.source = src;
      html.fileName = "LunarCommand.html";
    },
  };
}

export default defineConfig({
  root: __dirname,
  base: "./",
  plugins: [react(), tailwindcss(), inlineEverything()],
  build: {
    outDir: path.resolve(__dirname, "../dist-lunar"),
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    modulePreload: false,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
