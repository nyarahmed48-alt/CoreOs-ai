/**
 * Open this when Ideal AI goes quiet.
 *
 * It makes one real call down the same path the chat widget uses, and crawls
 * the site the same way, then says which half failed — so a missing key, an
 * exhausted free tier, a retired model id and a site the crawler cannot read
 * are told apart from a browser instead of guessed at.
 *
 * Safe to leave public: it returns states, status codes and page paths. Never
 * the key, never the model ids, never the provider's own error text.
 */

import type { Config, Context } from "@netlify/functions";
import { getSiteKnowledge } from "../../lib/knowledge.mts";

const DEFAULT_MODEL = "poolside/laguna-xs-2.1:free";
const PROBE_TIMEOUT_MS = 12_000;

export default async (request: Request, context: Context) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(JSON.stringify({ error: "METHOD_NOT_ALLOWED" }), {
      status: 405,
      headers: { "content-type": "application/json", allow: "GET" },
    });
  }

  const apiKey = Netlify.env.get("OPENROUTER_API_KEY");
  const models = (Netlify.env.get("OPENROUTER_MODEL") || DEFAULT_MODEL)
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);

  // What the assistant knows is half of whether it works, so report it first:
  // a bot answering "I don't know" with a healthy key is usually an empty crawl.
  const siteUrl = context.site?.url || Netlify.env.get("URL") || new URL(request.url).origin;
  const knowledge = await getSiteKnowledge(siteUrl);

  const report: Record<string, unknown> = {
    service: "ideal-ai",
    keyConfigured: Boolean(apiKey),
    modelsConfigured: models.length,
    knowledge: {
      source: knowledge.source,
      pagesIndexed: knowledge.pages.length,
      paths: knowledge.pages.map((page) => page.path),
      crawledAt: knowledge.crawledAt,
    },
    checkedAt: new Date().toISOString(),
  };

  if (!apiKey) {
    report.state = "not-configured";
    report.detail = "OPENROUTER_API_KEY is not set on this deployment.";
    return new Response(JSON.stringify(report, null, 2), {
      status: 503,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }

  const base = (Netlify.env.get("OPENROUTER_BASE_URL") || "https://openrouter.ai/api/v1").replace(/\/$/, "");
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), PROBE_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const response = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
        "x-title": "Ideal Management",
      },
      body: JSON.stringify({
        model: models[0],
        max_tokens: 8,
        messages: [{ role: "user", content: "Reply with the single word: ok" }],
      }),
      signal: abort.signal,
    });

    report.latencyMs = Date.now() - startedAt;
    report.status = response.status;

    if (response.ok) {
      report.state = "ok";
    } else if (response.status === 401 || response.status === 403) {
      report.state = "auth";
      report.detail = "The key was rejected — it may be revoked or lack permission for this model.";
    } else if (response.status === 402 || response.status === 429) {
      report.state = "quota";
      report.detail = "Out of credit or over the free daily cap. It should recover, or set a paid model id.";
    } else if (response.status === 404 || response.status === 400) {
      report.state = "model";
      report.detail = "The configured model id was not accepted. It may have been renamed or retired.";
    } else {
      report.state = "upstream";
      report.detail = "The provider answered with an error.";
    }
  } catch (error: any) {
    report.latencyMs = Date.now() - startedAt;
    report.state = abort.signal.aborted ? "timeout" : "network";
    report.detail = abort.signal.aborted
      ? `No answer within ${PROBE_TIMEOUT_MS}ms.`
      : "Could not reach the provider from this deployment.";
  } finally {
    clearTimeout(timer);
  }

  return new Response(JSON.stringify(report, null, 2), {
    // A cached health check is a lie, so say so to every hop.
    status: report.state === "ok" ? 200 : 503,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
};

export const config: Config = {
  path: "/api/ideal-health",
};
