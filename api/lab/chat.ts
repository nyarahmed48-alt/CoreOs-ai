/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Vercel serverless function backing POST /api/lab/chat.
 *
 * The roster and the answering logic are shared with the Express server — see
 * lab/agents.ts. Only the transport differs.
 *
 * Note: unlike the Express deployment there is no per-IP rate limit here.
 * Serverless invocations don't share memory, so an in-memory counter would do
 * nothing. The 500-character cap still applies. If this endpoint gets abused,
 * put Vercel's own rate limiting in front of it rather than counting in code.
 */

import { handleLabChat, settingsFromProcess } from "../../lab/agents";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  // Vercel parses JSON bodies for us, but be tolerant of a raw string.
  let payload = req.body ?? {};
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch {
      return res.status(400).json({ error: "BAD_JSON", message: "Could not read that request." });
    }
  }

  const { slug, message, history, lang } = payload;
  const { status, body } = await handleLabChat({ slug, message, history, lang, settings: settingsFromProcess() });
  return res.status(status).json(body);
}
