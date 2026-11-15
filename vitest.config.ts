import { defineConfig } from "vitest/config";

/**
 * The runner, waiting for something to run.
 *
 * The tests that used to live here were the till's — the arithmetic a shop's
 * money passes through and the migration its data passes through once — and
 * they moved with it to the CoreCashier repository. This stays so the site
 * can grow its own without ceremony, and passes on an empty suite rather
 * than failing a deploy over one.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    passWithNoTests: true,
  },
});
