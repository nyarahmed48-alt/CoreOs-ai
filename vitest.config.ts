import { defineConfig } from "vitest/config";

/**
 * Node, not a browser: these tests cover the arithmetic a shop's money passes
 * through and the migration its data passes through once. Both must be right
 * before anything renders, and neither needs a DOM.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
