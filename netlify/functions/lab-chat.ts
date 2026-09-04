/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Netlify function backing POST /api/lab/chat (see the redirect in
 * netlify.toml). The roster and the answering logic are shared with the
 * Express server — see lab/agents.ts. Only the transport differs.
 *
 * As on Vercel there is no per-IP rate limit: invocations don't share memory,
 * so an in-memory counter would do nothing. The 500-character cap still
 * applies; use Netlify's own rate limiting if this endpoint gets abused.
 */

import { handleLabChat } from "../../lab/agents";
import { resolveSettings } from "../../lab/settings";
import { settingsStore } from "../lib/settings-store";
import { withDeadline } from "../lib/deadline";

const JSON_HEADERS = { "content-type": "application/json" };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "METHOD_NOT_ALLOWED" }), {
      status: 405,
      headers: { ...JSON_HEADERS, allow: "POST" },
    });
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "BAD_JSON", message: "Could not read that request." }),
      { status: 400, headers: JSON_HEADERS },
    );
  }

  const { slug, message, history, lang } = payload ?? {};

  /* Raced against a deadline this function owns. Netlify kills an invocation
     at 30s and answers with HTML, which the console misreads as "no sandbox on
     this deployment" — so whatever hangs, say so in JSON before that happens. */
  return withDeadline(
    async () => {
      /* Stored settings, not just the environment: a model saved at /admin
         has to reach the agents, or the page reports a change it never made. */
      const settings = await resolveSettings(
        process.env as Record<string, string | undefined>,
        settingsStore(),
      );
      const { status, body } = await handleLabChat({ slug, message, history, lang, settings });
      return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
    },
    () =>
      new Response(
        JSON.stringify({
          error: "FUNCTION_TIMEOUT",
          message:
            "That took too long to answer and the request was stopped. The model may be slow or unreachable — try a shorter question, or check /api/lab/health.",
        }),
        { status: 504, headers: JSON_HEADERS },
      ),
  );
}
