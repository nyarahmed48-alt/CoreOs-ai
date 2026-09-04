/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The routing table, checked against itself and against the filesystem.
 *
 * Netlify reads the route table from two places. When both exist,
 * public/_redirects wins and netlify.toml is ignored — so a rule present in
 * only the toml is a route that looks configured, reviews as configured, and
 * 404s in production. This project has already been bitten by that twice: it is
 * how /api/lab/health came back as the SPA shell, which the console reports as
 * "the sandbox isn't running on this deployment" — a message that sends you
 * looking at the provider, the key and the model before the routing.
 *
 * A rule pointing at a function that does not exist fails the same silent way.
 *
 * Both are cheap to check and neither shows up in a typecheck, so they are
 * checked here instead of being left to a comment asking people to be careful.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** [from, to] for every rule in public/_redirects, comments and blanks dropped. */
function parseRedirects(): Array<[string, string]> {
  return fs
    .readFileSync(path.join(repo, "public/_redirects"), "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const [from, to] = line.split(/\s+/);
      return [from, to] as [string, string];
    });
}

/** The same, from the [[redirects]] blocks in netlify.toml. */
function parseToml(): Array<[string, string]> {
  const text = fs.readFileSync(path.join(repo, "netlify.toml"), "utf8");
  const rules: Array<[string, string]> = [];
  for (const block of text.split("[[redirects]]").slice(1)) {
    const from = block.match(/^\s*from\s*=\s*"([^"]+)"/m)?.[1];
    const to = block.match(/^\s*to\s*=\s*"([^"]+)"/m)?.[1];
    if (from && to) rules.push([from, to]);
  }
  return rules;
}

describe("Netlify routing", () => {
  it("declares the same routes in _redirects and netlify.toml", () => {
    /* Order included: these are matched top to bottom, so the SPA catch-all
       moving up the list is as breaking as a rule going missing. */
    assert.deepEqual(
      parseRedirects(),
      parseToml(),
      "public/_redirects wins over netlify.toml, so the two drifting means the file that is read is not the file that was reviewed",
    );
  });

  it("points every rule at a function that exists", () => {
    for (const [from, to] of parseRedirects()) {
      if (!to.startsWith("/.netlify/functions/")) continue;
      const name = to.replace("/.netlify/functions/", "");
      const file = path.join(repo, "netlify/functions", `${name}.ts`);
      assert.ok(
        fs.existsSync(file),
        `${from} routes to ${name}, but netlify/functions/${name}.ts does not exist — Netlify would fall through to the SPA shell and answer HTML`,
      );
    }
  });

  it("keeps the SPA catch-all last", () => {
    const rules = parseRedirects();
    const catchAll = rules.findIndex(([from]) => from === "/*");
    assert.notEqual(catchAll, -1, "the SPA catch-all is what makes deep links survive a refresh");
    assert.equal(
      catchAll,
      rules.length - 1,
      "anything below the catch-all is unreachable: /* matches first and answers with index.html",
    );
  });

  it("routes every API path the site's own code serves", () => {
    /* The Worker and the Express server both grew endpoints that Netlify never
       had a rule for. Whichever host is live should serve the same site. */
    const routed = new Set(parseRedirects().map(([from]) => from));
    for (const required of [
      "/api/lab/chat",
      "/api/lab/agents",
      "/api/lab/health",
      "/api/lab/settings",
      "/admin",
    ]) {
      assert.ok(routed.has(required), `${required} has no Netlify rule, so it would return the SPA shell`);
    }
  });
});
