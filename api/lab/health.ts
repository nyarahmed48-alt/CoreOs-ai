/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Vercel serverless function backing GET /api/lab/health.
 *
 * The Netlify twin is netlify/functions/lab-health.ts and the Express route is
 * in server.ts; all three call the same check in lab/agents.ts. See that file
 * for what it reports and why none of it is sensitive.
 */

import { checkLabHealth, settingsFromProcess } from "../../lab/agents";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  const health = await checkLabHealth(settingsFromProcess());
  // A cached health check is a lie, so say so to every hop in between.
  res.setHeader("cache-control", "no-store");
  return res.status(health.probe.ok ? 200 : 503).json(health);
}
