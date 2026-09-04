/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TOTAL_BUDGET_MS } from "../../lab/agents";

/**
 * A hard ceiling on a whole function invocation.
 *
 * The provider call already has its own 15s abort, but that only covers the
 * fetch. Anything else in the request path — a storage read, a DNS lookup, a
 * dependency doing something unexpected on a cold start — can still hang, and
 * when it does Netlify kills the function at 30s and answers with an HTML
 * error page. The browser then reports "the sandbox isn't running on this
 * deployment", which is both wrong and unactionable.
 *
 * So the function races its own work against a deadline it controls. Whatever
 * hangs, the caller gets real JSON explaining it, in time to be useful.
 */

/**
 * Comfortably inside Netlify's 30s ceiling, with room to serialise a reply —
 * and deliberately DERIVED from the provider budget rather than written out.
 *
 * The two numbers are one design, not two: this race exists to catch whatever
 * the provider call does not, so it has to fire *after* generateReply() has had
 * its full budget and given up honestly. Written as a literal, they drifted —
 * the inner budget was 24s against this 20s, so the honest answer was
 * unreachable and every slow model came back as a bare FUNCTION_TIMEOUT.
 * Deriving it means raising one raises the other.
 */
const SERIALISE_HEADROOM_MS = 3_000;
export const FUNCTION_DEADLINE_MS = TOTAL_BUDGET_MS + SERIALISE_HEADROOM_MS;

export async function withDeadline(
  work: () => Promise<Response>,
  onTimeout: () => Response,
  ms: number = FUNCTION_DEADLINE_MS,
): Promise<Response> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const expired = new Promise<Response>((resolve) => {
    timer = setTimeout(() => {
      console.error(`Function exceeded its ${ms}ms deadline; returning a timeout response.`);
      resolve(onTimeout());
    }, ms);
  });

  try {
    return await Promise.race([work(), expired]);
  } finally {
    clearTimeout(timer);
  }
}
