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

import { handleLabChat, settingsFromProcess } from "../../lab/agents";

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
  const { status, body } = await handleLabChat({ slug, message, history, lang, settings: settingsFromProcess() });

  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}
